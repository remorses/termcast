import React, { useRef, useCallback } from 'react'
import { BoxRenderable, TextareaRenderable } from '@opentui/core'
import { useFormContext } from 'react-hook-form'
import { useFocusContext, useFormFieldDescendant } from './index'
import { FormItemProps, FormItemRef } from './types'
import { useTheme } from 'termcast/src/theme'
import { WithLeftBorder, TitleIndicator } from './with-left-border'
import { useFormNavigation } from './use-form-navigation'
import { createTextareaFormRef } from './form-ref'
import { LoadingText } from 'termcast/src/components/loading-text'

export interface TextFieldProps extends FormItemProps<string> {
  placeholder?: string
}

export type TextFieldRef = FormItemRef

export const TextField = (props: TextFieldProps): any => {
  const theme = useTheme()
  const { register, formState } = useFormContext()
  const focusContext = useFocusContext()
  const { focusedField, setFocusedField } = focusContext
  const isFocused = focusedField === props.id

  const elementRef = useRef<BoxRenderable>(null)
  const textareaRef = useRef<TextareaRenderable>(null)

  // Register as form field descendant for scroll support
  useFormFieldDescendant({
    id: props.id,
    elementRef: elementRef.current,
  })

  // Use form navigation hook
  useFormNavigation(props.id)

  // Get register props
  const registration = register(props.id, {
    required: props.error ? props.error : false,
  })

  // Create form ref adapter with onContentChange handler
  const { formRef, onContentChange } = createTextareaFormRef(
    props.id,
    textareaRef,
    registration,
  )

  // Memoize ref callback - register() returns new object every render,
  // so we must not pass registration.ref directly to avoid re-renders
  const handleRef = useCallback((el: TextareaRenderable | null) => {
    textareaRef.current = el
    registration.ref(formRef)
  }, [])

  const handleContentChange = useCallback(() => {
    onContentChange()
    props.onChange?.(formRef.value)
  }, [props.onChange])

  const fieldError = formState.errors[props.id]

  return (
    <box ref={elementRef} flexDirection="column">
      <WithLeftBorder isFocused={isFocused} paddingBottom={1}>
        <TitleIndicator isFocused={isFocused} isLoading={focusContext.isLoading}>
          <box
            onMouseDown={() => {
              setFocusedField(props.id)
            }}
          >
            <LoadingText
              isLoading={isFocused && focusContext.isLoading}
              color={isFocused ? theme.primary : theme.text}
            >
              {props.title || ''}
            </LoadingText>
          </box>
        </TitleIndicator>
        <textarea
          ref={handleRef}
          height={1}
          keyBindings={[
            { name: 'return', action: 'submit' },
            { name: 'linefeed', action: 'submit' },
          ]}
          wrapMode='none'
          initialValue={props.defaultValue || props.value || ''}
          onContentChange={handleContentChange}
          placeholder={props.placeholder}
          focused={isFocused}
          onMouseDown={() => {
            setFocusedField(props.id)
          }}
        />
        {(fieldError || props.error || props.info) && <box height={1} />}
        {(fieldError || props.error) && (
          <text fg={theme.error}>
            {(fieldError?.message as string) || props.error}
          </text>
        )}
        {props.info && (
          <text fg={theme.textMuted}>{props.info}</text>
        )}
      </WithLeftBorder>
    </box>
  )
}
