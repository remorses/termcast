/**
 * Custom Renderable Form Example
 *
 * Demonstrates hybrid pattern for building forms:
 * - Form container = custom renderable (owns focus, navigation, scroll, RHF methods)
 * - Form fields = React components wrapped in self-registering renderables
 * - Tests dynamic field registration via timeout
 *
 * ## Architecture
 *
 * CustomFormRenderable (custom renderable)
 * ├── owns: react-hook-form methods, focusedFieldId, field registry, scrollbox
 * ├── methods: registerField(), focusField(), focusNext(), focusPrev()
 * │
 * └── CustomFormFieldWrapperRenderable (thin wrapper)
 *     ├── self-registers via onLifecyclePass (SYNC - no timing issues)
 *     └── React children (label, textarea) rendered inside
 *
 * ## Key Patterns
 *
 * 1. Wrapper renderable self-registers synchronously when added to tree
 * 2. No useEffect needed for registration - onLifecyclePass handles it
 * 3. Focus state in parent, checked in children each render
 * 4. react-hook-form integration via setRHFMethods()
 * 5. Tab navigation via parent methods (focusNext/focusPrev)
 */

import {
  Renderable,
  BoxRenderable,
  TextRenderable,
  ScrollBoxRenderable,
  TextareaRenderable,
  OptimizedBuffer,
  type RenderContext,
  type BoxOptions,
} from '@opentui/core'
import { extend, useKeyboard } from '@opentui/react'
import { useIsInFocus } from 'termcast/src/internal/focus-context'
import React, { useRef, createContext, useContext, useLayoutEffect, useState, useEffect } from 'react'

// Generic helper to find parent of specific type by traversing up
function findParent<T>(node: Renderable, type: abstract new (...args: any[]) => T): T | undefined {
  let current: Renderable | null = node.parent
  while (current) {
    if (current instanceof type) {
      return current
    }
    current = current.parent
  }
  return undefined
}
import { renderWithProviders } from '../../utils'
import { useForm, FormProvider, useFormContext, type UseFormReturn } from 'react-hook-form'
import { Theme } from 'termcast/src/theme'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface RegisteredField {
  id: string
  elementRef: BoxRenderable | null
  order: number // registration order for navigation
}

interface CustomFormOptions extends BoxOptions {
  // Props set by React after constructor
}

// ─────────────────────────────────────────────────────────────────────────────
// CustomFormRenderable
// ─────────────────────────────────────────────────────────────────────────────

class CustomFormRenderable extends BoxRenderable {
  // RHF integration - store methods object
  private rhfMethods: UseFormReturn<Record<string, unknown>> | null = null

  // Field registry - replaces useDescendants
  private fields = new Map<string, RegisteredField>()
  private fieldOrder: string[] = [] // ordered list for tab navigation
  private nextOrder = 0

  // Focus state
  private _focusedFieldId: string | null = null

  // UI components
  private scrollBox: ScrollBoxRenderable
  private statusText: TextRenderable

  constructor(ctx: RenderContext, options: CustomFormOptions) {
    super(ctx, { ...options, flexDirection: 'column' })

    this.scrollBox = new ScrollBoxRenderable(ctx, { flexGrow: 1 })
    this.statusText = new TextRenderable(ctx, { content: '0 fields', fg: Theme.textMuted })

    super.add(this.scrollBox)
    super.add(this.statusText)
  }

  // React children go to scrollbox
  add(child: Renderable, index?: number): number {
    return this.scrollBox.add(child, index)
  }

  // React reconciler calls insertBefore when a new child must be inserted
  // before an existing sibling. Example: delayed field inserted before "Field 1"
  // Without this, dynamic children cause "Anchor does not exist" error
  insertBefore(child: unknown, anchor?: unknown): number {
    return this.scrollBox.insertBefore(child, anchor)
  }

  // Delegate remove to scrollbox
  remove(id: string): void {
    this.scrollBox.remove(id)
  }

  // --- RHF Integration ---

  setRHFMethods(methods: UseFormReturn<Record<string, unknown>>) {
    this.rhfMethods = methods
  }

  getValues() {
    return this.rhfMethods?.getValues() ?? {}
  }

  setValue(name: string, value: unknown) {
    this.rhfMethods?.setValue(name, value)
  }

  // --- Field Registration ---
  // Called by wrapper renderables via onLifecyclePass (SYNC)

  registerField(id: string, wrapper: BoxRenderable): void {
    this.fields.set(id, { id, elementRef: wrapper, order: this.nextOrder++ })
    this.updateFieldOrder()
    
    // Update status text immediately
    this.statusText.content = `${this.fieldOrder.length} fields registered`
    this.requestRender()

    // Auto-focus first field
    if (this.fieldOrder.length === 1 && !this._focusedFieldId) {
      this._focusedFieldId = id
      if (wrapper instanceof CustomFormFieldWrapperRenderable) {
        wrapper.setFocused(true)
      }
    }
  }

