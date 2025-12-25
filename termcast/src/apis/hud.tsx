import React, { useEffect, useState } from 'react'
import { Theme } from 'termcast/src/theme'
import { logger } from 'termcast/src/logger'
import { useStore } from 'termcast/src/state'
import { Toast, ToastContent } from 'termcast/src/apis/toast'
import { PopToRootType } from 'termcast/src/apis/window'

// Re-export PopToRootType from window module
export { PopToRootType } from 'termcast/src/apis/window'

interface HUDContentProps {
  title: string
  onHide: () => void
}

function HUDContent({ title, onHide }: HUDContentProps): any {
  // Create a simple toast object for HUD display
  const [toast] = useState(() => new Toast({ title, style: Toast.Style.Success }))

  // HUD displays for 2 seconds then automatically hides
  useEffect(() => {
    const timer = setTimeout(() => {
      onHide()
    }, 2000)
    return () => {
      clearTimeout(timer)
    }
  }, [onHide])

  return (
    <ToastContent
      toast={toast}
      onHide={onHide}
      iconColor={Theme.text}
    />
  )
}

export async function showHUD(
  title: string,
  options?: {
    clearRootSearch?: boolean
    popToRootType?: PopToRootType
  },
): Promise<void> {
  // Show the HUD component in the toast area (bottom of screen)
  useStore.setState({
    toast: (
      <HUDContent
        title={title}
        onHide={() => {
          useStore.setState({ toast: null })
        }}
      />
    ),
  })

  // TODO: Handle closeMainWindow behavior with clearRootSearch and popToRootType options
  // This would need to be implemented based on the actual window management system

  logger.log('showHUD:', title, options)

  return Promise.resolve()
}
