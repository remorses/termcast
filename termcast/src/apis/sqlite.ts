/**
 * SQLite abstraction layer — swap engine by toggling the commented block.
 * To use libsql: `bun add libsql`, comment bun:sqlite, uncomment libsql.
 */

// ── bun:sqlite ─────────────────────────────────────────────────────
import { Database } from 'bun:sqlite'
export { Database }

// ── libsql (better-sqlite3 compatible, works on Node/Bun/Deno) ────
// import type LibsqlType from 'libsql'
// import LibsqlDatabase from 'libsql'
// export type Database = LibsqlType.Database
// export const Database: new (path: string, options?: LibsqlType.Options) => Database = LibsqlDatabase
