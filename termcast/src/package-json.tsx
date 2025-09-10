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
      let filePath = ''
      let exists = false

      // First, look for the file outside "src"
      for (const ext of possibleExtensions) {
        const candidatePath = path.join(projectRoot, `${command.name}${ext}`)
        if (fs.existsSync(candidatePath)) {
          filePath = candidatePath
          exists = true
          break
        }
      }

      // If not found, look for the file inside "src"
      if (!exists) {
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
      }

      // If still not found, default to "src/commandName.tsx"
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

export type {
  RaycastPreference,
  RaycastArgument,
  RaycastCommand,
  RaycastTool,
  RaycastPackageJson,
  CommandWithFile,
  CommandsWithFiles,
}
