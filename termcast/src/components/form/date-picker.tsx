import React from 'react'
import { TextAttributes } from '@opentui/core'
import { useKeyboard } from '@opentui/react'
import { useFormContext, Controller } from 'react-hook-form'
import { useFocusContext } from './index'
import { FormItemProps, FormItemRef } from './types'
import { logger } from '@termcast/cli/src/logger'
import { Theme } from '@termcast/cli/src/theme'
import { WithLeftBorder } from './with-left-border'
import { DatePickerWidget } from '@termcast/cli/src/internal/date-picker-widget'
import { useIsInFocus } from '@termcast/cli/src/internal/focus-context'

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
        const { control, getValues } = useFormContext()
        const { focusedField, setFocusedField } = useFocusContext()
        const isFocused = focusedField === props.id
        const isInFocus = useIsInFocus()

        const handleNavigateUp = () => {
            // Find previous field and focus it
            const fieldNames = Object.keys(getValues())
            const currentIndex = fieldNames.indexOf(props.id)
            if (currentIndex > 0) {
                setFocusedField(fieldNames[currentIndex - 1])
            } else {
                setFocusedField(fieldNames[fieldNames.length - 1])
            }
        }

        const handleNavigateDown = () => {
            // Find next field and focus it
            const fieldNames = Object.keys(getValues())
            const currentIndex = fieldNames.indexOf(props.id)
            if (currentIndex < fieldNames.length - 1) {
                setFocusedField(fieldNames[currentIndex + 1])
            } else {
                setFocusedField(fieldNames[0])
            }
        }

        // Handle tab navigation only
        useKeyboard((evt) => {
            if (!isFocused || !isInFocus) return

            if (evt.name === 'tab') {
                if (evt.shift) {
                    handleNavigateUp()
                } else {
                    handleNavigateDown()
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

// Create the properly typed DatePicker with static properties
export const DatePicker = Object.assign(DatePickerComponent, {
    Type: DatePickerType,
}) as DatePickerComponentType
