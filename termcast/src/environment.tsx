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

import os from 'node:os'
import path from 'node:path'
import fs from 'node:fs'
import { execSync } from 'node:child_process'

export interface Environment {
  appearance: "dark" | "light"
  assetsPath: string
  commandMode: "view" | "no-view" | "menu-bar"
  commandName: string
  extensionName: string
  isDevelopment: boolean
  launchType: LaunchType
  ownerOrAuthorName: string
  raycastVersion: string
  supportPath: string
  textSize: "medium" | "large"
  canAccess(api: any): boolean
  theme: "dark" | "light"
}

export enum LaunchType {
  UserInitiated = "userInitiated",
  Background = "background"
}

export interface LaunchProps<T extends Record<string, any> = Record<string, any>> {
  arguments: T
  fallbackText?: string
  launchContext?: { [key: string]: any }
}

class EnvironmentImpl implements Environment {
  get appearance(): "dark" | "light" {
    // Check for system appearance preference
    if (process.env.TERMCAST_APPEARANCE) {
      return process.env.TERMCAST_APPEARANCE as "dark" | "light"
    }
    // Try to detect system theme on macOS
    if (process.platform === 'darwin') {
      try {
        const result = execSync('defaults read -g AppleInterfaceStyle 2>/dev/null', { encoding: 'utf8' })
        return result.includes('Dark') ? 'dark' : 'light'
      } catch {
        return 'light'
      }
    }
    return 'light'
  }

  get assetsPath(): string {
    // Return the assets directory path
    return process.env.TERMCAST_ASSETS_PATH || path.join(process.cwd(), 'assets')
  }

  get commandMode(): "view" | "no-view" | "menu-bar" {
    return process.env.TERMCAST_COMMAND_MODE as any || 'view'
  }

  get commandName(): string {
    // Get the command name from environment or package.json
    return process.env.TERMCAST_COMMAND_NAME || process.argv[1]?.split('/').pop() || 'command'
  }

  get extensionName(): string {
    // Try to read from package.json
    try {
      const packagePath = path.join(process.cwd(), 'package.json')
      if (fs.existsSync(packagePath)) {
        const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'))
        return pkg.name || 'termcast-extension'
      }
    } catch {
      // Ignore errors
    }
    return process.env.TERMCAST_EXTENSION_NAME || 'termcast-extension'
  }

  get isDevelopment(): boolean {
    return process.env.NODE_ENV === 'development' || process.env.TERMCAST_ENV === 'development' || false
  }

  get launchType(): LaunchType {
    const type = process.env.TERMCAST_LAUNCH_TYPE
    return type === "background" ? LaunchType.Background : LaunchType.UserInitiated
  }

  get ownerOrAuthorName(): string {
    // Try to read from package.json
    try {
      const packagePath = path.join(process.cwd(), 'package.json')
      if (fs.existsSync(packagePath)) {
        const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'))
        return pkg.author?.name || pkg.author || 'Unknown'
      }
    } catch {
      // Ignore errors
    }
    return process.env.TERMCAST_AUTHOR || 'Unknown'
  }

  get raycastVersion(): string {
    // Return a version that indicates termcast compatibility
    return process.env.TERMCAST_VERSION || '1.0.0-termcast'
  }

  get supportPath(): string {
    // Create a support directory in the user's data directory
    const baseDir = process.env.TERMCAST_SUPPORT_PATH || 
      path.join(os.homedir(), '.termcast', 'support', this.extensionName)
    
    // Ensure the directory exists
    if (!fs.existsSync(baseDir)) {
      fs.mkdirSync(baseDir, { recursive: true })
    }
    
    return baseDir
  }

  get textSize(): "medium" | "large" {
    return process.env.TERMCAST_TEXT_SIZE as any || 'medium'
  }

  // Alias for appearance to match Raycast API
  get theme(): "dark" | "light" {
    return this.appearance
  }

  canAccess(api: any): boolean {
    // In termcast, all APIs are accessible
    // This method exists for Raycast compatibility
    return true
  }
}

export const environment = new EnvironmentImpl()

export async function getSelectedFinderItems(): Promise<string[]> {
  // TODO: Improve cross-platform support
  // Currently only works on macOS using AppleScript
  // Should add support for:
  // 1. Windows Explorer selection (via PowerShell or COM)
  // 2. Linux file managers (Nautilus, Dolphin, etc.)
  if (process.platform === 'darwin') {
    try {
      // Use AppleScript to get selected Finder items
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
      const result = execSync(`osascript -e '${script}'`, { encoding: 'utf8' })
      return result.trim().split(', ').filter(Boolean)
    } catch {
      return []
    }
  }
  // TODO: Implement for other platforms
  return []
}

export async function getSelectedText(): Promise<string> {
  // TODO: Improve implementation and cross-platform support
  // Current implementation has issues:
  // 1. Modifies the clipboard (should preserve original content)
  // 2. Uses delay which may not be reliable
  // 3. Only works on macOS
  // Should add support for Windows and Linux
  if (process.platform === 'darwin') {
    try {
      // TODO: Save and restore clipboard contents to avoid side effects
      // Use AppleScript to get selected text from frontmost application
      const script = `
        tell application "System Events"
          keystroke "c" using command down
          delay 0.1
          return (the clipboard)
        end tell
      `
      const result = execSync(`osascript -e '${script}'`, { encoding: 'utf8' })
      return result.trim()
    } catch {
      return ''
    }
  }
  // TODO: Implement for Windows (via PowerShell) and Linux (xclip/xsel)
  return ''
}