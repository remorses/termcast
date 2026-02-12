import { test, expect, afterEach, beforeEach } from 'vitest'
import { launchTerminal, Session } from 'tuistory/src'

let session: Session

beforeEach(async () => {
  session = await launchTerminal({
    command: 'bun',
    args: ['src/examples/list-detail-metadata.tsx'],
    cols: 80,
    rows: 40,
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
       Long Values                          │ Details
       Colored & Tags                       │
                                            │
                                            │ Name:    John Doe
                                            │
                                            │ Email:   john@example.com
                                            │
                                            │ ──────────────────────────────────
                                            │
                                            │ Status:  Active
                                            │
                                            │ Website: example.com
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
      ›Long Values                          │ Info with Long Values
       Colored & Tags                       │
                                            │
                                            │ Description: This is a very long
                                            │              description that
                                            │              would be truncated
                                            │              if shown inline
                                            │
                                            │ Path:        /Users/username/
                                            │              Documents/Projects/
                                            │              my-project/src/
                                            │              components
                                            │
                                            │ ──────────────────────────────────
                                            │
                                            │ Short:       OK
                                            │
                                            │ URL:         example.com/very/
                                            │              long/path
       ↑↓ navigate   ^k actions             │












    "
  `)
}, 10000)

test('list detail metadata renders colored values and tag lists', async () => {
  await session.text({
    waitFor: (text) => text.includes('Metadata Test'),
  })

  // Navigate to third item
  await session.press('down')
  await session.press('down')

  const snapshot = await session.text({
    waitFor: (text) => {
      return text.includes('Colored & Tags') && text.includes('Project Status') && text.includes('Tags')
    },
  })

  expect(snapshot).toMatchInlineSnapshot(`
    "


       Metadata Test ────────────────────────────────────────────────────────────

       > Search...

       Short Values
       Long Values                          │ Project Status
      ›Colored & Tags                       │
                                            │ Overview of the current project
                                            │ state.
                                            │
                                            │
                                            │ Info
                                            │
                                            │ Status:   Active
                                            │
                                            │ Priority: High
                                            │
                                            │ Type:     Feature
                                            │
                                            │ ──────────────────────────────────
                                            │
                                            │ Labels
                                            │
                                            │ Tags:     bug feature urgent
                                            │
                                            │ ──────────────────────────────────
                                            │
                                            │ Repo:     github.com/example
       ↑↓ navigate   ^k actions             │








    "
  `)

  // Verify colored values present
  expect(snapshot).toContain('Active')
  expect(snapshot).toContain('High')
  expect(snapshot).toContain('Feature')

  // Verify tags present
  expect(snapshot).toContain('bug')
  expect(snapshot).toContain('feature')
  expect(snapshot).toContain('urgent')

  // Verify link
  expect(snapshot).toContain('github.com/example')
}, 10000)
