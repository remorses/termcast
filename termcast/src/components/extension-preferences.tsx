import React from 'react'
import fs from 'node:fs'
import path from 'node:path'
import { useQuery } from '@tanstack/react-query'
import { Form } from './form'
import { showToast, Toast } from '../apis/toast'
import { ActionPanel, Action } from './actions'
import { LocalStorage } from 'termcast/src/apis/localstorage'
import { useNavigation } from 'termcast/src/internal/navigation'
import { logger } from 'termcast/src/logger'
import { getStoreDirectory } from 'termcast/src/utils'
import { useStore } from 'termcast/src/state'
import type { RaycastPackageJson } from 'termcast/src/package-json'

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
  const { pop } = useNavigation()

  const { data, isLoading } = useQuery({
    queryKey: ['extension-preferences', extensionName, commandName],
    queryFn: async () => {
      try {
        // First check extensionPath from state (dev mode), then fall back to store directory
        const { extensionPath, extensionPackageJson } = useStore.getState()

        let packageJson: RaycastPackageJson

        if (extensionPackageJson?.name === extensionName) {
          // Dev mode or compiled extension - use package.json from state
          packageJson = extensionPackageJson
        } else if (extensionPath && fs.existsSync(path.join(extensionPath, 'package.json'))) {
          // Dev mode with extensionPath - read from disk
          packageJson = JSON.parse(fs.readFileSync(path.join(extensionPath, 'package.json'), 'utf-8'))
        } else {
          // Store extension - read from store directory
          const storeDir = getStoreDirectory()
          const extensionDir = path.join(storeDir, extensionName)
          const packageJsonPath = path.join(extensionDir, 'package.json')

          if (!fs.existsSync(packageJsonPath)) {
            throw new Error(`Extension ${extensionName} not found`)
          }

          packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))
        }

        let prefsToUse: PreferenceManifest[] = []

        if (commandName) {
          const command = packageJson.commands?.find(
            (cmd) => cmd.name === commandName,
          )
          if (command) {
            prefsToUse = command.preferences || []
          }
        } else {
          prefsToUse = packageJson.preferences || []
        }

        const preferencesKey = commandName
          ? `preferences.${extensionName}.${commandName}`
          : `preferences.${extensionName}`
        const saved = await LocalStorage.getItem(preferencesKey)

        let savedValues: Record<string, any> = {}
        if (saved && typeof saved === 'string') {
          try {
            savedValues = JSON.parse(saved)
          } catch (e) {
            logger.error('Failed to parse saved preferences:', e)
          }
        }

        return { preferences: prefsToUse, savedValues }
      } catch (error) {
        logger.error(`Failed to load preferences for ${extensionName}:`, error)
        showToast({
          style: Toast.Style.Failure,
          title: 'Failed to load preferences',
          message: String(error),
        })
        return { preferences: [], savedValues: {} }
      }
    },
  })

  const preferences = data?.preferences ?? []
  const savedValues = data?.savedValues ?? {}

  const handleSubmit = async (values: Record<string, any>) => {
    try {
      // Transform file/directory values from arrays to strings
      // Form.FilePicker returns string[] but Raycast preferences expect string for file/directory types
      const transformedValues: Record<string, any> = {}
      for (const pref of preferences) {
        const value = values[pref.name]
        if (
          (pref.type === 'file' ||
            pref.type === 'directory' ||
            pref.type === 'appPicker') &&
          Array.isArray(value)
        ) {
          // Extract first element from array, or empty string if empty
          transformedValues[pref.name] = value[0] || ''
        } else {
          transformedValues[pref.name] = value
        }
      }

      // Save preferences to LocalStorage
      const preferencesKey = commandName
        ? `preferences.${extensionName}.${commandName}`
        : `preferences.${extensionName}`
      await LocalStorage.setItem(preferencesKey, JSON.stringify(transformedValues))

      await showToast({
        style: Toast.Style.Success,
        title: 'Preferences saved',
        message: commandName
          ? `Preferences for ${extensionName}/${commandName} have been saved`
          : `Preferences for ${extensionName} have been saved`,
      })

      if (onSubmit) {
        onSubmit(transformedValues)
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
    return <Form isLoading />
  }

  if (preferences.length === 0) {
    // TODO this causes an infinite loop, because initially prefs are zero
    // if (onSubmit) {
    //   onSubmit({})
    //   return null
    // }

    return (
      <Form
        actions={
          <ActionPanel>
            <Action.SubmitForm title='Close' onSubmit={() => pop()} />
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
          <Action.SubmitForm title='Save Preferences' onSubmit={handleSubmit} />
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
                storeValue
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
                storeValue
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
                storeValue
              />
            )

          case 'dropdown':
            return (
              <Form.Dropdown
                id={pref.name}
                title={pref.title}
                defaultValue={defaultValue}
                info={pref.description}
                storeValue
              >
                {pref.data?.map((item) => (
                  <Form.Dropdown.Item value={item.value} title={item.title} />
                ))}
              </Form.Dropdown>
            )

          case 'file':
            return (
              <Form.FilePicker
                key={pref.name}
                id={pref.name}
                title={pref.title}
                placeholder={pref.placeholder || 'Select a file'}
                defaultValue={defaultValue ? [defaultValue] : []}
                info={pref.description}
                allowMultipleSelection={false}
                canChooseFiles={true}
                canChooseDirectories={false}
                storeValue
              />
            )

          case 'directory':
            return (
              <Form.FilePicker
                key={pref.name}
                id={pref.name}
                title={pref.title}
                placeholder={pref.placeholder || 'Select a folder'}
                defaultValue={defaultValue ? [defaultValue] : []}
                info={pref.description}
                allowMultipleSelection={false}
                canChooseFiles={false}
                canChooseDirectories={true}
                storeValue
              />
            )

          case 'appPicker':
            return (
              <Form.FilePicker
                key={pref.name}
                id={pref.name}
                title={pref.title}
                placeholder={pref.placeholder || 'Select an application'}
                defaultValue={defaultValue ? [defaultValue] : []}
                info={pref.description || 'Select an application'}
                allowMultipleSelection={false}
                canChooseFiles={true}
                canChooseDirectories={false}
                initialDirectory='/Applications'
                storeValue
              />
            )

          default:
            return null
        }
      })}
    </Form>
  )
}
