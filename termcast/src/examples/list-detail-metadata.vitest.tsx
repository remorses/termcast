import { test, expect, afterEach, beforeEach } from 'vitest'
import { launchTerminal, Session } from 'tuistory/src'

let session: Session

beforeEach(async () => {
  session = await launchTerminal({
    command: 'bun',
    args: ['src/examples/list-detail-metadata.tsx'],
    cols: 80,
    rows: 20,
  })
})

afterEach(() => {
  session?.close()
})

test('list detail metadata label renders short values in row layout (key: value)', async () => {
  const snapshot = await session.text({
    waitFor: (text) => {
      return (
        text.includes('Metadata Test') &&
        text.includes('Name') &&
        text.includes('John Doe') &&
        text.includes('Email')
      )
    },
  })

  expect(snapshot).toMatchInlineSnapshot(`
    "


       Metadata Test ────────────────────────────────────────────────────────────

       > Search...

      ›Short Values
       Long Values                          │
                                            │
                                            │
                                            │ Name:       John Doe
                                            │
                                            │ Email:      john@example.com
                                            │ ─────────────────
                                            │
                                            │ Status:     Active
                                            │ Website:    example.com
       ↑↓ navigate   ^k actions             │

    "
  `)
}, 10000)

test('list detail metadata renders long values in column layout (key on one line, value below)', async () => {
  await session.text({
    waitFor: (text) => text.includes('Metadata Test'),
  })

  await session.press('down')

  const snapshot = await session.text({
    waitFor: (text) => {
      return text.includes('Description') && text.includes('very long')
    },
  })

  expect(snapshot).toMatchInlineSnapshot(`
    "


       Metadata Test ────────────────────────────────────────────────────────────

       > Search...

       Short Values
      ›Long Values                          │ Info with Long Values             ▲
                                            │                                   █
                                            │
                                            │ Description:
                                            │ This is a very long description
                                            │ that would be truncated if shown
                                            │ inline
                                            │
                                            │ Path:
                                            │ /Users/username/Documents/
       ↑↓ navigate   ^k actions             │ Projects/my-project/src/components▼

    "
  `)
}, 10000)
