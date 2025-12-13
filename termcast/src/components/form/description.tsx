import React from 'react'
import { TextAttributes } from '@opentui/core'
import { Theme } from 'termcast/src/theme'
import { WithLeftBorder } from './with-left-border'

export interface DescriptionProps {
  title?: string
  text: string
  isFormTitle?: boolean
}

export const FORM_MAX_WIDTH = 70

export const Description = (props: DescriptionProps): any => {
  return (
    <box flexDirection='column' maxWidth={FORM_MAX_WIDTH}>
      {props.title && (
        <WithLeftBorder
          customCharacter={{ focused: '⁉', unfocused: '▪︎' }}
          isFocused={false}
        >
          <text fg={Theme.text} attributes={TextAttributes.BOLD}>
            {props.title}
          </text>
        </WithLeftBorder>
      )}
      <WithLeftBorder isFocused={false}>
        <text fg={Theme.textMuted}>{props.text}</text>
      </WithLeftBorder>
    </box>
  )
}
