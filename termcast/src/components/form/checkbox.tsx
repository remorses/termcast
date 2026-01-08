import React from 'react'
import { useKeyboard } from '@opentui/react'
import { useFormContext, Controller } from 'react-hook-form'
import { useFocusContext } from './index'
import { FormItemProps, FormItemRef } from './types'
import { useTheme } from 'termcast/src/theme'
import { WithLeftBorder } from './with-left-border'
import { useFormNavigation } from './use-form-navigation'
import { useIsInFocus } from 'termcast/src/internal/focus-context'
import { LoadingText } from 'termcast/src/components/loading-text'

export interface CheckboxProps extends FormItemProps<boolean> {
  label: string
}

export type CheckboxRef = FormItemRef

export const Checkbox = (props: CheckboxProps): any => {
  const theme = useTheme()
  const { control, setValue, getValues } = useFormContext()
  const focusContext = useFocusContext()
  const { focusedField, setFocusedField } = focusContext
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
          <termcast-form-field-wrapper fieldId={props.id}>
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
                  color={isFocused ? theme.primary : theme.text}
                >
                  {props.title || ''}
                </LoadingText>
              </box>
            </WithLeftBorder>
            <WithLeftBorder isFocused={isFocused}>
              <text
                fg={isFocused ? theme.accent : theme.text}
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
                <text fg={theme.error}>{props.error}</text>
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
