/**
 * LocalStorage API — platform-agnostic facade.
 *
 * Re-exports the platform-specific LocalStorage from #platform/localstorage
 * (SQLite on Node/Bun, window.localStorage on browser).
 */

export { LocalStorage } from '#platform/localstorage'
