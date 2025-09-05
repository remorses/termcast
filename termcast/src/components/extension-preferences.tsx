import React, { useState, useEffect } from 'react'
import fs from 'node:fs'
import path from 'node:path'
import { Form, showToast, Toast, ActionPanel, Action } from '@termcast/cli'
import { LocalStorage } from '@termcast/cli/src/localstorage'
import { useNavigation } from '@termcast/cli/src/internal/navigation'
import { logger } from '@termcast/cli/src/logger'
import { getStoreDirectory } from '@termcast/cli/src/store'
import type { RaycastPackageJson } from '@termcast/cli/src/package-json'

interface ExtensionPreferencesProps {
    extensionName: string
    commandName?: string
    onSubmit?: (values: Record<string, any>) => void
}

interface PreferenceManifest {
    name: string
    type:
        | 'textfield'
        | 'password'
        | 'checkbox'
        | 'dropdown'
        | 'file'
        | 'directory'
        | 'appPicker'
    title: string
    description?: string
    required?: boolean
    placeholder?: string
    default?: any
    data?: Array<{ title: string; value: string }> // For dropdown
}

export function ExtensionPreferences({
    extensionName,
    commandName,
    onSubmit,
}: ExtensionPreferencesProps): any {
    const [preferences, setPreferences] = useState<PreferenceManifest[]>([])
    const [savedValues, setSavedValues] = useState<Record<string, any>>({})
    const [isLoading, setIsLoading] = useState(true)
    const { pop } = useNavigation()

    useEffect(() => {
        const loadPreferences = async () => {
            try {
                // Get extension package.json to read preference manifest
                const storeDir = getStoreDirectory()
                const extensionDir = path.join(storeDir, extensionName)
                const packageJsonPath = path.join(extensionDir, 'package.json')

                if (!fs.existsSync(packageJsonPath)) {
                    throw new Error(`Extension ${extensionName} not found`)
                }

                const packageJson: RaycastPackageJson = JSON.parse(
                    fs.readFileSync(packageJsonPath, 'utf-8'),
                )

                // Get preferences based on whether this is for a command or extension
                let prefsToUse: PreferenceManifest[] = []

                if (commandName) {
                    // Look for command-specific preferences
                    const command = packageJson.commands?.find(
                        (cmd) => cmd.name === commandName,
                    )
                    if (command) {
                        prefsToUse = command.preferences || []
                    }
                } else {
                    // Get extension preferences (shared across all commands)
                    prefsToUse = packageJson.preferences || []
                }

                // Load saved values from LocalStorage
                const preferencesKey = commandName
                    ? `preferences.${extensionName}.${commandName}`
                    : `preferences.${extensionName}`
                const saved = await LocalStorage.getItem(preferencesKey)

                if (saved && typeof saved === 'string') {
                    try {
                        const parsed = JSON.parse(saved)
                        setSavedValues(parsed)
                    } catch (e) {
                        logger.error('Failed to parse saved preferences:', e)
                    }
                }

                setPreferences(prefsToUse)
            } catch (error) {
                logger.error(
                    `Failed to load preferences for ${extensionName}:`,
                    error,
                )
                await showToast({
                    style: Toast.Style.Failure,
                    title: 'Failed to load preferences',
                    message: String(error),
                })
            } finally {
                setIsLoading(false)
            }
        }

        loadPreferences()
    }, [extensionName])

    const handleSubmit = async (values: Record<string, any>) => {
        try {
            // Save preferences to LocalStorage
            const preferencesKey = commandName
                ? `preferences.${extensionName}.${commandName}`
                : `preferences.${extensionName}`
            await LocalStorage.setItem(preferencesKey, JSON.stringify(values))

            await showToast({
                style: Toast.Style.Success,
                title: 'Preferences saved',
                message: commandName
                    ? `Preferences for ${extensionName}/${commandName} have been saved`
                    : `Preferences for ${extensionName} have been saved`,
            })

            if (onSubmit) {
                onSubmit(values)
            } else {
                pop()
            }
        } catch (error) {
            await showToast({
                style: Toast.Style.Failure,
                title: 'Failed to save preferences',
                message: String(error),
            })
        }
    }

    if (isLoading) {
        return <Form isLoading={true} />
    }

    if (preferences.length === 0) {
        // If no preferences but onSubmit provided, call it immediately
        if (onSubmit) {
            onSubmit({})
            return null
        }

        return (
            <Form
                actions={
                    <ActionPanel>
                        <Action.SubmitForm
                            title='Close'
                            onSubmit={() => pop()}
                        />
                    </ActionPanel>
                }
            >
                <Form.Description
                    text={
                        commandName
                            ? `No preferences available for ${extensionName}/${commandName}`
                            : `No preferences available for ${extensionName}`
                    }
                />
            </Form>
        )
    }

    return (
        <Form
            actions={
                <ActionPanel>
                    <Action.SubmitForm
                        title='Save Preferences'
                        onSubmit={handleSubmit}
                    />
                </ActionPanel>
            }
            navigationTitle={
                commandName
                    ? `${extensionName}/${commandName} Preferences`
                    : `${extensionName} Preferences`
            }
        >
            {preferences.map((pref) => {
                const defaultValue = savedValues[pref.name] ?? pref.default

                switch (pref.type) {
                    case 'textfield':
                        return (
                            <Form.TextField
                                key={pref.name}
                                id={pref.name}
                                title={pref.title}
                                placeholder={pref.placeholder}
                                defaultValue={defaultValue}
                                info={pref.description}
                                storeValue={true}
                            />
                        )

                    case 'password':
                        return (
                            <Form.PasswordField
                                key={pref.name}
                                id={pref.name}
                                title={pref.title}
                                placeholder={pref.placeholder}
                                defaultValue={defaultValue}
                                info={pref.description}
                                storeValue={true}
                            />
                        )

                    case 'checkbox':
                        return (
                            <Form.Checkbox
                                key={pref.name}
                                id={pref.name}
                                label={pref.title}
                                defaultValue={defaultValue}
                                info={pref.description}
                                storeValue={true}
                            />
                        )

                    case 'dropdown':
                        return (
                            <Form.Dropdown
                                id={pref.name}
                                title={pref.title}
                                defaultValue={defaultValue}
                                info={pref.description}
                                storeValue={true}
                            >
                                {pref.data?.map((item) => (
                                    <Form.Dropdown.Item
                                        value={item.value}
                                        title={item.title}
                                    />
                                ))}
                            </Form.Dropdown>
                        )

                    // TODO: Implement file and directory pickers and appPicker
                    case 'file':
                    case 'directory':
                    case 'appPicker':
                        return (
                            <Form.TextField
                                key={pref.name}
                                id={pref.name}
                                title={pref.title}
                                placeholder={
                                    pref.type === 'file'
                                        ? 'Enter file path'
                                        : pref.type === 'directory'
                                          ? 'Enter directory path'
                                          : 'Enter application name'
                                }
                                defaultValue={defaultValue}
                                info={
                                    pref.description ||
                                    `Select a ${pref.type.replace('appPicker', 'application')}`
                                }
                                storeValue={true}
                            />
                        )

                    default:
                        return null
                }
            })}
        </Form>
    )
}
