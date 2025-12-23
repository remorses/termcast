import React, { type ReactNode } from 'react'
import { createRoot } from '@opentui/react'
import { createCliRenderer } from '@opentui/core'
import { TermcastProvider } from 'termcast/src/internal/providers'
import path from 'node:path'
import fs from 'node:fs'
import os from 'node:os'
import {
  parsePackageJson,
  type RaycastPackageJson,
  getCommandsWithFiles,
  type CommandWithFile,
} from './package-json'
import { logger } from './logger'

export async function renderWithProviders(element: ReactNode): Promise<void> {
  const renderer = await createCliRenderer({
    onDestroy: () => {
      process.exit(0)
    },
  })
  createRoot(renderer).render(<TermcastProvider>{element}</TermcastProvider>)
}

export type CommonProps = {
  key?: any
}

export interface Application {
  name: string
  path: string
  bundleId?: string
  localizedName?: string
  windowsAppId?: string
}

export type PathLike = string | Buffer | { href: string; toString(): string }

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function getApplications(path?: PathLike): Promise<Application[]> {
  // TODO: Implement system call to get applications
  // For now, return common applications
  const apps: Application[] = [
    {
      name: 'Finder',
      localizedName: 'Finder',
      path: '/System/Library/CoreServices/Finder.app',
      bundleId: 'com.apple.finder',
    },
    {
      name: 'Terminal',
      localizedName: 'Terminal',
      path: '/System/Applications/Utilities/Terminal.app',
      bundleId: 'com.apple.Terminal',
    },
    {
      name: 'Visual Studio Code',
      localizedName: 'Visual Studio Code',
      path: '/Applications/Visual Studio Code.app',
      bundleId: 'com.microsoft.VSCode',
    },
  ]
  return Promise.resolve(apps)
}

export async function getDefaultApplication(
  path: PathLike,
): Promise<Application> {
  // TODO: Implement system call to get default application for file type
  // For now, return a default app
  const defaultApp: Application = {
    name: 'Finder',
    localizedName: 'Finder',
    path: '/System/Library/CoreServices/Finder.app',
    bundleId: 'com.apple.finder',
  }
  return Promise.resolve(defaultApp)
}

export async function getFrontmostApplication(): Promise<Application> {
  if (process.platform !== 'darwin') {
    throw new Error('getFrontmostApplication is only supported on macOS')
  }

  const { execSync } = await import('node:child_process')

  // Get frontmost app bundle ID
  const bundleId = execSync(
    `osascript -e 'tell application "System Events" to get bundle identifier of first application process whose frontmost is true'`,
    { encoding: 'utf-8' },
  ).trim()

  // Get app path from bundle ID
  const path = execSync(
    `mdfind "kMDItemCFBundleIdentifier == '${bundleId}'" | head -1`,
    { encoding: 'utf-8' },
  ).trim()

  // Get app name from path
  const name = path.split('/').pop()?.replace('.app', '') || bundleId

  return {
    name,
    localizedName: name,
    path,
    bundleId,
  }
}

export async function showInFinder(path: PathLike): Promise<void> {
  const pathStr = typeof path === 'string' ? path : path.toString()

  if (process.platform !== 'darwin') {
    // On non-macOS, just open the parent directory
    const { dirname } = await import('node:path')
    return open(dirname(pathStr))
  }

  const { spawn } = await import('node:child_process')

  return new Promise((resolve, reject) => {
    // -R reveals the file in Finder
    const child = spawn('open', ['-R', pathStr], { stdio: 'ignore' })
    child.on('error', reject)
    child.on('close', (code) => {
      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`showInFinder failed with code ${code}`))
      }
    })
  })
}

export async function trash(path: PathLike | PathLike[]): Promise<void> {
  const paths = Array.isArray(path) ? path : [path]
  const pathStrs = paths.map((p) => (typeof p === 'string' ? p : p.toString()))

  if (process.platform === 'darwin') {
    const { execSync } = await import('node:child_process')

    for (const filePath of pathStrs) {
      // Use osascript to move to trash via Finder (proper macOS trash behavior)
      execSync(
        `osascript -e 'tell application "Finder" to delete POSIX file "${filePath}"'`,
        { stdio: 'ignore' },
      )
    }
  } else if (process.platform === 'win32') {
    // Windows: use PowerShell to move to recycle bin
    const { execSync } = await import('node:child_process')

    for (const filePath of pathStrs) {
      execSync(
        `powershell -Command "Add-Type -AssemblyName Microsoft.VisualBasic; [Microsoft.VisualBasic.FileIO.FileSystem]::DeleteFile('${filePath}', 'OnlyErrorDialogs', 'SendToRecycleBin')"`,
        { stdio: 'ignore' },
      )
    }
  } else {
    // Linux: try trash-cli, fall back to gio trash
    const { execSync, spawnSync } = await import('node:child_process')

    // Check if trash-cli is available
    const hasTrashCli = spawnSync('which', ['trash-put']).status === 0
    const hasGio = spawnSync('which', ['gio']).status === 0

    for (const filePath of pathStrs) {
      if (hasTrashCli) {
        execSync(`trash-put "${filePath}"`, { stdio: 'ignore' })
      } else if (hasGio) {
        execSync(`gio trash "${filePath}"`, { stdio: 'ignore' })
      } else {
        throw new Error(
          'No trash utility found. Install trash-cli or gio.',
        )
      }
    }
  }
}

