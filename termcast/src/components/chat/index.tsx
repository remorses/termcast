/**
 * Chat Components - Compound component for AI chat interfaces
 *
 * Usage:
 * ```tsx
 * import { Chat } from 'termcast'
 *
 * <Chat.Provider onError={console.error}>
 *   <Chat.Messages />
 *   <Chat.Input onSubmit={handleSubmit} />
 * </Chat.Provider>
 * ```
 *
 * For custom message rendering:
 * ```tsx
 * import { Chat, useChatState } from 'termcast'
 *
 * function MyMessages() {
 *   const messages = useChatState(s => s.messages)
 *   return (
 *     <>
 *       {messages.map(message => (
 *         <Chat.Message key={message.id} message={message}>
 *           {message.parts.map((part, i) => {
 *             if (part.type === 'text') return <Chat.TextPart key={i} part={part} />
 *             if (part.type === 'tool-weather') return <MyWeatherPreview key={i} part={part} />
 *             return <Chat.ToolPart key={i} part={part} />
 *           })}
 *         </Chat.Message>
 *       ))}
 *     </>
 *   )
 * }
 * ```
 */

// Types
export type {
  UIMessage,
  UIMessagePart,
  TextUIPart,
  ReasoningUIPart,
  ToolUIPart,
  ToolState,
  FileUIPart,
  SourceUrlUIPart,
  StepStartUIPart,
  ChatState,
  ChatSubmitState,
} from './types'

export {
  isTextPart,
  isReasoningPart,
  isToolPart,
  isFilePart,
  isStepStartPart,
} from './types'

// Stream utilities
export { uiStreamToUIMessages, isAsyncIterable } from './stream'
export type {
  UIStreamToUIMessagesOptions,
  ToolPartOutputAvailable,
  ToolPartInputAvailable,
  ToolPartInputStreaming,
} from './stream'
export { type UIMessageChunk } from './stream'

// Provider and hooks
export {
  ChatProvider,
  useChatState,
  useChatContext,
  useChatStore,
} from './chat-provider'
export type { ChatProviderProps } from './chat-provider'

// Message components
export {
  ChatMessage,
  ChatUserMessage,
  ChatAssistantMessage,
} from './chat-message'
export type {
  ChatMessageProps,
  ChatUserMessageProps,
  ChatAssistantMessageProps,
} from './chat-message'

// Part components
export {
  ChatTextPart,
  ChatReasoningPart,
  ChatToolPart,
  ChatFilePart,
  ChatStepDivider,
} from './chat-parts'
export type {
  ChatTextPartProps,
  ChatReasoningPartProps,
  ChatToolPartProps,
  ChatFilePartProps,
  ChatStepDividerProps,
} from './chat-parts'

// Input component
export { ChatInput } from './chat-input'
export type { ChatInputProps } from './chat-input'

// Toolbar components
export {
  ChatSubmitButton,
  ChatStopButton,
  ChatToolbar,
} from './chat-toolbar'
export type {
  ChatSubmitButtonProps,
  ChatStopButtonProps,
  ChatToolbarProps,
} from './chat-toolbar'

// Messages list
export { ChatMessages } from './chat-messages'
export type { ChatMessagesProps } from './chat-messages'

// Import components for compound export
import { ChatProvider } from './chat-provider'
import { ChatMessage, ChatUserMessage, ChatAssistantMessage } from './chat-message'
import {
  ChatTextPart,
  ChatReasoningPart,
  ChatToolPart,
  ChatFilePart,
  ChatStepDivider,
} from './chat-parts'
import { ChatInput } from './chat-input'
import { ChatSubmitButton, ChatStopButton, ChatToolbar } from './chat-toolbar'
import { ChatMessages } from './chat-messages'

/**
 * Chat compound component
 *
 * Provides a namespace for all chat-related components.
 */
interface ChatType {
  Provider: typeof ChatProvider
  Messages: typeof ChatMessages
  Message: typeof ChatMessage
  UserMessage: typeof ChatUserMessage
  AssistantMessage: typeof ChatAssistantMessage
  TextPart: typeof ChatTextPart
  ReasoningPart: typeof ChatReasoningPart
  ToolPart: typeof ChatToolPart
  FilePart: typeof ChatFilePart
  StepDivider: typeof ChatStepDivider
  Input: typeof ChatInput
  SubmitButton: typeof ChatSubmitButton
  StopButton: typeof ChatStopButton
  Toolbar: typeof ChatToolbar
}

export const Chat: ChatType = {
  Provider: ChatProvider,
  Messages: ChatMessages,
  Message: ChatMessage,
  UserMessage: ChatUserMessage,
  AssistantMessage: ChatAssistantMessage,
  TextPart: ChatTextPart,
  ReasoningPart: ChatReasoningPart,
  ToolPart: ChatToolPart,
  FilePart: ChatFilePart,
  StepDivider: ChatStepDivider,
  Input: ChatInput,
  SubmitButton: ChatSubmitButton,
  StopButton: ChatStopButton,
  Toolbar: ChatToolbar,
}
