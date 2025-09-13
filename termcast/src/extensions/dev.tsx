import fs from 'node:fs'
import path from 'node:path'
import React from 'react'
import { render } from '@opentui/react'
import { List, useStore } from '@termcast/cli'
import { Action, ActionPanel } from '@termcast/cli'
import { useNavigation } from '@termcast/cli/src/internal/navigation'
import { Providers } from '@termcast/cli/src/internal/providers'
import { showToast, Toast } from '@termcast/cli/src/apis/toast'
import { Icon } from '@termcast/cli'
import { getCommandsWithFiles, CommandWithFile } from '../package-json'
import { buildExtensionCommands } from '../build'

interface BundledCommand extends CommandWithFile {
  bundledPath: string
}

function ExtensionCommandsList({
  extensionPath,
  commands,
}: {
  extensionPath: string
  commands: BundledCommand[]
}): any {
  const { push } = useNavigation()
  const packageJson = getCommandsWithFiles({
    packageJsonPath: path.join(extensionPath, 'package.json'),
  }).packageJson

  const handleCommandSelect = async (command: BundledCommand) => {
    try {
      if (!command.bundledPath) {
        await showToast({
          style: Toast.Style.Failure,
          title: 'Command not built',
          message: `Command ${command.name} was not built successfully`,
        })
        return
      }

      const state = useStore.getState()
      const devRebuildCount = state.devRebuildCount

      // Set the current command in state
      useStore.setState({ currentCommandName: command.name })

      const module = await import(
        `${command.bundledPath}?rebuild=${devRebuildCount}`
      )
      const Component = module.default

      if (!Component) {
        await showToast({
          style: Toast.Style.Failure,
          title: 'No default export',
          message: `Command file ${command.name} has no default export`,
        })
        return
      }

      push(<Component />)
    } catch (error) {
      await showToast({
        style: Toast.Style.Failure,
        title: 'Failed to load command',
        message: error.message ? error.message : error,
      })
    }
  }

  return (
    <List
      navigationTitle={packageJson.title || 'Extension Commands'}
      searchBarPlaceholder='Search commands...'
    >
      <List.Section title='Commands'>
        {commands.map((command) => (
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

      {commands.length === 0 && (
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
}: {
  extensionPath: string
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
  })

  // Reset state and set extension information
  useStore.setState({
    ...useStore.getInitialState(),
    extensionPath: resolvedPath,
    extensionPackageJson: packageJson,
    devElement: (
      <ExtensionCommandsList extensionPath={resolvedPath} commands={commands} />
    ),
    devRebuildCount: 1,
  })

  function App(): any {
    const devElement = useStore((state) => state.devElement)
    const devRebuildCount = useStore((state) => state.devRebuildCount)

    return <Providers key={String(devRebuildCount)}>{devElement}</Providers>
  }

  await render(<App />)
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
    })
  } catch (error: any) {
    await showToast({
      style: Toast.Style.Failure,
      title: 'Rebuild failed',
      message: error.message,
    })
  }
}
