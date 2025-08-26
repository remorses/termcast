import { exec } from 'child_process'
import { promisify } from 'util'
import { logger } from '@termcast/api/src/logger'

const execAsync = promisify(exec)
const platform = process.platform

/**
 * Execute command with input (for commands like pbcopy that need stdin)
 */
function execWithInput(command: string, input: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = exec(command, (error) => {
      if (error) {
        reject(error)
      } else {
        resolve()
      }
    })
    child.stdin?.write(input)
    child.stdin?.end()
  })
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(content: string | number, concealed?: boolean): Promise<void> {
  const text = String(content)
  
  try {
    if (platform === 'darwin') {
      // macOS: use pbcopy
      await execWithInput('pbcopy', text)
      logger.log(`📋 Copied to clipboard: ${concealed ? '[CONCEALED]' : text}`)
    } else if (platform === 'linux') {
      // Linux: use xclip if available
      await execWithInput('xclip -selection clipboard', text)
      logger.log(`📋 Copied to clipboard: ${concealed ? '[CONCEALED]' : text}`)
    } else if (platform === 'win32') {
      // Windows: use clip
      await execWithInput('clip', text)
      logger.log(`📋 Copied to clipboard: ${concealed ? '[CONCEALED]' : text}`)
    } else {
      logger.log(`📋 Copy to clipboard not supported on ${platform}: ${concealed ? '[CONCEALED]' : text}`)
    }
  } catch (error) {
    logger.log(`📋 Failed to copy to clipboard: ${error}`)
  }
}

/**
 * Open URL in the default browser
 */
export async function openInBrowser(url: string): Promise<void> {
  try {
    if (platform === 'darwin') {
      // macOS: use open
      await execAsync(`open "${url}"`)
      logger.log(`🌐 Opened in browser: ${url}`)
    } else if (platform === 'linux') {
      // Linux: use xdg-open
      await execAsync(`xdg-open "${url}"`)
      logger.log(`🌐 Opened in browser: ${url}`)
    } else if (platform === 'win32') {
      // Windows: use start
      await execAsync(`start "${url}"`)
      logger.log(`🌐 Opened in browser: ${url}`)
    } else {
      logger.log(`🌐 Opening browser not supported on ${platform}: ${url}`)
    }
  } catch (error) {
    logger.log(`🌐 Failed to open browser: ${error}`)
  }
}

/**
 * Open a file or folder with a specific application
 */
export async function openFile(target: string, application?: string): Promise<void> {
  try {
    if (platform === 'darwin') {
      // macOS: use open with optional application
      if (application) {
        await execAsync(`open -a "${application}" "${target}"`)
        logger.log(`📂 Opened ${target} with ${application}`)
      } else {
        await execAsync(`open "${target}"`)
        logger.log(`📂 Opened ${target}`)
      }
    } else if (platform === 'linux') {
      // Linux: use xdg-open (doesn't support specific application)
      await execAsync(`xdg-open "${target}"`)
      logger.log(`📂 Opened ${target}`)
    } else if (platform === 'win32') {
      // Windows: use start
      await execAsync(`start "" "${target}"`)
      logger.log(`📂 Opened ${target}`)
    } else {
      logger.log(`📂 Opening files not supported on ${platform}: ${target}`)
    }
  } catch (error) {
    logger.log(`📂 Failed to open file: ${error}`)
  }
}

/**
 * Paste content (simulates paste action)
 */
export async function pasteContent(content: string | number): Promise<void> {
  const text = String(content)
  
  try {
    if (platform === 'darwin') {
      // macOS: First copy to clipboard, then simulate Cmd+V
      await execWithInput('pbcopy', text)
      // Note: Simulating keypress requires additional tools like osascript
      await execAsync(`osascript -e 'tell application "System Events" to keystroke "v" using command down'`)
      logger.log(`📝 Pasted: ${text}`)
    } else if (platform === 'linux') {
      // Linux: Copy to clipboard with xclip
      await execWithInput('xclip -selection clipboard', text)
      // Simulating paste would require xdotool or similar
      logger.log(`📝 Copied for paste: ${text}`)
    } else if (platform === 'win32') {
      // Windows: Copy to clipboard
      await execWithInput('clip', text)
      logger.log(`📝 Copied for paste: ${text}`)
    } else {
      logger.log(`📝 Paste not supported on ${platform}: ${text}`)
    }
  } catch (error) {
    logger.log(`📝 Failed to paste: ${error}`)
  }
}

/**
 * Show content in file manager (Finder on macOS, Explorer on Windows, etc.)
 */
export async function showInFinder(path: string): Promise<void> {
  try {
    if (platform === 'darwin') {
      // macOS: use open -R to reveal in Finder
      await execAsync(`open -R "${path}"`)
      logger.log(`📁 Revealed in Finder: ${path}`)
    } else if (platform === 'linux') {
      // Linux: open containing directory
      await execAsync(`xdg-open "$(dirname "${path}")"`)
      logger.log(`📁 Opened containing folder: ${path}`)
    } else if (platform === 'win32') {
      // Windows: use explorer with /select
      await execAsync(`explorer /select,"${path}"`)
      logger.log(`📁 Revealed in Explorer: ${path}`)
    } else {
      logger.log(`📁 Show in file manager not supported on ${platform}: ${path}`)
    }
  } catch (error) {
    logger.log(`📁 Failed to show in file manager: ${error}`)
  }
}

/**
 * Move file to trash
 */
export async function moveToTrash(path: string): Promise<void> {
  try {
    if (platform === 'darwin') {
      // macOS: use osascript to move to trash
      await execAsync(`osascript -e 'tell application "Finder" to delete POSIX file "${path}"'`)
      logger.log(`🗑️ Moved to trash: ${path}`)
    } else if (platform === 'linux') {
      // Linux: use gio trash if available, otherwise move to trash directory
      try {
        await execAsync(`gio trash "${path}"`)
      } catch {
        // Fallback to moving to trash directory
        const trashDir = `${process.env.HOME}/.local/share/Trash/files`
        await execAsync(`mkdir -p "${trashDir}" && mv "${path}" "${trashDir}/"`)
      }
      logger.log(`🗑️ Moved to trash: ${path}`)
    } else if (platform === 'win32') {
      // Windows: use PowerShell to move to recycle bin
      await execAsync(`powershell -command "Add-Type -AssemblyName Microsoft.VisualBasic; [Microsoft.VisualBasic.FileIO.FileSystem]::DeleteFile('${path}','OnlyErrorDialogs','SendToRecycleBin')"`)
      logger.log(`🗑️ Moved to recycle bin: ${path}`)
    } else {
      logger.log(`🗑️ Move to trash not supported on ${platform}: ${path}`)
    }
  } catch (error) {
    logger.log(`🗑️ Failed to move to trash: ${error}`)
  }
}