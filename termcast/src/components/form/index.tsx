import React, {
  useState,
  createContext,
  useContext,
  useLayoutEffect,
  useRef,
  useEffect,
} from 'react'
import { useKeyboard } from '@opentui/react'
import { useForm, FormProvider } from 'react-hook-form'
import { ActionPanel } from 'termcast/src/components/actions'
import { logger } from 'termcast/src/logger'
import { InFocus, useIsInFocus } from 'termcast/src/internal/focus-context'
import { useDialog } from 'termcast/src/internal/dialog'
import { Theme } from 'termcast/src/theme'
import { useStore } from 'termcast/src/state'
import {
  TextAttributes,
  ScrollBoxRenderable,
  BoxRenderable,
} from '@opentui/core'

import {
  createDescendants,
  DescendantContextType,
} from 'termcast/src/descendants'
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
  LinkAccessoryProps,
} from './types'
import { LoadingBar } from 'termcast/src/components/loading-bar'
import { useNavigationPending } from 'termcast/src/internal/navigation'
import { FORM_MAX_WIDTH } from './description'
import { ScrollBox } from 'termcast/src/internal/scrollbox'

export * from './types'
export { useFormContext } from 'react-hook-form'

// Form field descendant type - stores element ref for scrolling
interface FormFieldDescendant {
  id: string
  elementRef?: BoxRenderable | null
}

// Create descendants for form fields
const {
  DescendantsProvider: FormFieldDescendantsProvider,
  useDescendants: useFormFieldDescendants,
  useDescendant: useFormFieldDescendant,
} = createDescendants<FormFieldDescendant>()

export { useFormFieldDescendant }

// Context to provide scrollbox ref and descendants to form fields
interface FormScrollContextValue {
  scrollBoxRef: React.RefObject<ScrollBoxRenderable | null>
  descendantsContext: DescendantContextType<FormFieldDescendant>
}

const FormScrollContext = createContext<FormScrollContextValue | null>(null)

export const useFormScrollContext = () => {
  return useContext(FormScrollContext)
}

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

function FormFooter(): any {
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
        ctrl ↵
      </text>
      <text fg={Theme.textMuted}> submit</text>
      <text fg={Theme.text} attributes={TextAttributes.BOLD}>
        {'   '}tab
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
  LinkAccessory: (props: LinkAccessoryProps) => any
}

