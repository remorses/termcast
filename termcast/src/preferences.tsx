import React from 'react'
import { useStore } from '@termcast/cli/src/state'
import { logger } from '@termcast/cli/src/logger'
import { LocalStorage } from '@termcast/cli/src/localstorage'
import { ExtensionPreferences } from '@termcast/cli/src/components/extension-preferences'

export type PreferenceValues = {
    [preferenceName: string]: any
}

/**
 * A function to access the preference values that have been passed to the command.
 * Each preference name is mapped to its value, and the defined default values are used as fallback values.
 * 
 * @returns An object with the preference names as property key and the typed value as property value.
 */
export function getPreferenceValues<Values extends PreferenceValues = PreferenceValues>(): Values {
    const state = useStore.getState()
    const { extensionPackageJson, currentCommandName, extensionPath } = state
    
    // Determine the extension name from package.json or path
    let extensionName: string | null = null
    if (extensionPackageJson?.name) {
        extensionName = extensionPackageJson.name
    } else if (extensionPath) {
        // Extract extension name from path if package.json not available
        const pathParts = extensionPath.split('/')
        extensionName = pathParts[pathParts.length - 1]
    }
    
    if (!extensionName) {
        logger.log('No extension context found for preferences')
        return {} as Values
    }
    
    try {
        // First try to load command-specific preferences, then fall back to extension preferences
        if (currentCommandName) {
            const commandPreferencesKey = `preferences.${extensionName}.${currentCommandName}`
            const commandPreferences = LocalStorage.getItemSync(commandPreferencesKey)
            
            if (commandPreferences && typeof commandPreferences === 'string') {
                try {
                    const parsed = JSON.parse(commandPreferences)
                    logger.log(`Loaded command preferences for ${extensionName}/${currentCommandName}:`, parsed)
                    return parsed as Values
                } catch (parseError) {
                    logger.error(`Failed to parse command preferences:`, parseError)
                }
            }
        }
        
        // Fall back to extension-level preferences
        const extensionPreferencesKey = `preferences.${extensionName}`
        const extensionPreferences = LocalStorage.getItemSync(extensionPreferencesKey)
        
        if (extensionPreferences && typeof extensionPreferences === 'string') {
            try {
                const parsed = JSON.parse(extensionPreferences)
                logger.log(`Loaded extension preferences for ${extensionName}:`, parsed)
                return parsed as Values
            } catch (parseError) {
                logger.error(`Failed to parse extension preferences:`, parseError)
            }
        }
    } catch (error) {
        logger.error(`Failed to load preferences for ${extensionName}:`, error)
    }
    
    // Return empty preferences if none saved
    return {} as Values
}

/**
 * Opens the extension's preferences screen.
 * 
 * @returns A Promise that resolves when the extensions preferences screen is opened.
 */
export async function openExtensionPreferences(): Promise<void> {
    const state = useStore.getState()
    const { extensionPackageJson, navigationStack } = state
    
    if (!extensionPackageJson?.name) {
        throw new Error('No current extension found')
    }
    
    logger.log(`Opening extension preferences for ${extensionPackageJson.name}`)
    
    // Push the preferences component to the navigation stack
    const preferencesComponent = <ExtensionPreferences extensionName={extensionPackageJson.name} />
    
    useStore.setState({
        navigationStack: [...navigationStack, { component: preferencesComponent }],
        dialogStack: []
    })
    
    return Promise.resolve()
}

/**
 * Opens the command's preferences screen.
 * 
 * @returns A Promise that resolves when the command's preferences screen is opened.
 */
export async function openCommandPreferences(): Promise<void> {
    const state = useStore.getState()
    const { extensionPackageJson, currentCommandName, navigationStack } = state
    
    if (!extensionPackageJson?.name || !currentCommandName) {
        throw new Error('No current command found')
    }
    
    logger.log(`Opening command preferences for ${extensionPackageJson.name}/${currentCommandName}`)
    
    // Push the preferences component to the navigation stack
    const preferencesComponent = (
        <ExtensionPreferences 
            extensionName={extensionPackageJson.name} 
            commandName={currentCommandName} 
        />
    )
    
    useStore.setState({
        navigationStack: [...navigationStack, { component: preferencesComponent }],
        dialogStack: []
    })
    
    return Promise.resolve()
}