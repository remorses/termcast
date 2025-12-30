/**
 * Chat Stream Utilities
 *
 * Async generator for consuming AI SDK UI message streams and converting
 * them to UIMessage arrays. Based on holocron/contesto patterns.
 */

import type { UIMessage, UIMessagePart, ToolUIPart } from './types'
import { isToolPart } from './types'

// Stream chunk types from AI SDK
export interface UIMessageChunk {
  type: string
  [key: string]: unknown
}

export type ToolPartOutputAvailable = Extract<ToolUIPart, { state: 'output-available' }>
export type ToolPartInputAvailable = Extract<ToolUIPart, { state: 'input-available' }>
export type ToolPartInputStreaming = Extract<ToolUIPart, { state: 'input-streaming' }>

export interface UIStreamToUIMessagesOptions {
  /** The async iterable stream of UI message chunks */
  uiStream: AsyncIterable<UIMessageChunk>
  /** Current messages array */
  messages: UIMessage[]
  /** ID generator function */
  generateId?: () => string
  /** Throttle updates (ms) */
  throttleMs?: number
  /** Callback when tool output is available */
  onToolOutput?: (toolPart: ToolPartOutputAvailable) => void | Promise<void>
  /** Callback when tool input is available */
  onToolInput?: (toolPart: ToolPartInputAvailable) => void | Promise<void>
  /** Callback when tool input is streaming */
  onToolInputStreaming?: (toolPart: ToolPartInputStreaming) => void | Promise<void>
}

function defaultGenerateId(): string {
  return Math.random().toString(36).substring(2, 15)
}

/**
 * Converts an async iterable of UI message chunks into an async generator
 * that yields updated message arrays as they stream in.
 *
 * Usage:
 * ```tsx
 * for await (const messages of uiStreamToUIMessages({ uiStream, messages })) {
 *   setMessages(messages)
 * }
 * ```
 */
export async function* uiStreamToUIMessages({
  uiStream,
  messages,
  generateId = defaultGenerateId,
  throttleMs = 32,
  onToolOutput,
  onToolInput,
  onToolInputStreaming,
}: UIStreamToUIMessagesOptions): AsyncIterable<UIMessage[]> {
  const lastMessage = messages[messages.length - 1]
  const replaceLastMessage = lastMessage?.role === 'assistant'

  const message: UIMessage = replaceLastMessage
    ? structuredClone(lastMessage)
    : {
        id: generateId(),
        role: 'assistant',
        parts: [],
      }

  let lastYieldTime = 0
  const processedToolCallIds = new Set<string>()

  // Track current state for building message
  let currentTextPart: UIMessagePart | null = null

  for await (const chunk of uiStream) {
    // Process different chunk types
    switch (chunk.type) {
      case 'text-delta': {
        const textDelta = chunk.textDelta as string
        if (!currentTextPart || currentTextPart.type !== 'text') {
          currentTextPart = { type: 'text', text: '', state: 'streaming' }
          message.parts.push(currentTextPart)
        }
        if (currentTextPart.type === 'text') {
          currentTextPart.text += textDelta
        }
        break
      }

      case 'reasoning': {
        const text = chunk.text as string
        const reasoningPart = message.parts.find(
          (p) => p.type === 'reasoning',
        ) as UIMessagePart | undefined
        if (reasoningPart && reasoningPart.type === 'reasoning') {
          reasoningPart.text = text
        } else {
          message.parts.push({ type: 'reasoning', text, state: 'streaming' })
        }
        break
      }

      case 'tool-call': {
        const toolCallId = chunk.toolCallId as string
        const toolName = chunk.toolName as string
        const args = chunk.args as unknown

        const toolPart: ToolUIPart = {
          type: `tool-${toolName}`,
          toolCallId,
          state: 'input-available',
          input: args,
        }
        message.parts.push(toolPart)
        currentTextPart = null

        if (onToolInput && !processedToolCallIds.has(toolCallId)) {
          await onToolInput(toolPart as ToolPartInputAvailable)
        }
        break
      }

      case 'tool-call-streaming-start': {
        const toolCallId = chunk.toolCallId as string
        const toolName = chunk.toolName as string

        const toolPart: ToolUIPart = {
          type: `tool-${toolName}`,
          toolCallId,
          state: 'input-streaming',
          input: undefined,
        }
        message.parts.push(toolPart)
        currentTextPart = null
        break
      }

      case 'tool-call-delta': {
        const toolCallId = chunk.toolCallId as string
        const argsTextDelta = chunk.argsTextDelta as string

        const toolPart = message.parts.find(
          (p) => isToolPart(p) && p.toolCallId === toolCallId,
        ) as ToolUIPart | undefined

        if (toolPart) {
          // Accumulate partial args as string for now
          const currentInput = (toolPart.input as string) || ''
          toolPart.input = currentInput + argsTextDelta

          if (onToolInputStreaming) {
            await onToolInputStreaming(toolPart as ToolPartInputStreaming)
          }
        }
        break
      }

      case 'tool-result': {
        const toolCallId = chunk.toolCallId as string
        const result = chunk.result as unknown

        const toolPart = message.parts.find(
          (p) => isToolPart(p) && p.toolCallId === toolCallId,
        ) as ToolUIPart | undefined

        if (toolPart) {
          toolPart.state = 'output-available'
          toolPart.output = result

          if (onToolOutput && !processedToolCallIds.has(toolCallId)) {
            processedToolCallIds.add(toolCallId)
            await onToolOutput(toolPart as ToolPartOutputAvailable)
          }
        }
        break
      }

      case 'step-start': {
        message.parts.push({ type: 'step-start' })
        currentTextPart = null
        break
      }

      case 'finish': {
        // Mark text parts as done
        for (const part of message.parts) {
          if (part.type === 'text' || part.type === 'reasoning') {
            part.state = 'done'
          }
        }
        break
      }

      case 'error': {
        const error = chunk.error as string
        // Find last tool part and mark as error
        const lastToolPart = [...message.parts]
          .reverse()
          .find((p) => isToolPart(p)) as ToolUIPart | undefined
        if (lastToolPart) {
          lastToolPart.state = 'output-error'
          lastToolPart.errorText = error
        }
        break
      }
    }

    // Build current messages array
    const currentMessages = [...messages]
    if (!replaceLastMessage) {
      currentMessages.push(message)
    } else {
      currentMessages[currentMessages.length - 1] = message
    }

    // Throttle yields
    const now = Date.now()
    if (now - lastYieldTime >= throttleMs) {
      lastYieldTime = now
      yield currentMessages.map((m) => structuredClone(m))
    }
  }

  // Final yield
  const finalMessages = [...messages]
  if (!replaceLastMessage) {
    finalMessages.push(message)
  } else {
    finalMessages[finalMessages.length - 1] = message
  }
  yield finalMessages.map((m) => structuredClone(m))
}

/**
 * Helper to check if a value is an async iterable
 */
export function isAsyncIterable<T>(value: unknown): value is AsyncIterable<T> {
  return (
    value !== null &&
    typeof value === 'object' &&
    Symbol.asyncIterator in value
  )
}
