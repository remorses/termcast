
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
import { logger } from './logger'

interface RaycastPreference {
    name: string
    title: string
    description: string
    type:
        | 'textfield'
        | 'password'
        | 'checkbox'
        | 'dropdown'
        | 'appPicker'
        | 'file'
        | 'directory'
    required: boolean
    placeholder?: string
    default?: any
    label?: string
    data?: Array<{ title: string; value: string }>
}

interface RaycastArgument {
    name: string
    type: 'text' | 'password' | 'dropdown'
    placeholder: string
    required?: boolean
    data?: Array<{ title: string; value: string }>
}

interface RaycastCommand {
    name: string
    title: string
    subtitle?: string
    description: string
    icon?: string
    mode: 'view' | 'no-view' | 'menu-bar'
    interval?: string
    keywords?: string[]
    arguments?: RaycastArgument[]
    preferences?: RaycastPreference[]
    disabledByDefault?: boolean
}

interface RaycastTool {
    name: string
    title: string
    description: string
    icon?: string
}

interface RaycastPackageJson {
    name: string
    title: string
    description: string
    icon?: string
    author?: string
    categories?: string[]
    license?: string
    commands?: RaycastCommand[]
    tools?: RaycastTool[]
    platforms?: string[]
    ai?: {
        instructions?: string
        evals?: any
    }
    owner?: string
    access?: 'public' | 'private'
    contributors?: string[]
    pastContributors?: string[]
    keywords?: string[]
    preferences?: RaycastPreference[]
    external?: string[]
}

export function parsePackageJson(packageJsonPath?: string): RaycastPackageJson {
    const resolvedPath =
        packageJsonPath || path.join(process.cwd(), 'package.json')

    if (!fs.existsSync(resolvedPath)) {
        throw new Error(`Package.json not found at: ${resolvedPath}`)
    }

    const rawContent = fs.readFileSync(resolvedPath, 'utf-8')
    const packageJson = JSON.parse(rawContent)

    const raycastConfig: RaycastPackageJson = {
        name: packageJson.name || '',
        title: packageJson.title || packageJson.name || '',
        description: packageJson.description || '',
        icon: packageJson.icon,
        author: packageJson.author,
        categories: packageJson.categories || [],
        license: packageJson.license,
        commands: packageJson.commands || [],
        tools: packageJson.tools || [],
        platforms: packageJson.platforms,
        ai: packageJson.ai,
        owner: packageJson.owner,
        access: packageJson.access,
        contributors: packageJson.contributors || [],
        pastContributors: packageJson.pastContributors || [],
        keywords: packageJson.keywords || [],
        preferences: packageJson.preferences || [],
        external: packageJson.external || [],
    }

    return raycastConfig
}

interface CommandWithFile extends RaycastCommand {
    filePath: string
    exists: boolean
}

interface CommandsWithFiles {
    packageJson: RaycastPackageJson
    packageJsonPath: string
    projectRoot: string
    commands: CommandWithFile[]
}

export function getCommandsWithFiles(
    packageJsonPath?: string,
): CommandsWithFiles {
    const resolvedPath =
        packageJsonPath || path.join(process.cwd(), 'package.json')
    const projectRoot = path.dirname(resolvedPath)
    const packageJson = parsePackageJson(resolvedPath)

    const commands: CommandWithFile[] = (packageJson.commands || []).map(
        (command) => {
            // Resolve the command file path based on Raycast conventions
            // Commands map to src/{commandName}.{ts,tsx,js,jsx}
            const possibleExtensions = ['.tsx', '.ts', '.jsx', '.js']
            let filePath = ''
            let exists = false

            for (const ext of possibleExtensions) {
                const candidatePath = path.join(
                    projectRoot,
                    'src',
                    `${command.name}${ext}`,
                )
                if (fs.existsSync(candidatePath)) {
                    filePath = candidatePath
                    exists = true
                    break
                }
            }

            // If no file found, default to expected .tsx path
            if (!filePath) {
                filePath = path.join(projectRoot, 'src', `${command.name}.tsx`)
            }

            return {
                ...command,
                filePath,
                exists,
            }
        },
    )

    return {
        packageJson,
        packageJsonPath: resolvedPath,
        projectRoot,
        commands,
    }
}

function ExtensionCommandsList({
    extensionPath,
}: {
    extensionPath: string
}): any {
    const { push } = useNavigation()
    const commandsData = getCommandsWithFiles(
        path.join(extensionPath, 'package.json'),
    )

    const handleCommandSelect = async (command: CommandWithFile) => {
        try {
            if (!command.exists) {
                await showToast({
                    style: Toast.Style.Failure,
                    title: 'Command file not found',
                    message: `File ${command.filePath} does not exist`,
                })
                return
            }

            // Dynamically import the command file
            const module = await import(command.filePath)
            const Component = module.default

            if (!Component) {
                await showToast({
                    style: Toast.Style.Failure,
                    title: 'No default export',
                    message: `Command file ${command.name} has no default export`,
                })
                return
            }

            // Push the imported component to navigation
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
            navigationTitle={
                commandsData.packageJson.title || 'Extension Commands'
            }
            searchBarPlaceholder='Search commands...'
        >
            <List.Section title='Commands'>
                {commandsData.commands.map((command) => (
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
                            ...(command.exists
                                ? []
                                : [
                                      {
                                          text: 'Missing',
                                          tooltip: 'Command file not found',
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

            {commandsData.commands.length === 0 && (
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

export function renderExtensionCommands(extensionPath: string): void {
    const resolvedPath = path.resolve(extensionPath)

    if (!fs.existsSync(resolvedPath)) {
        throw new Error(`Extension path does not exist: ${resolvedPath}`)
    }

    const packageJsonPath = path.join(resolvedPath, 'package.json')
    if (!fs.existsSync(packageJsonPath)) {
        throw new Error(`No package.json found at: ${packageJsonPath}`)
    }

    function App(): any {
        return (
            <Providers>
                <ExtensionCommandsList extensionPath={resolvedPath} />
            </Providers>
        )
    }

    render(<App />)
}

renderExtensionCommands(process.cwd())
