import { logger } from 'termcast/src/logger'

export namespace BrowserExtension {
  export interface Tab {
    id: number
    url: string
    active: boolean
    title?: string
    favicon?: string
  }
}

export const BrowserExtension = {
  async getContent(options?: {
    cssSelector?: string
    tabId?: number
    format?: 'html' | 'text' | 'markdown'
  }): Promise<string> {
    logger.log('BrowserExtension.getContent called (stubbed - no extension)')
    // TODO: implement actual browser extension protocol
    return ''
  },

  async getTabs(): Promise<BrowserExtension.Tab[]> {
    logger.log('BrowserExtension.getTabs called (stubbed - no extension)')
    // TODO: implement actual browser extension protocol
    return []
  },
}
