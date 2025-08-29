import fs from 'node:fs'
import React from 'react'
import { render } from '@opentui/react'
import { List, logger, useStore } from '@termcast/cli'
import { Action, ActionPanel } from '@termcast/cli'
import { useNavigation } from '@termcast/cli/src/internal/navigation'
import { Providers } from '@termcast/cli/src/internal/providers'
import { showToast, Toast } from '@termcast/cli/src/toast'
import { Icon } from '@termcast/cli'
import { getStoredExtensions } from './store'
import Store from './extensions/store'
import { ExtensionPreferences } from './components/extension-preferences'
import { LocalStorage } from '@termcast/cli/src/localstorage'
import './globals'

interface ExtensionCommand {
    extensionName: string
    extensionTitle: string
    command: any
    bundledPath?: string
    Component?: () => any
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
        Component: Store,
    },
]

function ExtensionsList({ allCommands }: { allCommands: ExtensionCommand[] }): any {
    const { push } = useNavigation()

    const handleCommandSelect = async (item: ExtensionCommand) => {
        try {
            await runCommand(item)
        } catch (error: any) {
            await showToast({
                style: Toast.Style.Failure,
                title: 'Failed to load command',
                message: error.message || String(error),
            })
        }
    }

    const runCommand = async (item: ExtensionCommand) => {
        // Check if command has required preferences that are missing
        const checkRequiredPreferences = async (): Promise<{
            hasRequiredPreferences: boolean
            requiredPreferences?: 'command' | 'extension'
        }> => {
            // Get package.json to check required preferences
            if (!item.bundledPath || item.Component || !item.packageJson) {
                // Built-in commands or commands without packageJson don't have preferences
                return { hasRequiredPreferences: true }
            }

            const packageJson = item.packageJson

            // Check command-specific preferences
            const command = packageJson.commands?.find((cmd: any) => cmd.name === item.command.name)
            const commandPrefs = command?.preferences || []

            // Check extension-wide preferences
            const extensionPrefs = packageJson.preferences || []

            // Get saved preferences
            const commandPrefsKey = `preferences.${item.extensionName}.${item.command.name}`
            const extensionPrefsKey = `preferences.${item.extensionName}`

            const savedCommandPrefs = await LocalStorage.getItem(commandPrefsKey)
            const savedExtensionPrefs = await LocalStorage.getItem(extensionPrefsKey)

            const parsedCommandPrefs = savedCommandPrefs ? JSON.parse(savedCommandPrefs as string) : {}
            const parsedExtensionPrefs = savedExtensionPrefs ? JSON.parse(savedExtensionPrefs as string) : {}

            // Check if all required command preferences are set
            for (const pref of commandPrefs) {
                if (pref.required && parsedCommandPrefs[pref.name] == null) {
                    return {
                        hasRequiredPreferences: false,
                        requiredPreferences: 'command'
                    }
                }
            }

            // Check if all required extension preferences are set
            for (const pref of extensionPrefs) {
                if (pref.required && parsedExtensionPrefs[pref.name] == null) {
                    return {
                        hasRequiredPreferences: false,
                        requiredPreferences: 'extension'
                    }
                }
            }

            return { hasRequiredPreferences: true }
        }

        const prefsCheck = await checkRequiredPreferences()

        if (!prefsCheck.hasRequiredPreferences) {
            // TODO: Use replace instead of push to avoid stacking navigation
            // Redirect to preferences with onSubmit to run command after
            push(
                <ExtensionPreferences
                    extensionName={item.extensionName}
                    commandName={prefsCheck.requiredPreferences === 'command' ? item.command.name : undefined}
                    onSubmit={() => {
                        // Recursively run command after preferences are set
                        runCommand(item)
                    }}
                />
            )
            return
        }

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
                                    <Action
                                        title='Configure Extension'
                                        onAction={() => {
                                            push(<ExtensionPreferences
                                                extensionName={item.extensionName}
                                                onSubmit={() => {
                                                    // After configuring extension preferences, try to run the command
                                                    runCommand(item)
                                                }}
                                            />)
                                        }}
                                    />
                                    <Action
                                        title='Configure Command'
                                        onAction={() => {
                                            push(<ExtensionPreferences
                                                extensionName={item.extensionName}
                                                commandName={item.command.name}
                                                onSubmit={() => {
                                                    // After configuring command preferences, try to run the command
                                                    runCommand(item)
                                                }}
                                            />)
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
                    packageJson,
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
    logger.log(`preparing to render the home command component`)

    await render(<App />)
    logger.log(`rendered home command component`)
}
