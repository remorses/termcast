import React from 'react'
import { TextareaRenderable } from '@opentui/core'
import { UseFormRegisterReturn } from 'react-hook-form'

/**
 * Creates a fake ref object that satisfies react-hook-form's register() requirements.
 * RHF expects a ref with:
 * - `name`: field name
 * - `value`: getter/setter for reading/writing the field value
 * - `focus()`: optional, for focusing on validation errors
 *
 * This allows using register() directly with non-HTML inputs like opentui's textarea.
 */
export function createReactHookFormRef(options: {
  name: string
  getValue: () => string
  setValue: (value: string) => void
  focus?: () => void
}) {
  return {
    name: options.name,
    get value() {
      return options.getValue()
    },
    set value(v: string) {
      options.setValue(v)
    },
    focus: options.focus || (() => {}),
  }
}

/**
 * Creates a react-hook-form adapter for opentui's TextareaRenderable.
 *
 * Returns:
 * - `formRef`: A fake ref object that RHF can use to get/set values
 * - `onContentChange`: Handler to trigger RHF's onChange
 * - `refCallback`: A memoized ref callback to pass to the textarea's ref prop
 *
 * IMPORTANT: The refCallback must be memoized (via useCallback) at the call site
 * because register() returns a new object on every render. Passing register().ref
 * directly to the textarea ref prop causes unnecessary re-renders.
 */
export function createTextareaFormRef(
  name: string,
  textareaRef: React.RefObject<TextareaRenderable | null>,
  registration: UseFormRegisterReturn<string>,
) {
  const formRef = createReactHookFormRef({
    name,
    getValue: () => textareaRef.current?.plainText || '',
    setValue: (v) => {
      textareaRef.current?.setText(v)
    },
  })

  const onContentChange = () => {
    registration.onChange({
      target: formRef,
      type: 'change',
    })
  }

  return {
    formRef,
    onContentChange,
  }
}
