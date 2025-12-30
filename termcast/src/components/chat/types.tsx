/**
 * Chat Types - Based on Vercel AI SDK UIMessage structure
 *
 * These types define the structure for chat messages and their parts,
 * compatible with AI SDK streaming responses.
 */

// Message part types
export interface TextUIPart {
  type: 'text'
  text: string
  state?: 'streaming' | 'done'
}

export interface ReasoningUIPart {
  type: 'reasoning'
  text: string
  state?: 'streaming' | 'done'
}

export type ToolState =
  | 'input-streaming'
  | 'input-available'
  | 'output-available'
  | 'output-error'

export interface ToolUIPart {
  type: `tool-${string}`
  toolCallId: string
  state: ToolState
  input?: unknown
  output?: unknown
  errorText?: string
}

export interface FileUIPart {
  type: 'file'
  mediaType: string
  filename?: string
  url: string
}

export interface SourceUrlUIPart {
  type: 'source-url'
  sourceId: string
  url: string
  title?: string
}

export interface StepStartUIPart {
  type: 'step-start'
}

export type UIMessagePart =
  | TextUIPart
  | ReasoningUIPart
  | ToolUIPart
  | FileUIPart
  | SourceUrlUIPart
  | StepStartUIPart

export interface UIMessage {
  id: string
  role: 'system' | 'user' | 'assistant'
  parts: UIMessagePart[]
  metadata?: unknown
}

// Chat state types
export interface ChatSubmitState {
  messages: UIMessage[]
  setMessages: (messages: UIMessage[]) => void
  abortController: AbortController
  draftText: string
}

export interface ChatState {
  messages: UIMessage[]
  draftText: string
  isGenerating: boolean
  abortController: AbortController
  error?: Error
  /** Model name to display (e.g. "claude-3-opus") */
  modelName?: string
  /** Timestamp when generation started */
  startTime?: number
  /** Duration of last completed generation in seconds */
  duration?: number

  setMessages: (messages: UIMessage[]) => void
  setDraftText: (text: string) => void
  setIsGenerating: (isGenerating: boolean) => void
  setError: (error: Error | undefined) => void
  setModelName: (name: string | undefined) => void
  stop: () => void
  reset: () => void
}

// Helper type guards
export function isTextPart(part: UIMessagePart): part is TextUIPart {
  return part.type === 'text'
}

export function isReasoningPart(part: UIMessagePart): part is ReasoningUIPart {
  return part.type === 'reasoning'
}

export function isToolPart(part: UIMessagePart): part is ToolUIPart {
  return part.type.startsWith('tool-')
}

export function isFilePart(part: UIMessagePart): part is FileUIPart {
  return part.type === 'file'
}

export function isStepStartPart(part: UIMessagePart): part is StepStartUIPart {
  return part.type === 'step-start'
}
