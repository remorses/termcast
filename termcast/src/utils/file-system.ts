import { homedir, isAbsolute, resolvePath, joinPath, cwd, relativePath, readdirAsync, accessAsync } from '#platform/runtime'

export interface FileSystemItem {
  name: string
  path: string
  isDirectory: boolean
}

/**
 * Recursively list all files in a directory (up to maxDepth levels)
 */
export async function listAllFiles({
  basePath = '.',
  maxDepth = 3,
  maxFiles = 1000,
  includeDirectories = true,
}: {
  basePath?: string
  maxDepth?: number
  maxFiles?: number
  includeDirectories?: boolean
} = {}): Promise<string[]> {
  const results: string[] = []
  
  // Resolve ~ to home directory
  if (basePath.startsWith('~')) {
    basePath = basePath.replace('~', homedir())
  }
  
  const resolvedBase = isAbsolute(basePath)
    ? basePath
    : resolvePath(cwd(), basePath)

  async function walk(dir: string, depth: number) {
    if (depth > maxDepth || results.length >= maxFiles) return
    
    try {
      const entries = await readdirAsync(dir)
      
      for (const entry of entries) {
        if (results.length >= maxFiles) break
        
        // Skip hidden files and common ignored directories
        if (entry.name.startsWith('.')) continue
        if (entry.name === 'node_modules') continue
        if (entry.name === 'dist') continue
        if (entry.name === 'build') continue
        
        const fullPath = joinPath(dir, entry.name)
        const relPath = relativePath(resolvedBase, fullPath)
        
        if (entry.isDirectory()) {
          if (includeDirectories) {
            results.push(relPath + '/')
          }
          await walk(fullPath, depth + 1)
        } else {
          results.push(relPath)
        }
      }
    } catch {
      // Ignore permission errors etc
    }
  }
  
  await walk(resolvedBase, 0)
  return results.sort()
}

export async function searchFiles(
  searchPath: string,
  prefix: string,
): Promise<FileSystemItem[]> {
  try {
    // Resolve ~ to home directory
    if (searchPath.startsWith('~')) {
      searchPath = searchPath.replace('~', homedir())
    }

    // Handle absolute vs relative paths
    const basePath = isAbsolute(searchPath)
      ? searchPath
      : resolvePath(cwd(), searchPath || '.')

    // Check if directory exists
    const exists = await accessAsync(basePath)
    if (!exists) return []

    // List files and directories
    const entries = await readdirAsync(basePath)

    const items: FileSystemItem[] = []

    for (const entry of entries) {
      // Skip hidden files unless prefix starts with .
      if (entry.name.startsWith('.') && !prefix.startsWith('.')) continue

      // Case-insensitive prefix matching
      if (
        prefix === '' ||
        entry.name.toLowerCase().startsWith(prefix.toLowerCase())
      ) {
        items.push({
          name: entry.name,
          path: joinPath(basePath, entry.name),
          isDirectory: entry.isDirectory(),
        })
      }
    }

    // Sort directories first, then files
    items.sort((a, b) => {
      if (a.isDirectory === b.isDirectory) {
        return a.name.localeCompare(b.name)
      }
      return a.isDirectory ? -1 : 1
    })

    return items.slice(0, 10) // Limit results
  } catch (error) {
    return []
  }
}

export function parsePath(input: string): { basePath: string; prefix: string } {
  // Handle ~ expansion
  if (input.startsWith('~')) {
    input = input.replace('~', homedir())
  }

  const lastSlashIndex = input.lastIndexOf('/')

  if (lastSlashIndex === -1) {
    // No slash, search in current directory
    return { basePath: '.', prefix: input }
  }

  // Extract base path and prefix
  const basePath = input.substring(0, lastSlashIndex + 1) || '/'
  const prefix = input.substring(lastSlashIndex + 1)

  return { basePath, prefix }
}
