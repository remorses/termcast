/**
 * SQLite Database — unified interface for bun:sqlite and better-sqlite3.
 *
 * On Bun, uses the built-in bun:sqlite (zero deps, fastest).
 * On Node.js, uses better-sqlite3 (same synchronous API shape).
 *
 * The constructor normalizes options between the two:
 *   bun:sqlite uses   { create: bool, readwrite: bool, readonly: bool }
 *   better-sqlite3 uses { fileMustExist: bool, readonly: bool }
 */

interface DatabaseOptions {
  create?: boolean
  readwrite?: boolean
  readonly?: boolean
}

const isBun = typeof globalThis.Bun !== 'undefined'

let DatabaseImpl: new (path: string, options?: DatabaseOptions) => any

if (isBun) {
  // bun:sqlite accepts { create, readwrite, readonly } directly
  const mod = await import('bun:sqlite')
  DatabaseImpl = mod.Database
} else {
  // better-sqlite3 accepts { fileMustExist, readonly }
  const mod = await import('better-sqlite3')
  const BetterSqlite3 = mod.default

  DatabaseImpl = function NodeDatabase(path: string, options?: DatabaseOptions) {
    const betterOpts: { fileMustExist?: boolean; readonly?: boolean } = {}

    // Translate bun:sqlite options → better-sqlite3 options
    if (options?.create === false) {
      betterOpts.fileMustExist = true
    }
    if (options?.readonly === true || options?.readwrite === false) {
      betterOpts.readonly = true
    }

    return new BetterSqlite3(path, betterOpts)
  } as any
}

export const Database: new (path: string, options?: DatabaseOptions) => DatabaseInstance = DatabaseImpl

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
