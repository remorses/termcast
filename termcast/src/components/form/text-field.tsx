import React, { useRef } from 'react'
import { TextAttributes, BoxRenderable } from '@opentui/core'
import { useFormContext, Controller } from 'react-hook-form'
import { useFocusContext, useFormFieldDescendant } from './index'
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

  const elementRef = useRef<BoxRenderable>(null)

  // Register as form field descendant for scroll support
  useFormFieldDescendant({
    id: props.id,
    elementRef: elementRef.current,
  })

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
          <box ref={elementRef} flexDirection='column'>
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
              <textarea
                height={1}
                keyBindings={[
                  { name: 'return', action: 'submit' },
                  { name: 'linefeed', action: 'submit' },
                ]}
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
