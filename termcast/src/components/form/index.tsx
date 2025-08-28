import React, { useState, createContext, useContext, useEffect } from 'react'
import { useKeyboard } from '@opentui/react'
import { useForm, FormProvider } from 'react-hook-form'
import { ActionPanel } from '@termcast/api/src/components/actions'
import { logger } from '@termcast/api/src/logger'
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


import type {
    TextFieldProps,
    TextFieldRef,
} from './text-field'
import type {
    PasswordFieldProps,
    PasswordFieldRef,
} from './password-field'
import type {
    TextAreaProps,
    TextAreaRef,
} from './text-area'
import type {
    CheckboxProps,
    CheckboxRef,
} from './checkbox'
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
        defaultValues: {},
        mode: 'onChange',
    })

    const [focusedField, setFocusedField] = useState<string | null>(null)

    // Auto-focus first field on mount
    useEffect(() => {
        const fieldNames = Object.keys(methods.getValues())
        if (fieldNames.length > 0 && !focusedField) {
            setFocusedField(fieldNames[0])
        }
    }, [])

    const handleSubmit = methods.handleSubmit((data) => {
        if (props.onSubmit) {
            props.onSubmit(data)
        }
    })

    // Handle Tab/Shift+Tab and arrow key navigation
    useKeyboard((evt) => {
        const fieldNames = Object.keys(methods.getValues())
        if (fieldNames.length === 0) return

        const currentIndex = focusedField ? fieldNames.indexOf(focusedField) : -1
        let nextIndex: number | null = null

        if (evt.name === 'tab') {
            if (evt.shift) {
                // Shift+Tab: go to previous field
                nextIndex = currentIndex > 0
                    ? currentIndex - 1
                    : fieldNames.length - 1
            } else {
                // Tab: go to next field
                nextIndex = currentIndex < fieldNames.length - 1
                    ? currentIndex + 1
                    : 0
            }
        } else if (evt.name === 'up') {
            // Arrow up: go to previous field
            nextIndex = currentIndex > 0
                ? currentIndex - 1
                : fieldNames.length - 1
        } else if (evt.name === 'down') {
            // Arrow down: go to next field
            nextIndex = currentIndex < fieldNames.length - 1
                ? currentIndex + 1
                : 0
        }

        if (nextIndex !== null) {
            const nextFieldName = fieldNames[nextIndex]
            if (nextFieldName) {
                // Just update the focused field in context
                setFocusedField(nextFieldName)
            }
        } else if (evt.name === 'enter' && evt.meta) {
            // Cmd+Enter submits the form
            handleSubmit()
        }
    })

    return (
        <FormProvider {...methods}>
            <FocusContext.Provider value={{ focusedField, setFocusedField }}>
                <box flexDirection='column'>{props.children}</box>
            </FocusContext.Provider>
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
