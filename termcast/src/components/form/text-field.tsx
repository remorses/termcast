import React from 'react'
import { TextAttributes } from '@opentui/core'
import { useFormContext, Controller } from 'react-hook-form'
import { useFocusContext } from './index'
import { FormItemProps, FormItemRef } from './types'
import { logger } from 'termcast/src/logger'
import { Theme } from 'termcast/src/theme'
import { WithLeftBorder } from './with-left-border'
import { useFormNavigation } from './use-form-navigation'

export interface TextFieldProps extends FormItemProps<string> {
  placeholder?: string
}

export type TextFieldRef = FormItemRef

export const TextField = (props: TextFieldProps): any => {
  const {
    control,
    formState: { errors },
  } = useFormContext()
  const { focusedField, setFocusedField } = useFocusContext()
  const isFocused = focusedField === props.id

  // Use form navigation hook
  useFormNavigation(props.id)

  return (
    <Controller
      name={props.id}
      control={control}
      defaultValue={props.defaultValue || props.value || ''}
      rules={{
        required: props.error ? props.error : false,
      }}
      render={({ field, fieldState, formState }) => {
        return (
          <box flexDirection='column'>
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
                value={field.value}
                onInput={(value: string) => {
                  field.onChange(value)
                  if (props.onChange) {
                    props.onChange(value)
                  }
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
