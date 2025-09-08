import React from 'react'
import { TextAttributes } from '@opentui/core'
import { useFormContext, Controller } from 'react-hook-form'
import { useFocusContext } from './index'
import { FormItemProps, FormItemRef } from './types'
import { logger } from '@termcast/cli/src/logger'
import { Theme } from '@termcast/cli/src/theme'
import { WithLeftBorder } from './with-left-border'

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
        const { control } = useFormContext()
        const { focusedField, setFocusedField } = useFocusContext()
        const isFocused = focusedField === props.id

        return (
            <Controller
                name={props.id}
                control={control}
                defaultValue={props.defaultValue || props.value || null}
                render={({ field, fieldState, formState }) => {
                    const placeholder = props.type === DatePickerType.DateTime 
                        ? 'YYYY/MM/DD HH:MM' 
                        : 'YYYY/MM/DD'
                    
                    const formatDateForDisplay = (date: Date | null): string => {
                        if (!date) return ''
                        const year = date.getFullYear()
                        const month = String(date.getMonth() + 1).padStart(2, '0')
                        const day = String(date.getDate()).padStart(2, '0')
                        
                        if (props.type === DatePickerType.DateTime) {
                            const hours = String(date.getHours()).padStart(2, '0')
                            const minutes = String(date.getMinutes()).padStart(2, '0')
                            return `${year}/${month}/${day} ${hours}:${minutes}`
                        }
                        return `${year}/${month}/${day}`
                    }
                    
                    const parseInput = (value: string): Date | null => {
                        if (!value) return null
                        
                        // Try to parse YYYY/MM/DD or YYYY/MM/DD HH:MM
                        const dateTimeMatch = value.match(/^(\d{4})\/(\d{2})\/(\d{2})\s+(\d{2}):(\d{2})$/)
                        if (dateTimeMatch) {
                            const [, year, month, day, hours, minutes] = dateTimeMatch
                            const date = new Date(
                                parseInt(year, 10),
                                parseInt(month, 10) - 1,
                                parseInt(day, 10),
                                parseInt(hours, 10),
                                parseInt(minutes, 10)
                            )
                            return isNaN(date.getTime()) ? null : date
                        }
                        
                        const dateMatch = value.match(/^(\d{4})\/(\d{2})\/(\d{2})$/)
                        if (dateMatch) {
                            const [, year, month, day] = dateMatch
                            const date = new Date(
                                parseInt(year, 10),
                                parseInt(month, 10) - 1,
                                parseInt(day, 10)
                            )
                            return isNaN(date.getTime()) ? null : date
                        }
                        
                        return null
                    }

                    return (
                        <box flexDirection='column'>
                            <WithLeftBorder withDiamond={true} diamondFilled={isFocused}>
                                <text
                                    fg={isFocused ? Theme.accent : Theme.text}
                                    onMouseDown={() => {
                                        setFocusedField(props.id)
                                    }}
                                >
                                    {props.title}
                                </text>
                            </WithLeftBorder>
                            <WithLeftBorder>
                                <input
                                    value={formatDateForDisplay(field.value)}
                                    onInput={(value: string) => {
                                        const parsedDate = parseInput(value)
                                        field.onChange(parsedDate)
                                        if (props.onChange && parsedDate) {
                                            props.onChange(parsedDate)
                                        }
                                    }}
                                    placeholder={placeholder}
                                    focused={isFocused}
                                    onMouseDown={() => {
                                        setFocusedField(props.id)
                                    }}
                                />
                            </WithLeftBorder>
                            {(fieldState.error || props.error) && (
                                <WithLeftBorder>
                                    <text fg={Theme.error}>
                                        {fieldState.error?.message || props.error}
                                    </text>
                                </WithLeftBorder>
                            )}
                            {props.info && (
                                <WithLeftBorder>
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