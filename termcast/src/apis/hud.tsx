import React, { useEffect } from 'react'
import { Theme } from 'termcast/src/theme'
import { TextAttributes } from '@opentui/core'
import { logger } from 'termcast/src/logger'
import { useStore } from 'termcast/src/state'
import { useTerminalDimensions } from '@opentui/react'
import { Toast } from 'termcast/src/apis/toast'
import { PopToRootType } from 'termcast/src/apis/window'

// Re-export PopToRootType from window module
export { PopToRootType } from 'termcast/src/apis/window'

interface HUDComponentProps {
  title: string
  onHide: () => void
}

function HUDComponent({ title, onHide }: HUDComponentProps): any {
  const dimensions = useTerminalDimensions()

  useEffect(() => {
    // HUD displays for 2 seconds then automatically hides
    const timer = setTimeout(() => {
      onHide()
    }, 2000)
    return () => clearTimeout(timer)
  }, [onHide])

  // Center the HUD message
  const padding = Math.max(
    0,
    Math.floor((dimensions.width - title.length - 4) / 2),
  )

  return (
    <box
      borderColor={Theme.border}
      paddingLeft={1}
      paddingRight={1}
      flexDirection='row'
      alignItems='center'
    >
      <text paddingLeft={padding}>✓ </text>
      <text fg={Theme.text} attributes={TextAttributes.BOLD}>
        {title}
      </text>
    </box>
  )
}

// Create a custom Toast class for HUD that displays with HUD styling
class HUDToast extends Toast {
  constructor(title: string) {
    super({
      title,
      style: Toast.Style.Success,
    })
  }
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
      <HUDComponent
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
