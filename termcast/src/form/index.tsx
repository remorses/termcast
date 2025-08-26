import React, {
    createContext,
    useContext,
    useState,
    useRef,
    useEffect,
    Children,
    isValidElement,
    cloneElement,
} from 'react'
import { useKeyboard } from '@opentui/react'
import { ActionPanel } from '@termcast/api/src/actions'
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
} from '@termcast/api/src/form/types'

export * from '@termcast/api/src/form/types'

interface FormContextValue {
    values: FormValues
    setFieldValue: (id: string, value: any) => void
    getFieldValue: (id: string) => any
    registerField: (id: string, ref: FormItemRef) => void
    unregisterField: (id: string) => void
    focusedField: string | null
    setFocusedField: (id: string | null) => void
}

const FormContext = createContext<FormContextValue | null>(null)

export const useFormContext = () => {
    const context = useContext(FormContext)
    if (!context) {
        throw new Error('Form components must be used within a Form')
    }
    return context
}

import type {
    TextFieldProps,
    TextFieldRef,
} from '@termcast/api/src/form/text-field'
import type {
    PasswordFieldProps,
    PasswordFieldRef,
} from '@termcast/api/src/form/password-field'
import type {
    TextAreaProps,
    TextAreaRef,
} from '@termcast/api/src/form/text-area'
import type {
    CheckboxProps,
    CheckboxRef,
} from '@termcast/api/src/form/checkbox'
import type {
    DropdownProps,
    DropdownRef,
    DropdownItemProps,
    DropdownSectionProps,
} from '@termcast/api/src/form/dropdown'
import type {
    DatePickerProps,
    DatePickerRef,
    DatePickerType as DatePickerEnum,
} from '@termcast/api/src/form/date-picker'
import type { DescriptionProps } from '@termcast/api/src/form/description'

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
    const [values, setValues] = useState<FormValues>({})
    const [focusedField, setFocusedField] = useState<string | null>(null)
    const fieldRefs = useRef<Map<string, FormItemRef>>(new Map())
    const fieldOrder = useRef<string[]>([])

    const setFieldValue = (id: string, value: any) => {
        setValues((prev) => ({ ...prev, [id]: value }))
    }

    const getFieldValue = (id: string) => {
        return values[id]
    }

    const registerField = (id: string, ref: FormItemRef) => {
        fieldRefs.current.set(id, ref)
        if (!fieldOrder.current.includes(id)) {
            fieldOrder.current.push(id)
        }
        // Auto-focus first field
        if (fieldOrder.current.length === 1 && !focusedField) {
            setFocusedField(id)
            setTimeout(() => ref.focus(), 0)
        }
    }

    const unregisterField = (id: string) => {
        fieldRefs.current.delete(id)
        fieldOrder.current = fieldOrder.current.filter((fid) => fid !== id)
    }

    const handleSubmit = () => {
        if (props.onSubmit) {
            props.onSubmit(values)
        }
    }

    // Handle Tab and Shift+Tab navigation
    useKeyboard((evt) => {
        if (evt.name === 'tab') {
            const currentIndex = focusedField
                ? fieldOrder.current.indexOf(focusedField)
                : -1
            let nextIndex: number

            if (evt.shift) {
                // Shift+Tab: go to previous field
                nextIndex =
                    currentIndex > 0
                        ? currentIndex - 1
                        : fieldOrder.current.length - 1
            } else {
                // Tab: go to next field
                nextIndex =
                    currentIndex < fieldOrder.current.length - 1
                        ? currentIndex + 1
                        : 0
            }

            const nextFieldId = fieldOrder.current[nextIndex]
            if (nextFieldId) {
                const nextRef = fieldRefs.current.get(nextFieldId)
                if (nextRef) {
                    setFocusedField(nextFieldId)
                    nextRef.focus()
                }
            }
        } else if (evt.name === 'enter' && evt.meta) {
            // Cmd+Enter submits the form
            handleSubmit()
        }
    })

    return (
        <FormContext.Provider
            value={{
                values,
                setFieldValue,
                getFieldValue,
                registerField,
                unregisterField,
                focusedField,
                setFocusedField,
            }}
        >
            <box flexDirection='column'>{props.children}</box>
        </FormContext.Provider>
    )
}) as FormType
