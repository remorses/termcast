import React, { useState, useEffect, useRef } from 'react'
import { TextAttributes } from '@opentui/core'
import { useFormContext, FormItemProps, FormItemRef } from '@termcast/api/src/form/index'
import { logger } from '@termcast/api/src/logger'
import { Theme } from '@termcast/api/src/theme'

export interface PasswordFieldProps extends FormItemProps<string> {
    placeholder?: string
}

export type PasswordFieldRef = FormItemRef

export const PasswordField = React.forwardRef<PasswordFieldRef, PasswordFieldProps>((props, ref) => {
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

    // Always show masked value when not focused
    const displayValue = isFocused ? localValue : '*'.repeat(localValue.length)

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
                    onInput={(value: string) => {
                        // Ignore masked input (all asterisks) when not focused
                        if (isFocused && !(/^\*+$/.test(value) && !localValue.startsWith('*'))) {
                            handleChange(value)
                        }
                    }}
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