import React, { useRef, useState, useCallback } from 'react'
import { TextareaRenderable } from '@opentui/core'
import { useForm } from 'react-hook-form'
import { useKeyboard } from '@opentui/react'
import { renderWithProviders } from '../../utils'
import { useTheme } from 'termcast/src/theme'
import { logger } from 'termcast/src/logger'
import { createTextareaFormRef } from 'termcast/src/components/form/form-ref'

interface FormData {
  username: string
  message: string
}

function RHFCustomRefExample() {
  const theme = useTheme()
  const textareaRef1 = useRef<TextareaRenderable>(null)
  const textareaRef2 = useRef<TextareaRenderable>(null)
  const [focusedField, setFocusedField] = useState<'username' | 'message'>('username')

  const { register, handleSubmit, formState, reset, setValue, getValues, watch } =
    useForm<FormData>({
      defaultValues: {
        username: '',
        message: '',
      },
    })

  const formValues = watch()

  const onSubmit = (data: FormData) => {
    logger.log('Form submitted:', data)
  }

  // Get register props
  const usernameRegistration = register('username', { required: 'Username is required' })
  const messageRegistration = register('message', { required: 'Message is required' })

  // Create form ref adapters with onContentChange handlers
  const { formRef: usernameFormRef, onContentChange: onUsernameChange } =
    createTextareaFormRef('username', textareaRef1, usernameRegistration)
  const { formRef: messageFormRef, onContentChange: onMessageChange } =
    createTextareaFormRef('message', textareaRef2, messageRegistration)

  // Memoize ref callbacks - register() returns new object every render,
  // so we must not pass registration.ref directly to avoid re-renders
  const handleUsernameRef = useCallback((el: TextareaRenderable | null) => {
    textareaRef1.current = el
    usernameRegistration.ref(usernameFormRef)
  }, [])

  const handleMessageRef = useCallback((el: TextareaRenderable | null) => {
    textareaRef2.current = el
    messageRegistration.ref(messageFormRef)
  }, [])

  useKeyboard((evt) => {
    if (evt.name === 'escape') {
      reset()
      logger.log('Form reset')
    }
    if (evt.ctrl && evt.name === 's') {
      handleSubmit(onSubmit)()
    }
    if (evt.ctrl && evt.name === 'v') {
      setValue('username', 'test-user')
      setValue('message', 'Hello from setValue!')
      logger.log('Set values programmatically')
    }
    if (evt.ctrl && evt.name === 'g') {
      logger.log('Current values:', getValues())
    }
  })

  return (
    <box flexDirection="column" gap={1}>
      <text fg={theme.accent}>React Hook Form with Custom Ref Adapter</text>
      <text fg={theme.textMuted}>
        This example uses register() directly with opentui textarea
      </text>

      <box flexDirection="column">
        <text
          fg={theme.text}
          onMouseDown={() => {
            setFocusedField('username')
          }}
        >
          Username:
        </text>
        <textarea
          ref={handleUsernameRef}
          height={1}
          wrapMode='none'
          placeholder="Enter username..."
          onContentChange={onUsernameChange}
          onMouseDown={() => {
            setFocusedField('username')
          }}
          focused={focusedField === 'username'}
        />
        {formState.errors.username && (
          <text fg={theme.error}>{formState.errors.username.message}</text>
        )}
      </box>

      <box flexDirection="column">
        <text
          fg={theme.text}
          onMouseDown={() => {
            setFocusedField('message')
          }}
        >
          Message:
        </text>
        <textarea
          ref={handleMessageRef}
          height={2}
          wrapMode='none'
          placeholder="Enter message..."
          onContentChange={onMessageChange}
          onMouseDown={() => {
            setFocusedField('message')
          }}
          focused={focusedField === 'message'}
        />
        {formState.errors.message && (
          <text fg={theme.error}>{formState.errors.message.message}</text>
        )}
      </box>

      <box flexDirection="column" marginTop={1}>
        <text fg={theme.textMuted}>Controls:</text>
        <text fg={theme.textMuted}>• Ctrl+S: Submit form</text>
        <text fg={theme.textMuted}>• Ctrl+V: Set values programmatically</text>
        <text fg={theme.textMuted}>• Ctrl+G: Get current values</text>
        <text fg={theme.textMuted}>• ESC: Reset form</text>
      </box>

      <box marginTop={1}>
        <text fg={theme.textMuted}>
          isDirty: {String(formState.isDirty)} | isValid:{' '}
          {String(formState.isValid)} | submitCount: {formState.submitCount}
        </text>
      </box>

      <box marginTop={1} flexDirection="column">
        <text fg={theme.accent}>Form values:</text>
        <text fg={theme.text}>{JSON.stringify(formValues, null, 2)}</text>
      </box>
    </box>
  )
}

renderWithProviders(<RHFCustomRefExample />)
