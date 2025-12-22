import React from 'react'
import { TextAttributes } from '@opentui/core'
import { Theme } from 'termcast/src/theme'
import { colord } from 'colord'

const spinnerFrames = [
  { char: ' ', color: Theme.accent },
  { char: '·', color: Theme.accent },
  { char: '•', color: colord(Theme.accent).lighten(0.1).toHex() },
  // { char: '●', color: colord(Theme.accent).lighten(0.2).toHex() },
]

function Spinner(): any {
  const [index, setIndex] = React.useState(0)

  React.useEffect(() => {
    const interval = setInterval(() => {
      setIndex((i) => (i + 1) % spinnerFrames.length)
    }, 200)
    return () => {
      clearInterval(interval)
    }
  }, [])

  const frame = spinnerFrames[index]
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
  if (withDiamond || customCharacter) {
    const chars = customCharacter || { focused: '◆', unfocused: '◇' }
    const color = isFocused ? Theme.accent : Theme.text
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
