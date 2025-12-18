import React from 'react'
import { TextAttributes } from '@opentui/core'
import { Theme } from 'termcast/src/theme'

interface WithLeftBorderProps {
  children: React.ReactNode
  withDiamond?: boolean
  customCharacter?: { focused: string; unfocused: string }
  isFocused: boolean
  paddingBottom?: number
  paddingLeft?: number
  paddingTop?: number
  key?: any
}

export const WithLeftBorder = ({
  children,
  withDiamond,
  customCharacter,
  isFocused,
  paddingBottom = 1,
  paddingLeft = 2,
  paddingTop = 0,
}: WithLeftBorderProps): any => {
  if (withDiamond || customCharacter) {
    const chars = customCharacter || { focused: '◆', unfocused: '◇' }
    return (
      <box flexDirection='row'>
        <text
          key={String(isFocused)}
          flexShrink={0}
          fg={isFocused ? Theme.accent : Theme.text}
        >
          <b>{isFocused ? chars.focused : chars.unfocused}</b>
        </text>
        <box flexShrink={0} flexGrow={1} paddingLeft={paddingLeft}>
          {children}
        </box>
      </box>
    )
  }
  return (
    <box
      paddingLeft={paddingLeft}
      border={['left']}
      borderStyle={isFocused ? 'heavy' : 'single'}
      borderColor={isFocused ? Theme.accent : undefined}
      flexShrink={0}
      flexDirection='row'
    >
      <box paddingTop={paddingTop} paddingBottom={paddingBottom} flexGrow={1}>
        {children}
      </box>
    </box>
  )
}
