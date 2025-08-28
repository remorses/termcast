import fs from 'node:fs'
import React from 'react'
import { render } from '@opentui/react'
import { List, useStore } from '@termcast/api'
import { Action, ActionPanel } from '@termcast/api'
import { useNavigation } from '@termcast/api/src/internal/navigation'
import { Providers } from '@termcast/api/src/internal/providers'
import { showToast, Toast } from '@termcast/api/src/toast'
import { Icon } from '@termcast/api'
import { getStoredExtensions } from './store'
import Store from './extensions/store'

interface ExtensionCommand {
    extensionName: string
    extensionTitle: string
    command: any
    bundledPath?: string
    Component?: () => any
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
        Component: Store,
    },
]

function ExtensionsList({ allCommands }: { allCommands: ExtensionCommand[] }): any {
    const { push } = useNavigation()

    const handleCommandSelect = async (item: ExtensionCommand) => {
        try {
            let Component: (() => any) | undefined

            if (item.Component) {
                Component = item.Component
            } else if (item.bundledPath) {
                const module = await import(item.bundledPath)
                Component = module.default

                if (!Component) {
                    await showToast({
                        style: Toast.Style.Failure,
                        title: 'No default export',
                        message: `Command file ${item.command.name} has no default export`,
                    })
                    return
                }
            } else {
                await showToast({
                    style: Toast.Style.Failure,
                    title: 'Command not available',
                    message: `Command ${item.command.name} has no implementation`,
                })
                return
            }

            push(<Component />)
        } catch (error: any) {
            await showToast({
                style: Toast.Style.Failure,
                title: 'Failed to load command',
                message: error.message || String(error),
            })
        }
    }

    // Group commands by extension
    const groupedByExtension = allCommands.reduce((acc, cmd) => {
        if (!acc[cmd.extensionName]) {
            acc[cmd.extensionName] = {
                title: cmd.extensionTitle,
                commands: [],
            }
        }
        acc[cmd.extensionName].commands.push(cmd)
        return acc
    }, {} as Record<string, { title: string; commands: ExtensionCommand[] }>)

    return (
        <List
            navigationTitle='Installed Extensions'
            searchBarPlaceholder='Search commands...'
        >
            {Object.entries(groupedByExtension).map(([extensionName, { title, commands }]) => (
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
                            accessories={item.command.mode ? [{ text: item.command.mode }] : []}
                            keywords={item.command.keywords}
                            actions={
                                <ActionPanel>
                                    <Action
                                        title='Run Command'
                                        onAction={() => {
                                            handleCommandSelect(item)
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
            ))}

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
    await import('./globals')

    const storedExtensions = getStoredExtensions()

    const allCommands: ExtensionCommand[] = []

    allCommands.push(...builtinExtensions)

    for (const extension of storedExtensions) {
        const packageJson = JSON.parse(
            fs.readFileSync(extension.packageJsonPath, 'utf-8')
        )

        for (const command of extension.commands) {
            if (command.bundledPath) {
                allCommands.push({
                    extensionName: extension.name,
                    extensionTitle: packageJson.title || extension.name,
                    command,
                    bundledPath: command.bundledPath,
                })
            }
        }
    }

    function App(): any {
        return (
            <Providers>
                <ExtensionsList allCommands={allCommands} />
            </Providers>
        )
    }

    await render(<App />)
}
