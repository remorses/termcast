/**
 * Chat Part Components
 *
 * Components for rendering different types of message parts.
 * Styled like Claude Code terminal output.
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
 * Chat.TextPart - Renders text content (left-aligned, no prefix)
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
 * Chat.ReasoningPart - Renders thinking content (Claude Code style: ✢ Thinking…)
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

  const previewText = part.text.slice(0, 60) + (part.text.length > 60 ? '…' : '')

  return (
    <box flexDirection="column" width="100%">
      <box flexDirection="row">
        <text fg={Theme.textMuted} flexShrink={0}>
          {isStreaming ? '✢ ' : '✢ '}
        </text>
        <text fg={Theme.textMuted}>
          {isStreaming ? 'Thinking…' : 'Thought'}
        </text>
      </box>
      <box flexDirection="row" paddingLeft={2}>
        <text fg={Theme.textMuted} flexShrink={0}>⎿  </text>
        <text fg={Theme.textMuted} wrapMode="word" attributes={TextAttributes.DIM}>
          {isCollapsed ? previewText : part.text}
          {isStreaming && <span fg={Theme.textMuted}>▌</span>}
        </text>
      </box>
    </box>
  )
}

export interface ChatToolPartProps {
  part: ToolUIPart
}

/**
 * Format tool input as a short string for display
 */
function formatToolInput(input: unknown): string {
  if (input === undefined || input === null) {
    return ''
  }
  if (typeof input === 'string') {
    // For strings, show first 60 chars
    return input.length > 60 ? input.slice(0, 60) + '…' : input
  }
  if (typeof input === 'object') {
    // For objects, try to make a compact representation
    try {
      const str = JSON.stringify(input)
      return str.length > 60 ? str.slice(0, 60) + '…' : str
    } catch {
      return String(input)
    }
  }
  return String(input)
}

/**
 * Format tool output for display
 */
function formatToolOutput(output: unknown): string {
  if (output === undefined || output === null) {
    return ''
  }
  if (typeof output === 'string') {
    // Check if it looks like file content
    const lines = output.split('\n')
    if (lines.length > 3) {
      return `${lines.slice(0, 3).join('\n')}\n… +${lines.length - 3} lines`
    }
    return output.length > 100 ? output.slice(0, 100) + '…' : output
  }
  try {
    const str = JSON.stringify(output, null, 2)
    return str.length > 150 ? str.slice(0, 150) + '…' : str
  } catch {
    return String(output)
  }
}

/**
 * Chat.ToolPart - Renders tool call/result (Claude Code style: ◆ ToolName(args))
 */
export function ChatToolPart({ part }: ChatToolPartProps): any {
  const toolName = part.type.replace('tool-', '')
  const { state, input, output, errorText } = part

  // Get icon based on state
  const getIcon = () => {
    switch (state) {
      case 'input-streaming':
        return { icon: '⏺', color: Theme.warning }
      case 'input-available':
        return { icon: '⏺', color: Theme.warning }
      case 'output-available':
        return { icon: '◆', color: Theme.text }
      case 'output-error':
        return { icon: '◆', color: Theme.error }
      default:
        return { icon: '○', color: Theme.textMuted }
    }
  }

  const { icon, color } = getIcon()
  const inputStr = formatToolInput(input)

  // Format like Claude Code: ◆ ToolName(args)
  const toolHeader = inputStr ? `${toolName}(${inputStr})` : toolName

  return (
    <box flexDirection="column" width="100%" flexShrink={1}>
      {/* Tool header: ◆ ToolName(args) */}
      <box flexDirection="row" flexShrink={0}>
        <text fg={color} flexShrink={0}>{icon} </text>
        <text fg={Theme.text} wrapMode="word">{toolHeader}</text>
      </box>

      {/* Output result with ⎿ prefix */}
      {state === 'output-available' && output !== undefined && (
        <box flexDirection="row" paddingLeft={2} flexShrink={1}>
          <text fg={Theme.textMuted} flexShrink={0}>⎿  </text>
          <text fg={Theme.textMuted} wrapMode="word">
            {formatToolOutput(output)}
          </text>
        </box>
      )}

      {/* Error with ⎿ prefix */}
      {state === 'output-error' && errorText && (
        <box flexDirection="row" paddingLeft={2} flexShrink={1}>
          <text fg={Theme.error} flexShrink={0}>⎿  </text>
          <text fg={Theme.error} wrapMode="word">{errorText}</text>
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
