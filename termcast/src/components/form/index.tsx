import React, { useState, createContext, useContext, useRef } from 'react'
import { useKeyboard, flushSync, extend } from '@opentui/react'
import { useForm, FormProvider } from 'react-hook-form'
import { ActionPanel } from 'termcast/src/components/actions'
import { logger } from 'termcast/src/logger'
import { InFocus, useIsInFocus } from 'termcast/src/internal/focus-context'
import { useDialog } from 'termcast/src/internal/dialog'
import { useTheme } from 'termcast/src/theme'
import { useStore } from 'termcast/src/state'
import { Footer } from 'termcast/src/components/footer'
import {
  TextAttributes,
  ScrollBoxRenderable,
  BoxRenderable,
  Renderable,
  type RenderContext,
  type BoxOptions,
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

// ─────────────────────────────────────────────────────────────────────────────
// Helper to find parent renderable of specific type
// ─────────────────────────────────────────────────────────────────────────────

function findParent<T>(
  node: Renderable,
  type: abstract new (...args: any[]) => T,
): T | undefined {
  let current: Renderable | null = node.parent
  while (current) {
    if (current instanceof type) {
      return current
    }
    current = current.parent
  }
  return undefined
}

// ─────────────────────────────────────────────────────────────────────────────
// FormRenderable - owns field registry, focus state, scroll
// ─────────────────────────────────────────────────────────────────────────────

interface RegisteredField {
  id: string
  elementRef: BoxRenderable | null
  order: number
}

interface FormRenderableOptions extends BoxOptions {}

class FormRenderable extends BoxRenderable {
  // Field registry
  private fields = new Map<string, RegisteredField>()

  // Focus state
  private _focusedFieldId: string | null = null

  // Callback to notify React of focus changes
  public onFocusChange?: (fieldId: string | null) => void

  // UI components
  private scrollBox: ScrollBoxRenderable
  private contentBox: BoxRenderable

  constructor(ctx: RenderContext, options: FormRenderableOptions) {
    super(ctx, {
      ...options,
      flexDirection: 'row',
      flexGrow: 1,
      paddingTop: 2,
      justifyContent: 'center',
    })

    // Outer scrollbox
    this.scrollBox = new ScrollBoxRenderable(ctx, {
      maxWidth: FORM_MAX_WIDTH,
    })
    super.add(this.scrollBox)

    // Content box inside scrollbox
    this.contentBox = new BoxRenderable(ctx, {
      flexDirection: 'column',
      justifyContent: 'center',
    })
    this.scrollBox.add(this.contentBox)
  }

  // React children go into content box
  add(child: Renderable, index?: number): number {
    return this.contentBox.add(child, index)
  }

  insertBefore(child: unknown, anchor?: unknown): number {
    return this.contentBox.insertBefore(child, anchor)
  }

  remove(id: string): void {
    this.contentBox.remove(id)
  }

  // --- Field Registration ---

  registerField(id: string, wrapper: BoxRenderable): void {
    // Don't store registration order - we'll sort by y-position instead
    this.fields.set(id, { id, elementRef: wrapper, order: 0 })

    // Auto-focus first field when no field is focused yet
    if (this._focusedFieldId === null) {
      this.focusField(id)
    }
  }

  unregisterField(id: string): void {
    this.fields.delete(id)
  }

  // Get fields sorted by y-position (visual order)
  private getFieldOrder(): string[] {
    return Array.from(this.fields.values())
      .sort((a, b) => {
        const aY = a.elementRef?.y ?? 0
        const bY = b.elementRef?.y ?? 0
        return aY - bY
      })
      .map((f) => f.id)
  }

  // --- Focus Management ---

  get focusedFieldId(): string | null {
    return this._focusedFieldId
  }

  focusField(id: string): void {
    if (!this.fields.has(id)) return
    this._focusedFieldId = id
    this.scrollToField(id)
    this.onFocusChange?.(id)
  }

  focusNext(): void {
    const fieldOrder = this.getFieldOrder()
    if (fieldOrder.length === 0) return
    const idx = this._focusedFieldId
      ? fieldOrder.indexOf(this._focusedFieldId)
      : -1
    const nextIdx = (idx + 1) % fieldOrder.length
    this.focusField(fieldOrder[nextIdx])
  }

  focusPrev(): void {
    const fieldOrder = this.getFieldOrder()
    if (fieldOrder.length === 0) return
    const idx = this._focusedFieldId
      ? fieldOrder.indexOf(this._focusedFieldId)
      : 0
    const prevIdx = (idx - 1 + fieldOrder.length) % fieldOrder.length
    this.focusField(fieldOrder[prevIdx])
  }

  private scrollToField(id: string): void {
    const field = this.fields.get(id)
    if (!field?.elementRef) return

    const itemY = field.elementRef.y
    const scrollBoxY = this.scrollBox.content?.y || 0
    const viewportHeight = this.scrollBox.viewport?.height || 10

    const relativeY = itemY - scrollBoxY
    const targetScrollTop = relativeY - Math.floor(viewportHeight / 2)
    this.scrollBox.scrollTop = Math.max(0, targetScrollTop)
  }

  // Page scroll support
  pageUp(): void {
    const viewportHeight = this.scrollBox.viewport?.height || 10
    const currentScrollTop = this.scrollBox.scrollTop || 0
    const scrollAmount = viewportHeight - 2
    this.scrollBox.scrollTop = Math.max(0, currentScrollTop - scrollAmount)
  }

  pageDown(): void {
    const viewportHeight = this.scrollBox.viewport?.height || 10
    const currentScrollTop = this.scrollBox.scrollTop || 0
    const scrollAmount = viewportHeight - 2
    this.scrollBox.scrollTop = currentScrollTop + scrollAmount
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// FormFieldWrapperRenderable - thin wrapper that self-registers via onLifecyclePass
// ─────────────────────────────────────────────────────────────────────────────

interface FormFieldWrapperOptions extends BoxOptions {
  fieldId?: string
}

class FormFieldWrapperRenderable extends BoxRenderable {
  private parentForm?: FormRenderable

  // Set by React after constructor
  public fieldId = ''

  constructor(ctx: RenderContext, options: FormFieldWrapperOptions) {
    super(ctx, { ...options, flexDirection: 'column' })

    // SYNC registration when added to tree
    this.onLifecyclePass = () => {
      if (!this.parentForm && this.fieldId) {
        this.parentForm = findParent(this, FormRenderable)
        this.parentForm?.registerField(this.fieldId, this)
      }
    }
  }
}

// Register with opentui
extend({
  'termcast-form': FormRenderable,
  'termcast-form-field-wrapper': FormFieldWrapperRenderable,
})

// ─────────────────────────────────────────────────────────────────────────────
// FormRenderableContext - exposes formRef for imperative access
// ─────────────────────────────────────────────────────────────────────────────

interface FormRenderableContextValue {
  formRef: React.RefObject<FormRenderable | null>
}

const FormRenderableContext = createContext<FormRenderableContextValue | null>(
  null,
)

export const useFormRenderable = () => {
  const ctx = useContext(FormRenderableContext)
  if (!ctx) {
    throw new Error('Form components must be used within a Form')
  }
  return ctx
}

// ─────────────────────────────────────────────────────────────────────────────
// Legacy descendants (kept for backward compatibility during migration)
// ─────────────────────────────────────────────────────────────────────────────

// Form field descendant type - stores element ref for scrolling
// Note: elementRef is a React ref object so we can access .current.y at navigation time
// (not the element directly, which would be null at registration time)
interface FormFieldDescendant {
  id: string
  elementRef?: React.RefObject<BoxRenderable | null> | BoxRenderable | null
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

// Context for managing focused field and loading state
interface FocusContextValue {
  focusedField: string | null
  setFocusedField: (id: string | null) => void
  isLoading: boolean
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
  const theme = useTheme()
  const hasToast = useStore((s) => s.toast !== null)

  const content = hasToast ? null : (
    <box style={{ flexDirection: 'row', gap: 3 }}>
      <box style={{ flexDirection: 'row', gap: 1 }}>
        <text flexShrink={0} fg={theme.text} attributes={TextAttributes.BOLD}>
          ctrl ↵
        </text>
        <text flexShrink={0} fg={theme.textMuted}>submit</text>
      </box>
      <box style={{ flexDirection: 'row', gap: 1 }}>
        <text flexShrink={0} fg={theme.text} attributes={TextAttributes.BOLD}>
          tab
        </text>
        <text flexShrink={0} fg={theme.textMuted}>navigate</text>
      </box>
      <box style={{ flexDirection: 'row', gap: 1 }}>
        <text flexShrink={0} fg={theme.text} attributes={TextAttributes.BOLD}>
          ^k
        </text>
        <text flexShrink={0} fg={theme.textMuted}>actions</text>
      </box>
    </box>
  )

  return <Footer>{content}</Footer>
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

  const formRef = useRef<FormRenderable>(null)
  const [focusedField, setFocusedFieldRaw] = useState<string | null>(null)
  const navigationPending = useNavigationPending()

  // Legacy: keep descendantsContext for backward compatibility with existing field components
  const descendantsContext = useFormFieldDescendants()
  const scrollBoxRef = useRef<ScrollBoxRenderable>(null)

  // Get focus state and dialog
  const inFocus = useIsInFocus()
  const dialog = useDialog()

  // Handle action keys, tab navigation, and page scrolling
  useKeyboard((evt) => {
    if (!inFocus) return

    // Tab navigation via renderable
    if (evt.name === 'tab') {
      if (evt.shift) {
        formRef.current?.focusPrev()
      } else {
        formRef.current?.focusNext()
      }
      return
    }

    // Page up/down scrolling via renderable
    if (evt.name === 'pageup') {
      formRef.current?.pageUp()
      return
    }
    if (evt.name === 'pagedown') {
      formRef.current?.pageDown()
      return
    }

    if (evt.name === 'k' && evt.ctrl) {
      // Ctrl+K shows actions (always show panel, even without actions)
      dialog.pushActions(
        <FormSubmitContext.Provider value={submitContextValue}>
          {props.actions || <ActionPanel />}
        </FormSubmitContext.Provider>,
        'center',
      )
    } else if (evt.name === 'return' && evt.ctrl && props.actions) {
      // Ctrl+Return executes first action directly
      useStore.setState({ shouldAutoExecuteFirstAction: true })
      dialog.pushActions(
        <FormSubmitContext.Provider value={submitContextValue}>
          {props.actions}
        </FormSubmitContext.Provider>,
        'center',
      )
    } else if (evt.name === 'return' && evt.meta && props.actions) {
      // Cmd+Return also executes first action directly
      useStore.setState({ shouldAutoExecuteFirstAction: true })
      dialog.pushActions(
        <FormSubmitContext.Provider value={submitContextValue}>
          {props.actions}
        </FormSubmitContext.Provider>,
        'center',
      )
    }
  })

  const submitContextValue: FormSubmitContextValue = {
    getFormValues: () => methods.getValues(),
  }

  // Legacy scroll context for backward compatibility
  const scrollContextValue: FormScrollContextValue = {
    scrollBoxRef,
    descendantsContext,
  }

  // Callback ref to set up onFocusChange when formRef is available
  const handleFormRef = React.useCallback((ref: FormRenderable | null) => {
    ;(formRef as React.MutableRefObject<FormRenderable | null>).current = ref
    if (ref) {
      ref.onFocusChange = (id) => {
        flushSync(() => {
          setFocusedFieldRaw(id)
        })
      }
    }
  }, [])

  return (
    <FormProvider {...methods}>
      <FormSubmitContext.Provider value={submitContextValue}>
        <FormRenderableContext.Provider value={{ formRef }}>
          <FormScrollContext.Provider value={scrollContextValue}>
            <FocusContext.Provider
              value={{
                focusedField,
                setFocusedField: (id) => {
                  formRef.current?.focusField(id!)
                },
                isLoading: isLoading || false,
              }}
            >
              <termcast-form ref={handleFormRef}>
                <FormFieldDescendantsProvider value={descendantsContext}>
                  {props.children}
                  <FormEnd />
                </FormFieldDescendantsProvider>
              </termcast-form>
              <FormFooter />
            </FocusContext.Provider>
          </FormScrollContext.Provider>
        </FormRenderableContext.Provider>
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
  const theme = useTheme()
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
        fg={theme.textMuted}
        attributes={TextAttributes.UNDERLINE}
        wrapMode='none'
      >
        {props.text}
      </text>
    </box>
  )
}

Form.LinkAccessory = LinkAccessory
