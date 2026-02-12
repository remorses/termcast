/**
 * E2E tests for action shortcuts.
 * Verifies that pressing action shortcuts (like ctrl+r for Refresh)
 * triggers the action directly without opening the action panel.
 *
 * Note: ctrl+digit shortcuts don't work reliably because terminals
 * don't have standard control codes for ctrl+0-9. Use letter shortcuts.
 */
import { test, expect, afterEach, beforeEach } from 'vitest'
import { launchTerminal, Session } from 'tuistory/src'

let session: Session

beforeEach(async () => {
  session = await launchTerminal({
    command: 'bun',
    args: ['src/examples/action-shortcut.tsx'],
    cols: 70,
    rows: 20,
  })
})

afterEach(() => {
  session?.close()
})

test('ctrl+r shortcut should trigger Refresh action directly', async () => {
  // Wait for list to render
  await session.text({
    waitFor: (text) => /Refresh count: 0/.test(text),
  })

  const initial = await session.text()
  expect(initial).toContain('Refresh count: 0')

  // Press ctrl+r directly to trigger Refresh action
  await session.press(['ctrl', 'r'])

  // Wait for the refresh to take effect
  const afterCtrlR = await session.text({
    waitFor: (text) => /Refresh count: 1/.test(text),
    timeout: 5000,
  })
  expect(afterCtrlR).toMatchInlineSnapshot(`
    "


       Action Shortcut Test ───────────────────────────────────────────

       > Search...

      ›Refresh count: 1 Press ctrl+r to refresh (shortcut) or Enter the







       ↵ refresh   ↑↓ navigate   ^k actions




    "
  `)
}, 30000)

test('action shortcut is displayed in action panel', async () => {
  // Wait for list to render
  await session.text({
    waitFor: (text) => /Refresh count: 0/.test(text),
  })

  // Open action panel with ctrl+k
  await session.press(['ctrl', 'k'])

  const actionsPanel = await session.text({
    waitFor: (text) => /Refresh/.test(text),
    timeout: 5000,
  })

  // Verify the shortcut is displayed (⌃R for ctrl+r)
  expect(actionsPanel).toContain('⌃R')
  expect(actionsPanel).toMatchInlineSnapshot(`
    "

      ╭────────────────────────────────────────────────────────────────╮
      │                                                                │
      │   Actions                                                esc   │
      │                                                                │
      │   > Search actions...                                          │
      │                                                                │
      │  ›Refresh                                                ⌃R    │
      │   Reset                                                  ⌃X    │
      │   Double                                                 ⌥D    │
      │                                                                │
      │   Settings                                                     │
      │   Change Theme...                                              │
      │   See Console Logs                                             │
      │                                                                │
      │                                                                │
      │                                                                │
      │                                                                │
      │   ↵ select   ↑↓ navigate                                       │
      │                                                                │"
  `)
}, 30000)

test('action works via Enter (auto-execute first action)', async () => {
  // Wait for list to render
  await session.text({
    waitFor: (text) => /Refresh count: 0/.test(text),
  })

  // Press Enter to auto-execute first action (Refresh)
  await session.press('return')

  const afterEnter = await session.text({
    waitFor: (text) => /Refresh count: 1/.test(text),
    timeout: 5000,
  })

  expect(afterEnter).toContain('Refresh count: 1')
}, 30000)

test('ctrl+x shortcut should trigger Reset action directly', async () => {
  // Wait for list to render and increment once via Enter
  await session.text({
    waitFor: (text) => /Refresh count: 0/.test(text),
  })

  // Increment via Enter first
  await session.press('return')
  await session.text({
    waitFor: (text) => /Refresh count: 1/.test(text),
    timeout: 5000,
  })

  // Now try ctrl+x to reset
  await session.press(['ctrl', 'x'])

  // Wait for the reset to take effect
  const afterCtrlX = await session.text({
    waitFor: (text) => /Refresh count: 0/.test(text),
    timeout: 5000,
  })
  expect(afterCtrlX).toContain('Refresh count: 0')
}, 30000)

test('alt+d shortcut should trigger Double action directly', async () => {
  // Wait for list to render
  await session.text({
    waitFor: (text) => /Refresh count: 0/.test(text),
  })

  // Increment twice via Enter to get count=2
  await session.press('return')
  await session.text({
    waitFor: (text) => /Refresh count: 1/.test(text),
    timeout: 5000,
  })
  await session.press('return')
  await session.text({
    waitFor: (text) => /Refresh count: 2/.test(text),
    timeout: 5000,
  })

  // Now try alt+d to double (2 -> 4)
  await session.press(['alt', 'd'])

  // Wait for the double to take effect
  const afterAltD = await session.text({
    waitFor: (text) => /Refresh count: 4/.test(text),
    timeout: 5000,
  })
  expect(afterAltD).toContain('Refresh count: 4')
}, 30000)
