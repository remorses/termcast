import { Database } from 'bun:sqlite'
import * as path from 'path'
import * as os from 'os'
import * as fs from 'fs'
import { logger } from './logger'
import { useStore } from './state'

function getCurrentDatabasePath(): string {
    const extensionPath = useStore.getState().extensionPath

    if (extensionPath) {
        // Use same shared database as localstorage
        return path.join(extensionPath, '.termcast-bundle', 'data.db')
    } else {
        return path.join(
            os.homedir(),
            '.termcast',
            '.termcast-bundle',
            'data.db',
        )
    }
}

function getCurrentCacheDir(namespace?: string): string {
    const extensionPath = useStore.getState().extensionPath

    if (extensionPath) {
        return namespace
            ? path.join(extensionPath, '.termcast-bundle', 'cache', namespace)
            : path.join(extensionPath, '.termcast-bundle', 'cache')
    } else {
        return namespace
            ? path.join(
                  os.homedir(),
                  '.termcast',
                  '.termcast-bundle',
                  'cache',
                  namespace,
              )
            : path.join(os.homedir(), '.termcast', '.termcast-bundle', 'cache')
    }
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
    private namespace?: string
    private tableName: string
    private subscribers: Cache.Subscriber[] = []
    private currentSize: number = 0

    constructor(options?: Cache.Options) {
        this.capacity = options?.capacity || Cache.DEFAULT_CAPACITY
        this.namespace = options?.namespace
        // Replace non-alphanumeric characters with underscores for valid SQL table names
        const safeNamespace = this.namespace?.replace(/[^a-zA-Z0-9]/g, '_')
        this.tableName = safeNamespace ? `cache_${safeNamespace}` : 'cache'

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

        // Use WAL mode and optimize for single file usage
        this.db.exec('PRAGMA journal_mode = WAL')
        this.db.exec('PRAGMA wal_autocheckpoint = 1000')
        this.db.exec('PRAGMA synchronous = NORMAL')

        // Use rowid for ordering - it auto-increments and provides natural LRU order
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS ${this.tableName} (
                rowid INTEGER PRIMARY KEY AUTOINCREMENT,
                key TEXT UNIQUE NOT NULL,
                data TEXT NOT NULL,
                size INTEGER NOT NULL
            )
        `)

        // Create index on key for fast lookups
        this.db.exec(`
            CREATE INDEX IF NOT EXISTS idx_${this.tableName}_key ON ${this.tableName}(key)
        `)

        // Calculate initial size
        const row = this.db
            .prepare(`SELECT SUM(size) as total FROM ${this.tableName}`)
            .get() as { total: number | null } | undefined
        this.currentSize = row?.total || 0

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
        const row = this.db
            .prepare(
                `SELECT rowid, data, size FROM ${this.tableName} WHERE key = ?`,
            )
            .get(key) as
            | { rowid: number; data: string; size: number }
            | undefined

        if (row) {
            // Move to end of LRU by deleting and reinserting (gets new rowid)
            const tx = this.db.transaction(() => {
                this.db
                    .prepare(`DELETE FROM ${this.tableName} WHERE key = ?`)
                    .run(key)
                this.db
                    .prepare(
                        `INSERT INTO ${this.tableName} (key, data, size) VALUES (?, ?, ?)`,
                    )
                    .run(key, row.data, row.size)
            })
            tx()

            return row.data
        }

        return undefined
    }

    has(key: string): boolean {
        const row = this.db
            .prepare(`SELECT 1 FROM ${this.tableName} WHERE key = ?`)
            .get(key)
        return !!row
    }

    get isEmpty(): boolean {
        const row = this.db
            .prepare(`SELECT COUNT(*) as count FROM ${this.tableName}`)
            .get() as { count: number }
        return row.count === 0
    }

    set(key: string, data: string): void {
        const dataSize = Buffer.byteLength(data, 'utf8')

        // Get existing size if any
        const existingRow = this.db
            .prepare(`SELECT size FROM ${this.tableName} WHERE key = ?`)
            .get(key) as { size: number } | undefined
        const oldSize = existingRow?.size || 0
        const newTotalSize = this.currentSize - oldSize + dataSize

        if (newTotalSize > this.capacity) {
            this.maintainCapacity(newTotalSize - this.capacity)
        }

        // Insert or update the cache entry
        this.db
            .prepare(
                `INSERT OR REPLACE INTO ${this.tableName} (key, data, size) VALUES (?, ?, ?)`,
            )
            .run(key, data, dataSize)

        this.currentSize = this.currentSize - oldSize + dataSize
        this.notifySubscribers(key, data)
    }

    remove(key: string): boolean {
        // Check if key exists and get its size
        const row = this.db
            .prepare(`SELECT size FROM ${this.tableName} WHERE key = ?`)
            .get(key) as { size: number } | undefined

        if (row) {
            // Delete the key
            this.db
                .prepare(`DELETE FROM ${this.tableName} WHERE key = ?`)
                .run(key)

            this.currentSize -= row.size
            this.notifySubscribers(key, undefined)
            return true
        }

        return false
    }

    clear(options?: { notifySubscribers: boolean }): void {
        this.db.exec(`DELETE FROM ${this.tableName}`)
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
        // Order by rowid ASC to get oldest entries first
        const rows = this.db
            .prepare(
                `SELECT key, size FROM ${this.tableName} ORDER BY rowid ASC`,
            )
            .all() as Array<{ key: string; size: number }>

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
                `DELETE FROM ${this.tableName} WHERE key IN (${placeholders})`,
            )
            stmt.run(...(keysToRemove as [string, ...string[]]))
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
