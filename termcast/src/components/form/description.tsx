import React, { useRef, useId } from 'react'
import { BoxRenderable } from '@opentui/core'
import { useFocusContext } from './index'
import { useTheme } from 'termcast/src/theme'
import { LoadingText } from 'termcast/src/components/loading-text'
import { WithLeftBorder } from './with-left-border'

export const FORM_MAX_WIDTH = 70

export interface DescriptionProps {
  id?: string
  title?: string
  text: string
  isFormTitle?: boolean
}

export const Description = (props: DescriptionProps): any => {
  const theme = useTheme()
  const elementRef = useRef<BoxRenderable>(null)
  const autoId = useId()
  const id = props.id || autoId

  const focusContext = useFocusContext()
  const isFocused = focusContext.focusedField === id

  // Note: Description is display-only, not a navigable input field.
  // It does NOT register with useFormFieldDescendant or useFormNavigation.

  return (
    <box
      ref={elementRef}
      flexDirection='column'
      maxWidth={FORM_MAX_WIDTH}
      onMouseDown={() => {
        focusContext.setFocusedField(id)
      }}
    >
      {props.title && (
        <WithLeftBorder
          customCharacter={{ focused: '■', unfocused: '▪︎' }}
          isFocused={isFocused}
          isLoading={focusContext.isLoading}
        >
          <LoadingText
            isLoading={isFocused && focusContext.isLoading}
            color={isFocused ? theme.primary : theme.text}
          >
            {props.title}
          </LoadingText>
        </WithLeftBorder>
      )}
      <WithLeftBorder isFocused={isFocused}>
        <text fg={theme.textMuted}>{props.text}</text>
      </WithLeftBorder>
    </box>
  )
}
