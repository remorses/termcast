import React, { useRef, useState } from 'react'
import { BoxRenderable } from '@opentui/core'
import { useFormContext, Controller } from 'react-hook-form'
import { useFocusContext, useFormFieldDescendant } from './index'
import { FormItemProps, FormItemRef } from './types'
import { useTheme } from 'termcast/src/theme'
import { WithLeftBorder, TitleIndicator } from './with-left-border'
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
            <WithLeftBorder isFocused={isFocused} paddingBottom={1}>
              <TitleIndicator isFocused={isFocused} isLoading={focusContext.isLoading}>
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
              </TitleIndicator>
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
              {(fieldState.error || props.error || props.info) && <box height={1} />}
              {(fieldState.error || props.error) && (
                <text fg={theme.error}>
                  {fieldState.error?.message || props.error}
                </text>
              )}
              {props.info && (
                <text fg={theme.textMuted}>{props.info}</text>
              )}
            </WithLeftBorder>
          </box>
        ) as React.ReactElement
      }}
    />
  )
}
