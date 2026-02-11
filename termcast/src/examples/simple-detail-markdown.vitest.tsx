import { test, expect, afterEach, beforeEach } from 'vitest'
import { launchTerminal, Session } from 'tuistory/src'

let session: Session

beforeEach(async () => {
  session = await launchTerminal({
    command: 'bun',
    args: ['src/examples/simple-detail-markdown.tsx'],
    cols: 80,
    rows: 70,
  })
})

afterEach(() => {
  session?.close()
})

test('detail renders markdown with headings, lists, links, tables, code and diagrams', async () => {
  const text = await session.text({
    waitFor: (text) => {
      return text.includes('Architecture') && text.includes('Configuration Table') && text.includes('Process')
    },
    timeout: 10000,
  })

  expect(text).toMatchInlineSnapshot(`
    "


                                                                                 █
                                                                                 █
      Architecture Overview                                                      ▀

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

      Nested formatting: bold with link inside and italic with link.

      Configuration Table

      ┌───────────┬───────────┬───────────────────────┐
      │Setting    │Default    │Description            │
      │───────────│───────────│───────────────────────│
      │Host       │localhost  │Database host address  │
      │───────────│───────────│───────────────────────│
      │Port       │5432       │Database port number   │
      │───────────│───────────│───────────────────────│
      │SSL        │false      │Enable TLS encryption  │
      │───────────│───────────│───────────────────────│
      │Pool Size  │10         │Max connections        │
      └───────────┴───────────┴───────────────────────┘

      Flow Diagram

      ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
      │   Client    │────▶│   Server    │────▶│  Database   │
      └─────────────┘     └─────────────┘     └─────────────┘

      Vertical Flow

           ┌─────────┐
           │  Start  │
           └────┬────┘
                │
                ▼
           ┌─────────┐
           │ Process │
           └────┬────┘
                │
                ▼
           ┌─────────┐
           │   End   │
           └─────────┘

      Code Example

      interface Config {


      esc go back                                              powered by termcast

    "
  `)
  // Headings
  expect(text).toContain('Architecture')
  expect(text).toContain('Components')
  expect(text).toContain('Configuration Table')
  // List items
  expect(text).toContain('Client')
  expect(text).toContain('Server')
  expect(text).toContain('Database')
  // Links - title text visible, URLs hidden
  expect(text).toContain('GitHub repository')
  expect(text).toContain('API documentation')
  expect(text).toContain('link inside')
  // Table
  expect(text).toContain('Setting')
  expect(text).toContain('localhost')
  expect(text).toContain('5432')
  // Diagram box-drawing chars
  expect(text).toContain('┌─')
  expect(text).toContain('─┐')
  expect(text).toContain('Process')
  // Code block header visible (content may need scroll)
  expect(text).toContain('Code Example')
  expect(text).toContain('interface Config')
}, 30000)
