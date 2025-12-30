/**
 * Chat Message Components
 *
 * Components for rendering chat messages and their containers.
 */

import React, { ReactNode } from 'react'
import { TextAttributes } from '@opentui/core'
import type { UIMessage } from './types'
import { Theme } from 'termcast/src/theme'

export interface ChatMessageProps {
  message: UIMessage
  children: ReactNode
}

/**
 * Chat.Message - Wrapper for a single message (user or assistant)
 *
 * Renders with appropriate styling based on role.
 */
export function ChatMessage({ message, children }: ChatMessageProps): any {
  const isUser = message.role === 'user'

  return (
    <box
      flexDirection="column"
      width="100%"
      paddingLeft={isUser ? 4 : 0}
      paddingRight={isUser ? 0 : 4}
    >
      {/* Role indicator */}
      <box flexDirection="row" gap={1} marginBottom={1}>
        <text
          fg={isUser ? Theme.accent : Theme.success}
          attributes={TextAttributes.BOLD}
          flexShrink={0}
        >
          {isUser ? '▸ You' : '◆ Assistant'}
        </text>
      </box>

      {/* Message content */}
      <box flexDirection="column" gap={1} paddingLeft={2}>
        {children}
      </box>
    </box>
  )
}

export interface ChatUserMessageProps {
  message: UIMessage
  children: ReactNode
}

/**
 * Chat.UserMessage - Styled wrapper for user messages
 */
export function ChatUserMessage({
  message,
  children,
}: ChatUserMessageProps): any {
  return (
    <box
      flexDirection="column"
      width="100%"
      paddingLeft={2}
    >
      <box flexDirection="row" gap={1} marginBottom={1}>
        <text fg={Theme.accent} attributes={TextAttributes.BOLD} flexShrink={0}>
          ▸ You
        </text>
      </box>
      <box flexDirection="column" paddingLeft={2}>
        {children}
      </box>
    </box>
  )
}

export interface ChatAssistantMessageProps {
  message: UIMessage
  children: ReactNode
}

/**
 * Chat.AssistantMessage - Styled wrapper for assistant messages
 */
export function ChatAssistantMessage({
  message,
  children,
}: ChatAssistantMessageProps): any {
  return (
    <box flexDirection="column" width="100%">
      <box flexDirection="row" gap={1} marginBottom={1}>
        <text
          fg={Theme.success}
          attributes={TextAttributes.BOLD}
          flexShrink={0}
        >
          ◆ Assistant
        </text>
      </box>
      <box flexDirection="column" paddingLeft={2}>
        {children}
      </box>
    </box>
  )
}