  unregisterField(id: string) {
    this.fields.delete(id)
    this.updateFieldOrder()
    this.statusText.content = `${this.fieldOrder.length} fields registered`
    this.requestRender()
  }

  private updateFieldOrder() {
    this.fieldOrder = Array.from(this.fields.values())
      .sort((a, b) => a.order - b.order)
      .map((f) => f.id)
  }

  // --- Focus Management ---

  get focusedFieldId() {
    return this._focusedFieldId
  }

  focusField(id: string) {
    if (!this.fields.has(id)) return
    
    // Update focus state on wrappers
    const oldField = this._focusedFieldId ? this.fields.get(this._focusedFieldId) : null
    const newField = this.fields.get(id)
    
    if (oldField?.elementRef instanceof CustomFormFieldWrapperRenderable) {
      oldField.elementRef.setFocused(false)
    }
    if (newField?.elementRef instanceof CustomFormFieldWrapperRenderable) {
      newField.elementRef.setFocused(true)
    }
    
    this._focusedFieldId = id
    this.scrollToField(id)
    this.requestRender()
  }

  focusNext() {
    if (this.fieldOrder.length === 0) return
    const idx = this._focusedFieldId ? this.fieldOrder.indexOf(this._focusedFieldId) : -1
    const nextIdx = (idx + 1) % this.fieldOrder.length
    this.focusField(this.fieldOrder[nextIdx])
  }

  focusPrev() {
    if (this.fieldOrder.length === 0) return
    const idx = this._focusedFieldId ? this.fieldOrder.indexOf(this._focusedFieldId) : 0
    const prevIdx = (idx - 1 + this.fieldOrder.length) % this.fieldOrder.length
    this.focusField(this.fieldOrder[prevIdx])
  }

  private scrollToField(id: string) {
    const field = this.fields.get(id)
    if (!field?.elementRef) return

    const itemY = field.elementRef.y
    const scrollBoxY = this.scrollBox.content.y
    const viewportHeight = this.scrollBox.viewport?.height || 10

    const relativeY = itemY - scrollBoxY
    const targetScrollTop = relativeY - Math.floor(viewportHeight / 2)
    this.scrollBox.scrollTop = Math.max(0, targetScrollTop)
  }

}

// ─────────────────────────────────────────────────────────────────────────────
// CustomFormFieldWrapperRenderable - thin wrapper for sync registration
// ─────────────────────────────────────────────────────────────────────────────

interface CustomFormFieldWrapperOptions extends BoxOptions {
  fieldId?: string
}

class CustomFormFieldWrapperRenderable extends BoxRenderable {
  private parentForm?: CustomFormRenderable
  private focusIndicator: TextRenderable
  private contentBox: BoxRenderable
  private isFocusedField = false
  
  // Set by React after constructor
  public fieldId = ''

  constructor(ctx: RenderContext, options: CustomFormFieldWrapperOptions) {
    // Outer wrapper is a row: [indicator] [content column]
    super(ctx, { ...options, flexDirection: 'row', paddingBottom: 1 })
    
    // Focus indicator - updated by parent form
    this.focusIndicator = new TextRenderable(ctx, { content: '  ', flexShrink: 0 })
    super.add(this.focusIndicator)
    
    // Content box holds React children in a column
    this.contentBox = new BoxRenderable(ctx, { flexDirection: 'column', flexGrow: 1 })
    super.add(this.contentBox)
    
    // SYNC registration when added to tree - no timing issues
    this.onLifecyclePass = () => {
      if (!this.parentForm && this.fieldId) {
        this.parentForm = findParent(this, CustomFormRenderable)
        this.parentForm?.registerField(this.fieldId, this)
      }
    }
  }

  // React children go into the content box
  add(child: Renderable, index?: number): number {
    return this.contentBox.add(child, index)
  }

  // React reconciler calls insertBefore when a new child must be inserted
  // before an existing sibling. Not strictly needed here since wrapper children
  // (title, textarea) are always added in fixed order, but included for safety
  // in case future usage adds dynamic children inside the wrapper
  insertBefore(child: unknown, anchor?: unknown): number {
    return this.contentBox.insertBefore(child, anchor)
  }

