/**
 * Chat Toolbar Components
 *
 * Submit and Stop buttons for chat control.
 */

import React, { ReactNode } from 'react'
import { TextAttributes } from '@opentui/core'
import { useChatStore } from './chat-provider'
import type { ChatSubmitState } from './types'
import { Theme } from 'termcast/src/theme'

export interface ChatSubmitButtonProps {
  /** Called when button is activated */
  onSubmit: (state: ChatSubmitState) => Promise<void>
  /** Button content (defaults to "Send") */
  children?: ReactNode
}

/**
 * Chat.SubmitButton - Button to manually submit the chat
 *
 * Disabled when generating or when draft is empty.
 */
export function ChatSubmitButton({
  onSubmit,
  children,
}: ChatSubmitButtonProps): any {
  const store = useChatStore()
  const isGenerating = store((s) => s.isGenerating)
  const draftText = store((s) => s.draftText)

  const isDisabled = isGenerating || !draftText.trim()

  const handleSubmit = async () => {
    if (isDisabled) {
      return
    }

    const state = store.getState()
    const { messages, abortController, setMessages } = state

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
    store.getState().setDraftText('')
    store.getState().setIsGenerating(true)

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
      store.setState({ abortController: new AbortController() })
    }
  }

  return (
    <box
      flexDirection="row"
      gap={1}
      paddingLeft={1}
      paddingRight={1}
    >
      <text
        fg={isDisabled ? Theme.textMuted : Theme.accent}
        attributes={isDisabled ? TextAttributes.DIM : TextAttributes.BOLD}
      >
        {children || '↵ Send'}
      </text>
    </box>
  )
}

export interface ChatStopButtonProps {
  /** Button content (defaults to "Stop") */
  children?: ReactNode
}

/**
 * Chat.StopButton - Button to stop ongoing generation
 *
 * Only visible/active when generating.
 */
export function ChatStopButton({ children }: ChatStopButtonProps): any {
  const store = useChatStore()
  const isGenerating = store((s) => s.isGenerating)

  if (!isGenerating) {
    return null
  }

  const handleStop = () => {
    store.getState().stop()
  }

  return (
    <box flexDirection="row" gap={1} paddingLeft={1} paddingRight={1}>
      <text fg={Theme.warning} attributes={TextAttributes.BOLD}>
        {children || '⎋ Stop'}
      </text>
    </box>
  )
}

export interface ChatToolbarProps {
  children?: ReactNode
}

/**
 * Chat.Toolbar - Container for chat action buttons
 */
export function ChatToolbar({ children }: ChatToolbarProps): any {
  return (
    <box
      flexDirection="row"
      gap={2}
      paddingTop={1}
      justifyContent="flex-end"
    >
      {children}
    </box>
  )
}
