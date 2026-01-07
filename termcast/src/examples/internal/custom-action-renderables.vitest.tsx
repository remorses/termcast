import { test, expect } from 'vitest'
import { launchTerminal } from 'tuistory'

test('extracts first action title via tree traversal', async () => {
  const session = await launchTerminal({
    command: 'bun',
    args: ['src/examples/internal/custom-action-renderables.tsx'],
    cols: 80,
    rows: 24,
  })

  const text = await session.text({
    waitFor: (text) => text.includes('First action: Eat Apple'),
  })

  expect(text).toMatchInlineSnapshot(`
    "



       Custom Action Renderables Example

       Press ⏎ to show actions

       First action: Eat Apple















    "
  `)
  expect(text).toContain('First action: Eat Apple')
  expect(text).toContain('Press ⏎ to show actions')

  session.close()
}, 30000)

test('shows actions dialog on enter', async () => {
  const session = await launchTerminal({
    command: 'bun',
    args: ['src/examples/internal/custom-action-renderables.tsx'],
    cols: 80,
    rows: 24,
  })

  await session.text({ waitFor: (text) => text.includes('First action: Eat Apple') })

  await session.press('return')
  
  const text = await session.text({
    waitFor: (text) => text.includes('Actions') && text.includes('› Eat Apple'),
  })

  expect(text).toMatchInlineSnapshot(`
    "



       Custom Action Renderables Example
       Press ⏎ to show actions

       First action: Eat Apple
       ┌────────────────────────────────────────────────────────────────────────┐
       │                                                                        │
       │ Actions                                                                │
       │                                                                        │
       │ Search actions...                                                      │
       │ › Eat Apple                                                            │
       │   Cook Apple                                                           │
       │   Throw Apple                                                          │
       │                                                                        │
       │                                                                        │
       │ 3 of 3 items                                                           │
       │ ↑↓ navigate • ⏎ select • esc close                                     │
       │                                                                        │
       └────────────────────────────────────────────────────────────────────────┘


    "
  `)
  expect(text).toContain('› Eat Apple')
  expect(text).toContain('Cook Apple')
  expect(text).toContain('Throw Apple')

  session.close()
}, 30000)
