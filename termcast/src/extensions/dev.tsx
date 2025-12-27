// CRITICAL: Import react-refresh-init FIRST before @opentui/react!
// This ensures the devtools hook exists and can intercept injectIntoDevTools calls
import { RefreshRuntime, hasRefreshCapability, getRendererInternals } from './react-refresh-init'

import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import React from 'react'
import { createRoot } from '@opentui/react'
import { createCliRenderer } from '@opentui/core'
import { List, useStore } from 'termcast'
import { Action, ActionPanel } from 'termcast'
import { useNavigation } from 'termcast/src/internal/navigation'
import { TermcastProvider } from 'termcast/src/internal/providers'
import { showToast, Toast } from 'termcast/src/apis/toast'
import { Icon } from 'termcast'
import { logger } from '../logger'
import { getCommandsWithFiles, CommandWithFile, RaycastPackageJson } from '../package-json'
import { buildExtensionCommands } from '../build'
import {
  runCommand,
  clearCommandArguments,
  parseExtensionArgs,
  handleHelpFlag,
} from '../utils/run-command'

interface BundledCommand extends CommandWithFile {
  bundledPath: string
  loadComponent?: () => Promise<(props: any) => any>
}

function ExtensionCommandsList({
  packageJson,
  commands,
  skipArgv,
}: {
  packageJson: RaycastPackageJson
  commands: BundledCommand[]
  skipArgv?: number
}): any {
  const { push, replace } = useNavigation()

  const visibleCommands = commands.filter((cmd) => cmd.mode !== 'menu-bar')

  const handleCommandSelect = async (command: BundledCommand, useReplace = false) => {
    clearCommandArguments()

    if (!command.bundledPath && !command.loadComponent) {
      await showToast({
        style: Toast.Style.Failure,
        title: 'Command not built',
        message: `Command ${command.name} was not built successfully`,
      })
      return
    }

    try {
      await runCommand({
        command,
        extensionName: packageJson.name,
        packageJson,
        bundledPath: command.bundledPath,
        loadComponent: command.loadComponent,
        push: useReplace ? replace : push,
        replace,
      })
    } catch (error: any) {
      await showToast({
        style: Toast.Style.Failure,
        title: 'Failed to load command',
        message: error.message || String(error),
      })
    }
  }

  // Auto-run command from CLI arg or single command
  React.useLayoutEffect(() => {
    // Only parse argv on initial load (when skipArgv is provided), not on rebuilds
    if (skipArgv != null) {
      const { commandName } = parseExtensionArgs({ skipArgv })

      if (commandName) {
        const command = visibleCommands.find((cmd) => cmd.name === commandName)
        if (command) {
          // Use replace so ESC at root exits instead of going back to command list
          handleCommandSelect(command, true)
        } else {
          showToast({
            style: Toast.Style.Failure,
            title: 'Command not found',
            message: `No command named "${commandName}"`,
          })
        }
        return
      }
    }

    if (visibleCommands.length === 1) {
      // Use replace so ESC at root exits instead of going back to command list
      handleCommandSelect(visibleCommands[0], true)
    }
  }, [])

  if (visibleCommands.length === 1) {
    return null
  }

  return (
    <List
      navigationTitle={packageJson.title || 'Extension Commands'}
      searchBarPlaceholder='Search commands...'
    >
      <List.Section title='Commands'>
        {visibleCommands.map((command) => (
          <List.Item
            key={command.name}
            id={command.name}
            title={command.title}
            subtitle={command.description}
            icon={
              command.icon ? Icon[command.icon as keyof typeof Icon] : undefined
            }
            accessories={[
              { text: command.mode },
              ...(command.bundledPath || command.loadComponent
                ? []
                : [
                    {
                      text: 'Not built',
                      tooltip: 'Command was not built successfully',
                    },
                  ]),
            ]}
            keywords={command.keywords}
            actions={
              <ActionPanel>
                <Action
                  title='Run Command'
                  onAction={() => {
                    handleCommandSelect(command)
                  }}
                />
                <Action.CopyToClipboard
                  content={command.filePath}
                  title='Copy File Path'
                />
                <Action.CopyToClipboard
                  content={JSON.stringify(command, null, 2)}
                  title='Copy Command Info'
                />
              </ActionPanel>
            }
          />
        ))}
      </List.Section>

      {visibleCommands.length === 0 && (
        <List.Section title='No Commands'>
          <List.Item
            title='No commands found'
            subtitle='Check your package.json for command definitions'
          />
        </List.Section>
      )}
    </List>
  )
}