export async function open(
  target: string,
  application?: Application | string,
): Promise<void> {
  const { spawn } = await import('node:child_process')
  const appName =
    typeof application === 'string' ? application : application?.name

  return new Promise((resolve, reject) => {
    let cmd: string
    let args: string[]

    if (process.platform === 'darwin') {
      // macOS
      cmd = 'open'
      args = appName ? ['-a', appName, target] : [target]
    } else if (process.platform === 'win32') {
      // Windows
      cmd = 'cmd'
      args = ['/c', 'start', '', target]
    } else {
      // Linux and others
      cmd = 'xdg-open'
      args = [target]
    }

    const child = spawn(cmd, args, { stdio: 'ignore', detached: true })
    child.unref()
    child.on('error', reject)
    child.on('spawn', () => resolve())
  })
}

export function captureException(exception: unknown): void {
  // TODO: Implement error reporting to Developer Hub
  console.error('[captureException] Exception captured:', exception)
}

export function getExtensionPath(extensionName: string): string {
  const storeDir = getStoreDirectory()
  return path.join(storeDir, extensionName)
}

export function getExtensionPackageJsonPath(extensionName: string): string {
  return path.join(getExtensionPath(extensionName), 'package.json')
}

export function getExtensionPackageJson(
  extensionName: string,
): RaycastPackageJson | null {
  const packageJsonPath = getExtensionPackageJsonPath(extensionName)

  if (!fs.existsSync(packageJsonPath)) {
    return null
  }

  try {
    return parsePackageJson({ packageJsonPath })
  } catch (error) {
    console.error(`Failed to parse package.json for ${extensionName}:`, error)
    return null
  }
}

export interface ExtensionPreferencesInfo {
  hasPreferences: boolean
  hasRequiredPreferences: boolean
}

export function checkExtensionPreferences(
  extensionName: string,
): ExtensionPreferencesInfo {
  const packageJson = getExtensionPackageJson(extensionName)

  if (!packageJson) {
    return { hasPreferences: false, hasRequiredPreferences: false }
  }

  // Check for extension-wide preferences
  const hasExtensionPreferences =
    packageJson.preferences && packageJson.preferences.length > 0

  // Check if any command has preferences
  const commandsWithPreferences = (packageJson.commands || []).filter(
    (cmd) => cmd.preferences && cmd.preferences.length > 0,
  )

  const hasPreferences =
    hasExtensionPreferences || commandsWithPreferences.length > 0

  // Check for required extension-wide preferences
  const requiredExtensionPrefs = (packageJson.preferences || []).filter(
    (pref) => pref.required,
  )

  // Check if any command has required preferences
  const commandsWithRequiredPrefs = (packageJson.commands || []).filter(
    (cmd) => {
      const requiredPrefs = (cmd.preferences || []).filter(
        (pref) => pref.required,
      )
      return requiredPrefs.length > 0
    },
  )

  const hasRequiredPreferences =
    requiredExtensionPrefs.length > 0 || commandsWithRequiredPrefs.length > 0

  return { hasPreferences, hasRequiredPreferences }
}

// Store management types
interface BundledCommand extends CommandWithFile {
  bundledPath: string
}

interface StoredExtension {
  name: string
  packageJsonPath: string
  commands: BundledCommand[]
}

export function resolveCommandPath({
  commandName,
  dir,
}: {
  commandName: string
  dir: string
}): string {
  // First check for .termcast-bundle directory
  const bundleDir = path.join(dir, '.termcast-bundle')
  const bundledPath = path.join(bundleDir, `${commandName}.js`)
  if (fs.existsSync(bundledPath)) {
    return bundledPath
  }

  // Then check for top-level command file
  const topLevelPath = path.join(dir, `${commandName}.js`)
  if (fs.existsSync(topLevelPath)) {
    return topLevelPath
  }

  // Return empty string if not found
  return ''
}

