import React from 'react'
import { useTheme } from 'termcast/src/theme'
import { colord } from 'colord'
import { useAnimationTick, TICK_DIVISORS } from 'termcast/src/components/animation-tick'

function Spinner(): any {
  const theme = useTheme()
  const tick = useAnimationTick(TICK_DIVISORS.SPINNER)
  const spinnerFrames = [
    { char: ' ', color: theme.accent },
    { char: '·', color: theme.accent },
    { char: '•', color: colord(theme.accent).lighten(0.1).toHex() },
  ]
  const frame = spinnerFrames[tick % spinnerFrames.length]
  return (
    <text flexShrink={0} fg={frame.color}>
      <b>{frame.char}</b>
    </text>
  )
}

interface WithLeftBorderProps {
  children: React.ReactNode
  withDiamond?: boolean
  customCharacter?: { focused: string; unfocused: string }
  isFocused: boolean
  isLoading?: boolean
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
  isLoading,
  paddingBottom = 1,
  paddingLeft = 2,
  paddingTop = 0,
}: WithLeftBorderProps): any => {
  const theme = useTheme()
  if (withDiamond || customCharacter) {
    const chars = customCharacter || { focused: '◆', unfocused: '◇' }
    const color = isFocused ? theme.accent : theme.text
    return (
      <box flexDirection='row'>
        {isFocused && isLoading ? (
          <Spinner />
        ) : (
          <text key={String(isFocused)} flexShrink={0} fg={color}>
            <b>{isFocused ? chars.focused : chars.unfocused}</b>
          </text>
        )}
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
      // borderStyle={isFocused ? 'heavy' : 'single'}
      borderColor={isFocused ? theme.accent : theme.text}
      flexShrink={0}
      flexDirection='row'
    >
      <box paddingTop={paddingTop} paddingBottom={paddingBottom} flexGrow={1}>
        {children}
      </box>
    </box>
  )
}
