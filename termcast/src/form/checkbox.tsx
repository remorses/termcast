import React, { useState, useEffect, useRef } from 'react'
import { TextAttributes } from '@opentui/core'
import { useKeyboard } from '@opentui/react'
import { useFormContext, FormItemProps, FormItemRef } from '@termcast/api/src/form/index'
import { logger } from '@termcast/api/src/logger'
import { Theme } from '@termcast/api/src/theme'

export interface CheckboxProps extends FormItemProps<boolean> {
    label: string
}

export type CheckboxRef = FormItemRef

export const Checkbox = React.forwardRef<CheckboxRef, CheckboxProps>((props, ref) => {
    const formContext = useFormContext()
    const [localValue, setLocalValue] = useState(props.defaultValue || props.value || false)
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
            formContext.setFocusedField(props.id)
        },
        reset: () => {
            const resetValue = props.defaultValue || false
            setLocalValue(resetValue)
            formContext.setFieldValue(props.id, resetValue)
        }
    }

    React.useImperativeHandle(ref, () => fieldRef)

    useEffect(() => {
        formContext.registerField(props.id, fieldRef)
        return () => formContext.unregisterField(props.id)
    }, [props.id])

    const handleToggle = () => {
        const newValue = !localValue
        setLocalValue(newValue)
        if (props.onChange) {
            props.onChange(newValue)
        }
    }

    // Handle space or enter key to toggle when focused
    useKeyboard((evt) => {
        if (isFocused && (evt.name === 'space' || evt.name === 'return')) {
            handleToggle()
        }
    })

    return (
        <box flexDirection="column">
            {props.title && (
                <text fg={Theme.primary}>
                    {props.title}
                </text>
            )}
            <box 
                border
                padding={1}
                backgroundColor={isFocused ? Theme.backgroundPanel : undefined}
            >
                <text fg={localValue ? Theme.accent : Theme.text}>
                    [{localValue ? '✓' : ' '}] {props.label}
                </text>
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