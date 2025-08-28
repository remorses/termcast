import React from 'react'
import { TextAttributes } from '@opentui/core'
import { useFormContext, Controller } from 'react-hook-form'
import { useFocusContext } from './index'
import { FormItemProps, FormItemRef } from './types'
import { logger } from '@termcast/api/src/logger'
import { Theme } from '@termcast/api/src/theme'

export interface TextFieldProps extends FormItemProps<string> {
    placeholder?: string
}

export type TextFieldRef = FormItemRef

export const TextField = React.forwardRef<TextFieldRef, TextFieldProps>((props, ref) => {
    const { control, formState: { errors } } = useFormContext()
    const { focusedField, setFocusedField } = useFocusContext()
    const isFocused = focusedField === props.id

    return (
        <Controller
            name={props.id}
            control={control}
            defaultValue={props.defaultValue || props.value || ''}
            rules={{
                required: props.error ? props.error : false
            }}
            render={({ field, fieldState, formState }) => {
                return (
                    <box flexDirection="column">
                        {props.title && (
                            <text fg={Theme.primary}>
                                {props.title}
                            </text>
                        )}
                        <box border padding={1} backgroundColor={isFocused ? Theme.backgroundPanel : undefined}>
                            <input
                                value={field.value}
                                onInput={(value: string) => {
                                    field.onChange(value)
                                    if (props.onChange) {
                                        props.onChange(value)
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