/**
 * Chat Messages Component
 *
 * Default renderer for the message list.
 */

import React, { ReactNode } from 'react'
import { useChatState } from './chat-provider'
import { ChatMessage, ChatUserMessage, ChatAssistantMessage } from './chat-message'
import {
  ChatTextPart,
  ChatReasoningPart,
  ChatToolPart,
  ChatFilePart,
  ChatStepDivider,
} from './chat-parts'
import { isTextPart, isReasoningPart, isToolPart, isFilePart, isStepStartPart } from './types'
import type { UIMessage, UIMessagePart } from './types'
import { Theme } from 'termcast/src/theme'
import { LoadingText } from 'termcast/src/components/loading-text'

export interface ChatMessagesProps {
  /** Content to show when there are no messages */
  emptyContent?: ReactNode
}

/**
 * Chat.Messages - Default message list renderer
 *
 * Automatically renders all messages with appropriate part components.
 * For custom rendering, use useChatState(s => s.messages) directly.
 */
export function ChatMessages({ emptyContent }: ChatMessagesProps): any {
  const messages = useChatState((s) => s.messages)
  const isGenerating = useChatState((s) => s.isGenerating)
  const modelName = useChatState((s) => s.modelName)
  const startTime = useChatState((s) => s.startTime)
  const duration = useChatState((s) => s.duration)

  if (messages.length === 0) {
    if (emptyContent) {
      return <>{emptyContent}</>
    }
    return (
      <box paddingLeft={2} paddingTop={1}>
        <text fg={Theme.textMuted}>No messages yet. Start a conversation!</text>
      </box>
    )
  }

  // Calculate elapsed time during generation
  const elapsedSeconds = isGenerating && startTime 
    ? Math.round((Date.now() - startTime) / 100) / 10 
    : duration

  // Show model info when generating or just completed
  const showModelInfo = modelName && (isGenerating || duration !== undefined)

  return (
    <box flexDirection="column" gap={1} width="100%">
      {messages.map((message) => (
        <DefaultMessageRenderer key={message.id} message={message} />
      ))}
      
      {/* Model name and duration footer */}
      {showModelInfo && (
        <box flexDirection="row" gap={1}>
          {isGenerating ? (
            <LoadingText isLoading={true} color={Theme.textMuted}>
              {modelName}
            </LoadingText>
          ) : (
            <text fg={Theme.textMuted}>{modelName}</text>
          )}
          {elapsedSeconds !== undefined && (
            <text fg={Theme.textMuted}> · {elapsedSeconds.toFixed(1)}s</text>
          )}
        </box>
      )}
    </box>
  )
}

interface DefaultMessageRendererProps {
  message: UIMessage
}

/**
 * Default message renderer that handles user/assistant messages
 */
function DefaultMessageRenderer({ message }: DefaultMessageRendererProps): any {
  if (message.role === 'user') {
    // User messages render text directly (no ◆ prefix)
    const textContent = message.parts
      .filter(isTextPart)
      .map((p) => p.text)
      .join('')

    return (
      <ChatUserMessage message={message}>
        <text fg={Theme.text} wrapMode="word">{textContent}</text>
      </ChatUserMessage>
    )
  }

  if (message.role === 'assistant') {
    // Skip empty assistant messages (placeholders during generation)
    if (message.parts.length === 0) {
      return null
    }

    return (
      <ChatAssistantMessage message={message}>
        {message.parts.map((part, index) => (
          <DefaultPartRenderer key={index} part={part} />
        ))}
      </ChatAssistantMessage>
    )
  }

  // System messages - render inline
  return (
    <box paddingLeft={2}>
      {message.parts.map((part, index) => (
        <DefaultPartRenderer key={index} part={part} />
      ))}
    </box>
  )
}

interface DefaultPartRendererProps {
  part: UIMessagePart
}

/**
 * Default part renderer that dispatches to appropriate component
 */
function DefaultPartRenderer({ part }: DefaultPartRendererProps): any {
  if (isTextPart(part)) {
    return <ChatTextPart part={part} />
  }

  if (isReasoningPart(part)) {
    return <ChatReasoningPart part={part} />
  }

  if (isToolPart(part)) {
    return <ChatToolPart part={part} />
  }

  if (isFilePart(part)) {
    return <ChatFilePart part={part} />
  }

  if (isStepStartPart(part)) {
    return <ChatStepDivider part={part} />
  }

  // Unknown part type - skip
  return null
}
