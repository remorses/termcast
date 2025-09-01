import React, { useState, useEffect, useRef } from 'react'
import { Theme } from '@termcast/cli/src/theme'

interface LoadingBarProps {
    title: string
    isLoading?: boolean
    barLength?: number
}

export function LoadingBar(props: LoadingBarProps): any {
    let { title, isLoading = true, barLength = 80 } = props
    const [position, setPosition] = useState(0)
    const intervalRef = useRef<NodeJS.Timeout | null>(null)

    // Create the full text including title and bar
    const bar = '─'.repeat(barLength)
    const fullText = `${title} ${bar}`
    const characters = fullText.split('')

    // Define gradient colors using xterm-256 colors for consistency
    const waveColors = [
        '#585858', // xterm 240
        '#6c6c6c', // xterm 242
        '#808080', // xterm 244
        '#949494', // xterm 246
        '#a8a8a8', // xterm 248
        '#bcbcbc', // xterm 250
        '#d0d0d0', // xterm 252
        '#bcbcbc', // xterm 250
        '#a8a8a8', // xterm 248
        '#949494', // xterm 246
        '#808080', // xterm 244
        '#6c6c6c', // xterm 242
        '#585858', // xterm 240
    ]

    const waveWidth = waveColors.length

    useEffect(() => {
        if (isLoading) {
            intervalRef.current = setInterval(() => {
                setPosition((prev) => (prev + 1) % (characters.length + waveWidth))
            }, 25) // Faster animation
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
    }, [isLoading, characters.length, waveWidth])

    // Calculate color for each character
    const getCharacterColor = (index: number): string => {
        if (!isLoading) {
            // When not loading, use default theme colors
            return index < title.length ? Theme.text : Theme.textMuted
        }

        // Title text stays static when loading, only animate the bar
        if (index < title.length) {
            return Theme.textMuted  // Keep title text muted during loading
        }

        // Only animate the bar part
        const barIndex = index - title.length - 1  // Adjust for space after title
        const distance = position - barIndex

        // If character is within the wave (behind the current position)
        if (distance >= 0 && distance < waveWidth) {
            return waveColors[distance]
        }

        // Default muted color for characters outside the wave (xterm 241)
        return '#626262'
    }

    return (
        <box style={{ flexDirection: 'row' }}>
            {characters.map((char, index) => (
                <text
                    key={index}
                    fg={getCharacterColor(index)}
                    attributes={index <= title.length && !isLoading ? 1 : undefined} // Bold for title when not loading
                >
                    {char}
                </text>
            ))}
        </box>
    )
}
