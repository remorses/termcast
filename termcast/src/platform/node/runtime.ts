/**
 * Node.js / Bun platform runtime.
 *
 * Re-exports native APIs behind a platform-agnostic interface so the rest of
 * termcast never imports node:* directly (except CLI / build tooling which is
 * excluded from the browser bundle).
 */

import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import util from 'node:util'
import { exec as _exec } from 'node:child_process'
import { promisify } from 'node:util'

const execAsync = promisify(_exec)

// ── filesystem ──────────────────────────────────────────────────────

export function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

export function fileExists(p: string): boolean {
  return fs.existsSync(p)
}

export function readFileSync(p: string): string {
  return fs.readFileSync(p, 'utf-8')
}

export function appendToFile(p: string, data: string): void {
  fs.appendFileSync(p, data)
}

export function unlinkIfExists(p: string): void {
  if (fs.existsSync(p)) {
    fs.unlinkSync(p)
  }
}

export function readdirSync(dir: string): Array<{ name: string; isDirectory(): boolean }> {
  return fs.readdirSync(dir, { withFileTypes: true })
}

export function rmSync(p: string): void {
  fs.rmSync(p, { recursive: true, force: true })
}

export function mkdirSync(dir: string): void {
  fs.mkdirSync(dir, { recursive: true })
}

export function cpSync(src: string, dest: string): void {
  fs.cpSync(src, dest, { recursive: true })
}

// ── async filesystem ────────────────────────────────────────────────

import fsPromises from 'node:fs/promises'

export async function readdirAsync(dir: string): Promise<Array<{ name: string; isDirectory(): boolean }>> {
  return fsPromises.readdir(dir, { withFileTypes: true })
}

export async function accessAsync(p: string): Promise<boolean> {
  try {
    await fsPromises.access(p)
    return true
  } catch {
    return false
  }
}

// ── path ────────────────────────────────────────────────────────────

export const joinPath: (...parts: string[]) => string = path.join
export const dirname: (p: string) => string = path.dirname
export const basename: (p: string) => string = path.basename
export const resolvePath: (...parts: string[]) => string = path.resolve
export const isAbsolute: (p: string) => boolean = path.isAbsolute
export const relativePath: (from: string, to: string) => string = path.relative

// ── os ──────────────────────────────────────────────────────────────

export function homedir(): string {
  return os.homedir()
}

// ── process ─────────────────────────────────────────────────────────

export const platform: string = process.platform

export function exit(code?: number): void {
  process.exit(code)
}

export function getEnv(key: string): string | undefined {
  return process.env[key]
}

export function setEnv(key: string, value: string): void {
  process.env[key] = value
}

export function cwd(): string {
  return process.cwd()
}

export function stdoutWrite(data: string): void {
  process.stdout.write(data)
}

export function isTTY(): boolean {
  return !!process.stdout.isTTY
}

export function getArgv(): string[] {
  return process.argv
}

// ── appearance ──────────────────────────────────────────────────────

export function getSystemAppearance(): 'dark' | 'light' {
  if (process.platform !== 'darwin') {
    return 'light'
  }
  try {
    const { execFileSync } = require('node:child_process') as typeof import('node:child_process')
    const result = execFileSync('defaults', ['read', '-g', 'AppleInterfaceStyle'], {
      encoding: 'utf-8',
      timeout: 500,
      stdio: ['pipe', 'pipe', 'pipe'],
    })
    return result.trim().toLowerCase() === 'dark' ? 'dark' : 'light'
  } catch {
    // "AppleInterfaceStyle" key doesn't exist when in light mode
    return 'light'
  }
}

// ── util ────────────────────────────────────────────────────────────

export function byteLength(str: string): number {
  return Buffer.byteLength(str, 'utf-8')
}

export function inspectValue(val: unknown, depth = 3): string {
  return util.inspect(val, { depth })
}

// ── error handling ──────────────────────────────────────────────────

export function setupErrorHandlers(handler: (err: Error, type: string) => void): void {
  process.on('uncaughtException', (err) => {
    handler(err, 'uncaughtException')
  })
  process.on('unhandledRejection', (reason) => {
    handler(
      reason instanceof Error ? reason : new Error(String(reason)),
      'unhandledRejection',
    )
  })
  process.on('uncaughtExceptionMonitor', (err, origin) => {
    handler(err, origin)
  })
}

// ── shell / clipboard ───────────────────────────────────────────────

export function execWithInput(command: string, input: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = _exec(command, (error) => {
      if (error) {
        reject(error)
      } else {
        resolve()
      }
    })
    child.stdin?.write(input)
    child.stdin?.end()
  })
}

export async function execCommand(command: string): Promise<string> {
  const { stdout } = await execAsync(command)
  return stdout
}

export async function copyToClipboard(text: string): Promise<void> {
  if (process.platform === 'darwin') {
    await execWithInput('pbcopy', text)
  } else if (process.platform === 'linux') {
    await execWithInput('xclip -selection clipboard', text)
  } else if (process.platform === 'win32') {
    await execWithInput('clip', text)
  }
}

export async function readClipboard(): Promise<string> {
  if (process.platform === 'darwin') {
    return (await execAsync('pbpaste')).stdout
  } else if (process.platform === 'linux') {
    return (await execAsync('xclip -selection clipboard -o')).stdout
  } else if (process.platform === 'win32') {
    return (await execAsync('powershell -command "Get-Clipboard"')).stdout
  }
  return ''
}

export async function openUrl(url: string): Promise<void> {
  if (process.platform === 'darwin') {
    await execAsync(`open "${url}"`)
  } else if (process.platform === 'linux') {
    await execAsync(`xdg-open "${url}"`)
  } else if (process.platform === 'win32') {
    await execAsync(`start "${url}"`)
  }
}

export async function openFile(target: string, app?: string): Promise<void> {
  if (process.platform === 'darwin') {
    if (app) {
      await execAsync(`open -a "${app}" "${target}"`)
    } else {
      await execAsync(`open "${target}"`)
    }
  } else if (process.platform === 'linux') {
    await execAsync(`xdg-open "${target}"`)
  } else if (process.platform === 'win32') {
    await execAsync(`start "" "${target}"`)
  }
}

export async function showInFileManager(filePath: string): Promise<void> {
  if (process.platform === 'darwin') {
    await execAsync(`open -R "${filePath}"`)
  } else if (process.platform === 'linux') {
    await execAsync(`xdg-open "$(dirname "${filePath}")"`)
  } else if (process.platform === 'win32') {
    await execAsync(`explorer /select,"${filePath}"`)
  }
}

export async function moveToTrash(filePath: string): Promise<void> {
  if (process.platform === 'darwin') {
    await execAsync(
      `osascript -e 'tell application "Finder" to delete POSIX file "${filePath}"'`,
    )
  } else if (process.platform === 'linux') {
    try {
      await execAsync(`gio trash "${filePath}"`)
    } catch {
      const trashDir = `${os.homedir()}/.local/share/Trash/files`
      await execAsync(`mkdir -p "${trashDir}" && mv "${filePath}" "${trashDir}/"`)
    }
  } else if (process.platform === 'win32') {
    await execAsync(
      `powershell -command "Add-Type -AssemblyName Microsoft.VisualBasic; [Microsoft.VisualBasic.FileIO.FileSystem]::DeleteFile('${filePath}','OnlyErrorDialogs','SendToRecycleBin')"`,
    )
  }
}
