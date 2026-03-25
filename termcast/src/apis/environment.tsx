/**
 * Environment API - Provides access to environment information and context
 *
 * Raycast Docs: https://developers.raycast.com/api-reference/environment
 *
 * The environment object provides information about the command's runtime context,
 * including theme settings, development mode, launch type, and paths. LaunchType enum
 * indicates whether the command was triggered by user action or background process.
 *
 * Key features:
 * - Access to appearance/theme (dark/light)
 * - Extension and command metadata
 * - Launch context (user-initiated vs background)
 * - Support and assets paths for file storage
 * - System integration (selected Finder items, selected text)
 */

import {
  homedir,
  joinPath,
  basename,
  platform,
  getEnv,
  ensureDir,
  fileExists,
  execCommand,
  getSystemAppearance,
} from '#platform/runtime'
import { useStore } from '../state'

export interface Environment {
  appearance: 'dark' | 'light'
  assetsPath: string
  commandMode: 'view' | 'no-view' | 'menu-bar'
  commandName: string
  extensionName: string
  isDevelopment: boolean
  launchType: LaunchType
  ownerOrAuthorName: string
  raycastVersion: string
  supportPath: string
  textSize: 'medium' | 'large'
  canAccess(api: any): boolean
  theme: 'dark' | 'light'
}

export enum LaunchType {
  UserInitiated = 'userInitiated',
  Background = 'background',
}

export interface LaunchProps<
  T extends Record<string, any> = Record<string, any>,
> {
  arguments: T
  fallbackText?: string
  launchContext?: { [key: string]: any }
}

class EnvironmentImpl implements Environment {
  constructor() {
    // Bind all methods to this instance
    this.canAccess = this.canAccess.bind(this)
  }

  get appearance(): 'dark' | 'light' {
    return getSystemAppearance()
  }

  get assetsPath(): string {
    const state = useStore.getState()
    if (state.extensionPath) {
      return joinPath(state.extensionPath, 'assets')
    }
    // TODO: Fallback for non-dev mode extensions
    return joinPath(homedir(), '.termcast', 'assets')
  }

  get commandMode(): 'view' | 'no-view' | 'menu-bar' {
    const state = useStore.getState()
    if (state.currentCommandName && state.extensionPackageJson?.commands) {
      const command = state.extensionPackageJson.commands.find(
        (cmd) => cmd.name === state.currentCommandName,
      )
      if (command) {
        return command.mode
      }
    }
    return 'view'
  }

  get commandName(): string {
    const state = useStore.getState()
    if (state.currentCommandName) {
      return state.currentCommandName
    }
    return ''
  }

  get extensionName(): string {
    const state = useStore.getState()
    if (state.extensionPackageJson?.name) {
      return state.extensionPackageJson.name
    }
    if (state.extensionPath) {
      return basename(state.extensionPath)
    }
    return ''
  }

  get isDevelopment(): boolean {
    const state = useStore.getState()
    // We're in development mode if devElement is set
    return state.devElement !== null
  }

  get launchType(): LaunchType {
    // TODO: Support background commands when implemented
    return LaunchType.UserInitiated
  }

  get ownerOrAuthorName(): string {
    const state = useStore.getState()
    const pkg = state.extensionPackageJson
    if (pkg?.author) {
      return pkg.author
    }
    if (pkg?.owner) {
      return pkg.owner
    }
    return ''
  }

  get raycastVersion(): string {
    // Return a version that indicates termcast compatibility
    return '1.0.0-termcast'
  }

  get supportPath(): string {
    // Create a support directory in the user's data directory
    const baseDir = joinPath(
      homedir(),
      '.termcast',
      'support',
      this.extensionName,
    )

    ensureDir(baseDir)

    return baseDir
  }

  get textSize(): 'medium' | 'large' {
    // TODO: Make this configurable via preferences
    return 'medium'
  }

  // Alias for appearance to match Raycast API
  get theme(): 'dark' | 'light' {
    return this.appearance
  }

  canAccess(api: any): boolean {
    // In termcast, all APIs are accessible
    // This method exists for Raycast compatibility
    return true
  }
}

export const environment = new EnvironmentImpl()

// Whether the TUI is running inside a standalone desktop app built with `termcast app build`.
// In app mode, ESC at root level does not exit the process.
export function isAppMode(): boolean {
  return getEnv('TERMCAST_APP_MODE') === '1'
}

export async function getSelectedFinderItems(): Promise<string[]> {
  // TODO: Improve cross-platform support
  if (platform === 'darwin') {
    try {
      const script = `
        tell application "Finder"
          set theSelection to selection
          set thePaths to {}
          repeat with theItem in theSelection
            set end of thePaths to POSIX path of (theItem as alias)
          end repeat
          return thePaths
        end tell
      `
      const result = await execCommand(`osascript -e '${script}'`)
      return result.trim().split(', ').filter(Boolean)
    } catch {
      return []
    }
  }
  return []
}

export interface LaunchOptions {
  name: string
  type: LaunchType
  arguments?: Record<string, any>
  context?: Record<string, any>
}

export async function launchCommand(options: LaunchOptions): Promise<void> {
  const state = useStore.getState()
  const { extensionPath, extensionPackageJson, navigationStack, devRebuildCount } = state

  if (!extensionPackageJson) {
    throw new Error('No extension loaded')
  }

  // launchCommand requires filesystem access to import the command module
  // For compiled extensions, the commands are pre-bundled and this function won't work
  if (!extensionPath) {
    throw new Error('launchCommand is not supported in compiled extensions - commands must be accessed through the main extension entry point')
  }

  const commandDef = extensionPackageJson.commands?.find(
    (cmd) => cmd.name === options.name,
  )

  if (!commandDef) {
    throw new Error(`Command '${options.name}' not found in extension`)
  }

  const bundledPath = joinPath(extensionPath, '.termcast-bundle', `${options.name}.js`)

  if (!fileExists(bundledPath)) {
    throw new Error(`Command '${options.name}' has not been built`)
  }

  const importPath = devRebuildCount
    ? `${bundledPath}?rebuild=${devRebuildCount}`
    : bundledPath
  const module = await import(importPath)
  const CommandComponent = module.default

  if (!CommandComponent) {
    throw new Error(`Command '${options.name}' has no default export`)
  }

  const launchProps: LaunchProps = {
    arguments: options.arguments || {},
    fallbackText: undefined,
    launchContext: options.context,
  }

  useStore.setState({ currentCommandName: options.name })

  if (commandDef.mode === 'no-view') {
    await CommandComponent(launchProps)
    return
  }

  const { createElement } = await import('react')
  const element = createElement(CommandComponent, launchProps)

  useStore.setState({
    navigationStack: [...navigationStack, { element }],
  })
}

export async function getSelectedText(): Promise<string> {
  if (platform === 'darwin') {
    try {
      const script = `
        tell application "System Events"
          keystroke "c" using command down
          delay 0.1
          return (the clipboard)
        end tell
      `
      const result = await execCommand(`osascript -e '${script}'`)
      return result.trim()
    } catch {
      return ''
    }
  }
  return ''
}
