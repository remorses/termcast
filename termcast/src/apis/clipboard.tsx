import {
  platform,
  getEnv,
  fileExists,
  resolvePath,
  copyToClipboard as platformCopy,
  readClipboard as platformRead,
  execCommand,
  execWithInput,
} from '#platform/runtime'
import { copyToClipboard, pasteContent } from 'termcast/src/action-utils'
import { logger } from 'termcast/src/logger'

async function copyFileToClipboard(filePath: string): Promise<void> {
  const absolutePath = resolvePath(filePath)

  if (getEnv('VITEST')) {
    logger.log(`📋 [VITEST] Skipping copy file to clipboard: ${filePath}`)
    return
  }

  if (!fileExists(absolutePath)) {
    throw new Error(`File not found: ${absolutePath}`)
  }

  try {
    if (platform === 'darwin') {
      const script = `osascript -e 'set the clipboard to (POSIX file "${absolutePath}")'`
      await execCommand(script)
      logger.log(`📋 Copied file to clipboard: ${filePath}`)
    } else if (platform === 'linux') {
      const fileUri = `file://${absolutePath}`
      await execWithInput(
        'xclip -selection clipboard -t text/uri-list',
        fileUri,
      )
      logger.log(`📋 Copied file to clipboard: ${filePath}`)
    } else if (platform === 'win32') {
      const script = `powershell -command "Set-Clipboard -Path '${absolutePath}'"`
      await execCommand(script)
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
        try {
          const fileCheckScript = `osascript -e 'try' -e 'get the clipboard as «class furl»' -e 'POSIX path of result' -e 'end try'`
          const filePath = await execCommand(fileCheckScript)
          if (filePath && filePath.trim()) {
            file = filePath.trim()
          }
        } catch {
          // No file in clipboard
        }

        text = await platformRead()
      } else if (platform === 'linux') {
        try {
          const fileUri = await execCommand(
            'xclip -selection clipboard -t text/uri-list -o',
          )
          if (fileUri && fileUri.startsWith('file://')) {
            file = fileUri.replace('file://', '').trim()
          }
        } catch {
          // No file in clipboard
        }

        try {
          text = await platformRead()
        } catch {
          // No text in clipboard
        }
      } else if (platform === 'win32') {
        text = await platformRead()
        if (text && fileExists(text.trim())) {
          file = text.trim()
        }
      } else {
        // browser or other
        text = await platformRead()
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
        file: string | { href: string; toString(): string }
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
