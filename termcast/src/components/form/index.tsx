import React, { useState, createContext, useContext, useEffect } from 'react'
import { useKeyboard } from '@opentui/react'
import { useForm, FormProvider } from 'react-hook-form'
import { ActionPanel } from '@termcast/cli/src/components/actions'
import { logger } from '@termcast/cli/src/logger'
import { InFocus, useIsInFocus } from '@termcast/cli/src/internal/focus-context'
import { useDialog } from '@termcast/cli/src/internal/dialog'
import { Theme } from '@termcast/cli/src/theme'
import { TextAttributes } from '@opentui/core'
import { useStore } from '@termcast/cli/src/state'
import {
    FormValues,
    FormProps,
    FormItemProps,
    FormEvent,
    FormEventType,
    FormItemRef,
    FormValue_2,
    FormValues_2,
    FormProps_2,
    FormItemProps_2,
} from './types'

export * from './types'
export { useFormContext } from 'react-hook-form'

// Context for managing focused field
interface FocusContextValue {
    focusedField: string | null
    setFocusedField: (id: string | null) => void
}

const FocusContext = createContext<FocusContextValue | null>(null)

export const useFocusContext = () => {
    const context = useContext(FocusContext)
    if (!context) {
        throw new Error('Form components must be used within a Form')
    }
    return context
}

// Context for form submission
interface FormSubmitContextValue {
    getFormValues: () => FormValues
}

const FormSubmitContext = createContext<FormSubmitContextValue | null>(null)

export const useFormSubmit = () => {
    const context = useContext(FormSubmitContext)
    return context // Can be null if not in a form
}

// Footer component to show keyboard shortcuts
function FormFooter(): any {
    const toast = useStore((state) => state.toast)

    if (toast) {
        return (
            <box
                border={false}
                style={{
                    paddingLeft: 1,
                    paddingRight: 1,
                    paddingTop: 1,
                    marginTop: 1,
                }}
            >
                {toast}
            </box>
        )
    }

    return (
        <box
            border={false}
            style={{
                paddingLeft: 1,
                paddingRight: 1,
                paddingTop: 1,
                marginTop: 1,
                flexDirection: 'row',
            }}
        >
            <text fg={Theme.text} attributes={TextAttributes.BOLD}>
                ↵
            </text>
            <text fg={Theme.textMuted}> submit</text>
            <text fg={Theme.text} attributes={TextAttributes.BOLD}>
                {'   '}↑↓
            </text>
            <text fg={Theme.textMuted}> navigate</text>
            <text fg={Theme.text} attributes={TextAttributes.BOLD}>
                {'   '}^k
            </text>
            <text fg={Theme.textMuted}> actions</text>
        </box>
    )
}

import type { TextFieldProps, TextFieldRef } from './text-field'
import type { PasswordFieldProps, PasswordFieldRef } from './password-field'
import type { TextAreaProps, TextAreaRef } from './text-area'
import type { CheckboxProps, CheckboxRef } from './checkbox'
import type {
    DropdownProps,
    DropdownRef,
    DropdownItemProps,
    DropdownSectionProps,
} from './dropdown'
import type {
    DatePickerProps,
    DatePickerRef,
    DatePickerType as DatePickerEnum,
} from './date-picker'
import type { DescriptionProps } from './description'

interface DropdownType {
    (props: DropdownProps): any
    Item: (props: DropdownItemProps) => any
    Section: (props: DropdownSectionProps) => any
}

interface DatePickerComponentType {
    (props: DatePickerProps): any
    Type: typeof DatePickerEnum
}

interface FormType {
    (props: FormProps): any
    TextField: React.ForwardRefExoticComponent<
        TextFieldProps & React.RefAttributes<TextFieldRef>
    >
    PasswordField: React.ForwardRefExoticComponent<
        PasswordFieldProps & React.RefAttributes<PasswordFieldRef>
    >
    TextArea: React.ForwardRefExoticComponent<
        TextAreaProps & React.RefAttributes<TextAreaRef>
    >
    Checkbox: React.ForwardRefExoticComponent<
        CheckboxProps & React.RefAttributes<CheckboxRef>
    >
    Dropdown: DropdownType
    DatePicker: DatePickerComponentType
    TagPicker: null // TODO: implement
    FilePicker: null // TODO: implement
    Separator: () => any
    Description: (props: DescriptionProps) => any
}

