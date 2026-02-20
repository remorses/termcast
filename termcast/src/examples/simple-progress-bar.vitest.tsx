// E2E tests for ProgressBar example.
// Verifies ProgressBar in List.Item.Detail.Metadata updates per selected item.

import { test, expect, afterEach, beforeEach } from 'vitest'
import { launchTerminal, Session } from 'tuistory/src'

let session: Session

beforeEach(async () => {
  session = await launchTerminal({
    command: 'bun',
    args: ['src/examples/simple-progress-bar.tsx'],
    cols: 80,
    rows: 24,
  })
})

afterEach(() => {
  session?.close()
})

test('progress bars render in detail metadata and update on selection', async () => {
  const initial = await session.text({
    waitFor: (text) => {
      return text.includes('OpenAI account') && text.includes('37% used')
    },
    timeout: 10000,
  })

  expect(initial).toMatchInlineSnapshot(`
    "


       ProgressBar Metadata ─────────────────────────────────────────────────────

       > Search...

      ›OpenAI account default workspace     │ Current session
       Anthropic account research workspace │ █████████░░░░░░░░░░░░░░░░ 37% used
       Google account sandbox workspace     │ Resets 9pm (Asia/Bangkok)
                                            │
                                            │ Current week (all models)
                                            │ ██░░░░░░░░░░░░░░░░░░░░░░░░ 7% used
                                            │ Resets Feb 27, 1pm (Asia/Bangkok)
                                            │
       ↑↓ navigate   ^k actions             │








    "
  `)

  expect(initial).toContain('37% used')
  expect(initial).toContain('7% used')

  await session.press('down')

  const second = await session.text({
    waitFor: (text) => {
      return text.includes('›Anthropic account') && text.includes('82% used')
    },
    timeout: 10000,
  })

  expect(second).toContain('46% used')
  expect(second).toContain('Europe/Rome')
}, 30000)
