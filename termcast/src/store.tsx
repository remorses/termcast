import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { logger } from './logger'
import { getCommandsWithFiles, type CommandWithFile } from './package-json'

interface BundledCommand extends CommandWithFile {
  bundledPath: string
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

interface StoredExtension {
  name: string
  packageJsonPath: string
  commands: BundledCommand[]
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
