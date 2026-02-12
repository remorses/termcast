/**
 * E2E tests for List spacingMode prop.
 *
 * Tests both 'default' (single-line) and 'relaxed' (two-line) modes
 * to verify layout differences and subtitle alignment.
 */

import { test, expect, afterEach, beforeEach, describe } from 'vitest'
import { launchTerminal, Session } from 'tuistory/src'

describe('spacingMode default', () => {
  let session: Session

  beforeEach(async () => {
    session = await launchTerminal({
      command: 'bun',
      args: ['src/examples/list-spacing-default.tsx'],
      cols: 70,
      rows: 20,
    })
  })

  afterEach(() => {
    session?.close()
  })

  test('renders single-line items with title and subtitle on same row', async () => {
    await session.text({
      waitFor: (text) => /Default Mode/i.test(text),
    })

    const text = await session.text()
    expect(text).toMatchInlineSnapshot(`
      "


         Default Mode ───────────────────────────────────────────────────

         > Search...

         With Icons
        ›▯ Report Q4 financial summary                            [Draft]
         ⟨⟩ API Docs REST endpoints guide                            v2.1

         Without Icons
         Meeting Notes Weekly standup points                  [Important]

         No Subtitle
         ★ Favorites


         ↑↓ navigate   ^k actions

      "
    `)

    // Title and subtitle on same line
    expect(text).toContain('Report')
    expect(text).toContain('Q4 financial')
  }, 10000)
})

describe('spacingMode relaxed', () => {
  let session: Session

  beforeEach(async () => {
    session = await launchTerminal({
      command: 'bun',
      args: ['src/examples/list-spacing-relaxed.tsx'],
      cols: 70,
      rows: 25,
    })
  })

  afterEach(() => {
    session?.close()
  })

  test('renders two-line items with subtitle below title', async () => {
    await session.text({
      waitFor: (text) => /Relaxed Mode/i.test(text),
    })

    const text = await session.text()
    expect(text).toMatchInlineSnapshot(`
      "


         Relaxed Mode ───────────────────────────────────────────────────

         > Search...

         With Icons
        ›▯ Report                                                 [Draft]
           Q4 financial summary

         ⟨⟩ API Docs                                                 v2.1
           REST endpoints guide


         Without Icons
         Meeting Notes                                        [Important]
         Weekly standup points


         No Subtitle


         ↑↓ navigate   ^k actions

      "
    `)

    // Should have content
    expect(text).toContain('Report')
    expect(text).toContain('Q4 financial')
  }, 10000)

  test('navigates through relaxed items', async () => {
    await session.text({
      waitFor: (text) => /Relaxed Mode/i.test(text),
    })

    await session.press('down')
    const afterDown = await session.text()
    expect(afterDown).toMatchInlineSnapshot(`
      "


         Relaxed Mode ───────────────────────────────────────────────────

         > Search...

         With Icons
         ▯ Report                                                 [Draft]
           Q4 financial summary

        ›⟨⟩ API Docs                                                 v2.1
           REST endpoints guide


         Without Icons
         Meeting Notes                                        [Important]
         Weekly standup points


         No Subtitle


         ↑↓ navigate   ^k actions

      "
    `)

    // Second item should be selected
    expect(afterDown).toContain('API Docs')
  }, 10000)
})
