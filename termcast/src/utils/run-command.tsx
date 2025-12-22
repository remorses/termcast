import React from 'react'
import { cac } from 'cac'
import { useStore } from 'termcast/src/state'
import { showToast, Toast } from 'termcast/src/apis/toast'
import { LocalStorage } from 'termcast/src/apis/localstorage'
import { CommandArguments } from 'termcast/src/components/command-arguments'
import { ExtensionPreferences } from 'termcast/src/components/extension-preferences'
import type { RaycastArgument, RaycastPackageJson } from 'termcast/src/package-json'
import type { LaunchProps } from 'termcast/src/apis/environment'
import { logger } from '../logger'

export interface CommandInfo {
  name: string
  title: string
  description?: string
}

export interface ParsedExtensionArgs {
  commandName?: string
  showHelp: boolean
  showVersion: boolean
}

/**
 * Parse CLI args to extract command name and help flag.
 * @param skipArgv - Number of subcommand args to skip (e.g. 1 for "dev" in "termcast dev")
 */
export function parseExtensionArgs({ skipArgv = 0 }: { skipArgv?: number } = {}): ParsedExtensionArgs {
  // Build argv for cac: keep first 2 (binary + script), skip subcommand args, keep the rest
  const argv = [
    process.argv[0],
    process.argv[1],
    ...process.argv.slice(2 + skipArgv),
  ]
  const parsed = cac().parse(argv, { run: false })
  return {
    commandName: parsed.args[0] as string | undefined,
    showHelp: Boolean(parsed.options.help || parsed.options.h),
    showVersion: Boolean(parsed.options.version || parsed.options.v),
  }
}

function printExtensionHelp({
  extensionName,
  commands,
}: {
  extensionName: string
  commands: CommandInfo[]
}): void {
  console.log(`\n${extensionName}\n`)
  console.log('Usage: <binary> [command]\n')
  console.log('Commands:')
  for (const cmd of commands) {
    const desc = cmd.description ? `  ${cmd.description}` : ''
    console.log(`  ${cmd.name.padEnd(20)} ${cmd.title}${desc}`)
  }
  console.log('\nOptions:')
  console.log('  --help, -h          Show this help message')
  console.log('  --version, -v       Show version')
  console.log()
}

/**
 * Check for --help and --version flags. Call before rendering.
 * Exits process if help or version is shown.
 */
export function handleHelpFlag({
  extensionName,
  commands,
  skipArgv = 0,
}: {
  extensionName: string
  commands: CommandInfo[]
  skipArgv?: number
}): void {
  const { showHelp, showVersion } = parseExtensionArgs({ skipArgv })
  if (showVersion) {
    console.log(process.env.VERSION || 'unknown')
    process.exit(0)
  }
  if (showHelp) {
    printExtensionHelp({ extensionName, commands })
    process.exit(0)
  }
}

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
}

export async function runCommand(options: RunCommandOptions): Promise<void> {
  const {
    command,
    extensionName,
    packageJson,
    bundledPath,
    Component: BuiltInComponent,
    push,
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
    const state = useStore.getState()
    const devRebuildCount = state.devRebuildCount + 1
    useStore.setState({ devRebuildCount })
    const importPath = `${bundledPath}?rebuild=${devRebuildCount}`
    // logger.log(`importing ${importPath}`)
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
