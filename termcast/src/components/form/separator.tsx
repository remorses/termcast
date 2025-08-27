import React from 'react'
import { Theme } from '@termcast/api/src/theme'

export const Separator = () => {
    return (
        <box paddingTop={1} paddingBottom={1}>
            <text fg={Theme.border}>
                {'─'.repeat(40)}
            </text>
        </box>
    )
}
