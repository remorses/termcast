import React, { useState, useEffect, useRef } from 'react'
import { TextAttributes } from '@opentui/core'
import { useFormContext } from './index'
import { FormItemProps, FormItemRef } from './types'
import { logger } from '@termcast/api/src/logger'
import { Theme } from '@termcast/api/src/theme'

export interface TextAreaProps extends FormItemProps<string> {
    placeholder?: string
    enableMarkdown?: boolean
}

export type TextAreaRef = FormItemRef

export const TextArea = React.forwardRef<TextAreaRef, TextAreaProps>((props, ref) => {
    const formContext = useFormContext()
    const [localValue, setLocalValue] = useState(props.defaultValue || props.value || '')
    const inputRef = useRef<any>(null)
    const isFocused = formContext.focusedField === props.id

    useEffect(() => {
        if (props.value !== undefined) {
            setLocalValue(props.value)
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
            const resetValue = props.defaultValue || ''
            setLocalValue(resetValue)
            formContext.setFieldValue(props.id, resetValue)
        }
    }

    React.useImperativeHandle(ref, () => fieldRef)

    useEffect(() => {
        formContext.registerField(props.id, fieldRef)
        return () => formContext.unregisterField(props.id)
    }, [props.id])

    const handleChange = (value: string) => {
        setLocalValue(value)
        if (props.onChange) {
            props.onChange(value)
        }
    }

    return (
        <box flexDirection="column">
            {props.title && (
                <text fg={Theme.primary}>
                    {props.title}
                </text>
            )}
            <box border padding={1} height={4} backgroundColor={isFocused ? Theme.backgroundPanel : undefined}>
                <input
                    ref={inputRef}
                    value={localValue}
                    onInput={(value: string) => handleChange(value)}
                    placeholder={props.placeholder}
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
})