import React from 'react'
import { TextAttributes } from '@opentui/core'
import { useFormContext, Controller } from 'react-hook-form'
import { useFocusContext } from './index'
import { FormItemProps, FormItemRef } from './types'
import { logger } from '@termcast/cli/src/logger'
import { Theme } from '@termcast/cli/src/theme'
import { WithLeftBorder } from './with-left-border'
import { useFormNavigation } from './use-form-navigation'

export interface TextAreaProps extends FormItemProps<string> {
    placeholder?: string
    enableMarkdown?: boolean
}

export type TextAreaRef = FormItemRef

export const TextArea = (props: TextAreaProps): any => {
        const { control } = useFormContext()
        const { focusedField, setFocusedField } = useFocusContext()
        const isFocused = focusedField === props.id

        // TODO in textarea arrows should probably go to lines instead of other forms
        useFormNavigation(props.id, )

        return (
            <Controller
                name={props.id}
                control={control}
                defaultValue={props.defaultValue || props.value || ''}
                render={({ field, fieldState, formState }) => {
                    return (
                        <box flexDirection='column'>
                            <WithLeftBorder
                                withDiamond={true}
                                diamondFilled={isFocused}
                            >
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
                                <box flexGrow={1}>
                                    <input
                                        value={field.value}
                                        onInput={(value: string) => {
                                            field.onChange(value)
                                            if (props.onChange) {
                                                props.onChange(value)
                                            }
                                        }}
                                        minHeight={4}
                                        placeholder={props.placeholder}
                                        focused={isFocused}
                                        onMouseDown={() => {
                                            setFocusedField(props.id)
                                        }}
                                    />
                                </box>
                            </WithLeftBorder>

                            {(fieldState.error || props.error) && (
                                <WithLeftBorder>
                                    <text fg={Theme.error}>
                                        {fieldState.error?.message ||
                                            props.error}
                                    </text>
                                </WithLeftBorder>
                            )}
                            {props.info && (
                                <WithLeftBorder>
                                    <text fg={Theme.textMuted}>
                                        {props.info}
                                    </text>
                                </WithLeftBorder>
                            )}
                        </box>
                    ) as React.ReactElement
                }}
            />
        )
    }
