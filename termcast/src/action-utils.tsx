import {
  platform,
  getEnv,
  copyToClipboard as platformCopy,
  execWithInput,
  execCommand,
  openUrl,
  openFile as platformOpenFile,
  showInFileManager,
  moveToTrash as platformMoveToTrash,
} from '#platform/runtime'
import { logger } from 'termcast/src/logger'

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(
  content: string | number,
  concealed?: boolean,
): Promise<void> {
  const text = String(content)

  if (getEnv('VITEST')) {
    logger.log(`📋 [VITEST] Skipping copy to clipboard: ${concealed ? '[CONCEALED]' : text}`)
    return
  }

  try {
    await platformCopy(text)
    logger.log(`📋 Copied to clipboard: ${concealed ? '[CONCEALED]' : text}`)
  } catch (error) {
    logger.log(`📋 Failed to copy to clipboard: ${error}`)
  }
}

/**
 * Open URL in the default browser
 */
export async function openInBrowser(url: string): Promise<void> {
  try {
    await openUrl(url)
    logger.log(`🌐 Opened in browser: ${url}`)
  } catch (error) {
    logger.log(`🌐 Failed to open browser: ${error}`)
  }
}

/**
 * Open a file or folder with a specific application
 */
export async function openFile(
  target: string,
  application?: string,
): Promise<void> {
  try {
    await platformOpenFile(target, application)
    logger.log(`📂 Opened ${target}${application ? ` with ${application}` : ''}`)
  } catch (error) {
    logger.log(`📂 Failed to open file: ${error}`)
  }
}

/**
 * Paste content (simulates paste action)
 */
export async function pasteContent(content: string | number): Promise<void> {
  const text = String(content)

  if (getEnv('VITEST')) {
    logger.log(`📝 [VITEST] Skipping paste: ${text}`)
    return
  }

  try {
    if (platform === 'darwin') {
      // macOS: First copy to clipboard, then simulate Cmd+V
      await execWithInput('pbcopy', text)
      await execCommand(
        `osascript -e 'tell application "System Events" to keystroke "v" using command down'`,
      )
      logger.log(`📝 Pasted: ${text}`)
    } else if (platform === 'linux') {
      await execWithInput('xclip -selection clipboard', text)
      logger.log(`📝 Copied for paste: ${text}`)
    } else if (platform === 'win32') {
      await execWithInput('clip', text)
      logger.log(`📝 Copied for paste: ${text}`)
    } else {
      // browser or unknown — copy to clipboard
      await platformCopy(text)
      logger.log(`📝 Copied for paste: ${text}`)
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
    await showInFileManager(path)
    logger.log(`📁 Revealed in file manager: ${path}`)
  } catch (error) {
    logger.log(`📁 Failed to show in file manager: ${error}`)
  }
}

/**
 * Move file to trash
 */
export async function moveToTrash(path: string): Promise<void> {
  try {
    await platformMoveToTrash(path)
    logger.log(`🗑️ Moved to trash: ${path}`)
  } catch (error) {
    logger.log(`🗑️ Failed to move to trash: ${error}`)
  }
}
