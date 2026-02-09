import { Database } from 'bun:sqlite'
import * as path from 'path'
import * as os from 'os'
import * as fs from 'fs'
import { logger } from '../logger'
import { useStore } from '../state'

const CACHE_TABLE_NAME = 'cache_entries'
const DEFAULT_NAMESPACE = '__default__'
const initializedDatabasePaths = new Set<string>()
let logicalTimestamp = Date.now()

function nextTimestamp(): number {
  logicalTimestamp += 1
  return logicalTimestamp
}

function getCurrentDatabasePath(): string {
  const { extensionPath } = useStore.getState()
  const dbSuffix = process.env.TERMCAST_DB_SUFFIX?.replace(/[^a-zA-Z0-9_-]/g, '_')
  const dbFileName = dbSuffix ? `data-${dbSuffix}.db` : 'data.db'

  if (extensionPath) {
    return path.join(extensionPath, '.termcast-bundle', dbFileName)
  }

  // Fallback for examples/tests that don't set extensionPath
  return path.join(os.homedir(), '.termcast', '.termcast-bundle', dbFileName)
}

function getCurrentCacheDir(namespace?: string): string {
  const { extensionPath } = useStore.getState()

  const baseDir = extensionPath
    ? path.join(extensionPath, '.termcast-bundle', 'cache')
    : path.join(os.homedir(), '.termcast', '.termcast-bundle', 'cache')

  return namespace ? path.join(baseDir, namespace) : baseDir
}

function getNamespace(namespace?: string): string {
  return namespace || DEFAULT_NAMESPACE
}

