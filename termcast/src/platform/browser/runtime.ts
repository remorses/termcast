/**
 * Browser platform runtime.
 *
 * Provides the same exports as the Node runtime but backed by browser APIs
 * or sensible no-ops for features that don't exist in the browser.
 */

// ── filesystem (no-ops / stubs) ─────────────────────────────────────

export function ensureDir(_dir: string): void {
  // no-op: browser storage (IndexedDB) doesn't need directory creation
}

export function fileExists(_p: string): boolean {
  return false
}

export function readFileSync(_p: string): string {
  throw new Error('readFileSync is not available in the browser')
}

export function appendToFile(_p: string, _data: string): void {
  // no-op: browser logger uses console only
}

export function unlinkIfExists(_p: string): void {
  // no-op
}

export function readdirSync(_dir: string): Array<{ name: string; isDirectory(): boolean }> {
  return []
}

export function rmSync(_p: string): void {
  // no-op
}

export function mkdirSync(_dir: string): void {
  // no-op
}

export function cpSync(_src: string, _dest: string): void {
  throw new Error('cpSync is not available in the browser')
}

// ── async filesystem ────────────────────────────────────────────────

export async function readdirAsync(_dir: string): Promise<Array<{ name: string; isDirectory(): boolean }>> {
  return []
}

export async function accessAsync(_p: string): Promise<boolean> {
  return false
}

// ── path (pure string ops) ──────────────────────────────────────────

export function joinPath(...parts: string[]): string {
  return parts
    .filter(Boolean)
    .join('/')
    .replace(/\/+/g, '/')
}

export function dirname(p: string): string {
  const parts = p.split('/')
  parts.pop()
  return parts.join('/') || '/'
}

export function basename(p: string): string {
  return p.split('/').pop() || ''
}

export function resolvePath(...parts: string[]): string {
  return joinPath(...parts)
}

export function isAbsolute(p: string): boolean {
  return p.startsWith('/')
}

export function relativePath(from: string, to: string): string {
  const fromParts = from.split('/').filter(Boolean)
  const toParts = to.split('/').filter(Boolean)
  let common = 0
  while (common < fromParts.length && common < toParts.length && fromParts[common] === toParts[common]) {
    common++
  }
  const ups = fromParts.length - common
  return [...Array(ups).fill('..'), ...toParts.slice(common)].join('/')
}

// ── os ──────────────────────────────────────────────────────────────

export function homedir(): string {
  return '/home'
}

// ── process ─────────────────────────────────────────────────────────

export const platform = 'browser'

export function exit(_code?: number): void {
  // no-op: can't exit the browser
}

export function getEnv(key: string): string | undefined {
  // Browser env can be populated by the host app before boot
  return (globalThis as any).__termcast_env?.[key]
}

export function setEnv(key: string, value: string): void {
  const g = globalThis as any
  if (!g.__termcast_env) {
    g.__termcast_env = {}
  }
  g.__termcast_env[key] = value
}

export function cwd(): string {
  return '/'
}

export function stdoutWrite(_data: string): void {
  // no-op: browser renderer handles output
}

export function isTTY(): boolean {
  return false
}

export function getArgv(): string[] {
  return []
}

// ── appearance ──────────────────────────────────────────────────────

export function getSystemAppearance(): 'dark' | 'light' {
  if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
    return 'dark'
  }
  return 'light'
}

// ── util ────────────────────────────────────────────────────────────

export function byteLength(str: string): number {
  return new TextEncoder().encode(str).length
}

export function inspectValue(val: unknown, _depth = 3): string {
  if (typeof val === 'string') {
    return val
  }
  try {
    return JSON.stringify(val, null, 2)
  } catch {
    return String(val)
  }
}

// ── error handling ──────────────────────────────────────────────────

export function setupErrorHandlers(handler: (err: Error, type: string) => void): void {
  window.addEventListener('error', (event) => {
    handler(event.error ?? new Error(event.message), 'uncaughtException')
  })
  window.addEventListener('unhandledrejection', (event) => {
    const err = event.reason instanceof Error
      ? event.reason
      : new Error(String(event.reason))
    handler(err, 'unhandledRejection')
  })
}

// ── shell / clipboard ───────────────────────────────────────────────

export function execWithInput(_command: string, _input: string): Promise<void> {
  return Promise.reject(new Error('execWithInput is not available in the browser'))
}

export async function execCommand(_command: string): Promise<string> {
  throw new Error('execCommand is not available in the browser')
}

export async function copyToClipboard(text: string): Promise<void> {
  await navigator.clipboard.writeText(text)
}

export async function readClipboard(): Promise<string> {
  return navigator.clipboard.readText()
}

export async function openUrl(url: string): Promise<void> {
  window.open(url, '_blank')
}

export async function openFile(_target: string, _app?: string): Promise<void> {
  throw new Error('openFile is not supported in the browser')
}

export async function showInFileManager(_filePath: string): Promise<void> {
  throw new Error('showInFileManager is not supported in the browser')
}

export async function moveToTrash(_filePath: string): Promise<void> {
  throw new Error('moveToTrash is not supported in the browser')
}
