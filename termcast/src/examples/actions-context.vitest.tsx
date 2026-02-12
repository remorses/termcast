import { test, expect, afterEach, beforeEach } from 'vitest'
import { launchTerminal, Session } from 'tuistory/src'

let session: Session

beforeEach(async () => {
  session = await launchTerminal({
    command: 'bun',
    args: ['src/examples/actions-context.tsx'],
    cols: 70,
    rows: 20,
  })
})

afterEach(() => {
  session?.close()
})

test('actions preserve React context through portal', async () => {
  // Wait for list to render
  await session.text({
    waitFor: (text) => /Counter: 42/.test(text),
  })

  const initial = await session.text()
  expect(initial).toContain('Counter:')

  // Open actions panel with Ctrl+K
  await session.press(['ctrl', 'k'])

  const actionsPanel = await session.text({
    waitFor: (text) => /Show Counter/.test(text),
    timeout: 5000,
  })
  // Verify the actions dialog is shown with our custom action
  expect(actionsPanel).toContain('Show Counter')
  expect(actionsPanel).toContain('Increment')
  expect(actionsPanel).toMatchInlineSnapshot(`
    "

      ╭────────────────────────────────────────────────────────────────╮
      │                                                                │
      │   Actions                                                esc   │
      │                                                                │
      │   > Search actions...                                          │
      │                                                                │
      │  ›Show Counter                                                 │
      │   Increment                                                    │
      │                                                                │
      │   Settings                                                     │
      │   Change Theme...                                              │
      │   See Console Logs                                             │
      │                                                                │
      │                                                                │
      │                                                                │
      │                                                                │
      │                                                                │
      │   ↵ select   ↑↓ navigate                                       │
      │                                                                │"
  `)

  // Select "Show Counter" (first action, already selected)
  await session.press('return')

  // Verify toast shows correct context value (prop=42 ctx=42)
  const afterAction = await session.text({
    waitFor: (text) => /prop=42 ctx=42/.test(text),
    timeout: 5000,
  })
  expect(afterAction).toContain('prop=42')
}, 30000)

test('actions context stays fresh after state updates', async () => {
  // Wait for list to render
  await session.text({
    waitFor: (text) => /Counter: 42/.test(text),
  })

  // Open actions, select "Increment" to change counter
  await session.press(['ctrl', 'k'])
  await session.text({
    waitFor: (text) => /Increment/.test(text),
    timeout: 5000,
  })

  // Navigate down to "Increment" action
  await session.press('down')
  await session.press('return')

  // Wait for counter to update to 43
  await session.text({
    waitFor: (text) => /Counter: 43/.test(text),
    timeout: 5000,
  })

  // Now open actions again and run "Show Counter"
  await session.press(['ctrl', 'k'])
  await session.text({
    waitFor: (text) => /Show Counter/.test(text),
    timeout: 5000,
  })
  await session.press('return')

  // Verify toast shows UPDATED context value (43, not stale 42)
  const afterAction = await session.text({
    waitFor: (text) => /prop=43 ctx=43/.test(text),
    timeout: 5000,
  })
  expect(afterAction).toContain('prop=43')
}, 30000)
