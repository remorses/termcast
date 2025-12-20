import React, { useState, useEffect, useRef } from 'react'
import { colord } from 'colord'

interface LoadingTextProps {
  children: string
  isLoading?: boolean
  color: string
}

/**
 * Generate wave colors based on base color
 * Creates a gradient from base color to a lighter version and back
 * Uses a shorter wave (12 chars) compared to LoadingBar
 */
function generateWaveColors(baseColor: string): string[] {
  const base = colord(baseColor)
  // Shorter wave for text - lighten factors from 0 to 0.5 and back
  const steps = [0, 10, 20, 30, 40, 50, 40, 30, 20, 10, 0, 0]
  return steps.map((percent) => base.lighten(percent / 100).toHex())
}

export function LoadingText(props: LoadingTextProps): any {
  const { children, isLoading = false, color = '#FFC000' } = props
  const [position, setPosition] = useState(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const characters = children.split('')
  const waveColors = generateWaveColors(color)
  const waveWidth = waveColors.length
  // Add padding at the end to create a delay before the next loop
  const endPadding = 10
  const totalLength = characters.length + waveWidth + endPadding

  useEffect(() => {
    if (isLoading) {
      intervalRef.current = setInterval(() => {
        setPosition((prev) => (prev + 1) % totalLength)
      }, 30)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      setPosition(0)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isLoading, totalLength])

  const getCharacterColor = (index: number): string => {
    if (!isLoading) {
      return color
    }

    const distance = position - index

    // If character is within the wave (behind the current position)
    if (distance >= 0 && distance < waveWidth) {
      return waveColors[distance]
    }

    // Default to base color for characters outside the wave
    return color
  }

  return (
    <box flexDirection="row">
      {characters.map((char, index) => (
        <text key={index} fg={getCharacterColor(index)} flexShrink={0}>
          {char}
        </text>
      ))}
    </box>
  )
}
