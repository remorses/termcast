import { test, expect, afterEach, beforeEach } from 'vitest'
import { launchTerminal, Session } from 'tuistory/src'

let session: Session

beforeEach(async () => {
  session = await launchTerminal({
    command: 'bun',
    args: ['src/examples/chat-basic.tsx'],
    cols: 70,
    rows: 30,
  })
})

afterEach(() => {
  session?.close()
})

test('renders initial chat state with empty content', async () => {
  const initialSnapshot = await session.text({
    waitFor: (text) => {
      return /Type a message to start chatting/i.test(text)
    },
  })

  expect(initialSnapshot).toMatchInlineSnapshot(`
    "



                                                                      █
                                                                      █
         Welcome! Type a message to start chatting.                   █
                                                                      █
                                                                      █
                                                                      █
                                                                      █
                                                                      █
                                                                      █
                                                                      ▀










       ┌──────────────────────────────────────────────────────────────┐
       │Type your message... (Enter to send)                          │
       └──────────────────────────────────────────────────────────────┘



    "
  `)
}, 10000)

test('input shows placeholder text', async () => {
  await session.text({
    waitFor: (text) => {
      return /Type your message/i.test(text)
    },
  })

  const snapshot = await session.text()
  expect(snapshot).toMatchInlineSnapshot(`
    "



                                                                      █
                                                                      █
         Welcome! Type a message to start chatting.                   █
                                                                      █
                                                                      █
                                                                      █
                                                                      █
                                                                      █
                                                                      █
                                                                      ▀










       ┌──────────────────────────────────────────────────────────────┐
       │Type your message... (Enter to send)                          │
       └──────────────────────────────────────────────────────────────┘



    "
  `)
}, 10000)

test('can type in the input field', async () => {
  await session.text({
    waitFor: (text) => {
      return /Type your message/i.test(text)
    },
  })

  await session.type('Hello AI!')
  await session.waitIdle()

  const afterTypingSnapshot = await session.text()
  expect(afterTypingSnapshot).toMatchInlineSnapshot(`
    "





         Welcome! Type a message to start chatting.

















       ┌──────────────────────────────────────────────────────────────┐
       │Hello AI!                                                     │
       └──────────────────────────────────────────────────────────────┘



    "
  `)
}, 10000)

test('submitting message shows user and assistant messages', async () => {
  await session.text({
    waitFor: (text) => {
      return /Type your message/i.test(text)
    },
  })

  // Type a message
  await session.type('Hi')
  await session.waitIdle()

  // Submit with Enter (custom keybinding)
  await session.press('return')

  // Wait for the complete response - input placeholder returns when done
  const assistantSnapshot = await session.text({
    waitFor: (text) => {
      // Complete when: has Bash tool, text response, and input is back to normal
      return /Bash/.test(text) && 
             /well-organized/.test(text) && 
             /Type your message.*Enter to send/.test(text)
    },
    timeout: 20000,
  })

  expect(assistantSnapshot).toMatchInlineSnapshot(`
    "



         ◆ Bash(git status)
           ⎿  On branch main
              nothing to commit, working tree clean

         Based on my analysis of your codebase, I can see this is a
         TypeScript project with the following structure:

         - **package.json** - Project configuration
         - **src/index.ts** - Main entry point
         - **src/utils.ts** - Utility functions
         - **README.md** - Documentation
         - **tsconfig.json** - TypeScript config

         The project appears to be well-organized. How can I help
         you with it?

         claude-sonnet-4-20250514  · 2.4s                             █
                                                                      █
                                                                      █

       ┌──────────────────────────────────────────────────────────────┐
       │Type your message... (Enter to send)                          │
       └──────────────────────────────────────────────────────────────┘



    "
  `)
}, 30000)
