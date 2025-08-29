import React, { useState } from 'react'
import { TextAttributes } from '@opentui/core'
import { useFormContext, Controller } from 'react-hook-form'
import { useFocusContext } from './index'
import { FormItemProps, FormItemRef } from './types'
import { logger } from '@termcast/cli/src/logger'
import { Theme } from '@termcast/cli/src/theme'

export enum DatePickerType {
    Date = 'date',
    DateTime = 'datetime'
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

const DatePickerComponent = React.forwardRef<DatePickerRef, DatePickerProps>((props, ref) => {
    const { control } = useFormContext()
    const { focusedField, setFocusedField } = useFocusContext()
    const isFocused = focusedField === props.id
    const [inputValue, setInputValue] = useState('')

    const formatDate = (date: Date | null) => {
        if (!date) return ''
        if (props.type === DatePickerType.DateTime) {
            return date.toISOString().slice(0, 16).replace('T', ' ')
        }
        return date.toISOString().slice(0, 10)
    }

    const parseDate = (dateString: string): Date | null => {
        if (!dateString) return null
        try {
            // Handle YYYY-MM-DD or YYYY-MM-DD HH:MM
            const cleanedString = dateString.replace(' ', 'T')
            const date = new Date(cleanedString)
            return isNaN(date.getTime()) ? null : date
        } catch {
            return null
        }
    }

    return (
        <Controller
            name={props.id}
            control={control}
            defaultValue={props.defaultValue || props.value || null}
            render={({ field, fieldState, formState }) => {
                const handleChange = (value: string) => {
                    setInputValue(value)
                    const date = parseDate(value)
                    field.onChange(date)
                    if (props.onChange) {
                        props.onChange(date)
                    }
                }

                // When not focused, show formatted date or placeholder
                const displayValue = isFocused ? inputValue : (formatDate(field.value) || '')

                return (
                    <box flexDirection="column">
                            {props.title && (
                                <text fg={Theme.primary}>
                                    {props.title}
                                </text>
                            )}
                            <box border padding={1} backgroundColor={isFocused ? Theme.backgroundPanel : undefined}>
                                <input
                                    value={displayValue}
                                    onInput={(value: string) => {
                                        if (isFocused) {
                                            handleChange(value)
                                        } else {
                                            setInputValue(formatDate(field.value))
                                        }
                                    }}
                                    placeholder={props.type === DatePickerType.DateTime ? 'YYYY-MM-DD HH:MM' : 'YYYY-MM-DD'}
                                    focused={isFocused}
                                />
                            </box>
                            {(fieldState.error || props.error) && (
                                <text fg={Theme.error}>
                                    {fieldState.error?.message || props.error}
                                </text>
                            )}
                            {props.info && (
                                <text fg={Theme.textMuted}>
                                    {props.info}
                                </text>
                            )}
                        </box>
                ) as React.ReactElement
            }}
        />
    )
}) as unknown as DatePickerComponentType

DatePickerComponent.Type = DatePickerType

export const DatePicker = DatePickerComponent