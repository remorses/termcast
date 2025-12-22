import React, { useRef } from 'react'
import { TextAttributes, BoxRenderable } from '@opentui/core'
import { useKeyboard } from '@opentui/react'
import { useFormContext, Controller } from 'react-hook-form'
import { useFocusContext, useFormFieldDescendant } from './index'
import { FormItemProps, FormItemRef } from './types'
import { logger } from 'termcast/src/logger'
import { Theme } from 'termcast/src/theme'
import { WithLeftBorder } from './with-left-border'
import { useFormNavigation } from './use-form-navigation'
import { useIsInFocus } from 'termcast/src/internal/focus-context'
import { LoadingText } from 'termcast/src/components/loading-text'

export interface CheckboxProps extends FormItemProps<boolean> {
  label: string
}

export type CheckboxRef = FormItemRef

export const Checkbox = (props: CheckboxProps): any => {
  const { control, setValue, getValues } = useFormContext()
  const focusContext = useFocusContext()
  const { focusedField, setFocusedField } = focusContext
  const isFocused = focusedField === props.id
  const isInFocus = useIsInFocus()

  const elementRef = useRef<BoxRenderable>(null)

  // Register as form field descendant for scroll support
  useFormFieldDescendant({
    id: props.id,
    elementRef: elementRef.current,
  })

  // Use form navigation hook
  useFormNavigation(props.id)
  const handleToggle = () => {
    const newValue = !getValues()?.[props.id]
    setValue(props.id, newValue)
    if (props.onChange) {
      props.onChange(newValue)
    }
  }

  useKeyboard((evt) => {
    if (
      isFocused &&
      isInFocus &&
      (evt.name === 'space' || evt.name === 'return')
    ) {
      handleToggle()
    }
  })
  return (
    <Controller
      name={props.id}
      control={control}
      defaultValue={props.defaultValue || props.value || false}
      render={({ field, fieldState, formState }) => {
        return (
          <box ref={elementRef} flexDirection='column'>
            <WithLeftBorder withDiamond isFocused={isFocused} isLoading={focusContext.isLoading}>
              <box
                onMouseDown={() => {
                  // Always focus the field when clicked
                  if (!isFocused) {
                    setFocusedField(props.id)
                  }
                  // Always toggle the value when clicked
                  handleToggle()
                }}
              >
                <LoadingText
                  isLoading={isFocused && focusContext.isLoading}
                  color={isFocused ? Theme.primary : Theme.text}
                >
                  {props.title || ''}
                </LoadingText>
              </box>
            </WithLeftBorder>
            <WithLeftBorder isFocused={isFocused}>
              <text
                fg={isFocused ? Theme.accent : Theme.text}
                selectable={false}
                onMouseDown={() => {
                  if (!isFocused) {
                    setFocusedField(props.id)
                  }
                  handleToggle()
                }}
              >
                {field.value ? '●' : '○'} {props.label}
              </text>
            </WithLeftBorder>
            {props.error && (
              <WithLeftBorder isFocused={isFocused}>
                <text fg={Theme.error}>{props.error}</text>
              </WithLeftBorder>
            )}
            {props.info && (
              <WithLeftBorder isFocused={isFocused}>
                <text fg={Theme.textMuted}>{props.info}</text>
              </WithLeftBorder>
            )}
          </box>
        ) as React.ReactElement
      }}
    />
  )
}
