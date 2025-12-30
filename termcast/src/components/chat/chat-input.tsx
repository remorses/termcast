/**
 * Chat Input Component
 *
 * Textarea input for chat messages with keyboard handling.
 */

import React, { useRef } from 'react'
import { TextareaRenderable } from '@opentui/core'
import { useKeyboard } from '@opentui/react'
import { useChatStore } from './chat-provider'
import type { ChatSubmitState } from './types'
import { Theme } from 'termcast/src/theme'
import { useIsInFocus } from 'termcast/src/internal/focus-context'

export interface ChatInputProps {
  /** Placeholder text */
  placeholder?: string
  /** Whether input is disabled */
  disabled?: boolean
  /** Whether input is focused */
  focused?: boolean
  /** Called when user submits (Enter without Shift) */
  onSubmit: (state: ChatSubmitState) => Promise<void>
}

/**
 * Chat.Input - Text input for chat messages
 *
 * Handles:
 * - Cmd/Ctrl+Enter to submit (calls onSubmit with chat state)
 * - Enter for newline (default textarea behavior)
 * - Escape to stop generation
 */
export function ChatInput({
  placeholder = 'Type a message...',
  disabled = false,
  focused = true,
  onSubmit,
}: ChatInputProps): any {
  const textareaRef = useRef<TextareaRenderable>(null)
  const store = useChatStore()
  const inFocus = useIsInFocus()

  const handleSubmit = async () => {
    const state = store.getState()
    const { messages, isGenerating, abortController, setMessages } = state

    // Get text from textarea ref
    const draftText = textareaRef.current?.plainText || ''

    if (isGenerating || !draftText.trim()) {
      return
    }

    // Create user message
    const userMessage = {
      id: Math.random().toString(36).substring(2, 15),
      role: 'user' as const,
      parts: [{ type: 'text' as const, text: draftText.trim() }],
    }

    // Add user message and empty assistant message
    const newMessages = [
      ...messages,
      userMessage,
      {
        id: Math.random().toString(36).substring(2, 15),
        role: 'assistant' as const,
        parts: [],
      },
    ]

    setMessages(newMessages)
    store.getState().setIsGenerating(true)

    // Clear textarea
    if (textareaRef.current) {
      textareaRef.current.clear()
    }

    try {
      await onSubmit({
        messages: newMessages,
        setMessages,
        abortController,
        draftText: draftText.trim(),
      })
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        store.getState().setError(error)
      }
    } finally {
      store.getState().setIsGenerating(false)
      // Create new abort controller for next request
      store.setState({ abortController: new AbortController() })
    }
  }

  useKeyboard((evt) => {
    if (!inFocus) {
      return
    }

    // Escape to stop generation
    if (evt.name === 'escape') {
      const { isGenerating, stop } = store.getState()
      if (isGenerating) {
        stop()
      }
    }
  })

  const isGenerating = store((s) => s.isGenerating)

  return (
    <box
      border
      borderStyle="single"
      borderColor={Theme.border}
      width="100%"
      minHeight={3}
      flexDirection="column"
    >
      <textarea
        ref={textareaRef}
        placeholder={isGenerating ? 'Generating...' : placeholder}
        focused={focused && !disabled && !isGenerating}
        onSubmit={handleSubmit}
        style={{
          flexGrow: 1,
          paddingLeft: 1,
          paddingRight: 1,
        }}
      />
    </box>
  )
}
