import { Database } from 'bun:sqlite'
import * as path from 'path'
import * as os from 'os'
import * as fs from 'fs'
import { logger } from './logger'
import { useStore } from './state'

let db: Database | null = null
let currentDbPath: string | null = null

function getCurrentDatabasePath(): string {
    const extensionPath = useStore.getState().extensionPath

    if (extensionPath) {
        // Use .termcast-bundle directory inside extension path
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

function getDatabase(): Database {
    const dbPath = getCurrentDatabasePath()

    // Check if we need to reconnect due to path change
    if (db && currentDbPath !== dbPath) {
        db.close()
        db = null
        currentDbPath = null
    }

    if (!db) {
        // Ensure parent directory exists
        const dbDir = path.dirname(dbPath)
        if (!fs.existsSync(dbDir)) {
            fs.mkdirSync(dbDir, { recursive: true })
        }

        // Open with options to reduce file usage
        db = new Database(dbPath, {
            create: true,
            readwrite: true,
        })
        currentDbPath = dbPath

        // Use WAL mode and optimize for single file usage
        db.exec('PRAGMA journal_mode = WAL')
        db.exec('PRAGMA wal_autocheckpoint = 1000')
        db.exec('PRAGMA synchronous = NORMAL')

        db.exec(`
            CREATE TABLE IF NOT EXISTS localstorage (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL,
                type TEXT NOT NULL
            )
        `)
    }
    return db
}

export namespace LocalStorage {
    export type Value = string | number | boolean

    export interface Values {
        [key: string]: any
    }

    export async function getItem<T extends Value = Value>(
        key: string,
    ): Promise<T | undefined> {
        return new Promise((resolve) => {
            try {
                const db = getDatabase()
                const row = db
                    .prepare(
                        'SELECT value, type FROM localstorage WHERE key = ?',
                    )
                    .get(key) as { value: string; type: string } | undefined

                if (!row) {
                    resolve(undefined)
                    return
                }

                let value: Value
                switch (row.type) {
                    case 'number':
                        value = parseFloat(row.value)
                        break
                    case 'boolean':
                        value = row.value === 'true'
                        break
                    default:
                        value = row.value
                }

                resolve(value as T)
            } catch (err) {
                logger.error('LocalStorage.getItem error:', err)
                resolve(undefined)
            }
        })
    }

    export function getItemSync<T extends Value = Value>(
        key: string,
    ): T | undefined {
        try {
            const db = getDatabase()
            const row = db
                .prepare('SELECT value, type FROM localstorage WHERE key = ?')
                .get(key) as { value: string; type: string } | undefined

            if (!row) {
                return undefined
            }

            let value: Value
            switch (row.type) {
                case 'number':
                    value = parseFloat(row.value)
                    break
                case 'boolean':
                    value = row.value === 'true'
                    break
                default:
                    value = row.value
            }

            return value as T
        } catch (err) {
            logger.error('LocalStorage.getItemSync error:', err)
            return undefined
        }
    }

    export async function setItem(key: string, value: Value): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                const db = getDatabase()
                const type = typeof value
                const stringValue = String(value)

                db.prepare(
                    'INSERT OR REPLACE INTO localstorage (key, value, type) VALUES (?, ?, ?)',
                ).run(key, stringValue, type)
                resolve()
            } catch (err) {
                logger.error('LocalStorage.setItem error:', err)
                reject(err)
            }
        })
    }

    export async function removeItem(key: string): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                const db = getDatabase()
                db.prepare('DELETE FROM localstorage WHERE key = ?').run(key)
                resolve()
            } catch (err) {
                logger.error('LocalStorage.removeItem error:', err)
                reject(err)
            }
        })
    }

    export async function allItems<T extends Values = Values>(): Promise<T> {
        return new Promise((resolve, reject) => {
            try {
                const db = getDatabase()
                const rows = db
                    .prepare('SELECT key, value, type FROM localstorage')
                    .all() as Array<{
                    key: string
                    value: string
                    type: string
                }>

                const result: Values = {}
                for (const row of rows) {
                    let value: Value
                    switch (row.type) {
                        case 'number':
                            value = parseFloat(row.value)
                            break
                        case 'boolean':
                            value = row.value === 'true'
                            break
                        default:
                            value = row.value
                    }
                    result[row.key] = value
                }

                resolve(result as T)
            } catch (err) {
                logger.error('LocalStorage.allItems error:', err)
                reject(err)
            }
        })
    }

    export async function clear(): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                const db = getDatabase()
                db.exec('DELETE FROM localstorage')
                resolve()
            } catch (err) {
                logger.error('LocalStorage.clear error:', err)
                reject(err)
            }
        })
    }
}
