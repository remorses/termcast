import React, { useState } from 'react'
import { TextAttributes } from '@opentui/core'
import { useFormContext, Controller } from 'react-hook-form'
import { useFocusContext } from './index'
import { FormItemProps, FormItemRef } from './types'
import { logger } from '@termcast/cli/src/logger'
import { Theme } from '@termcast/cli/src/theme'

export interface PasswordFieldProps extends FormItemProps<string> {
    placeholder?: string
}

export type PasswordFieldRef = FormItemRef

export const PasswordField = React.forwardRef<PasswordFieldRef, PasswordFieldProps>((props, ref) => {
    const { control } = useFormContext()
    const { focusedField, setFocusedField } = useFocusContext()
    const isFocused = focusedField === props.id

    return (
        <Controller
            name={props.id}
            control={control}
            defaultValue={props.defaultValue || props.value || ''}
            render={({ field, fieldState, formState }) => {
                // Always show masked value when not focused
                const displayValue = isFocused ? field.value : '*'.repeat(field.value.length)

                return (
                    <box flexDirection="column">
                            <box 
                                border 
                                title={props.title ? (isFocused ? `${props.title} ‹` : props.title) : undefined}
                                padding={1} 
                                backgroundColor={isFocused ? Theme.backgroundPanel : undefined}
                            >
                                <input
                                    value={displayValue}
                                    onInput={(value: string) => {
                                        // Ignore masked input (all asterisks) when not focused
                                        if (isFocused && !(/^\*+$/.test(value) && !field.value.startsWith('*'))) {
                                            field.onChange(value)
                                            if (props.onChange) {
                                                props.onChange(value)
                                            }
                                        }
                                    }}
                                    placeholder={props.placeholder}
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
})