export function getStoreDirectory(): string {
  const homeDir = os.homedir()
  const storeDir = path.join(homeDir, '.termcast', 'store')

  // Ensure store directory exists
  if (!fs.existsSync(storeDir)) {
    fs.mkdirSync(storeDir, { recursive: true })
  }

  return storeDir
}

export function installExtension({
  extensionName,
  extensionSourcePath,
}: {
  extensionName: string
  extensionSourcePath: string
}): void {
  const storeDir = getStoreDirectory()
  const extensionDir = path.join(storeDir, extensionName)

  // Remove existing extension directory if it exists
  if (fs.existsSync(extensionDir)) {
    fs.rmSync(extensionDir, { recursive: true, force: true })
  }

  // Create extension directory
  fs.mkdirSync(extensionDir, { recursive: true })

  // Copy entire extension source directory
  fs.cpSync(extensionSourcePath, extensionDir, { recursive: true })

  logger.log(`Extension '${extensionName}' installed to ${extensionDir}`)
}

export function getStoredExtensions(): StoredExtension[] {
  const storeDir = getStoreDirectory()
  const extensions: StoredExtension[] = []

  if (!fs.existsSync(storeDir)) {
    return extensions
  }

  const entries = fs.readdirSync(storeDir, { withFileTypes: true })

  for (const entry of entries) {
    if (!entry.isDirectory()) continue

    const extensionDir = path.join(storeDir, entry.name)
    const packageJsonPath = path.join(extensionDir, 'package.json')

    if (!fs.existsSync(packageJsonPath)) {
      logger.log(`Skipping ${entry.name}: no package.json found`)
      continue
    }

    try {
      const commandsData = getCommandsWithFiles({ packageJsonPath })

      // Map commands to bundled commands using the resolver
      const bundledCommands: BundledCommand[] = commandsData.commands.map(
        (command) => {
          const bundledPath = resolveCommandPath({
            commandName: command.name,
            dir: extensionDir,
          })

          return {
            ...command,
            bundledPath,
          }
        },
      )

      extensions.push({
        name: entry.name,
        packageJsonPath,
        commands: bundledCommands,
      })
    } catch (error: any) {
      logger.error(`Failed to load extension ${entry.name}:`, error.message)
    }
  }

  return extensions
}

export type ParseExecOutputHandler<T = any> = (args: { stdout: string }) => T

export interface ExecuteOptions<T> {
  humanReadableOutput?: boolean
  language?: 'AppleScript' | 'JavaScript'
  signal?: AbortSignal
  timeout?: number
  parseOutput?: ParseExecOutputHandler<T>
}

/**
 * Executes an AppleScript or JavaScript for Automation script on macOS.
 *
 * This function provides a way to interact with macOS system features and applications
 * through AppleScript or JavaScript for Automation (JXA). Only available on macOS.
 *
 * @param script - The AppleScript or JavaScript code to execute
 * @param arguments_ - Optional array of arguments to pass to the script
 * @param options - Execution options
 * @param options.humanReadableOutput - Whether to format output for human readability (default: true)
 * @param options.language - Script language: "AppleScript" (default) or "JavaScript"
 * @param options.signal - AbortSignal to cancel execution
 * @param options.timeout - Maximum execution time in milliseconds (default: 10000)
 * @param options.parseOutput - Custom function to parse the script output
 * @returns A Promise that resolves to the script output (string by default, or custom type if parseOutput is provided)
 * @throws Error if not running on macOS or if script execution fails
 *
 * @example
 * ```typescript
 * // Simple AppleScript
 * const result = await runAppleScript('return "Hello World"')
 *
 * // AppleScript with arguments
 * const greeting = await runAppleScript(
 *   'return "Hello " & item 1 of argv',
 *   ['John']
 * )
 *
 * // JavaScript for Automation
 * const apps = await runAppleScript(
 *   'Application("System Events").processes.name()',
 *   undefined,
 *   { language: 'JavaScript' }
 * )
 *
 * // Custom output parsing
 * interface SystemInfo {
 *   name: string
 *   version: string
 * }
 * const info = await runAppleScript<SystemInfo>(
 *   'return "{\\"name\\": \\"macOS\\", \\"version\\": \\"14.0\\"}"',
 *   undefined,
 *   { parseOutput: ({ stdout }) => JSON.parse(stdout) }
 * )
 * ```
 */