export const Form: FormType = ((props) => {
  const { navigationTitle, isLoading, searchBarAccessory } = props
  const methods = useForm<FormValues>({
    // defaultValues: {},
    // mode: 'onChange',
  })

  const [focusedField, setFocusedFieldRaw] = useState<string | null>(null)
  const navigationPending = useNavigationPending()

  const scrollBoxRef = useRef<ScrollBoxRenderable>(null)
  const descendantsContext = useFormFieldDescendants()

  // Helper to get sorted field IDs
  const getFieldIds = () => {
    return Object.values(descendantsContext.map.current)
      .filter((item) => item.index !== -1 && item.props?.id)
      .sort((a, b) => a.index - b.index)
      .map((item) => item.props!.id)
  }

  const scrollToField = (fieldId: string) => {
    const scrollBox = scrollBoxRef.current
    if (!scrollBox) return

    // Find field in descendants map by matching props.id
    const field = Object.values(descendantsContext.map.current).find(
      (item) => item.props?.id === fieldId,
    )
    const elementRef = field?.props?.elementRef
    if (!elementRef) return

    const contentY = scrollBox.content?.y || 0
    const viewportHeight = scrollBox.viewport?.height || 10

    // Access current position from the BoxRenderable ref
    const itemTop = elementRef.y - contentY

    // Scroll so the top of the item is centered in the viewport
    const targetScrollTop = itemTop - viewportHeight / 2
    scrollBox.scrollTo(Math.max(0, targetScrollTop))
  }

  const setFocusedField = (id: string | null) => {
    setFocusedFieldRaw(id)
    if (id) {
      scrollToField(id)
    }
  }

  // Focus first field helper
  const focusFirstField = () => {
    const fieldIds = getFieldIds()
    if (fieldIds.length > 0) {
      logger.log(`focusing first field:`, fieldIds[0])
      setFocusedField(fieldIds[0])
      return true
    }
    return false
  }

  // Focus last field helper
  const focusLastField = () => {
    const fieldIds = getFieldIds()
    if (fieldIds.length > 0) {
      logger.log(`focusing last field:`, fieldIds[fieldIds.length - 1])
      setFocusedField(fieldIds[fieldIds.length - 1])
      return true
    }
    return false
  }

  // Auto-focus first field when descendants become available
  // Runs on every render until a field is focused (handles async loading)
  useEffect(() => {
    if (focusedField) return

    const fieldIds = getFieldIds()
    if (fieldIds.length > 0) {
      logger.log(`auto-focusing first field:`, fieldIds[0])
      setFocusedFieldRaw(fieldIds[0])
    }
  })

  // Get focus state and dialog
  const inFocus = useIsInFocus()
  const dialog = useDialog()

  // Handle action keys, tab navigation, and page scrolling
  useKeyboard((evt) => {
    // Only handle keyboard events when form is in focus
    if (!inFocus) return

    // Tab navigation at Form level - handles case when no field is focused
    // or navigates between fields
    if (evt.name === 'tab') {
      if (!focusedField) {
        // No field focused yet - focus first or last based on shift
        if (evt.shift) {
          focusLastField()
        } else {
          focusFirstField()
        }
      } else {
        // A field is focused - navigate to next/previous
        const fieldIds = getFieldIds()
        const currentIndex = fieldIds.indexOf(focusedField)
        if (evt.shift) {
          // Shift+Tab - go to previous
          if (currentIndex > 0) {
            setFocusedField(fieldIds[currentIndex - 1])
          } else {
            setFocusedField(fieldIds[fieldIds.length - 1])
          }
        } else {
          // Tab - go to next
          if (currentIndex < fieldIds.length - 1) {
            setFocusedField(fieldIds[currentIndex + 1])
          } else {
            setFocusedField(fieldIds[0])
          }
        }
      }
      return
    }

    // Page up/down scrolling
    if (evt.name === 'pageup' || evt.name === 'pagedown') {
      const scrollBox = scrollBoxRef.current
      if (!scrollBox) return

      const viewportHeight = scrollBox.viewport?.height || 10
      const currentScrollTop = scrollBox.scrollTop || 0
      const scrollAmount = viewportHeight - 2 // Leave some overlap

      if (evt.name === 'pageup') {
        scrollBox.scrollTo(Math.max(0, currentScrollTop - scrollAmount))
      } else {
        scrollBox.scrollTo(currentScrollTop + scrollAmount)
      }
      return
    }

    if (evt.name === 'k' && evt.ctrl && props.actions) {
      // Ctrl+K shows actions (always show sheet)
      dialog.push(
        <FormSubmitContext.Provider value={submitContextValue}>
          {props.actions}
        </FormSubmitContext.Provider>,
        'bottom-right',
      )
    } else if (evt.name === 'return' && evt.ctrl && props.actions) {
      // Ctrl+Return executes first action directly
      useStore.setState({ shouldAutoExecuteFirstAction: true })
      dialog.push(
        <FormSubmitContext.Provider value={submitContextValue}>
          {props.actions}
        </FormSubmitContext.Provider>,
        'bottom-right',
      )
    } else if (evt.name === 'return' && evt.meta && props.actions) {
      // Cmd+Return also executes first action directly
      useStore.setState({ shouldAutoExecuteFirstAction: true })
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

  const scrollContextValue: FormScrollContextValue = {
    scrollBoxRef,
    descendantsContext,
  }

  return (
    <FormProvider {...methods}>
      <FormSubmitContext.Provider value={submitContextValue}>
        <FormScrollContext.Provider value={scrollContextValue}>
          <FocusContext.Provider value={{ focusedField, setFocusedField }}>
            <box flexDirection='row' flexGrow={1} justifyContent='center'>
              <box flexGrow={0} flexDirection='column'>
                <ScrollBox
                  ref={scrollBoxRef}
                  flexGrow={1}
                  style={{
                    rootOptions: {
                      maxWidth: FORM_MAX_WIDTH,
                    },
                    contentOptions: {
                      justifyContent: 'center',
                    },
                  }}
                >
                  {/* Navigation header with title, loading bar, and accessory */}

                  <box
                    border={false}
                    style={{
                      flexShrink: 0,
                      flexDirection: 'row',
                      paddingBottom: 1,
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 3,
                    }}
                  >
                    <box overflow='hidden'>
                      <LoadingBar
                        title={navigationTitle || ''}
                        isLoading={isLoading || navigationPending}
                      />
                    </box>
                    {searchBarAccessory}
                  </box>

                  <FormFieldDescendantsProvider value={descendantsContext}>
                    {props.children}
                    <FormEnd />
                  </FormFieldDescendantsProvider>
                </ScrollBox>
                <FormFooter />
              </box>
            </box>
          </FocusContext.Provider>
        </FormScrollContext.Provider>
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

// LinkAccessory component - shows a link in the navigation bar
function LinkAccessory(props: LinkAccessoryProps): any {
  return (
    <box
      style={{
        flexShrink: 0,
        maxWidth: '50%',
        overflow: 'hidden',
        paddingRight: 1,
      }}
    >
      <text
        fg={Theme.textMuted}
        attributes={TextAttributes.UNDERLINE}
        wrapMode='none'
      >
        {props.text}
      </text>
    </box>
  )
}

Form.LinkAccessory = LinkAccessory
