import fs from 'node:fs'
import path from 'node:path'

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

export function parsePackageJson({
  packageJsonPath,
}: {
  packageJsonPath?: string
} = {}): RaycastPackageJson {
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
  /** All candidate paths checked when resolving this command's file */
  checkedPaths: string[]
}

interface CommandsWithFiles {
  packageJson: RaycastPackageJson
  packageJsonPath: string
  projectRoot: string
  commands: CommandWithFile[]
}
export function getCommandsWithFiles({
  packageJsonPath,
}: {
  packageJsonPath?: string
} = {}): CommandsWithFiles {
  const resolvedPath =
    packageJsonPath || path.join(process.cwd(), 'package.json')
  const projectRoot = path.dirname(resolvedPath)
  const packageJson = parsePackageJson({ packageJsonPath: resolvedPath })

  const commands: CommandWithFile[] = (packageJson.commands || []).map(
    (command) => {
      const possibleExtensions = ['.tsx', '.ts', '.jsx', '.js']
      const dirs = [projectRoot, path.join(projectRoot, 'src')]

      // Build ordered candidate list: all flat files first, then directory entries.
      // This means src/{name}.tsx is preferred over root/{name}/index.tsx.
      const checkedPaths: string[] = [
        ...dirs.flatMap((dir) => {
          return possibleExtensions.map((ext) => {
            return path.join(dir, `${command.name}${ext}`)
          })
        }),
        ...dirs.flatMap((dir) => {
          return possibleExtensions.map((ext) => {
            return path.join(dir, command.name, `index${ext}`)
          })
        }),
      ]

      let filePath = ''
      let exists = false
      for (const candidate of checkedPaths) {
        if (fs.existsSync(candidate)) {
          filePath = candidate
          exists = true
          break
        }
      }

      // If not found, default to "src/commandName.tsx" for the fallback path
      if (!filePath) {
        filePath = path.join(projectRoot, 'src', `${command.name}.tsx`)
      }

      return {
        ...command,
        filePath,
        exists,
        checkedPaths,
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

export type {
  RaycastPreference,
  RaycastArgument,
  RaycastCommand,
  RaycastTool,
  RaycastPackageJson,
  CommandWithFile,
  CommandsWithFiles,
}