export async function runAppleScript<T = string>(
  script: string,
  arguments_?: string[],
  options?: ExecuteOptions<T>,
): Promise<T> {
  if (process.platform !== 'darwin') {
    throw new Error('runAppleScript is only supported on macOS')
  }

  const { exec } = await import('node:child_process')
  const { promisify } = await import('node:util')
  const execAsync = promisify(exec)

  const language = options?.language || 'AppleScript'
  const timeout = options?.timeout || 10000
  const parseOutput = options?.parseOutput

  let command: string
  let fullScript = script

  if (arguments_ && arguments_.length > 0) {
    if (language === 'AppleScript') {
      const args = arguments_
        .map((arg) => `"${arg.replace(/"/g, '\\"')}"`)
        .join(', ')
      // Check if the script already has an "on run" handler
      if (script.includes('on run')) {
        fullScript = script
      } else {
        fullScript = `on run argv\n${script}\nend run`
      }
      // Execute with arguments passed separately
      command = `osascript ${options?.humanReadableOutput === false ? '' : '-ss'} -e '${fullScript.replace(/'/g, "'\"'\"'")}' ${args}`
    } else {
      // JavaScript for Automation
      const args = arguments_.map((arg) => `'${arg.replace(/'/g, "\\'")}'`)
      fullScript = `const argv = [${args.join(', ')}];\n${script}`
      const wrappedScript = `(function() { ${fullScript.replace(/'/g, "'\"'\"'")} })()`
      command = `osascript -l JavaScript -e '${wrappedScript}'`
    }
  } else {
    const escapedScript = fullScript.replace(/'/g, "'\"'\"'")

    if (language === 'JavaScript') {
      // For JavaScript, wrap in a function to allow return statements
      const wrappedScript = `(function() { ${escapedScript} })()`
      command = `osascript -l JavaScript -e '${wrappedScript}'`
    } else {
      command = `osascript ${options?.humanReadableOutput === false ? '' : '-ss'} -e '${escapedScript}'`
    }
  }

  try {
    const { stdout, stderr } = await execAsync(command, {
      timeout,
      signal: options?.signal,
    })

    if (stderr) {
      throw new Error(stderr)
    }

    let result = stdout.trim()

    // Remove surrounding quotes if present (AppleScript returns quoted strings)
    if (
      result.startsWith('"') &&
      result.endsWith('"') &&
      options?.humanReadableOutput !== false
    ) {
      result = result.slice(1, -1)
    }

    if (parseOutput) {
      return parseOutput({ stdout: result })
    }

    return result as T
  } catch (error: any) {
    if (error.code === 'ETIMEDOUT') {
      throw new Error(`AppleScript execution timed out after ${timeout}ms`)
    }
    throw error
  }
}

export enum LaunchType {
  UserInitiated = 'userInitiated',
  Background = 'background',
}

export enum DeeplinkType {
  Extension = 'extension',
  ScriptCommand = 'script-command',
}

export interface LaunchProps {
  name?: string
  path?: string
  callback?: () => void
  fallbackText?: string
  preferredItemHeight?: string
  resizeToContent?: boolean
  subtitle?: string
  onSearchTextChange?: (text: string) => void
  arguments?: any
  context?: any
  type?: string
}

interface ExtensionDeeplinkOptions {
  type?: DeeplinkType.Extension
  command: string
  launchType?: LaunchType
  arguments?: LaunchProps['arguments']
  fallbackText?: string
  ownerOrAuthorName?: string
  extensionName?: string
}

interface ScriptCommandDeeplinkOptions {
  type: DeeplinkType.ScriptCommand
  command: string
  arguments?: string[]
}

