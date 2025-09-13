import * as fs from 'fs/promises'
import * as path from 'path'
import * as os from 'os'

export interface FileSystemItem {
  name: string
  path: string
  isDirectory: boolean
}

export async function searchFiles(
  searchPath: string,
  prefix: string,
): Promise<FileSystemItem[]> {
  try {
    // Resolve ~ to home directory
    if (searchPath.startsWith('~')) {
      searchPath = searchPath.replace('~', os.homedir())
    }

    // Handle absolute vs relative paths
    const basePath = path.isAbsolute(searchPath)
      ? searchPath
      : path.resolve(process.cwd(), searchPath || '.')

    // Check if directory exists
    try {
      await fs.access(basePath)
    } catch {
      return []
    }

    // List files and directories
    const entries = await fs.readdir(basePath, { withFileTypes: true })
    
    const items: FileSystemItem[] = []
    
    for (const entry of entries) {
      // Skip hidden files unless prefix starts with .
      if (entry.name.startsWith('.') && !prefix.startsWith('.')) continue
      
      // Case-insensitive prefix matching
      if (prefix === '' || entry.name.toLowerCase().startsWith(prefix.toLowerCase())) {
        items.push({
          name: entry.name,
          path: path.join(basePath, entry.name),
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
    input = input.replace('~', os.homedir())
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