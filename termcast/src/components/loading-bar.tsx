import React, { useState, useRef, useLayoutEffect } from 'react'
import { BoxRenderable } from '@opentui/core'
import { useTheme } from 'termcast/src/theme'
import { useAnimationTick, TICK_DIVISORS } from 'termcast/src/components/animation-tick'

interface LoadingBarProps {
  title: string
  isLoading?: boolean
  barLength?: number
}

export function LoadingBar(props: LoadingBarProps): any {
  let { title, isLoading = false, barLength: propBarLength } = props
  const theme = useTheme()
  const [calculatedBarLength, setCalculatedBarLength] = useState(
    propBarLength || 0,
  )
  const containerRef = useRef<BoxRenderable>(null)
  const tick = useAnimationTick(isLoading ? TICK_DIVISORS.LOADING_BAR : 0)

  // Calculate bar length based on container width
  useLayoutEffect(() => {
    if (containerRef.current) {
      // TODO i am using the full terminal width for now. it would be better to use the box width for real instead
      const containerWidth = containerRef.current.ctx.width - 4

      // logger.log('LoadingBar container width:', containerWidth)
      if (!containerWidth) return
      // Account for padding (1 on each side) and the title length + space
      const availableWidth = containerWidth - 2 - title.length - 1

      const calculatedLength = Math.max(availableWidth, 10) // Minimum bar length of 10

      setCalculatedBarLength(calculatedLength)
    }
  }, [title, propBarLength])

  // Create the full text including title and bar
  const barLength = propBarLength || calculatedBarLength
  const bar = '─'.repeat(barLength)
  const fullText = `${title} ${bar}`
  const characters = fullText.split('')

  // Define gradient colors using xterm-256 colors for consistency
  const waveColors = [
    '#585858', // xterm 240
    '#585858', // xterm 240
    '#6c6c6c', // xterm 242
    '#6c6c6c', // xterm 242
    '#808080', // xterm 244
    '#808080', // xterm 244
    '#949494', // xterm 246
    '#949494', // xterm 246
    '#a8a8a8', // xterm 248
    '#a8a8a8', // xterm 248
    '#bcbcbc', // xterm 250
    '#bcbcbc', // xterm 250
    '#d0d0d0', // xterm 252
    '#d0d0d0', // xterm 252
    '#bcbcbc', // xterm 250
    '#bcbcbc', // xterm 250
    '#a8a8a8', // xterm 248
    '#a8a8a8', // xterm 248
    '#949494', // xterm 246
    '#949494', // xterm 246
    '#808080', // xterm 244
    '#808080', // xterm 244
    '#6c6c6c', // xterm 242
    '#6c6c6c', // xterm 242
    '#585858', // xterm 240
    '#585858', // xterm 240
  ]

  const waveWidth = waveColors.length
  const totalAnimLength = characters.length + waveWidth
  const position = isLoading ? tick % totalAnimLength : 0

  // Calculate color for each character
  const getCharacterColor = (index: number): string => {
    if (!isLoading) {
      // When not loading, use default theme colors
      return index < title.length ? theme.text : '#626262'
    }

    // Title text stays static when loading, only animate the bar
    if (index < title.length) {
      return theme.textMuted // Keep title text muted during loading
    }

    // Only animate the bar part
    const barIndex = index - title.length - 1 // Adjust for space after title
    const distance = position - barIndex

    // If character is within the wave (behind the current position)
    if (distance >= 0 && distance < waveWidth) {
      return waveColors[distance]
    }

    // Default muted color for characters outside the wave (xterm 241)
    return '#626262'
  }

  return (
    <box
      ref={(el) => {
        containerRef.current = el
      }}
      style={{
        flexDirection: 'row',
        flexGrow: 1,
        // paddingLeft: 1,
        // paddingRight: 1,
      }}
    >

      {characters.map((char, index) => (
        <text key={index} fg={getCharacterColor(index)} flexShrink={0}>
          {char}
        </text>
      ))}
    </box>
  )
}
