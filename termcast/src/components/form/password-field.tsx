import React, { useRef } from 'react'
import { BoxRenderable } from '@opentui/core'
import { useFormContext, Controller } from 'react-hook-form'
import { useFocusContext, useFormFieldDescendant } from './index'
import { FormItemProps, FormItemRef } from './types'
import { Theme } from 'termcast/src/theme'
import { WithLeftBorder } from './with-left-border'
import { useFormNavigation } from './use-form-navigation'

export interface PasswordFieldProps extends FormItemProps<string> {
  placeholder?: string
}

export type PasswordFieldRef = FormItemRef

export const PasswordField = (props: PasswordFieldProps): any => {
  const { control } = useFormContext()
  const { focusedField, setFocusedField } = useFocusContext()
  const isFocused = focusedField === props.id
  const elementRef = useRef<BoxRenderable>(null)

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
        const displayValue = isFocused
          ? field.value
          : '*'.repeat(field.value?.length || 0)

        return (
          <box ref={elementRef} flexDirection="column">
            <WithLeftBorder withDiamond isFocused={isFocused}>
              <text
                fg={Theme.text}
                onMouseDown={() => {
                  setFocusedField(props.id)
                }}
              >
                {props.title}
              </text>
            </WithLeftBorder>
            <WithLeftBorder isFocused={isFocused}>
              <input
                value={displayValue}
                onInput={(value: string) => {
                  if (!isFocused) return
                  field.onChange(value)
                  props.onChange?.(value)
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
