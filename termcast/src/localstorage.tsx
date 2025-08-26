import Database from 'better-sqlite3'
import * as path from 'path'
import * as os from 'os'
import { logger } from './logger'

const DB_PATH = path.join(os.homedir(), '.termcast.db')

let db: Database.Database | null = null

function getDatabase(): Database.Database {
    if (!db) {
        db = new Database(DB_PATH)
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

    export async function getItem<T extends Value = Value>(key: string): Promise<T | undefined> {
        return new Promise((resolve) => {
            try {
                const db = getDatabase()
                const row = db.prepare('SELECT value, type FROM localstorage WHERE key = ?').get(key) as { value: string; type: string } | undefined
                
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

    export async function setItem(key: string, value: Value): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                const db = getDatabase()
                const type = typeof value
                const stringValue = String(value)
                
                db.prepare('INSERT OR REPLACE INTO localstorage (key, value, type) VALUES (?, ?, ?)').run(key, stringValue, type)
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
                const rows = db.prepare('SELECT key, value, type FROM localstorage').all() as Array<{ key: string; value: string; type: string }>
                
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
                db.prepare('DELETE FROM localstorage').run()
                resolve()
            } catch (err) {
                logger.error('LocalStorage.clear error:', err)
                reject(err)
            }
        })
    }
}