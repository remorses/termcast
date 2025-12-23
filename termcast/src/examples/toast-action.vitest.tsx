import { test, expect, afterEach, beforeEach } from 'vitest'
import { launchTerminal, Session } from 'tuistory/src'

let session: Session

beforeEach(async () => {
  session = await launchTerminal({
    command: 'bun',
    args: ['src/examples/toast-action.tsx'],
    cols: 70,
    rows: 20,
  })
})

afterEach(() => {
  session?.close()
})

test('pressing enter triggers primary action on toast', async () => {
  // Wait for the toast with action to appear
  await session.text({
    waitFor: (text) => text.includes('[Undo ↵]'),
  })

  const beforeEnter = await session.text()
  expect(beforeEnter).toMatchInlineSnapshot(`
    "


     Toast Action Test ──────────────────────────────────────────────

     Search...

    ›Show Toast with Action
     Other Item








                   ┌───────────────────────────────────┐
                   │ ✓ File Deleted [Undo ↵]           │
                   │   document.pdf was moved to trash │
                   └───────────────────────────────────┘"
  `)

  expect(beforeEnter).toContain('[Undo')

  // Press Enter to trigger the primary action
  await session.press('enter')
  await new Promise((r) => setTimeout(r, 300))

  const afterEnter = await session.text()
  expect(afterEnter).toMatchInlineSnapshot(`
    "


     Toast Action Test ──────────────────────────────────────────────

     Search...

    ›Show Toast with Action
     Other Item








                            ┌─────────────────┐
                            │ ✓ Undone        │
                            │   File restored │
                            └─────────────────┘"
  `)

  expect(afterEnter).toContain('Undone')
}, 30000)
