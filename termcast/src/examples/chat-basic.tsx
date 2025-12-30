/**
 * Basic Chat Example
 *
 * Demonstrates the Chat compound component with a simulated AI response.
 * Styled like Claude Code.
 */

import React, { useRef } from 'react'
import { ScrollBoxRenderable } from '@opentui/core'
import {
  Chat,
  useChatStore,
  uiStreamToUIMessages,
  type ChatSubmitState,
  type UIMessageChunk,
} from 'termcast'
import { renderWithProviders } from 'termcast/src/utils'

const MODEL_NAME = 'claude-sonnet-4-20250514'

// Simulated file contents
const FILES = {
  'package.json': '{\n  "name": "my-app",\n  "version": "1.0.0"\n}',
  'src/index.ts': 'export function main() {\n  console.log("Hello")\n}',
  'src/utils.ts': 'export const add = (a: number, b: number) => a + b',
  'README.md': '# My App\n\nA sample application.',
  'tsconfig.json': '{\n  "compilerOptions": {\n    "strict": true\n  }\n}',
}

/**
 * Simulates an AI stream response for demonstration.
 * Emulates Claude Code reading multiple files and responding.
 */
async function* simulateAIStream(
  userMessage: string,
): AsyncIterable<UIMessageChunk> {
  // Simulate initial thinking
  yield { type: 'reasoning', text: 'Let me explore the codebase to understand the project structure...' }
  await sleep(200)

  // Read multiple files like Claude Code does
  const filesToRead = Object.keys(FILES)
  
  for (let i = 0; i < filesToRead.length; i++) {
    const file = filesToRead[i]
    const callId = `read_${i}`
    
    yield {
      type: 'tool-call',
      toolCallId: callId,
      toolName: 'Read',
      args: file,
    }
    await sleep(80)

    const content = FILES[file as keyof typeof FILES]
    const lines = content.split('\n').length
    
    yield {
      type: 'tool-result',
      toolCallId: callId,
      result: `Read ${lines} lines`,
    }
    await sleep(50)
  }

  // More thinking after reading
  yield { type: 'reasoning', text: 'Let me explore the codebase to understand the project structure... I can see this is a TypeScript project with a simple structure.' }
  await sleep(150)

  // Run a command
  yield {
    type: 'tool-call',
    toolCallId: 'bash_1',
    toolName: 'Bash',
    args: 'git status',
  }
  await sleep(100)

  yield {
    type: 'tool-result',
    toolCallId: 'bash_1',
    result: 'On branch main\nnothing to commit, working tree clean',
  }
  await sleep(50)

  // Stream the text response
  const response = `Based on my analysis of your codebase, I can see this is a TypeScript project with the following structure:

- **package.json** - Project configuration
- **src/index.ts** - Main entry point  
- **src/utils.ts** - Utility functions
- **README.md** - Documentation
- **tsconfig.json** - TypeScript config

The project appears to be well-organized. How can I help you with it?`

  const words = response.split(' ')
  for (const word of words) {
    yield { type: 'text-delta', textDelta: word + ' ' }
    await sleep(20)
  }

  yield { type: 'finish', finishReason: 'stop' }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function ChatContent(): any {
  const scrollBoxRef = useRef<ScrollBoxRenderable>(null)
  const store = useChatStore()

  const handleSubmit = async ({ messages, setMessages }: ChatSubmitState) => {
    // Set model name when starting
    store.getState().setModelName(MODEL_NAME)

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
      // Scroll to bottom as content streams in
      scrollToBottom()
    }
  }

  const scrollToBottom = () => {
    const scrollBox = scrollBoxRef.current
    if (scrollBox) {
      const contentHeight = scrollBox.content?.height || 0
      const viewportHeight = scrollBox.viewport?.height || 0
      if (contentHeight > viewportHeight) {
        scrollBox.scrollTo(contentHeight - viewportHeight)
      }
    }
  }

  return (
    <>
      {/* Messages area with scrollbox */}
      <scrollbox ref={scrollBoxRef} flexGrow={1}>
        <Chat.Messages
          emptyContent={
            <box padding={2}>
              <text>Welcome! Type a message to start chatting.</text>
            </box>
          }
        />
      </scrollbox>

      {/* Input area */}
      <box flexShrink={0} marginTop={1}>
        <Chat.Input
          placeholder="Type your message... (Enter to send)"
          onSubmit={handleSubmit}
          onAfterSubmit={scrollToBottom}
        />
      </box>

      {/* Toolbar */}
      <Chat.Toolbar>
        <Chat.StopButton />
      </Chat.Toolbar>
    </>
  )
}

function ChatBasicExample(): any {
  return (
    <box flexDirection="column" height="100%" padding={1}>
      <Chat.Provider onError={console.error}>
        <ChatContent />
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
