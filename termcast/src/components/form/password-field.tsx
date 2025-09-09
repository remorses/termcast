import React, { useState } from 'react'
import { TextAttributes } from '@opentui/core'
import { useFormContext, Controller } from 'react-hook-form'
import { useFocusContext } from './index'
import { FormItemProps, FormItemRef } from './types'
import { logger } from '@termcast/cli/src/logger'
import { Theme } from '@termcast/cli/src/theme'
import { WithLeftBorder } from './with-left-border'
import { useFormNavigation } from './use-form-navigation'

export interface PasswordFieldProps extends FormItemProps<string> {
    placeholder?: string
}

export type PasswordFieldRef = FormItemRef

export const PasswordField = (props: PasswordFieldProps): any => {
    const { control } = useFormContext()
    const { focusedField, setFocusedField } = useFocusContext()
    const isFocused = focusedField === props.id

    // Use form navigation hook
    useFormNavigation(props.id)

    return (
        <Controller
            name={props.id}
            control={control}
            defaultValue={props.defaultValue || props.value || ''}
            render={({ field, fieldState, formState }) => {
                // Always show masked value when not focused
                const displayValue = isFocused
                    ? field.value
                    : '*'.repeat(field.value.length)

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
                            <input
                                value={displayValue}
                                onInput={(value: string) => {
                                    // Ignore masked input (all asterisks) when not focused
                                    if (
                                        isFocused &&
                                        !(
                                            /^\*+$/.test(value) &&
                                            !field.value.startsWith('*')
                                        )
                                    ) {
                                        field.onChange(value)
                                        if (props.onChange) {
                                            props.onChange(value)
                                        }
                                    }
                                }}
                                placeholder={props.placeholder}
                                focused={isFocused}
                                onMouseDown={() => {
                                    setFocusedField(props.id)
                                }}
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
