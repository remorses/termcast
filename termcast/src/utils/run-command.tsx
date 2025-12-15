import React from 'react'
import { useStore } from 'termcast/src/state'
import { showToast, Toast } from 'termcast/src/apis/toast'
import { LocalStorage } from 'termcast/src/apis/localstorage'
import { CommandArguments } from 'termcast/src/components/command-arguments'
import { ExtensionPreferences } from 'termcast/src/components/extension-preferences'
import type { RaycastArgument, RaycastPackageJson } from 'termcast/src/package-json'
import type { LaunchProps } from 'termcast/src/apis/environment'

export interface RunnableCommand {
  name: string
  title: string
  mode: 'view' | 'no-view' | 'menu-bar'
  arguments?: RaycastArgument[]
  preferences?: any[]
}

export interface RunCommandOptions {
  command: RunnableCommand
  extensionName: string
  packageJson?: RaycastPackageJson
  bundledPath?: string
  Component?: (props: LaunchProps) => any
  push: (element: React.ReactNode) => void
  // For dev mode, adds cache busting query param
  cacheBustParam?: string
}

export async function runCommand(options: RunCommandOptions): Promise<void> {
  const {
    command,
    extensionName,
    packageJson,
    bundledPath,
    Component: BuiltInComponent,
    push,
    cacheBustParam,
  } = options

  // Check if command has required preferences that are missing
  const prefsCheck = await checkRequiredPreferences({
    command,
    extensionName,
    packageJson,
    hasBuiltInComponent: !!BuiltInComponent,
  })

  if (!prefsCheck.hasRequiredPreferences) {
    // TODO: Use replace instead of push to avoid stacking navigation
    // Redirect to preferences with onSubmit to run command after
    push(
      <ExtensionPreferences
        extensionName={extensionName}
        commandName={
          prefsCheck.requiredPreferences === 'command'
            ? command.name
            : undefined
        }
        onSubmit={() => {
          runCommand(options)
        }}
      />,
    )
    return
  }

  // Check if command has arguments that need to be collected
  const commandArgs = command.arguments || []
  const currentArgs = useStore.getState().currentCommandArguments
  const needsArguments = commandArgs.length > 0 && !currentArgs

  if (needsArguments) {
    push(
      <CommandArguments
        arguments={commandArgs}
        commandTitle={command.title}
        onSubmit={(args) => {
          useStore.setState({ currentCommandArguments: args })
          runCommand(options)
        }}
      />,
    )
    return
  }

  // Set the current command in state
  useStore.setState({ currentCommandName: command.name })

  // Get the component/function to run
  let CommandComponent: ((props: LaunchProps) => any) | undefined

  if (BuiltInComponent) {
    CommandComponent = BuiltInComponent
  } else if (bundledPath) {
    const importPath = cacheBustParam
      ? `${bundledPath}?rebuild=${cacheBustParam}`
      : bundledPath
    const module = await import(importPath)
    CommandComponent = module.default

    if (!CommandComponent) {
      await showToast({
        style: Toast.Style.Failure,
        title: 'No default export',
        message: `Command file ${command.name} has no default export`,
      })
      return
    }
  } else {
    await showToast({
      style: Toast.Style.Failure,
      title: 'Command not available',
      message: `Command ${command.name} has no implementation`,
    })
    return
  }

  // Build LaunchProps
  const launchProps: LaunchProps = {
    arguments: useStore.getState().currentCommandArguments || {},
    fallbackText: undefined,
    launchContext: undefined,
  }

  // Menu bar commands are not supported in termcast
  if (command.mode === 'menu-bar') {
    await showToast({
      style: Toast.Style.Failure,
      title: 'Unsupported command type',
      message: 'Menu bar commands are not supported',
    })
    return
  }

  // Handle no-view commands (they export an async function, not a component)
  if (command.mode === 'no-view') {
    if (typeof CommandComponent === 'function') {
      await CommandComponent(launchProps)
    }
    return
  }

  // For view commands, push the component
  push(<CommandComponent {...launchProps} />)
}

async function checkRequiredPreferences({
  command,
  extensionName,
  packageJson,
  hasBuiltInComponent,
}: {
  command: RunnableCommand
  extensionName: string
  packageJson?: RaycastPackageJson
  hasBuiltInComponent: boolean
}): Promise<{
  hasRequiredPreferences: boolean
  requiredPreferences?: 'command' | 'extension'
}> {
  // Built-in commands or commands without packageJson don't have preferences
  if (hasBuiltInComponent || !packageJson) {
    return { hasRequiredPreferences: true }
  }

  // Check command-specific preferences
  const commandDef = packageJson.commands?.find(
    (cmd) => cmd.name === command.name,
  )
  const commandPrefs = commandDef?.preferences || []

  // Check extension-wide preferences
  const extensionPrefs = packageJson.preferences || []

  // Get saved preferences
  const commandPrefsKey = `preferences.${extensionName}.${command.name}`
  const extensionPrefsKey = `preferences.${extensionName}`

  const savedCommandPrefs = await LocalStorage.getItem(commandPrefsKey)
  const savedExtensionPrefs = await LocalStorage.getItem(extensionPrefsKey)

  const parsedCommandPrefs = savedCommandPrefs
    ? JSON.parse(savedCommandPrefs as string)
    : {}
  const parsedExtensionPrefs = savedExtensionPrefs
    ? JSON.parse(savedExtensionPrefs as string)
    : {}

  // Check if all required command preferences are set
  for (const pref of commandPrefs) {
    if (pref.required && parsedCommandPrefs[pref.name] == null) {
      return {
        hasRequiredPreferences: false,
        requiredPreferences: 'command',
      }
    }
  }

  // Check if all required extension preferences are set
  for (const pref of extensionPrefs) {
    if (pref.required && parsedExtensionPrefs[pref.name] == null) {
      return {
        hasRequiredPreferences: false,
        requiredPreferences: 'extension',
      }
    }
  }

  return { hasRequiredPreferences: true }
}

export function clearCommandArguments(): void {
  useStore.setState({ currentCommandArguments: null })
}
