import { test, expect, afterEach, beforeEach } from 'vitest'
import { launchTerminal, Session } from 'tuistory/src'

let session: Session

beforeEach(async () => {
  session = await launchTerminal({
    command: 'bun',
    args: ['src/examples/simple-detail-markdown.tsx'],
    cols: 80,
    rows: 50,
  })
})

afterEach(() => {
  session?.close()
})

test('detail renders markdown with headings, lists, links, code and diagram', async () => {
  const text = await session.text({
    waitFor: (text) => {
      return text.includes('Architecture') && text.includes('processRequest')
    },
    timeout: 10000,
  })

  expect(text).toMatchInlineSnapshot(`
    "




      Architecture Overview

      This document describes the system architecture.

      Components

      The system has three main components:

      - Client - handles user interaction
      - Server - processes requests
      - Database - stores data

      Links

      Check out the GitHub repository for the source code.

      See the API documentation for more details.

      A paragraph with multiple links inline here.

      Flow

      ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
      │   Client    │────▶│   Server    │────▶│  Database   │
      └─────────────┘     └─────────────┘     └─────────────┘

      Code Example

      function processRequest(input: string): Result {
        const validated = validate(input)
        return db.query(validated)
      }

      > Note: All connections use TLS encryption.

      The system handles ~10k requests/second.


      esc go back                                              powered by termcast






    "
  `)
  // Headings
  expect(text).toContain('Architecture')
  expect(text).toContain('Components')
  // List items
  expect(text).toContain('Client')
  expect(text).toContain('Server')
  expect(text).toContain('Database')
  // Links - title text visible
  expect(text).toContain('GitHub repository')
  expect(text).toContain('API documentation')
  // Diagram box-drawing chars
  expect(text).toContain('┌─')
  expect(text).toContain('─┐')
  // Code block
  expect(text).toContain('processRequest')
  expect(text).toContain('validate')
  // Blockquote
  expect(text).toContain('TLS encryption')
}, 30000)
