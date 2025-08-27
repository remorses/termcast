import React, { useState } from 'react'
import { useKeyboard } from '@opentui/react'
import { Theme } from '@termcast/api/src/theme'
import { TextAttributes } from '@opentui/core'
import { LocalStorage } from '@termcast/api/src/localstorage'
import { useStore } from '@termcast/api/src/state'

export namespace Alert {
  export interface Options {
    icon?: any  // TODO: Add proper Image.ImageLike support
    title: string
    message?: string
    primaryAction?: ActionOptions
    dismissAction?: ActionOptions
    rememberUserChoice?: boolean
  }

  export interface ActionOptions {
    title: string
    onAction?: () => void
    style?: ActionStyle
  }

  export type ActionStyle = "default" | "cancel" | "destructive"
}

export const Alert = {
  ActionStyle: {
    Default: "default" as Alert.ActionStyle,
    Cancel: "cancel" as Alert.ActionStyle,
    Destructive: "destructive" as Alert.ActionStyle
  }
}

interface AlertComponentProps {
  options: Alert.Options
  onConfirm: () => void
  onDismiss: () => void
}

function AlertComponent({ options, onConfirm, onDismiss }: AlertComponentProps): any {
  const [rememberChoice, setRememberChoice] = useState(false)

  useKeyboard((evt) => {
    if (evt.name === 'enter') {
      if (options.rememberUserChoice && rememberChoice) {
        LocalStorage.setItem(`alert-remember-${options.title}`, 'true')
      }
      options.primaryAction?.onAction?.()
      onConfirm()
    } else if (evt.name === 'escape') {
      if (options.rememberUserChoice && rememberChoice) {
        LocalStorage.setItem(`alert-remember-${options.title}`, 'false')
      }
      options.dismissAction?.onAction?.()
      onDismiss()
    } else if (evt.name === 'space' && options.rememberUserChoice) {
      setRememberChoice(!rememberChoice)
    }
  })

  const primaryStyle = options.primaryAction?.style || Alert.ActionStyle.Default
  const dismissStyle = options.dismissAction?.style || Alert.ActionStyle.Cancel

  const getPrimaryColor = () => {
    switch (primaryStyle) {
      case Alert.ActionStyle.Destructive:
        return Theme.error
      case Alert.ActionStyle.Default:
      default:
        return Theme.primary
    }
  }

  return (
    <box
      border={true}
      borderColor={Theme.border}
      backgroundColor={Theme.backgroundPanel}
      paddingTop={2}
      paddingBottom={2}
      paddingLeft={3}
      paddingRight={3}
      width={60}
    >
      <group flexDirection="column" alignItems="center">
        {options.icon && (
          <box marginBottom={1}>
            <text fg={Theme.accent}>⚠️</text>
          </box>
        )}
        
        <text fg={Theme.text} attributes={TextAttributes.BOLD}>
          {options.title}
        </text>
        
        {options.message && (
          <box marginTop={1} marginBottom={1}>
            <text fg={Theme.textMuted}>{options.message}</text>
          </box>
        )}

        {options.rememberUserChoice && (
          <box marginTop={1} marginBottom={1}>
            <text fg={Theme.textMuted}>
              {rememberChoice ? '[x]' : '[ ]'} Do not show this message again (Space to toggle)
            </text>
          </box>
        )}
        
        <group flexDirection="row" marginTop={2}>
          <box marginRight={2}>
            <text fg={getPrimaryColor()} attributes={TextAttributes.BOLD}>
              [{options.primaryAction?.title || 'OK'} (↵)]
            </text>
          </box>
          <text fg={Theme.textMuted}>
            [{options.dismissAction?.title || 'Cancel'} (ESC)]
          </text>
        </group>
      </group>
    </box>
  )
}


export async function confirmAlert(options: Alert.Options): Promise<boolean> {
  // Check if user previously selected "remember choice"
  if (options.rememberUserChoice) {
    const remembered = await LocalStorage.getItem(`alert-remember-${options.title}`)
    if (remembered === 'true') {
      options.primaryAction?.onAction?.()
      return true
    } else if (remembered === 'false') {
      options.dismissAction?.onAction?.()
      return false
    }
  }

  return new Promise<boolean>((resolve) => {
    const { pushDialog, clearDialogs } = useStore.getState()
    
    const handleConfirm = () => {
      clearDialogs()
      resolve(true)
    }
    
    const handleDismiss = () => {
      clearDialogs()
      resolve(false)
    }
    
    pushDialog(
      <AlertComponent
        options={options}
        onConfirm={handleConfirm}
        onDismiss={handleDismiss}
      />,
      'center'
    )
  })
}