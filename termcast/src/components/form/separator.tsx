import React from 'react'
import { useTheme } from 'termcast/src/theme'
import { WithLeftBorder } from './with-left-border'

export const Separator = (): any => {
  const theme = useTheme()
  return null
  return (
    <>
      <WithLeftBorder withDiamond isFocused={false}>
        <text fg={theme.border}>{''.repeat(40)}</text>
      </WithLeftBorder>
      |
    </>
  )
}
