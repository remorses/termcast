import React from 'react'
import { TextAttributes } from '@opentui/core'
import { Theme } from '@termcast/cli/src/theme'

interface WithLeftBorderProps {
    children: React.ReactNode
    withDiamond?: boolean
    customCharacter?: { focused: string; unfocused: string }
    isFocused: boolean
    paddingBottom?: number
    key?: any
}

export const WithLeftBorder = ({
    children,
    withDiamond,
    customCharacter,
    isFocused,
    paddingBottom = 1,
}: WithLeftBorderProps): any => {
    if (withDiamond || customCharacter) {
        const chars = customCharacter || { focused: '◆', unfocused: '◇' }
        return (
            <box flexDirection='row'>
                <text key={String(isFocused)} fg={isFocused ? Theme.accent : Theme.text}>
                    {isFocused ? chars.focused : chars.unfocused}
                </text>
                <box flexGrow={1} paddingLeft={1} >
                    {children}
                </box>
            </box>
        )
    }
    return (
        <box
            paddingLeft={0}
            border={['left']}
            borderColor={isFocused ? Theme.accent : undefined}
            flexDirection='row'
        >
            <text fg={Theme.text}>{''}</text>
            <box paddingTop={0} paddingBottom={paddingBottom} flexGrow={1}>
                {children}
            </box>
        </box>
    )
}
