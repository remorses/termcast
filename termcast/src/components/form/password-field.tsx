import React, { useRef, useState } from 'react'
import { BoxRenderable } from '@opentui/core'
import { useFormContext, Controller } from 'react-hook-form'
import { useFocusContext, useFormFieldDescendant } from './index'
import { FormItemProps, FormItemRef } from './types'
import { Theme } from 'termcast/src/theme'
import { WithLeftBorder } from './with-left-border'
import { useFormNavigation } from './use-form-navigation'
import { LoadingText } from 'termcast/src/components/loading-text'

export interface PasswordFieldProps extends FormItemProps<string> {
  placeholder?: string
}

export type PasswordFieldRef = FormItemRef

export const PasswordField = (props: PasswordFieldProps): any => {
  const { control } = useFormContext()
  const focusContext = useFocusContext()
  const { focusedField, setFocusedField } = focusContext
  const isFocused = focusedField === props.id
  const elementRef = useRef<BoxRenderable>(null)
  const realValueRef = useRef(props.defaultValue || props.value || '')
  const [displayLength, setDisplayLength] = useState(realValueRef.current.length)

  useFormFieldDescendant({
    id: props.id,
    elementRef: elementRef.current,
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
          <box ref={elementRef} flexDirection="column">
            <WithLeftBorder withDiamond isFocused={isFocused}>
              <box
                onMouseDown={() => {
                  setFocusedField(props.id)
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
                <text fg={Theme.error}>
                  {fieldState.error?.message || props.error}
                </text>
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
