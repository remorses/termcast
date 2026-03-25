/**
 * SQLite Database for Node.js — uses better-sqlite3.
 *
 * Translates bun:sqlite constructor options ({ create, readwrite })
 * to better-sqlite3 options ({ fileMustExist, readonly }).
 * All other APIs (prepare/get/all/run/exec/transaction/close) are
 * identical between the two libraries.
 */

import BetterSqlite3 from 'better-sqlite3'

interface DatabaseOptions {
  create?: boolean
  readwrite?: boolean
  readonly?: boolean
}

function NodeDatabase(path: string, options?: DatabaseOptions) {
  const betterOpts: { fileMustExist?: boolean; readonly?: boolean } = {}

  if (options?.create === false) {
    betterOpts.fileMustExist = true
  }
  if (options?.readonly === true || options?.readwrite === false) {
    betterOpts.readonly = true
  }

  return new BetterSqlite3(path, betterOpts)
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
