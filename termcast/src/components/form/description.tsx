import React from 'react'
import { TextAttributes } from '@opentui/core'
import { Theme } from '@termcast/cli/src/theme'

export interface DescriptionProps {
    title?: string
    text: string
}

export const Description = (props: DescriptionProps): any => {
    return (
        <box flexDirection='column' paddingTop={1} paddingBottom={1}>
            {props.title && (
                <text fg={Theme.text} attributes={TextAttributes.BOLD}>
                    {props.title}
                </text>
            )}
            <text fg={Theme.textMuted}>{props.text}</text>
        </box>
    )
}
