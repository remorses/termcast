import fs from 'node:fs'
import path from 'node:path'
import React from 'react'
import { List, logger, useStore, renderWithProviders } from 'termcast'
import { Action, ActionPanel } from 'termcast'
import { useNavigation } from 'termcast/src/internal/navigation'
import { showToast, Toast } from 'termcast/src/apis/toast'
import { Icon } from 'termcast'
import { getStoredExtensions } from '../utils'
import Store from './store'
import { ExtensionPreferences } from '../components/extension-preferences'
import { runCommand, clearCommandArguments } from '../utils/run-command'
import '../globals'

interface ExtensionCommand {
  extensionName: string
  extensionTitle: string
  extensionDir?: string
  command: any
  bundledPath?: string
  loadComponent?: () => Promise<(props: any) => any>
  packageJson?: any
}

// Built-in extensions available globally
const builtinExtensions: ExtensionCommand[] = [
  {
    extensionName: 'termcast-store',
    extensionTitle: 'Termcast Store',
    command: {
      name: 'store',
      title: 'Store - Install Extensions',
      description: 'Browse and install extensions from the Raycast Store',
      mode: 'view',
      icon: 'Store',
    },
    loadComponent: async () => Store,
  },
]

function ExtensionsList({
  allCommands,
  initialSearchQuery = '',
}: {
  allCommands: ExtensionCommand[]
  initialSearchQuery?: string
}): any {
  const { push, replace } = useNavigation()
  const [searchText, setSearchText] = React.useState(initialSearchQuery)

  const handleCommandSelect = async (item: ExtensionCommand) => {
    clearCommandArguments()

    try {
      await runCommand({
        command: item.command,
        extensionName: item.extensionName,
        packageJson: item.packageJson,
        bundledPath: item.bundledPath,
        loadComponent: item.loadComponent,
        push,
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

  // Group commands by extension
  const groupedByExtension = allCommands.reduce(
    (acc, cmd) => {
      if (!acc[cmd.extensionName]) {
        acc[cmd.extensionName] = {
          title: cmd.extensionTitle,
          commands: [],
        }
      }
      acc[cmd.extensionName].commands.push(cmd)
      return acc
    },
    {} as Record<string, { title: string; commands: ExtensionCommand[] }>,
  )

  return (
    <List
      navigationTitle='Installed Extensions'
      searchBarPlaceholder='Search commands...'
      filtering={true}
      onSearchTextChange={setSearchText}
      searchText={searchText}
    >
      {Object.entries(groupedByExtension).map(
        ([extensionName, { title, commands }]) => (
          <List.Section key={extensionName} title={title}>
            {commands.map((item) => (
              <List.Item
                key={`${item.extensionName}-${item.command.name}`}
                id={`${item.extensionName}-${item.command.name}`}
                title={item.command.title}
                subtitle={item.command.description}
                icon={
                  item.command.icon
                    ? Icon[item.command.icon as keyof typeof Icon]
                    : undefined
                }
                accessories={
                  item.command.mode ? [{ text: item.command.mode }] : []
                }
                keywords={[
                  ...(item.command.keywords || []),
                  item.extensionName,
                ]}
                actions={
                  <ActionPanel>
                    <Action
                      title='Run Command'
                      onAction={() => {
                        handleCommandSelect(item)
                      }}
                    />
                    <Action
                      title='Configure Extension'
                      onAction={() => {
                        push(
                          <ExtensionPreferences
                            extensionName={item.extensionName}
                            onSubmit={() => {
                              handleCommandSelect(item)
                            }}
                          />,
                        )
                      }}
                    />
                    <Action
                      title='Configure Command'
                      onAction={() => {
                        push(
                          <ExtensionPreferences
                            extensionName={item.extensionName}
                            commandName={item.command.name}
                            onSubmit={() => {
                              handleCommandSelect(item)
                            }}
                          />,
                        )
                      }}
                    />
                    {item.bundledPath && (
                      <Action.CopyToClipboard
                        content={item.bundledPath}
                        title='Copy Bundle Path'
                      />
                    )}
                    <Action.CopyToClipboard
                      content={JSON.stringify(item.command, null, 2)}
                      title='Copy Command Info'
                    />
                  </ActionPanel>
                }
              />
            ))}
          </List.Section>
        ),
      )}

      {allCommands.length === 0 && (
        <List.Section title='No Commands'>
          <List.Item
            title='No extensions installed'
            subtitle='Use "termcast build" to install an extension'
          />
        </List.Section>
      )}
    </List>
  )
}

export async function runHomeCommand(): Promise<void> {
  logger.log(`preparing to render the home command component`)
  await renderWithProviders(<Home />)
  logger.log(`rendered home command component`)
}

export default function Home({
  initialSearchQuery = '',
  key,
}: {
  initialSearchQuery?: string
  key?: React.Key
}): any {
  const storedExtensions = getStoredExtensions()

  const allCommands: ExtensionCommand[] = []

  allCommands.push(...builtinExtensions)

  for (const extension of storedExtensions) {
    const packageJson = JSON.parse(
      fs.readFileSync(extension.packageJsonPath, 'utf-8'),
    )
    const extensionPath = path.dirname(extension.packageJsonPath)

    for (const command of extension.commands) {
      if (command.bundledPath) {
        allCommands.push({
          extensionName: extension.name,
          extensionTitle: packageJson.title || extension.name,
          extensionDir: extensionPath,
          command,
          bundledPath: command.bundledPath,
          packageJson,
        })
      }
    }
  }

  return (
    <ExtensionsList
      allCommands={allCommands}
      initialSearchQuery={initialSearchQuery}
    />
  )
}
