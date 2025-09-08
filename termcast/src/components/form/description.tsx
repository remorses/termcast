import React from 'react'
import { TextAttributes } from '@opentui/core'
import { Theme } from '@termcast/cli/src/theme'
import { WithLeftBorder } from './with-left-border'

export interface DescriptionProps {
    title?: string
    text: string
    isFormTitle?: boolean
}

export const Description = (props: DescriptionProps): any => {
    return (
        <>
            {props.title && (
                <WithLeftBorder withDiamond>
                    <text fg={Theme.text} attributes={TextAttributes.BOLD}>
                        {props.title}
                    </text>
                </WithLeftBorder>
            )}
            <WithLeftBorder>
                <text fg={Theme.textMuted}>{props.text}</text>
            </WithLeftBorder>
        </>
    )
}
