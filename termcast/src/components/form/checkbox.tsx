import React from 'react'
import { TextAttributes } from '@opentui/core'
import { useKeyboard } from '@opentui/react'
import { useFormContext, Controller } from 'react-hook-form'
import { useFocusContext } from './index'
import { FormItemProps, FormItemRef } from './types'
import { logger } from '@termcast/cli/src/logger'
import { Theme } from '@termcast/cli/src/theme'
import { WithLeftBorder } from './with-left-border'

export interface CheckboxProps extends FormItemProps<boolean> {
    label: string
}

export type CheckboxRef = FormItemRef

export const Checkbox = React.forwardRef<CheckboxRef, CheckboxProps>(
    (props, ref) => {
        const { control, setValue, getValues } = useFormContext()
        const { focusedField, setFocusedField } = useFocusContext()
        const isFocused = focusedField === props.id
        const handleToggle = () => {
          const newValue = !getValues()?.[props.id]
            setValue(props.id, newValue)
            if (props.onChange) {
                props.onChange(newValue)
            }
        }

        useKeyboard((evt) => {
            if (isFocused && (evt.name === 'space' || evt.name === 'return')) {
                handleToggle()
            }
        })
        return (
            <Controller
                name={props.id}
                control={control}
                defaultValue={props.defaultValue || props.value || false}
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
                                        // Always focus the field when clicked
                                        if (!isFocused) {
                                            setFocusedField(props.id)
                                        }
                                        // Always toggle the value when clicked
                                        handleToggle()
                                    }}
                                >
                                    {props.title}
                                </text>
                            </WithLeftBorder>
                            <WithLeftBorder>
                                <text
                                    fg={Theme.text}
                                    selectable={false}
                                    onMouseDown={() => {
                                        if (!isFocused) {
                                            setFocusedField(props.id)
                                        }
                                        handleToggle()
                                    }}
                                >
                                    {field.value ? '●' : '○'} {props.label}
                                </text>
                            </WithLeftBorder>
                            {props.error && (
                                <WithLeftBorder>
                                    <text fg={Theme.error}>{props.error}</text>
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
    },
)
