import React, { useRef, useState } from 'react'
import { BoxRenderable } from '@opentui/core'
import { useFormContext, Controller } from 'react-hook-form'
import { useFocusContext, useFormFieldDescendant } from './index'
import { FormItemProps, FormItemRef } from './types'
import { useTheme } from 'termcast/src/theme'
import { WithLeftBorder } from './with-left-border'
import { useFormNavigation } from './use-form-navigation'
import { LoadingText } from 'termcast/src/components/loading-text'

export interface PasswordFieldProps extends FormItemProps<string> {
  placeholder?: string
}

export type PasswordFieldRef = FormItemRef

export const PasswordField = (props: PasswordFieldProps): any => {
  const theme = useTheme()
  const { control } = useFormContext()
  const focusContext = useFocusContext()
  const { focusedField, setFocusedField } = focusContext
  const isFocused = focusedField === props.id
  const realValueRef = useRef(props.defaultValue || props.value || '')
  const [displayLength, setDisplayLength] = useState(realValueRef.current.length)
  const elementRef = useRef<BoxRenderable>(null)

  // Register as form field descendant for scroll and navigation support
  useFormFieldDescendant({
    id: props.id,
    elementRef: elementRef,
  })

  useFormNavigation(props.id)

  return (
    <Controller
      name={props.id}
      control={control}
      defaultValue={props.defaultValue || props.value || ''}
      render={({ field, fieldState }) => {
        const displayValue = '*'.repeat(displayLength)

        return (
          <termcast-form-field-wrapper fieldId={props.id} ref={elementRef}>
            <WithLeftBorder withDiamond isFocused={isFocused} isLoading={focusContext.isLoading}>
              <box
                onMouseDown={() => {
                  setFocusedField(props.id)
                }}
              >
                <LoadingText
                  isLoading={isFocused && focusContext.isLoading}
                  color={isFocused ? theme.primary : theme.text}
                >
                  {props.title || ''}
                </LoadingText>
              </box>
            </WithLeftBorder>
            <WithLeftBorder isFocused={isFocused}>
              <input
                value={displayValue}
                onInput={(newDisplay: string) => {
                  if (!isFocused) return

                  const currentValue = realValueRef.current
                  const oldLen = currentValue.length
                  const newLen = newDisplay.length

                  let newValue: string
                  if (newLen > oldLen) {
                    const addedChars = newDisplay.replace(/\*/g, '')
                    newValue = currentValue + addedChars
                  } else if (newLen < oldLen) {
                    newValue = currentValue.slice(0, newLen)
                  } else {
                    return
                  }

                  realValueRef.current = newValue
                  setDisplayLength(newValue.length)
                  field.onChange(newValue)
                  props.onChange?.(newValue)
                }}
                placeholder={props.placeholder}
                focused={isFocused}
                onMouseDown={() => {
                  setFocusedField(props.id)
                }}
              />
            </WithLeftBorder>
            {(fieldState.error || props.error) && (
              <WithLeftBorder isFocused={isFocused}>
                <text fg={theme.error}>
                  {fieldState.error?.message || props.error}
                </text>
              </WithLeftBorder>
            )}
            {props.info && (
              <WithLeftBorder isFocused={isFocused}>
                <text fg={theme.textMuted}>{props.info}</text>
              </WithLeftBorder>
            )}
          </termcast-form-field-wrapper>
        ) as React.ReactElement
      }}
    />
  )
}
