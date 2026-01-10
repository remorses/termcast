import type { PathLike } from 'node:fs'
import fs from 'node:fs'
import path from 'node:path'
import { exec } from 'child_process'
import { promisify } from 'util'
import { copyToClipboard, pasteContent } from 'termcast/src/action-utils'
import { logger } from 'termcast/src/logger'

const execAsync = promisify(exec)
const platform = process.platform

async function copyFileToClipboard(filePath: string): Promise<void> {
  const absolutePath = path.resolve(filePath)

  if (process.env.VITEST) {
    logger.log(`📋 [VITEST] Skipping copy file to clipboard: ${filePath}`)
    return
  }

  if (!fs.existsSync(absolutePath)) {
    throw new Error(`File not found: ${absolutePath}`)
  }

  try {
    if (platform === 'darwin') {
      // macOS: Use osascript to copy file to clipboard
      const script = `osascript -e 'set the clipboard to (POSIX file "${absolutePath}")'`
      await execAsync(script)
      logger.log(`📋 Copied file to clipboard: ${filePath}`)
    } else if (platform === 'linux') {
      // Linux: Copy file path as text and file URI
      const fileUri = `file://${absolutePath}`
      await execAsync(
        `echo '${fileUri}' | xclip -selection clipboard -t text/uri-list`,
      )
      logger.log(`📋 Copied file to clipboard: ${filePath}`)
    } else if (platform === 'win32') {
      // Windows: Use PowerShell to copy file to clipboard
      const script = `powershell -command "Set-Clipboard -Path '${absolutePath}'"`
      await execAsync(script)
      logger.log(`📋 Copied file to clipboard: ${filePath}`)
    } else {
      logger.log(`📋 File copy not supported on ${platform}: ${filePath}`)
    }
  } catch (error) {
    logger.log(`📋 Failed to copy file to clipboard: ${error}`)
    throw error
  }
}

interface ClipboardType {
  copy: (
    content: string | number | Clipboard.Content,
    options?: Clipboard.CopyOptions,
  ) => Promise<void>
  clear: () => Promise<void>
  paste: (content: string | number | Clipboard.Content) => Promise<void>
  read: (options?: { offset?: number }) => Promise<Clipboard.ReadContent>
  readText: (options?: { offset?: number }) => Promise<string | undefined>
}

export const Clipboard: ClipboardType = {
  async copy(
    content: string | number | Clipboard.Content,
    options?: Clipboard.CopyOptions,
  ): Promise<void> {
    let textContent: string

    if (typeof content === 'string' || typeof content === 'number') {
      textContent = String(content)
    } else if ('text' in content) {
      textContent = content.text || ''
    } else if ('file' in content) {
      await copyFileToClipboard(String(content.file))
      return
    } else if ('html' in content) {
      textContent = content.text || content.html
    } else {
      throw new Error('Invalid clipboard content type')
    }

    await copyToClipboard(textContent, options?.concealed)
  },

  async clear(): Promise<void> {
    await copyToClipboard('', false)
    logger.log('📋 Clipboard cleared')
  },

  async paste(content: string | number | Clipboard.Content): Promise<void> {
    let textContent: string

    if (typeof content === 'string' || typeof content === 'number') {
      textContent = String(content)
    } else if ('text' in content) {
      textContent = content.text || ''
    } else if ('file' in content) {
      logger.log(`📝 File paste not yet implemented: ${content.file}`)
      return
    } else if ('html' in content) {
      textContent = content.text || content.html
    } else {
      throw new Error('Invalid clipboard content type')
    }

    await pasteContent(textContent)
  },

  async read(options?: { offset?: number }): Promise<Clipboard.ReadContent> {
    if (options?.offset && options.offset > 0) {
      logger.log('📋 Clipboard history not yet implemented')
    }

    try {
      let text = ''
      let file: string | undefined

      if (platform === 'darwin') {
        // Try to get file first
        try {
          const fileCheckScript = `osascript -e 'try' -e 'get the clipboard as «class furl»' -e 'POSIX path of result' -e 'end try'`
          const { stdout: filePath } = await execAsync(fileCheckScript)
          if (filePath && filePath.trim()) {
            file = filePath.trim()
          }
        } catch {
          // No file in clipboard, try text
        }

        // Get text content
        const { stdout } = await execAsync('pbpaste')
        text = stdout
      } else if (platform === 'linux') {
        // Check for file URIs
        try {
          const { stdout: fileUri } = await execAsync(
            'xclip -selection clipboard -t text/uri-list -o',
          )
          if (fileUri && fileUri.startsWith('file://')) {
            file = fileUri.replace('file://', '').trim()
          }
        } catch {
          // No file in clipboard
        }

        // Get text content
        try {
          const { stdout } = await execAsync('xclip -selection clipboard -o')
          text = stdout
        } catch {
          // No text in clipboard
        }
      } else if (platform === 'win32') {
        // Windows: Get clipboard content
        const { stdout } = await execAsync(
          'powershell -command "Get-Clipboard"',
        )
        text = stdout

        // Check if it's a file path
        if (text && fs.existsSync(text.trim())) {
          file = text.trim()
        }
      }

      return { text, file }
    } catch (error) {
      logger.log(`📋 Failed to read clipboard: ${error}`)
      return { text: '' }
    }
  },

  async readText(options?: { offset?: number }): Promise<string | undefined> {
    const content = await this.read(options)
    return content.text || undefined
  },
}

export namespace Clipboard {
  export type ReadContent = {
    text: string
    file?: string
    html?: string
  }

  export type Content =
    | {
        text: string
      }
    | {
        file: PathLike
      }
    | {
        html: string
        text?: string
      }

  export type CopyOptions = {
    concealed?: boolean
  }
}

export const copyTextToClipboard = Clipboard.copy
export const clearClipboard = Clipboard.clear
export const pasteText = Clipboard.paste
