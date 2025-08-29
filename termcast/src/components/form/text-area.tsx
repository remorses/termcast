import React from 'react'
import { TextAttributes } from '@opentui/core'
import { useFormContext, Controller } from 'react-hook-form'
import { useFocusContext } from './index'
import { FormItemProps, FormItemRef } from './types'
import { logger } from '@termcast/cli/src/logger'
import { Theme } from '@termcast/cli/src/theme'

export interface TextAreaProps extends FormItemProps<string> {
    placeholder?: string
    enableMarkdown?: boolean
}

export type TextAreaRef = FormItemRef

export const TextArea = React.forwardRef<TextAreaRef, TextAreaProps>((props, ref) => {
    const { control } = useFormContext()
    const { focusedField, setFocusedField } = useFocusContext()
    const isFocused = focusedField === props.id

    return (
        <Controller
            name={props.id}
            control={control}
            defaultValue={props.defaultValue || props.value || ''}
            render={({ field, fieldState, formState }) => {
                return (
                    <box flexDirection="column">
                        {props.title && (
                            <text fg={Theme.primary}>
                                {props.title}
                            </text>
                        )}
                        <box border padding={1} height={4} backgroundColor={isFocused ? Theme.backgroundPanel : undefined}>
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