export async function startDevMode({
  extensionPath,
  skipArgv = 0,
}: {
  extensionPath: string
  skipArgv?: number
}): Promise<void> {
  const resolvedPath = path.resolve(extensionPath)

  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`Extension path does not exist: ${resolvedPath}`)
  }

  const packageJsonPath = path.join(resolvedPath, 'package.json')
  if (!fs.existsSync(packageJsonPath)) {
    throw new Error(`No package.json found at: ${packageJsonPath}`)
  }

  // Parse the package.json to get extension metadata
  const { packageJson } = getCommandsWithFiles({ packageJsonPath })

  // Build and set initial devElement with hot reload support
  const { commands } = await buildExtensionCommands({
    extensionPath: resolvedPath,
    format: 'esm',
    target: 'bun',
    hotReload: true,
  })

  // Handle --help before rendering
  handleHelpFlag({
    extensionName: packageJson.title || packageJson.name,
    commands: commands.map((cmd) => ({
      name: cmd.name,
      title: cmd.title,
      description: cmd.description,
    })),
    skipArgv,
  })

  // Reset state and set extension information
  useStore.setState({
    ...useStore.getInitialState(),
    extensionPath: resolvedPath,
    extensionPackageJson: packageJson,
    devElement: (
      <ExtensionCommandsList packageJson={packageJson} commands={commands} skipArgv={skipArgv} />
    ),
    devRebuildCount: 1,
  })

  function App(): any {
    const devElement = useStore((state) => state.devElement)
    // REMOVED: key={devRebuildCount} - we want to preserve the React tree!
    // React Refresh will update components in-place without remounting
    return <TermcastProvider>{devElement}</TermcastProvider>
  }

  const renderer = await createCliRenderer({
    onDestroy: () => {
      process.exit(0)
    },
  })
  createRoot(renderer).render(<App />)
}

export async function startCompiledExtension({
  packageJson,
  compiledCommands,
  skipArgv = 0,
}: {
  packageJson: RaycastPackageJson
  compiledCommands: Array<{
    name: string
    loadComponent: () => Promise<(props: any) => any>
  }>
  skipArgv?: number
}): Promise<void> {
  // Build command metadata from packageJson.commands
  const commandsMetadata = (packageJson.commands || []).map((cmd) => ({
    ...cmd,
    filePath: '',
    exists: true,
  }))

  const commands: BundledCommand[] = compiledCommands.map((compiled) => {
    const metadata = commandsMetadata.find((cmd) => cmd.name === compiled.name)
    return {
      ...metadata!,
      filePath: '',
      exists: true,
      bundledPath: '',
      loadComponent: compiled.loadComponent,
    }
  })

  // Handle --help before rendering
  handleHelpFlag({
    extensionName: packageJson.title || packageJson.name,
    commands: commands.map((cmd) => ({
      name: cmd.name,
      title: cmd.title,
      description: cmd.description,
    })),
    skipArgv,
  })

  // For compiled extensions, use ~/.termcast/compiled/{name} as extensionPath
  // This is where data.db and cache will be stored
  const compiledExtensionPath = path.join(os.homedir(), '.termcast', 'compiled', packageJson.name)

  useStore.setState({
    ...useStore.getInitialState(),
    extensionPath: compiledExtensionPath,
    extensionPackageJson: packageJson,
    devElement: (
      <ExtensionCommandsList packageJson={packageJson} commands={commands} skipArgv={skipArgv} />
    ),
    devRebuildCount: 1,
  })

  function App(): any {
    const devElement = useStore((state) => state.devElement)
    return <TermcastProvider>{devElement}</TermcastProvider>
  }

  const renderer = await createCliRenderer({
    onDestroy: () => {
      process.exit(0)
    },
  })
  createRoot(renderer).render(<App />)
}

export async function triggerRebuild({
  extensionPath,
}: {
  extensionPath: string
}): Promise<void> {
  try {
    const { commands } = await buildExtensionCommands({
      extensionPath,
      format: 'esm',
      target: 'bun',
      hotReload: true,
    })

    // Re-parse package.json in case it changed
    const packageJsonPath = path.join(extensionPath, 'package.json')
    const { packageJson } = getCommandsWithFiles({ packageJsonPath })

    const state = useStore.getState()
    const newRebuildCount = state.devRebuildCount + 1

    // Re-import all command modules with cache bust
    // This triggers $RefreshReg$ calls which register new component versions
    // TODO maybe we can skip importing all command modules here. only the one being used instead
    for (const cmd of commands) {
      if (cmd.bundledPath) {
        try {
          await import(`${cmd.bundledPath}?v=${newRebuildCount}`)
        } catch (err) {
          logger.error(`Failed to reimport ${cmd.name}:`, err)
        }
      }
    }

    // Trigger React Refresh - this updates components in-place!
    // The reconciler will find all fibers using updated "families"
    // and schedule re-renders with the new implementations
    RefreshRuntime.performReactRefresh()

    // Update state WITHOUT resetting navigation/dialog stacks
    useStore.setState({
      extensionPackageJson: packageJson,
      devRebuildCount: newRebuildCount,
      devElement: (
        <ExtensionCommandsList
          packageJson={packageJson}
          commands={commands}
        />
      ),
    })

    // TODO show a green dot in the corner to notify HMR happened
  } catch (error: any) {
    await showToast({
      style: Toast.Style.Failure,
      title: 'Rebuild failed',
      message: error.message,
    })
  }
}
