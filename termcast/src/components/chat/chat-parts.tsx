/**
 * Chat Part Components
 *
 * Components for rendering different types of message parts.
 */

import React, { useState } from 'react'
import { TextAttributes } from '@opentui/core'
import type {
  TextUIPart,
  ReasoningUIPart,
  ToolUIPart,
  FileUIPart,
  StepStartUIPart,
} from './types'
import { Theme } from 'termcast/src/theme'

export interface ChatTextPartProps {
  part: TextUIPart
}

/**
 * Chat.TextPart - Renders text content
 */
export function ChatTextPart({ part }: ChatTextPartProps): any {
  const isStreaming = part.state === 'streaming'

  return (
    <box flexDirection="row" width="100%">
      <text fg={Theme.text} wrapMode="word">
        {part.text}
        {isStreaming && (
          <span fg={Theme.textMuted}>▌</span>
        )}
      </text>
    </box>
  )
}

export interface ChatReasoningPartProps {
  part: ReasoningUIPart
  /** Whether to show collapsed by default */
  collapsed?: boolean
}

/**
 * Chat.ReasoningPart - Renders thinking/reasoning content (collapsible)
 */
export function ChatReasoningPart({
  part,
  collapsed = true,
}: ChatReasoningPartProps): any {
  const [isCollapsed, setIsCollapsed] = useState(collapsed)
  const isStreaming = part.state === 'streaming'

  if (!part.text) {
    return null
  }

  const previewText = part.text.slice(0, 50) + (part.text.length > 50 ? '...' : '')

  return (
    <box flexDirection="column" width="100%">
      <box flexDirection="row" gap={1}>
        <text fg={Theme.textMuted} flexShrink={0}>
          {isCollapsed ? '▸' : '▾'}
        </text>
        <text fg={Theme.textMuted} attributes={TextAttributes.DIM}>
          {isStreaming ? 'Thinking' : 'Thought'}
          {isCollapsed && `: ${previewText}`}
        </text>
      </box>
      {!isCollapsed && (
        <box paddingLeft={2} marginTop={1}>
          <text fg={Theme.textMuted} wrapMode="word" attributes={TextAttributes.DIM}>
            {part.text}
            {isStreaming && <span fg={Theme.textMuted}>▌</span>}
          </text>
        </box>
      )}
    </box>
  )
}

export interface ChatToolPartProps {
  part: ToolUIPart
}

/**
 * Chat.ToolPart - Renders tool call/result display
 */
export function ChatToolPart({ part }: ChatToolPartProps): any {
  const toolName = part.type.replace('tool-', '')
  const { state, input, output, errorText } = part

  // Status indicator
  const getStatusIndicator = () => {
    switch (state) {
      case 'input-streaming':
        return { icon: '◔', color: Theme.warning, text: 'preparing' }
      case 'input-available':
        return { icon: '◑', color: Theme.warning, text: 'running' }
      case 'output-available':
        return { icon: '◆', color: Theme.success, text: 'done' }
      case 'output-error':
        return { icon: '✕', color: Theme.error, text: 'error' }
      default:
        return { icon: '○', color: Theme.textMuted, text: 'pending' }
    }
  }

  const status = getStatusIndicator()

  // Format input/output for display
  const formatValue = (value: unknown): string => {
    if (value === undefined || value === null) {
      return ''
    }
    if (typeof value === 'string') {
      return value.length > 100 ? value.slice(0, 100) + '...' : value
    }
    try {
      const str = JSON.stringify(value, null, 2)
      return str.length > 200 ? str.slice(0, 200) + '...' : str
    } catch {
      return String(value)
    }
  }

  return (
    <box flexDirection="column" width="100%" gap={1}>
      {/* Tool header */}
      <box flexDirection="row" gap={1}>
        <text fg={status.color} flexShrink={0}>
          {status.icon}
        </text>
        <text fg={Theme.accent} attributes={TextAttributes.BOLD} flexShrink={0}>
          {toolName}
        </text>
        <text fg={Theme.textMuted} flexShrink={0}>
          ({status.text})
        </text>
      </box>

      {/* Input args */}
      {input !== undefined && (
        <box paddingLeft={2}>
          <text fg={Theme.textMuted} wrapMode="word">
            ⎿ {formatValue(input)}
          </text>
        </box>
      )}

      {/* Output result */}
      {state === 'output-available' && output !== undefined && (
        <box paddingLeft={2}>
          <text fg={Theme.text} wrapMode="word">
            → {formatValue(output)}
          </text>
        </box>
      )}

      {/* Error */}
      {state === 'output-error' && errorText && (
        <box paddingLeft={2}>
          <text fg={Theme.error} wrapMode="word">
            Error: {errorText}
          </text>
        </box>
      )}
    </box>
  )
}

export interface ChatFilePartProps {
  part: FileUIPart
}

/**
 * Chat.FilePart - Renders file attachment indicator
 */
export function ChatFilePart({ part }: ChatFilePartProps): any {
  const filename = part.filename || 'file'

  return (
    <box flexDirection="row" gap={1}>
      <text fg={Theme.textMuted} flexShrink={0}>
        📎
      </text>
      <text fg={Theme.accent}>{filename}</text>
      <text fg={Theme.textMuted}>({part.mediaType})</text>
    </box>
  )
}

export interface ChatStepDividerProps {
  part?: StepStartUIPart
}

/**
 * Chat.StepDivider - Renders a visual separator between steps
 */
export function ChatStepDivider({ part }: ChatStepDividerProps): any {
  return (
    <box width="100%" paddingTop={1} paddingBottom={1}>
      <text fg={Theme.border}>{'─'.repeat(40)}</text>
    </box>
  )
}
