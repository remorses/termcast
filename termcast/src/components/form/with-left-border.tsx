import React from 'react'
import { TextAttributes } from '@opentui/core'
import { Theme } from '@termcast/cli/src/theme'

interface WithLeftBorderProps {
    children: React.ReactNode
    withDiamond?: boolean
    isFocused: boolean
    paddingBottom?: number
}

export const WithLeftBorder = ({
    children,
    withDiamond,
    isFocused,
    paddingBottom = 1,
}: WithLeftBorderProps): any => {
    if (withDiamond) {
        return (
            <box flexDirection='row'>
                <text key={String(isFocused)} fg={isFocused ? Theme.accent : Theme.text}>
                    {isFocused ? '◆' : '◇'}
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
