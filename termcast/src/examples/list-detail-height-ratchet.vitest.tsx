// E2E tests for the detail panel grow-only height ratchet.
// Verifies that the footer does not shift up when navigating from a tall
// detail item to a short one. The detail panel's minHeight should ratchet
// upward and never shrink back.
import { test, expect, afterEach, beforeEach } from 'vitest'
import { launchTerminal, Session } from 'tuistory/src'

let session: Session

beforeEach(async () => {
  session = await launchTerminal({
    command: 'bun',
    args: ['src/examples/list-detail-height-ratchet.tsx'],
    cols: 80,
    rows: 30,
  })
})

afterEach(() => {
  session?.close()
})

function getFooterLineNumber(snapshot: string): number {
  const lines = snapshot.split('\n')
  return lines.findIndex((line) => line.includes('navigate'))
}

test('detail panel height ratchet prevents footer layout shift', async () => {
  // Item 0 is short detail
  const shortSnapshot = await session.text({
    waitFor: (text) => {
      return text.includes('›Item 0') && text.includes('Brief') && text.includes('navigate')
    },
    timeout: 10000,
  })
  expect(shortSnapshot).toMatchInlineSnapshot(`
    "


       Height Ratchet Test ──────────────────────────────────────────────────────

       > Search...

      ›Item 0 short                         │ Item 0 (short)
       Item 1 tall                          │
       Item 2 short                         │
       Item 3 tall                          │ Brief.
       Item 4 short                         │
       Item 5 tall                          │
       Item 6 short                         │
       Item 7 tall                          │
       Item 8 short                         │
       Item 9 tall                          │
       Item 10 short                        │
       Item 11 tall                         │
       Item 12 short                        │
       Item 13 tall                         │
       Item 14 short                        │
       Item 15 tall                         │
       Item 16 short                        │
       Item 17 tall                         │
       Item 18 short                        │
                                            │
                                            │
       ↑↓ navigate   ^k actions             │

    "
  `)

  // Navigate to Item 1 (tall detail) to ratchet the height up
  await session.press('down')

  const tallSnapshot = await session.text({
    waitFor: (text) => {
      return text.includes('›Item 1') && text.includes('Line 1') && text.includes('navigate')
    },
  })
  expect(tallSnapshot).toMatchInlineSnapshot(`
    "


       Height Ratchet Test ──────────────────────────────────────────────────────

       > Search...

       Item 0 short                         │ Item 1 (tall)                     ▲
      ›Item 1 tall                          │ Line 1 of detail content for item █
       Item 2 short                         │ 1.                                █
       Item 3 tall                          │ Line 2 of detail content for item █
       Item 4 short                         │ 1.                                █
       Item 5 tall                          │ Line 3 of detail content for item █
       Item 6 short                         │ 1.
       Item 7 tall                          │ Line 4 of detail content for item
       Item 8 short                         │ 1.
       Item 9 tall                          │ Line 5 of detail content for item
       Item 10 short                        │ 1.
       Item 11 tall                         │ Line 6 of detail content for item
       Item 12 short                        │ 1.
       Item 13 tall                         │ Line 7 of detail content for item
       Item 14 short                        │ 1.
       Item 15 tall                         │ Line 8 of detail content for item
       Item 16 short                        │ 1.
       Item 17 tall                         │ Line 9 of detail content for item
       Item 18 short                        │ 1.
                                            │ Line 10 of detail content for
                                            │ item 1.
       ↑↓ navigate   ^k actions             │ Line 11 of detail content for     ▼

    "
  `)

  // Navigate back to Item 0 (short detail).
  // The footer should stay at the same line as the tall snapshot.
  await session.press('up')

  const backToShortSnapshot = await session.text({
    waitFor: (text) => {
      return text.includes('›Item 0') && text.includes('Brief') && text.includes('navigate')
    },
  })
  expect(backToShortSnapshot).toMatchInlineSnapshot(`
    "


       Height Ratchet Test ──────────────────────────────────────────────────────

       > Search...

      ›Item 0 short                         │ Item 0 (short)
       Item 1 tall                          │ Brief.
       Item 2 short                         │
       Item 3 tall                          │
       Item 4 short                         │
       Item 5 tall                          │
       Item 6 short                         │
       Item 7 tall                          │
       Item 8 short                         │
       Item 9 tall                          │
       Item 10 short                        │
       Item 11 tall                         │
       Item 12 short                        │
       Item 13 tall                         │
       Item 14 short                        │
       Item 15 tall                         │
       Item 16 short                        │
       Item 17 tall                         │
       Item 18 short                        │
                                            │
                                            │
       ↑↓ navigate   ^k actions             │

    "
  `)

  // The key assertion: footer line should not move up when going from tall to short
  const footerLineTall = getFooterLineNumber(tallSnapshot)
  const footerLineBackToShort = getFooterLineNumber(backToShortSnapshot)

  expect(footerLineBackToShort).toBe(footerLineTall)
  expect(backToShortSnapshot).toContain('navigate')
}, 20000)
