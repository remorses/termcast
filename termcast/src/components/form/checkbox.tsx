import React from 'react'
import { TextAttributes } from '@opentui/core'
import { useKeyboard } from '@opentui/react'
import { useFormContext, Controller } from 'react-hook-form'
import { useFocusContext } from './index'
import { FormItemProps, FormItemRef } from './types'
import { logger } from '@termcast/cli/src/logger'
import { Theme } from '@termcast/cli/src/theme'

export interface CheckboxProps extends FormItemProps<boolean> {
    label: string
}

export type CheckboxRef = FormItemRef

export const Checkbox = React.forwardRef<CheckboxRef, CheckboxProps>((props, ref) => {
    const { control } = useFormContext()
    const { focusedField, setFocusedField } = useFocusContext()
    const isFocused = focusedField === props.id

    return (
        <Controller
            name={props.id}
            control={control}
            defaultValue={props.defaultValue || props.value || false}
            render={({ field, fieldState, formState }) => {
                const handleToggle = () => {
                    const newValue = !field.value
                    field.onChange(newValue)
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
                            <box 
                                border
                                title={props.title ? (isFocused ? `${props.title} ‹` : props.title) : undefined}
                                padding={1}
                                backgroundColor={isFocused ? Theme.backgroundPanel : undefined}
                            >
                                <text fg={field.value ? Theme.accent : Theme.text}>
                                    [{field.value ? '✓' : ' '}] {props.label}
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
                ) as React.ReactElement
            }}
        />
    )
})