import React, { useState, useEffect, useRef } from 'react'
import { TextAttributes } from '@opentui/core'
import { useFormContext } from './index'
import { FormItemProps, FormItemRef } from './types'
import { logger } from '@termcast/api/src/logger'
import { Theme } from '@termcast/api/src/theme'

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
    const formContext = useFormContext()
    const [localValue, setLocalValue] = useState<Date | null>(props.defaultValue || props.value || null)
    const [inputValue, setInputValue] = useState('')
    const inputRef = useRef<any>(null)
    const isFocused = formContext.focusedField === props.id

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

    useEffect(() => {
        if (props.value !== undefined) {
            setLocalValue(props.value)
            setInputValue(formatDate(props.value))
        }
    }, [props.value])

    useEffect(() => {
        formContext.setFieldValue(props.id, localValue)
    }, [localValue, props.id])

    const fieldRef: FormItemRef = {
        focus: () => {
            inputRef.current?.focus()
            formContext.setFocusedField(props.id)
        },
        reset: () => {
            const resetValue = props.defaultValue || null
            setLocalValue(resetValue)
            setInputValue(formatDate(resetValue))
            formContext.setFieldValue(props.id, resetValue)
        }
    }

    React.useImperativeHandle(ref, () => fieldRef)

    useEffect(() => {
        formContext.registerField(props.id, fieldRef)
        return () => formContext.unregisterField(props.id)
    }, [props.id])

    const handleChange = (value: string) => {
        setInputValue(value)
        const date = parseDate(value)
        setLocalValue(date)
        if (props.onChange) {
            props.onChange(date)
        }
    }

    // When not focused, show formatted date or placeholder
    const displayValue = isFocused ? inputValue : (formatDate(localValue) || '')

    return (
        <box flexDirection="column">
            {props.title && (
                <text fg={Theme.primary}>
                    {props.title}
                </text>
            )}
            <box border padding={1} backgroundColor={isFocused ? Theme.backgroundPanel : undefined}>
                <input
                    ref={inputRef}
                    value={displayValue}
                    onInput={(value: string) => handleChange(value)}
                    placeholder={props.type === DatePickerType.DateTime ? 'YYYY-MM-DD HH:MM' : 'YYYY-MM-DD'}
                    focused={isFocused}
                />
            </box>
            {props.error && (
                <text fg={Theme.error}>
                    {props.error}
                </text>
            )}
            {props.info && (
                <text fg={Theme.textMuted}>
                    {props.info}
                </text>
            )}
        </box>
    )
}) as DatePickerComponentType

DatePickerComponent.Type = DatePickerType

export const DatePicker = DatePickerComponent