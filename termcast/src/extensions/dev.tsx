import fs from 'node:fs'
import path from 'node:path'
import React from 'react'
import { createRoot } from '@opentui/react'
import { createCliRenderer } from '@opentui/core'
import { List, useStore } from 'termcast'
import { Action, ActionPanel } from 'termcast'
import { useNavigation } from 'termcast/src/internal/navigation'
import { TermcastProvider } from 'termcast/src/internal/providers'
import { showToast, Toast } from 'termcast/src/apis/toast'
import { Icon } from 'termcast'
import { getCommandsWithFiles, CommandWithFile } from '../package-json'
import { buildExtensionCommands } from '../build'
import {
  runCommand,
  clearCommandArguments,
  parseExtensionArgs,
  handleHelpFlag,
} from '../utils/run-command'

interface BundledCommand extends CommandWithFile {
  bundledPath: string
  Component?: (props: any) => any
}

function ExtensionCommandsList({
  extensionPath,
  commands,
  skipArgv,
}: {
  extensionPath: string
  commands: BundledCommand[]
  skipArgv?: number
}): any {
  const { push } = useNavigation()
  const { packageJson } = getCommandsWithFiles({
    packageJsonPath: path.join(extensionPath, 'package.json'),
  })

  const visibleCommands = commands.filter((cmd) => cmd.mode !== 'menu-bar')

  const handleCommandSelect = async (command: BundledCommand) => {
    clearCommandArguments()

    if (!command.bundledPath && !command.Component) {
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
        Component: command.Component,
        push,
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
          handleCommandSelect(command)
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
      handleCommandSelect(visibleCommands[0])
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
              ...(command.bundledPath
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

  // Build and set initial devElement
  const { commands } = await buildExtensionCommands({
    extensionPath: resolvedPath,
    format: 'esm',
    target: 'bun',
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
      <ExtensionCommandsList extensionPath={resolvedPath} commands={commands} skipArgv={skipArgv} />
    ),
    devRebuildCount: 1,
  })

  function App(): any {
    const devElement = useStore((state) => state.devElement)
    const devRebuildCount = useStore((state) => state.devRebuildCount)

    return <TermcastProvider key={String(devRebuildCount)}>{devElement}</TermcastProvider>
  }

  const renderer = await createCliRenderer({
    onDestroy: () => {
      process.exit(0)
    },
  })
  createRoot(renderer).render(<App />)
}

export async function startCompiledExtension({
  extensionPath,
  compiledCommands,
  skipArgv = 0,
}: {
  extensionPath: string
  compiledCommands: Array<{
    name: string
    bundledPath: string
    Component: (props: any) => any
  }>
  skipArgv?: number
}): Promise<void> {
  const packageJsonPath = path.join(extensionPath, 'package.json')
  const { packageJson, commands: commandsMetadata } = getCommandsWithFiles({
    packageJsonPath,
  })

  const commands: BundledCommand[] = compiledCommands.map((compiled) => {
    const metadata = commandsMetadata.find((cmd) => cmd.name === compiled.name)
    return {
      ...metadata!,
      bundledPath: '',
      Component: compiled.Component,
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

  useStore.setState({
    ...useStore.getInitialState(),
    extensionPath,
    extensionPackageJson: packageJson,
    devElement: (
      <ExtensionCommandsList extensionPath={extensionPath} commands={commands} skipArgv={skipArgv} />
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
    })

    // Re-parse package.json in case it changed
    const packageJsonPath = path.join(extensionPath, 'package.json')
    const { packageJson } = getCommandsWithFiles({ packageJsonPath })

    // Update the devElement with new commands and increment rebuild count
    const state = useStore.getState()

    useStore.setState({
      extensionPackageJson: packageJson,
      devElement: (
        <ExtensionCommandsList
          extensionPath={extensionPath}
          commands={commands}
        />
      ),
      devRebuildCount: state.devRebuildCount + 1,
      navigationStack: [], // Reset navigation so NavigationProvider re-initializes with new devElement
      dialogStack: [], // Clear any open dialogs/toasts on rebuild
      toast: null,
    })
  } catch (error: any) {
    await showToast({
      style: Toast.Style.Failure,
      title: 'Rebuild failed',
      message: error.message,
    })
  }
}