function initializeDatabaseOnce({ db, dbPath }: { db: Database; dbPath: string }): void {
  if (initializedDatabasePaths.has(dbPath)) {
    return
  }

  db.exec('PRAGMA journal_mode = WAL')
  db.exec('PRAGMA wal_autocheckpoint = 1000')
  db.exec('PRAGMA synchronous = NORMAL')

  db.exec(`
    CREATE TABLE IF NOT EXISTS ${CACHE_TABLE_NAME} (
      namespace TEXT NOT NULL,
      key TEXT NOT NULL,
      data TEXT NOT NULL,
      size INTEGER NOT NULL,
      last_accessed_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      PRIMARY KEY(namespace, key)
    )
  `)

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_${CACHE_TABLE_NAME}_namespace_lru
    ON ${CACHE_TABLE_NAME}(namespace, last_accessed_at)
  `)

  cleanupLegacyCacheTables(db)
  initializedDatabasePaths.add(dbPath)
}

function cleanupLegacyCacheTables(db: Database): void {
  const rows = db
    .prepare(
      `SELECT name FROM sqlite_master
       WHERE type = 'table'
         AND (name = 'cache' OR name LIKE 'cache_%')
         AND name != ?`,
    )
    .all(CACHE_TABLE_NAME) as Array<{ name: string }>

  if (rows.length === 0) {
    return
  }

  const tx = db.transaction(() => {
    const upsert = db.prepare(
      `INSERT INTO ${CACHE_TABLE_NAME} (namespace, key, data, size, last_accessed_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(namespace, key)
       DO UPDATE SET
         data = excluded.data,
         size = excluded.size,
         last_accessed_at = excluded.last_accessed_at,
         updated_at = excluded.updated_at`,
    )

    for (const { name } of rows) {
      const namespace =
        name === 'cache'
          ? DEFAULT_NAMESPACE
          : name === 'cache_tanstack_query'
            ? 'tanstack-query'
            : `legacy:${name.slice('cache_'.length)}`

      try {
        const values = db
          .prepare(`SELECT key, data, size, rowid FROM ${name}`)
          .all() as Array<{ key: string; data: string; size: number; rowid: number }>

        values.forEach((entry) => {
          const timestamp = entry.rowid
          upsert.run(
            namespace,
            entry.key,
            entry.data,
            entry.size,
            timestamp,
            timestamp,
          )
        })
      } catch {
        // Ignore invalid legacy tables and continue cleanup.
      }

      db.exec(`DROP TABLE IF EXISTS ${name}`)
    }
  })

  tx()
}

function hashString(value: string): string {
  let hash = 0
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0
  }
  return Math.abs(hash).toString(36)
}

export class Cache {
  static get STORAGE_DIRECTORY_NAME(): string {
    const extensionPath = useStore.getState().extensionPath
    return extensionPath ? 'cache' : '.termcast-cache'
  }

  static get DEFAULT_CAPACITY(): number {
    return 10 * 1024 * 1024 // 10 MB
  }

  private db: Database
  private capacity: number
  private namespace: string
  private subscribers: Cache.Subscriber[] = []
  private currentSize: number = 0

  constructor(options?: Cache.Options) {
    const sqliteLoadStart = Date.now()
    this.capacity = options?.capacity || Cache.DEFAULT_CAPACITY
    this.namespace = getNamespace(options?.namespace)

    const dbPath = getCurrentDatabasePath()

    // Ensure parent directory exists
    const dbDir = path.dirname(dbPath)
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true })
    }

    // Open with options to reduce file usage
    this.db = new Database(dbPath, {
      create: true,
      readwrite: true,
    })

    initializeDatabaseOnce({ db: this.db, dbPath })

    // Calculate initial size
    const row = this.db
      .prepare(
        `SELECT COALESCE(SUM(size), 0) as total FROM ${CACHE_TABLE_NAME} WHERE namespace = ?`,
      )
      .get(this.namespace) as { total: number | null } | undefined
    this.currentSize = row?.total || 0

    const sqliteLoadMs = Date.now() - sqliteLoadStart
    if (sqliteLoadMs > 500) {
      logger.log(
        `[perf] sqlite cache init took ${sqliteLoadMs}ms (namespace=${this.namespace})`,
      )
    }

    // Bind all methods to this instance
    this.get = this.get.bind(this)
    this.has = this.has.bind(this)
    this.set = this.set.bind(this)
    this.remove = this.remove.bind(this)
    this.clear = this.clear.bind(this)
    this.subscribe = this.subscribe.bind(this)
    this.maintainCapacity = this.maintainCapacity.bind(this)
    this.notifySubscribers = this.notifySubscribers.bind(this)
  }

  get storageDirectory(): string {
    return getCurrentCacheDir(this.namespace)
  }

  get(key: string): string | undefined {
    const now = nextTimestamp()
    const row = this.db
      .prepare(
        `SELECT data, size FROM ${CACHE_TABLE_NAME} WHERE namespace = ? AND key = ?`,
      )
      .get(this.namespace, key) as { data: string; size: number } | undefined

    if (row) {
      this.db
        .prepare(
          `UPDATE ${CACHE_TABLE_NAME} SET last_accessed_at = ? WHERE namespace = ? AND key = ?`,
        )
        .run(now, this.namespace, key)

      return row.data
    }

    return undefined
  }

  has(key: string): boolean {
    const row = this.db
      .prepare(`SELECT 1 FROM ${CACHE_TABLE_NAME} WHERE namespace = ? AND key = ?`)
      .get(this.namespace, key)
    return !!row
  }

  get isEmpty(): boolean {
    const row = this.db
      .prepare(
        `SELECT COUNT(*) as count FROM ${CACHE_TABLE_NAME} WHERE namespace = ?`,
      )
      .get(this.namespace) as { count: number }
    return row.count === 0
  }

  set(key: string, data: string): void {
    const now = nextTimestamp()
    const dataSize = Buffer.byteLength(data, 'utf8')

    // Get existing size if any
    const existingRow = this.db
      .prepare(
        `SELECT size FROM ${CACHE_TABLE_NAME} WHERE namespace = ? AND key = ?`,
      )
      .get(this.namespace, key) as { size: number } | undefined
    const oldSize = existingRow?.size || 0
    const newTotalSize = this.currentSize - oldSize + dataSize

    if (newTotalSize > this.capacity) {
      this.maintainCapacity(newTotalSize - this.capacity)
    }

    // Insert or update the cache entry
    this.db
      .prepare(
        `INSERT INTO ${CACHE_TABLE_NAME} (namespace, key, data, size, last_accessed_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT(namespace, key)
         DO UPDATE SET
           data = excluded.data,
           size = excluded.size,
           last_accessed_at = excluded.last_accessed_at,
           updated_at = excluded.updated_at`,
      )
      .run(this.namespace, key, data, dataSize, now, now)

    this.currentSize = this.currentSize - oldSize + dataSize
    this.notifySubscribers(key, data)
  }

  remove(key: string): boolean {
    // Check if key exists and get its size
    const row = this.db
      .prepare(
        `SELECT size FROM ${CACHE_TABLE_NAME} WHERE namespace = ? AND key = ?`,
      )
      .get(this.namespace, key) as { size: number } | undefined

    if (row) {
      // Delete the key
      this.db
        .prepare(`DELETE FROM ${CACHE_TABLE_NAME} WHERE namespace = ? AND key = ?`)
        .run(this.namespace, key)

      this.currentSize -= row.size
      this.notifySubscribers(key, undefined)
      return true
    }

    return false
  }

  clear(options?: { notifySubscribers: boolean }): void {
    this.db
      .prepare(`DELETE FROM ${CACHE_TABLE_NAME} WHERE namespace = ?`)
      .run(this.namespace)
    this.currentSize = 0

    if (options?.notifySubscribers !== false) {
      this.notifySubscribers(undefined, undefined)
    }
  }

  subscribe(subscriber: Cache.Subscriber): Cache.Subscription {
    this.subscribers.push(subscriber)
    return () => {
      const index = this.subscribers.indexOf(subscriber)
      if (index > -1) {
        this.subscribers.splice(index, 1)
      }
    }
  }

  private maintainCapacity(bytesToFree: number): void {
    // Order by oldest last-access time first to evict least-recently-used rows.
    const rows = this.db
      .prepare(
        `SELECT key, size FROM ${CACHE_TABLE_NAME}
         WHERE namespace = ?
         ORDER BY last_accessed_at ASC`,
      )
      .all(this.namespace) as Array<{ key: string; size: number }>

    let freedBytes = 0
    const keysToRemove: string[] = []

    for (const row of rows) {
      if (freedBytes >= bytesToFree) {
        break
      }
      keysToRemove.push(row.key)
      freedBytes += row.size
    }

    if (keysToRemove.length > 0) {
      const placeholders = keysToRemove.map(() => '?').join(',')
      const stmt = this.db.prepare(
        `DELETE FROM ${CACHE_TABLE_NAME}
         WHERE namespace = ? AND key IN (${placeholders})`,
      )
      stmt.run(this.namespace, ...(keysToRemove as [string, ...string[]]))
      this.currentSize -= freedBytes
    }
  }

  private notifySubscribers(
    key: string | undefined,
    data: string | undefined,
  ): void {
    for (const subscriber of this.subscribers) {
      try {
        subscriber(key, data)
      } catch (error) {
        logger.error('Cache subscriber error:', error)
      }
    }
  }
}

export namespace Cache {
  export interface Options {
    namespace?: string
    capacity?: number
  }

  export type Subscriber = (
    key: string | undefined,
    data: string | undefined,
  ) => void
  export type Subscription = () => void
}

interface CacheMetadata {
  timestamp: number
  value: any
}

const functionCacheMap = new Map<string, Cache>()
const functionCacheData = new Map<string, Map<string, CacheMetadata>>()

/**
 * Wraps an async function with caching capabilities.
 *
 * This higher-order function adds automatic caching to any async function. Results are
 * cached both in memory and persistently on disk, with support for cache expiration
 * and validation. Each unique set of arguments creates a separate cache entry.
 *
 * @param fn - The async function to wrap with caching
 * @param options - Caching options
 * @param options.validate - Function to check if cached data is still valid (called before returning cached data)
 * @param options.maxAge - Maximum age in milliseconds before cached data expires (default: Infinity)
 * @returns The wrapped function with an additional `clearCache()` method
 * @template Fn - Type of the async function being wrapped
 *
 * @example
 * ```typescript
 * // Basic caching
 * const fetchUser = async (userId: string) => {
 *   const response = await fetch(`/api/users/${userId}`)
 *   return response.json()
 * }
 * const cachedFetchUser = withCache(fetchUser)
 *
 * // First call fetches from API
 * const user1 = await cachedFetchUser("123") // Makes API call
 * // Subsequent calls return from cache
 * const user2 = await cachedFetchUser("123") // Returns cached data
 *
 * // With expiration (5 minutes)
 * const cachedSearch = withCache(searchAPI, {
 *   maxAge: 5 * 60 * 1000
 * })
 *
 * // With validation
 * const cachedGetConfig = withCache(getConfig, {
 *   validate: (config) => config.version === currentVersion
 * })
 *
 * // Clear cache manually
 * cachedFetchUser.clearCache()
 *
 * // Different arguments are cached separately
 * await cachedFetchUser("123") // Cached
 * await cachedFetchUser("456") // Different cache entry
 * ```
 */
export function withCache<Fn extends (...args: any[]) => Promise<any>>(
  fn: Fn,
  options?: {
    validate?: (data: Awaited<ReturnType<Fn>>) => boolean
    maxAge?: number
  },
): Fn & { clearCache: () => void } {
  const fnKey = fn.toString()
  const maxAge = options?.maxAge || Infinity
  const validate = options?.validate || (() => true)

  if (!functionCacheMap.has(fnKey)) {
    const functionNamespace = `fn-${hashString(fnKey)}`
    functionCacheMap.set(fnKey, new Cache({ namespace: functionNamespace }))
    functionCacheData.set(fnKey, new Map())
  }

  const cache = functionCacheMap.get(fnKey)!
  const cacheData = functionCacheData.get(fnKey)!

  const cachedFn = (async (...args: Parameters<Fn>) => {
    const cacheKey = JSON.stringify(args)

    // Check memory cache first
    const cached = cacheData.get(cacheKey)
    if (cached) {
      const age = Date.now() - cached.timestamp
      if (age < maxAge && validate(cached.value)) {
        return cached.value
      }
    }

    // Check persistent cache
    const persistentCached = cache.get(cacheKey)
    if (persistentCached) {
      try {
        const metadata = JSON.parse(persistentCached) as CacheMetadata
        const age = Date.now() - metadata.timestamp
        if (age < maxAge && validate(metadata.value)) {
          // Update memory cache
          cacheData.set(cacheKey, metadata)
          return metadata.value
        }
      } catch {
        // Invalid cache entry, ignore
      }
    }

    // Call the original function
    const result = await fn(...args)

    // Cache the result
    const metadata: CacheMetadata = {
      timestamp: Date.now(),
      value: result,
    }

    // Update both caches
    cacheData.set(cacheKey, metadata)
    cache.set(cacheKey, JSON.stringify(metadata))

    return result
  }) as any

  cachedFn.clearCache = () => {
    cache.clear()
    cacheData.clear()
  }

  return cachedFn as Fn & { clearCache: () => void }
}
