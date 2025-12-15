import React, { useRef, useLayoutEffect } from 'react'
import { BoxRenderable, TextAttributes } from '@opentui/core'
import { useFormContext } from 'react-hook-form'
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

  // Only use focus features if id is provided
  const focusContext = props.id ? useFocusContext() : null
  const { setValue } = useFormContext()

  const isFocused = props.id ? focusContext?.focusedField === props.id : false

  // Register as form field descendant for scroll support
  useFormFieldDescendant({
    id: props.id || '',
    elementRef: elementRef.current,
  })

  // Register with react-hook-form by setting a value so it appears in getValues()
  useLayoutEffect(() => {
    if (props.id) {
      setValue(props.id, '')
    }
  }, [props.id])

  // Use form navigation for tab/arrow key support
  useFormNavigation(props.id || '')

  return (
    <box
      ref={elementRef}
      flexDirection='column'
      maxWidth={FORM_MAX_WIDTH}
      onMouseDown={() => {
        if (props.id && focusContext) {
          focusContext.setFocusedField(props.id)
        }
      }}
    >
      {props.title && (
        <WithLeftBorder
          customCharacter={{ focused: '⁉', unfocused: '▪︎' }}
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
