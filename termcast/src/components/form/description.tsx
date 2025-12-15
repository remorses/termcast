import React, { useRef, useId } from 'react'
import { BoxRenderable, TextAttributes } from '@opentui/core'
import { Theme } from 'termcast/src/theme'
import { WithLeftBorder } from './with-left-border'
import { useFocusContext, useFormFieldDescendant } from './index'
import { useFormNavigation } from './use-form-navigation'

export interface DescriptionProps {
  id?: string
  title?: string
  text: string
  isFormTitle?: boolean
}

export const FORM_MAX_WIDTH = 70

export const Description = (props: DescriptionProps): any => {
  const elementRef = useRef<BoxRenderable>(null)
  const autoId = useId()
  const id = props.id || autoId

  const focusContext = useFocusContext()
  const isFocused = focusContext.focusedField === id

  // Register as form field descendant for scroll and navigation support
  useFormFieldDescendant({
    id,
    elementRef: elementRef.current,
  })

  // Use form navigation for tab/arrow key support
  useFormNavigation(id)

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
        >
          <text fg={Theme.text} attributes={TextAttributes.BOLD}>
            {props.title}
          </text>
        </WithLeftBorder>
      )}
      <WithLeftBorder isFocused={isFocused}>
        <text fg={Theme.textMuted}>{props.text}</text>
      </WithLeftBorder>
    </box>
  )
}
