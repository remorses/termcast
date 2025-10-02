import React from 'react'
import { TextAttributes } from '@opentui/core'
import { useKeyboard } from '@opentui/react'
import { useFormContext, Controller } from 'react-hook-form'
import { useFocusContext } from './index'
import { FormItemProps, FormItemRef } from './types'
import { logger } from 'termcast/src/logger'
import { Theme } from 'termcast/src/theme'
import { WithLeftBorder } from './with-left-border'
import { useFormNavigation } from './use-form-navigation'
import { useIsInFocus } from 'termcast/src/internal/focus-context'

export interface CheckboxProps extends FormItemProps<boolean> {
  label: string
}

export type CheckboxRef = FormItemRef

export const Checkbox = (props: CheckboxProps): any => {
  const { control, setValue, getValues } = useFormContext()
  const { focusedField, setFocusedField } = useFocusContext()
  const isFocused = focusedField === props.id
  const isInFocus = useIsInFocus()

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
          <box flexDirection='column'>
            <WithLeftBorder withDiamond isFocused={isFocused}>
              <text
                fg={Theme.text}
                onMouseDown={() => {
                  // Always focus the field when clicked
                  if (!isFocused) {
                    setFocusedField(props.id)
                  }
                  // Always toggle the value when clicked
                  handleToggle()
                }}
              >
                {props.title}
              </text>
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
