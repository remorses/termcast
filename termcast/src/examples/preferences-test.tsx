import React from 'react'
import { List, Action, ActionPanel, showToast, Toast } from '@termcast/cli'
import {
    getPreferenceValues,
    openExtensionPreferences,
    openCommandPreferences,
} from '@termcast/cli'
import { renderWithProviders } from '@termcast/cli'

function PreferencesTestExample(): any {
    const handleGetPreferences = () => {
        const prefs = getPreferenceValues()
        showToast({
            style: Toast.Style.Success,
            title: 'Current Preferences',
            message:
                Object.keys(prefs).length > 0
                    ? JSON.stringify(prefs, null, 2)
                    : 'No preferences set',
        })
    }

    const handleOpenExtensionPrefs = async () => {
        try {
            await openExtensionPreferences()
        } catch (error) {
            showToast({
                style: Toast.Style.Failure,
                title: 'Error',
                message: String(error),
            })
        }
    }

    const handleOpenCommandPrefs = async () => {
        try {
            await openCommandPreferences()
        } catch (error) {
            showToast({
                style: Toast.Style.Failure,
                title: 'Error',
                message: String(error),
            })
        }
    }

    return (
        <List navigationTitle='Preferences Test'>
            <List.Item
                title='Get Current Preferences'
                subtitle='Shows current preference values'
                actions={
                    <ActionPanel>
                        <Action
                            title='Get Preferences'
                            onAction={handleGetPreferences}
                        />
                    </ActionPanel>
                }
            />

            <List.Item
                title='Open Extension Preferences'
                subtitle='Opens the extension preferences form'
                actions={
                    <ActionPanel>
                        <Action
                            title='Open'
                            onAction={handleOpenExtensionPrefs}
                        />
                    </ActionPanel>
                }
            />

            <List.Item
                title='Open Command Preferences'
                subtitle='Opens the command preferences form'
                actions={
                    <ActionPanel>
                        <Action
                            title='Open'
                            onAction={handleOpenCommandPrefs}
                        />
                    </ActionPanel>
                }
            />
        </List>
    )
}

renderWithProviders(<PreferencesTestExample />)
