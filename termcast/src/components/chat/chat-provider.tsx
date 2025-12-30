/**
 * Chat Provider - State management for chat components
 *
 * Uses zustand for state management with React context for scoping.
 */

import React, { createContext, useContext, useMemo, ReactNode } from 'react'
import { create, StoreApi, UseBoundStore } from 'zustand'
import type { UIMessage, ChatState } from './types'

// Create context for the store
const ChatContext = createContext<UseBoundStore<StoreApi<ChatState>> | null>(
  null,
)

export interface ChatProviderProps {
  children: ReactNode
  /** Initial messages to populate the chat */
  initialMessages?: UIMessage[]
  /** Error handler callback */
  onError?: (error: Error) => void
}

/**
 * Chat.Provider - Provides chat state context to children
 *
 * Usage:
 * ```tsx
 * <Chat.Provider onError={console.error}>
 *   <Chat.Messages />
 *   <Chat.Input onSubmit={handleSubmit} />
 * </Chat.Provider>
 * ```
 */
export function ChatProvider({
  children,
  initialMessages = [],
  onError,
}: ChatProviderProps): any {
  const store = useMemo(() => {
    const abortController = new AbortController()

    const store = create<ChatState>((set, get) => ({
      messages: initialMessages,
      draftText: '',
      isGenerating: false,
      abortController,
      error: undefined,
      modelName: undefined,
      startTime: undefined,
      duration: undefined,

      setMessages: (messages) => {
        set({ messages })
      },

      setDraftText: (draftText) => {
        set({ draftText })
      },

      setIsGenerating: (isGenerating) => {
        if (isGenerating) {
          // Starting generation - record start time
          set({ isGenerating, startTime: Date.now(), duration: undefined })
        } else {
          // Ending generation - calculate duration
          const { startTime } = get()
          const duration = startTime ? (Date.now() - startTime) / 1000 : undefined
          set({ isGenerating, duration })
        }
      },

      setError: (error) => {
        set({ error })
        if (error && onError) {
          onError(error)
        }
      },

      setModelName: (modelName) => {
        set({ modelName })
      },

      stop: () => {
        const { abortController, startTime } = get()
        abortController.abort('User stopped generation')
        const duration = startTime ? (Date.now() - startTime) / 1000 : undefined
        set({
          isGenerating: false,
          abortController: new AbortController(),
          duration,
        })
      },

      reset: () => {
        const { abortController } = get()
        abortController.abort('Chat reset')
        set({
          messages: [],
          draftText: '',
          isGenerating: false,
          abortController: new AbortController(),
          error: undefined,
          modelName: undefined,
          startTime: undefined,
          duration: undefined,
        })
      },
    }))

    return store
  }, [])

  return <ChatContext.Provider value={store}>{children}</ChatContext.Provider>
}

/**
 * Hook to access chat state with a selector
 *
 * Usage:
 * ```tsx
 * const messages = useChatState(s => s.messages)
 * const { messages, isGenerating } = useChatState(s => ({
 *   messages: s.messages,
 *   isGenerating: s.isGenerating
 * }))
 * ```
 */
export function useChatState<T>(selector: (state: ChatState) => T): T {
  const store = useContext(ChatContext)
  if (store === null) {
    throw new Error('useChatState must be used within a Chat.Provider')
  }
  return store(selector)
}

/**
 * Hook to get the full chat context (all state and methods)
 *
 * Usage:
 * ```tsx
 * const { messages, setMessages, isGenerating, stop } = useChatContext()
 * ```
 */
export function useChatContext(): ChatState {
  const store = useContext(ChatContext)
  if (store === null) {
    throw new Error('useChatContext must be used within a Chat.Provider')
  }
  return store((state) => state)
}

/**
 * Hook to get direct access to the zustand store for external updates
 *
 * Usage:
 * ```tsx
 * const store = useChatStore()
 * store.getState().setMessages(newMessages)
 * ```
 */
export function useChatStore(): UseBoundStore<StoreApi<ChatState>> {
  const store = useContext(ChatContext)
  if (store === null) {
    throw new Error('useChatStore must be used within a Chat.Provider')
  }
  return store
}