/**
 * Creates a Raycast deeplink URL for extensions or script commands.
 *
 * Deeplinks allow you to launch Raycast commands from external applications or share
 * direct links to specific functionality. Supports both installed extensions and
 * script commands.
 *
 * @param options - Configuration for the deeplink
 * @param options.type - Type of deeplink: DeeplinkType.Extension (default) or DeeplinkType.ScriptCommand
 * @param options.command - The command name to execute
 * @param options.launchType - How to launch the command: LaunchType.UserInitiated or LaunchType.Background (extension only)
 * @param options.arguments - Arguments to pass to the command (extension: any object, script: string array)
 * @param options.fallbackText - Text to show if the command is not available (extension only)
 * @param options.ownerOrAuthorName - The owner or author name for published extensions (extension only)
 * @param options.extensionName - The extension name (extension only)
 * @returns A Raycast deeplink URL string
 *
 * @example
 * ```typescript
 * // Extension deeplink
 * const extensionUrl = createDeeplink({
 *   command: 'search-notes',
 *   extensionName: 'notion',
 *   ownerOrAuthorName: 'raycast',
 *   arguments: { query: 'meeting notes' },
 *   fallbackText: 'Search Notion'
 * })
 * // Returns: "raycast://extensions/raycast/notion/search-notes?fallbackText=Search+Notion&arguments=%257B%2522query%2522%253A%2522meeting%2520notes%2522%257D"
 *
 * // Script command deeplink
 * const scriptUrl = createDeeplink({
 *   type: DeeplinkType.ScriptCommand,
 *   command: 'toggle-system-appearance',
 *   arguments: ['dark']
 * })
 * // Returns: "raycast://script-commands/toggle-system-appearance?name=toggle-system-appearance&arguments=dark"
 *
 * // Background launch
 * const backgroundUrl = createDeeplink({
 *   command: 'sync-data',
 *   launchType: LaunchType.Background,
 *   extensionName: 'my-extension'
 * })
 * ```
 */
export function createDeeplink(
  options: ExtensionDeeplinkOptions | ScriptCommandDeeplinkOptions,
): string {
  const baseUrl = 'raycast://'

  if (options.type === DeeplinkType.ScriptCommand) {
    const params = new URLSearchParams()
    params.set('name', options.command)

    if (options.arguments && options.arguments.length > 0) {
      params.set('arguments', options.arguments.join('\t'))
    }

    return `${baseUrl}script-commands/${options.command}?${params.toString()}`
  }

  // Extension deeplink
  const extensionOptions = options as ExtensionDeeplinkOptions
  const params = new URLSearchParams()

  if (extensionOptions.fallbackText) {
    params.set('fallbackText', extensionOptions.fallbackText)
  }

  if (extensionOptions.launchType) {
    params.set('launchType', extensionOptions.launchType)
  }

  if (extensionOptions.arguments) {
    params.set(
      'arguments',
      encodeURIComponent(JSON.stringify(extensionOptions.arguments)),
    )
  }

  let path = 'extensions'

  if (extensionOptions.ownerOrAuthorName && extensionOptions.extensionName) {
    path = `${path}/${extensionOptions.ownerOrAuthorName}/${extensionOptions.extensionName}`
  } else if (extensionOptions.extensionName) {
    path = `${path}/${extensionOptions.extensionName}`
  }

  const queryString = params.toString()
  const url = `${baseUrl}${path}/${extensionOptions.command}${queryString ? '?' + queryString : ''}`

  return url
}

/**
 * Executes a SQL query on a local SQLite database and returns the results.
 *
 * This function provides read-only access to SQLite databases, useful for querying
 * application data, browser history, or other local SQLite-based storage.
 *
 * @param databasePath - Absolute path to the SQLite database file
 * @param query - SQL query to execute (SELECT statements recommended)
 * @returns A Promise that resolves to an array of result objects
 * @throws Error if the database file doesn't exist or query execution fails
 * @template T - Type of the expected result objects (default: unknown)
 *
 * @example
 * ```typescript
 * // Query browser bookmarks
 * interface Bookmark {
 *   title: string
 *   url: string
 *   date_added: number
 * }
 * const bookmarks = await executeSQL<Bookmark>(
 *   '/Users/john/Library/Safari/Bookmarks.db',
 *   'SELECT title, url, date_added FROM bookmarks ORDER BY date_added DESC LIMIT 10'
 * )
 *
 * // Query application data
 * const appData = await executeSQL(
 *   '/path/to/app.db',
 *   'SELECT * FROM settings WHERE key = "theme"'
 * )
 *
 * // Aggregate query
 * interface Stats {
 *   total: number
 *   average: number
 * }
 * const stats = await executeSQL<Stats>(
 *   '/path/to/data.db',
 *   'SELECT COUNT(*) as total, AVG(score) as average FROM results'
 * )
 * ```
 */
export async function executeSQL<T = unknown>(
  databasePath: string,
  query: string,
): Promise<T[]> {
  const { Database } = await import('bun:sqlite')

  if (!fs.existsSync(databasePath)) {
    throw new Error(`Database file not found: ${databasePath}`)
  }

  const db = new Database(databasePath, {
    readonly: true,
  })

  try {
    const stmt = db.prepare(query)
    const results = stmt.all() as T[]
    return results
  } catch (error: any) {
    throw new Error(`SQL execution failed: ${error.message}`)
  } finally {
    db.close()
  }
}
