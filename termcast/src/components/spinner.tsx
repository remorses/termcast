/**
 * Animated spinner component for loading states.
 * Uses pulsing dot characters: ' ' · •
 */
import React from 'react'
import { useTheme } from 'termcast/src/theme'
import { useAnimationTick, TICK_DIVISORS } from 'termcast/src/components/animation-tick'

interface SpinnerProps {
  color?: string
}

export function Spinner({ color }: SpinnerProps): any {
  const theme = useTheme()
  const tick = useAnimationTick(TICK_DIVISORS.SPINNER)
  // Pulsing dot characters
  const frames = [' ', '·', '•']
  const frame = frames[tick % frames.length]

  return (
    <text flexShrink={0} fg={color ?? theme.textMuted}>
      {frame}
    </text>
  )
}
