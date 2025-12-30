/**
 * Chat Message Components
 *
 * Components for rendering chat messages and their containers.
 * Styled like Claude Code:
 * - User messages: right-aligned, no background
 * - Assistant messages: left-aligned, minimal styling
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

  if (isUser) {
    return (
      <box flexDirection="row" width="100%" justifyContent="flex-end">
        <box flexDirection="column" maxWidth="70%" flexShrink={1}>
          {children}
        </box>
      </box>
    )
  }

  return (
    <box flexDirection="column" width="100%" paddingLeft={1}>
      {children}
    </box>
  )
}

export interface ChatUserMessageProps {
  message: UIMessage
  children: ReactNode
}

/**
 * Chat.UserMessage - Styled wrapper for user messages
 * Container right-aligned, text left-aligned inside, max 70% width
 */
export function ChatUserMessage({
  message,
  children,
}: ChatUserMessageProps): any {
  return (
    <box flexDirection="row" width="100%" justifyContent="flex-end">
      <box flexDirection="column" maxWidth="70%" flexShrink={1}>
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
 * Chat.AssistantMessage - Styled wrapper for assistant messages (Claude Code style)
 * No label - each part (text, tool) has its own ◆ prefix at root level
 */
export function ChatAssistantMessage({
  message,
  children,
}: ChatAssistantMessageProps): any {
  return (
    <box flexDirection="column" width="100%" gap={1} flexShrink={1}>
      {children}
    </box>
  )
}
