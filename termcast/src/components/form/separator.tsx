import React from 'react'
import { Theme } from '@termcast/cli/src/theme'
import { WithLeftBorder } from './with-left-border'

export const Separator = (): any => {
    return null
    return (
        <>
            <WithLeftBorder withDiamond isFocused={false}>
                <text fg={Theme.border}>{''.repeat(40)}</text>
            </WithLeftBorder>
            |
        </>
    )
}
