/**
 * SQLite Database for Node.js — uses the built-in node:sqlite module.
 *
 * Translates bun:sqlite constructor options ({ create, readwrite, readonly })
 * to node:sqlite DatabaseSync options ({ readOnly }).
 * Adds a transaction() polyfill since node:sqlite lacks a built-in one.
 *
 * Requires Node.js >= 22.13.0 (node:sqlite without --experimental-sqlite flag).
 */

import { DatabaseSync } from 'node:sqlite'

interface DatabaseOptions {
  create?: boolean
  readwrite?: boolean
  readonly?: boolean
}

function NodeDatabase(path: string, options?: DatabaseOptions) {
  const readOnly = options?.readonly === true || options?.readwrite === false

  const db = new DatabaseSync(path, {
    readOnly,
  })

  // node:sqlite's DatabaseSync lacks a transaction() helper.
  // Polyfill it to match better-sqlite3 / bun:sqlite behavior:
  // transaction(fn) returns a new function that wraps fn in BEGIN/COMMIT/ROLLBACK.
  const dbAny = db as any
  dbAny.transaction = <T>(fn: () => T): (() => T) => {
    return () => {
      db.exec('BEGIN')
      try {
        const result = fn()
        db.exec('COMMIT')
        return result
      } catch (e) {
        db.exec('ROLLBACK')
        throw e
      }
    }
  }

  return db
}

export const Database: new (path: string, options?: DatabaseOptions) => DatabaseInstance = NodeDatabase as any

/** Instance type returned by `new Database(...)` */
export type DatabaseInstance = {
  exec(sql: string): void
  prepare(sql: string): {
    get(...params: any[]): any
    all(...params: any[]): any[]
    run(...params: any[]): any
  }
  transaction<T>(fn: () => T): () => T
  close(): void
}
