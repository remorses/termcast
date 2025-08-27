import fs from 'node:fs'
import path from 'node:path'
import React from 'react'
import { render } from '@opentui/react'
import { List } from '@termcast/api'
import { Action, ActionPanel } from '@termcast/api'
import { useNavigation } from '@termcast/api/src/internal/navigation'
import { Providers } from '@termcast/api/src/internal/providers'
import { showToast, Toast } from '@termcast/api/src/toast'
import { Icon } from '@termcast/api'
import { getCommandsWithFiles, CommandWithFile } from './package-json'
import { buildExtensionCommands } from './build'

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
    const packageJson = getCommandsWithFiles(
        path.join(extensionPath, 'package.json'),
    ).packageJson

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

            const module = await import(command.bundledPath)
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
                            command.icon
                                ? Icon[command.icon as keyof typeof Icon]
                                : undefined
                        }
                        accessories={[
                            { text: command.mode },
                            ...(command.bundledPath
                                ? []
                                : [
                                      {
                                          text: 'Not built',
                                          tooltip:
                                              'Command was not built successfully',
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

export async function renderExtensionCommands(
    extensionPath: string,
): Promise<void> {
    const resolvedPath = path.resolve(extensionPath)

    if (!fs.existsSync(resolvedPath)) {
        throw new Error(`Extension path does not exist: ${resolvedPath}`)
    }

    const packageJsonPath = path.join(resolvedPath, 'package.json')
    if (!fs.existsSync(packageJsonPath)) {
        throw new Error(`No package.json found at: ${packageJsonPath}`)
    }

    // Build all commands
    const { commands } = await buildExtensionCommands(resolvedPath)

    function App(): any {
        return (
            <Providers>
                <ExtensionCommandsList
                    extensionPath={resolvedPath}
                    commands={commands}
                />
            </Providers>
        )
    }

    render(<App />)
}