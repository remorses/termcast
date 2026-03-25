/**
 * Node/Bun Cache implementation backed by SQLite (bun:sqlite).
 * Moved from apis/cache.tsx — this is the platform-specific storage layer.
 */

import { Database } from 'bun:sqlite'
import { joinPath, dirname, homedir, ensureDir, byteLength } from '#platform/runtime'
import { logger } from '../../logger'
import { useStore } from '../../state'

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
  const dbSuffix = (globalThis as any).process?.env?.TERMCAST_DB_SUFFIX?.replace(/[^a-zA-Z0-9_-]/g, '_')
  const dbFileName = dbSuffix ? `data-${dbSuffix}.db` : 'data.db'

  if (extensionPath) {
    return joinPath(extensionPath, '.termcast-bundle', dbFileName)
  }

  // Fallback for examples/tests that don't set extensionPath
  return joinPath(homedir(), '.termcast', '.termcast-bundle', dbFileName)
}

function getCurrentCacheDir(namespace?: string): string {
  const { extensionPath } = useStore.getState()

  const baseDir = extensionPath
    ? joinPath(extensionPath, '.termcast-bundle', 'cache')
    : joinPath(homedir(), '.termcast', '.termcast-bundle', 'cache')

  return namespace ? joinPath(baseDir, namespace) : baseDir
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
    const dbDir = dirname(dbPath)
    ensureDir(dbDir)

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
    const dataSize = byteLength(data)

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
    const row = this.db
      .prepare(
        `SELECT size FROM ${CACHE_TABLE_NAME} WHERE namespace = ? AND key = ?`,
      )
      .get(this.namespace, key) as { size: number } | undefined

    if (row) {
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
