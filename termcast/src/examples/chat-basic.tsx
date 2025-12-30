/**
 * Basic Chat Example
 *
 * Demonstrates the Chat compound component with a simulated AI response.
 */

import React from 'react'
import {
  Chat,
  uiStreamToUIMessages,
  type ChatSubmitState,
  type UIMessageChunk,
} from 'termcast'
import { renderWithProviders } from 'termcast/src/utils'

/**
 * Simulates an AI stream response for demonstration.
 * In real usage, this would be replaced with actual API calls.
 */
async function* simulateAIStream(
  userMessage: string,
): AsyncIterable<UIMessageChunk> {
  // Simulate thinking
  yield { type: 'reasoning', text: 'Let me think about this...' }
  await sleep(500)
  yield { type: 'reasoning', text: 'Let me think about this... Analyzing your question.' }
  await sleep(500)

  // Simulate text response
  const response = `I received your message: "${userMessage}". This is a simulated AI response demonstrating the Chat component.`
  const words = response.split(' ')

  for (const word of words) {
    yield { type: 'text-delta', textDelta: word + ' ' }
    await sleep(50)
  }

  // Simulate a tool call
  yield {
    type: 'tool-call',
    toolCallId: 'call_123',
    toolName: 'getTime',
    args: { timezone: 'UTC' },
  }
  await sleep(300)

  yield {
    type: 'tool-result',
    toolCallId: 'call_123',
    result: { time: new Date().toISOString() },
  }

  yield { type: 'finish', finishReason: 'stop' }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function handleSubmit({ messages, setMessages }: ChatSubmitState) {
  // Get the user's message text
  const lastUserMessage = messages
    .filter((m) => m.role === 'user')
    .pop()
  const userText = lastUserMessage?.parts
    .filter((p) => p.type === 'text')
    .map((p) => (p as { text: string }).text)
    .join('') || ''

  // Stream the response
  const stream = simulateAIStream(userText)

  for await (const updated of uiStreamToUIMessages({
    uiStream: stream,
    messages,
  })) {
    setMessages(updated)
  }
}

function ChatBasicExample(): any {
  return (
    <box flexDirection="column" height="100%" padding={1}>
      <Chat.Provider onError={console.error}>
        {/* Messages area */}
        <box flexGrow={1} flexDirection="column">
          <Chat.Messages
            emptyContent={
              <box padding={2}>
                <text>Welcome! Type a message to start chatting.</text>
              </box>
            }
          />
        </box>

        {/* Input area */}
        <box flexShrink={0} marginTop={1}>
          <Chat.Input
            placeholder="Type your message..."
            onSubmit={handleSubmit}
          />
        </box>

        {/* Toolbar */}
        <Chat.Toolbar>
          <Chat.StopButton />
        </Chat.Toolbar>
      </Chat.Provider>
    </box>
  )
}

export default function Command() {
  return <ChatBasicExample />
}

// For standalone testing
if (import.meta.main) {
  renderWithProviders(<ChatBasicExample />)
}
