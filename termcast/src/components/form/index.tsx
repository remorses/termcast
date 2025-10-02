import React, { useState, createContext, useContext, useEffect } from 'react'
import { useKeyboard } from '@opentui/react'
import { useForm, FormProvider } from 'react-hook-form'
import { ActionPanel } from 'termcast/src/components/actions'
import { logger } from 'termcast/src/logger'
import { InFocus, useIsInFocus } from 'termcast/src/internal/focus-context'
import { useDialog } from 'termcast/src/internal/dialog'
import { Theme } from 'termcast/src/theme'
import { TextAttributes } from '@opentui/core'
import { useStore } from 'termcast/src/state'
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
import type { TagPickerType } from './tagpicker'
import type { DescriptionProps } from './description'
import type { FilePickerProps, FilePickerRef } from './file-picker'

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
  TagPicker: TagPickerType
  FilePicker: (props: FilePickerProps) => any
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

  // Handle action key navigation only
  useKeyboard((evt) => {
    // Only handle keyboard events when form is in focus
    if (!inFocus) return

    if (evt.name === 'k' && evt.ctrl && props.actions) {
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
        <FocusContext.Provider value={{ focusedField, setFocusedField }}>
          <box flexDirection='column'>
            {props.children}
            <FormEnd />
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
import { TagPicker } from './tagpicker'
import { Separator } from './separator'
import { Description } from './description'
import { FormEnd } from './form-end'
import { FilePicker } from './file-picker'

Form.TextField = TextField as any
Form.PasswordField = PasswordField as any
Form.TextArea = TextArea as any
Form.Checkbox = Checkbox as any
Form.Dropdown = Dropdown
Form.DatePicker = DatePicker
Form.TagPicker = TagPicker
Form.FilePicker = FilePicker
Form.Separator = Separator
Form.Description = Description
