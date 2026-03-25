/**
 * SQLite Database for Bun — re-exports the built-in bun:sqlite.
 */

import { Database as BunDatabase } from 'bun:sqlite'

export const Database = BunDatabase

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
