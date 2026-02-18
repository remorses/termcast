/**
 * E2E tests for ctrl+k with no extension-provided actions.
 * Verifies that the built-in action panel (Change Theme, See Console Logs)
 * is always accessible via ctrl+k, even when items have no actions prop.
 */
import { test, expect, afterEach, beforeEach } from 'vitest'
import { launchTerminal, Session } from 'tuistory/src'

let session: Session

beforeEach(async () => {
  session = await launchTerminal({
    command: 'bun',
    args: ['src/examples/list-no-actions.tsx'],
    cols: 70,
    rows: 20,
  })
})

afterEach(() => {
  session?.close()
})

test('footer does not show stale action title from built-in actions', async () => {
  const initial = await session.text({
    waitFor: (text) => /Item without actions/.test(text),
  })

  // Footer should show ^k actions but NOT "↵ change theme..." — the useLayoutEffect
  // in CurrentItemActionsOffscreen clears firstActionTitle for items without actions
  expect(initial).toContain('^k')
  expect(initial).not.toContain('change theme')
  expect(initial).toMatchInlineSnapshot(`
    "


       No Actions Test ────────────────────────────────────────────────

       > Search...

      ›Item without actions Press ctrl+k
       Another item Also no actions






       ↑↓ navigate   ^k actions




    "
  `)
}, 30000)

test('ctrl+k opens built-in actions when item has no actions', async () => {
  await session.text({
    waitFor: (text) => /Item without actions/.test(text),
  })

  // Press ctrl+k to open action panel
  await session.press(['ctrl', 'k'])

  const actionsPanel = await session.text({
    waitFor: (text) => /Change Theme/.test(text),
    timeout: 5000,
  })

  // Built-in actions should appear
  expect(actionsPanel).toContain('Change Theme')
  expect(actionsPanel).toContain('Console Logs')
  expect(actionsPanel).toMatchInlineSnapshot(`
    "

      ╭────────────────────────────────────────────────────────────────╮
      │                                                                │
      │   Actions                                                esc   │
      │                                                                │
      │   > Search actions...                                          │
      │                                                                │
      │                                                                │
      │   Settings                                                     │
      │  ›Change Theme...                                              │
      │   See Console Logs                                             │
      │                                                                │
      │                                                                │
      │                                                                │
      │                                                                │
      │                                                                │
      │                                                                │
      │                                                                │
      │   ↵ select   ↑↓ navigate                                       │
      │                                                                │"
  `)
}, 30000)