export const Form: FormType = ((props) => {
    const methods = useForm<FormValues>({
        // defaultValues: {},
        // mode: 'onChange',
    })

    const [focusedField, setFocusedField] = useState<string | null>(null)

    // Auto-focus first field on mount
    useEffect(() => {
        const fieldNames = Object.keys(methods.getValues())
        if (fieldNames.length > 0) {
            logger.log(`focusing `, fieldNames[0])
            setFocusedField(fieldNames[0])
        } else {
            logger.log(`no fields to focus in form`)
        }
    }, [])

    // Get focus state and dialog
    const inFocus = useIsInFocus()
    const dialog = useDialog()

    // Handle Tab/Shift+Tab and arrow key navigation
    useKeyboard((evt) => {
        // Only handle keyboard events when form is in focus
        if (!inFocus) return

        const fieldNames = Object.keys(methods.getValues())
        if (fieldNames.length === 0) return

        const currentIndex = focusedField
            ? fieldNames.indexOf(focusedField)
            : -1
        let nextIndex: number | null = null

        if (evt.name === 'tab') {
            if (evt.shift) {
                // Shift+Tab: go to previous field
                nextIndex =
                    currentIndex > 0 ? currentIndex - 1 : fieldNames.length - 1
            } else {
                // Tab: go to next field
                nextIndex =
                    currentIndex < fieldNames.length - 1 ? currentIndex + 1 : 0
            }
        } else if (evt.name === 'up') {
            // Arrow up: go to previous field
            nextIndex =
                currentIndex > 0 ? currentIndex - 1 : fieldNames.length - 1
        } else if (evt.name === 'down') {
            // Arrow down: go to next field
            nextIndex =
                currentIndex < fieldNames.length - 1 ? currentIndex + 1 : 0
        }

        if (nextIndex !== null) {
            const nextFieldName = fieldNames[nextIndex]
            if (nextFieldName) {
                // Just update the focused field in context
                setFocusedField(nextFieldName)
            }
        } else if (evt.name === 'k' && evt.ctrl && props.actions) {
            // Ctrl+K shows actions
            dialog.push(
                <FormSubmitContext.Provider value={submitContextValue}>
                    {props.actions}
                </FormSubmitContext.Provider>,
                'bottom-right',
            )
        } else if (evt.name === 'return' && evt.meta && props.actions) {
            // Cmd+Return also shows actions (consistent with List)
            dialog.push(
                <FormSubmitContext.Provider value={submitContextValue}>
                    {props.actions}
                </FormSubmitContext.Provider>,
                'bottom-right',
            )
        }
    })

    const submitContextValue: FormSubmitContextValue = {
        getFormValues: () => methods.getValues(),
    }

    return (
        <FormProvider {...methods}>
            <FormSubmitContext.Provider value={submitContextValue}>
                <FocusContext.Provider
                    value={{ focusedField, setFocusedField }}
                >
                    <box flexDirection='column'>
                        {props.children}
                        <FormFooter />
                    </box>
                </FocusContext.Provider>
            </FormSubmitContext.Provider>
        </FormProvider>
    )
}) as FormType

// Import and assign components after Form is defined
import { TextField } from './text-field'
import { PasswordField } from './password-field'
import { TextArea } from './text-area'
import { Checkbox } from './checkbox'
import { Dropdown } from './dropdown'
import { DatePicker } from './date-picker'
import { Separator } from './separator'
import { Description } from './description'

Form.TextField = TextField
Form.PasswordField = PasswordField
Form.TextArea = TextArea
Form.Checkbox = Checkbox
Form.Dropdown = Dropdown
Form.DatePicker = DatePicker
Form.TagPicker = null // TODO: implement
Form.FilePicker = null // TODO: implement
Form.Separator = Separator
Form.Description = Description
