import React, { useRef } from 'react'
import { BoxRenderable } from '@opentui/core'
import { useKeyboard } from '@opentui/react'
import { useFormContext, Controller } from 'react-hook-form'
import { useFocusContext, useFormFieldDescendant } from './index'
import { FormItemProps, FormItemRef } from './types'
import { useTheme } from 'termcast/src/theme'
import { WithLeftBorder } from './with-left-border'
import { DatePickerWidget } from 'termcast/src/internal/date-picker-widget'
import { useIsInFocus } from 'termcast/src/internal/focus-context'
import { useFormNavigationHelpers } from './use-form-navigation'
import { LoadingText } from 'termcast/src/components/loading-text'

export enum DatePickerType {
  Date = 'date',
  DateTime = 'datetime',
}

export interface DatePickerProps extends FormItemProps<Date | null> {
  type?: DatePickerType
  min?: Date
  max?: Date
}

export type DatePickerRef = FormItemRef

interface DatePickerComponentType {
  (props: DatePickerProps): any
  Type: typeof DatePickerType
}

const DatePickerComponent = (props: DatePickerProps): any => {
  const theme = useTheme()
  const { control } = useFormContext()
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

  const { navigateToPrevious, navigateToNext } = useFormNavigationHelpers(props.id)

  // Handle tab navigation only
  useKeyboard((evt) => {
    if (!isFocused || !isInFocus) return

    if (evt.name === 'tab') {
      if (evt.shift) {
        navigateToPrevious()
      } else {
        navigateToNext()
      }
    }
  })

  return (
    <Controller
      name={props.id}
      control={control}
      defaultValue={props.defaultValue || props.value || null}
      render={({ field, fieldState, formState }) => {
        return (
          <box ref={elementRef} flexDirection='column'>
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
              <DatePickerWidget
                enableColors={isFocused}
                initialValue={field.value || undefined}
                onChange={(date) => {
                  field.onChange(date)
                  if (props.onChange) {
                    props.onChange(date)
                  }
                }}
                focused={isFocused}
              />
            </WithLeftBorder>
            {field.value && (
              <WithLeftBorder isFocused={isFocused}>
                <text fg={theme.accent}>
                  Selected: {field.value.toISOString().split('T')[0]}
                </text>
              </WithLeftBorder>
            )}
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
          </box>
        ) as React.ReactElement
      }}
    />
  )
}

// Create the properly typed DatePicker with static properties
export const DatePicker = Object.assign(DatePickerComponent, {
  Type: DatePickerType,
}) as DatePickerComponentType
