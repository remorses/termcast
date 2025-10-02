import { ReactNode } from 'react'
import { logger } from 'termcast/src/logger'

export interface ActionPanelState {
  /**
   * @deprecated No alternative :(
   */
  update: (actionPanel: ReactNode) => void
}

/**
 * @deprecated No alternative :(
 *
 * Hook to get access to the ActionPanel state
 * This hook is deprecated in Raycast API and provides an update function
 * that doesn't have a clear use case in the new architecture
 */
export function useActionPanel(): ActionPanelState {
  logger.warn('useActionPanel is deprecated and has no alternative')

  return {
    update: (actionPanel: ReactNode) => {
      logger.warn('ActionPanel.update() is deprecated and has no effect', {
        actionPanel,
      })
    },
  }
}
