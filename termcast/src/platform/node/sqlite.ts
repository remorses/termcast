/**
 * SQLite Database re-export.
 *
 * Currently uses bun:sqlite. This file exists as the single swap point
 * for adding Node.js support later (e.g. better-sqlite3 or node:sqlite).
 */

import { Database } from 'bun:sqlite'
export { Database }