  // Called by parent form when focus changes
  setFocused(focused: boolean) {
    if (this.isFocusedField === focused) return
    this.isFocusedField = focused
    this.focusIndicator.content = focused ? '› ' : '  '
    this.focusIndicator.fg = focused ? Theme.primary : undefined
    this.requestRender()
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Register with opentui
// ─────────────────────────────────────────────────────────────────────────────

extend({
  'custom-form': CustomFormRenderable,
  'custom-form-field-wrapper': CustomFormFieldWrapperRenderable,
})

// ─────────────────────────────────────────────────────────────────────────────
// React Context for parent ref
// ─────────────────────────────────────────────────────────────────────────────

interface CustomFormContextValue {
  formRef: React.RefObject<CustomFormRenderable | null>
}

const CustomFormContext = createContext<CustomFormContextValue | null>(null)

function useCustomForm() {
  const ctx = useContext(CustomFormContext)
  if (!ctx) throw new Error('Must be inside CustomForm')
  return ctx.formRef
}

// ─────────────────────────────────────────────────────────────────────────────
// React wrapper component
// ─────────────────────────────────────────────────────────────────────────────

interface CustomFormProps {
  children: React.ReactNode
}

function CustomForm({ children }: CustomFormProps): any {
  const formRef = useRef<CustomFormRenderable>(null)
  const methods = useForm<Record<string, unknown>>()
  const inFocus = useIsInFocus()

  // Pass RHF methods to renderable after mount
  useLayoutEffect(() => {
    if (formRef.current) {
      formRef.current.setRHFMethods(methods)
    }
  }, [methods])

  // Tab navigation
  useKeyboard((evt) => {
    if (!inFocus || !formRef.current) return
    if (evt.name === 'tab') {
      if (evt.shift) {
        formRef.current.focusPrev()
      } else {
        formRef.current.focusNext()
      }
    }
  })

  return (
    <FormProvider {...methods}>
      <CustomFormContext.Provider value={{ formRef }}>
        <custom-form ref={formRef} flexGrow={1}>
          {children}
        </custom-form>
      </CustomFormContext.Provider>
    </FormProvider>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// React TextField component
// ─────────────────────────────────────────────────────────────────────────────

interface TextFieldProps {
  id: string
  title: string
  placeholder?: string
}

function CustomFormTextField({ id, title, placeholder }: TextFieldProps): any {
  const formRef = useCustomForm()
  const inputRef = useRef<TextareaRenderable>(null)
  const { register } = useFormContext()

  // No useEffect needed - wrapper self-registers via onLifecyclePass

  // Check if focused - read from parent each render
  const isFocused = formRef.current?.focusedFieldId === id

  // RHF integration
  const registration = register(id)

  const handleContentChange = () => {
    registration.onChange({
      target: { name: id, value: inputRef.current?.plainText || '' },
      type: 'change',
    })
  }

  // Focus indicator is rendered by the wrapper renderable (updates synchronously)

  return (
    <custom-form-field-wrapper fieldId={id}>
      <text fg={isFocused ? Theme.primary : Theme.text}>{title}</text>
      <textarea
        ref={inputRef}
        height={1}
        placeholder={placeholder}
        focused={isFocused}
        keyBindings={[
          { name: 'return', action: 'submit' },
          { name: 'linefeed', action: 'submit' },
        ]}
        onContentChange={handleContentChange}
      />
    </custom-form-field-wrapper>
  )
}

// Add compound component
CustomForm.TextField = CustomFormTextField

// ─────────────────────────────────────────────────────────────────────────────
// Example with dynamic field via useEffect
// ─────────────────────────────────────────────────────────────────────────────

function Example(): any {
  const [showDelayedField, setShowDelayedField] = useState(false)

  // Test: add field after timeout
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowDelayedField(true)
    }, 2000)
    return () => {
      clearTimeout(timer)
    }
  }, [])

  return (
    <box flexDirection="column" padding={1} flexGrow={1}>
      <text marginBottom={1}>Custom Form Renderable Example</text>
      <text fg={Theme.textMuted} marginBottom={1}>
        Tab to navigate • Dynamic field appears after 2s
      </text>
      <CustomForm>
        <CustomForm.TextField id="name" title="Name" placeholder="Enter name..." />
        <CustomForm.TextField id="email" title="Email" placeholder="Enter email..." />
        <CustomForm.TextField id="phone" title="Phone" placeholder="Enter phone..." />

        {/* Dynamic field - should register correctly */}
        {showDelayedField && (
          <CustomForm.TextField id="delayed" title="Delayed Field (added after 2s)" placeholder="Dynamic field..." />
        )}

        {/* Many fields to test scrolling */}
        {Array.from({ length: 8 }, (_, i) => (
          <CustomForm.TextField key={`field-${i}`} id={`field-${i}`} title={`Field ${i + 1}`} placeholder={`Enter field ${i + 1}...`} />
        ))}
      </CustomForm>
    </box>
  )
}

if (import.meta.main) {
  renderWithProviders(<Example />)
}

export { CustomForm, CustomFormTextField, Example }
