/**
 * Tests for CustomDropdown component
 */

import { test, expect } from 'vitest'
import { launchTerminal } from 'tuistory'

test('dropdown renders items and shows selection', async () => {
  const session = await launchTerminal({
    command: 'bun',
    args: ['src/examples/internal/custom-dropdown.tsx'],
    cols: 60,
    rows: 15,
  })

  const initial = await session.text({
    waitFor: (text) => text.includes('Apple') && text.includes('Banana'),
  })

  expect(initial).toMatchInlineSnapshot(`
    "



       Custom Dropdown Example
       Hover: Apple

       ┌────────────────────────────────────────────────────┐
       │› Apple                                             │
       │  Banana                                            │
       │                                                   ▀│
       │4 of 4 items                                        │
       └────────────────────────────────────────────────────┘


    "
  `)
  expect(initial).toContain('› Apple')

  session.close()
}, 30000)

test('dropdown keyboard navigation', async () => {
  const session = await launchTerminal({
    command: 'bun',
    args: ['src/examples/internal/custom-dropdown.tsx'],
    cols: 60,
    rows: 15,
  })

  await session.text({ waitFor: (text) => text.includes('› Apple') })

  // Navigate down
  await session.press('down')
  const atBanana = await session.text({
    waitFor: (text) => text.includes('› Banana'),
  })

  expect(atBanana).toMatchInlineSnapshot(`
    "



       Custom Dropdown Example
       Hover: Banana

       ┌────────────────────────────────────────────────────┐
       │› Banana                                            │
       │  Carrot                                            │
       │                                                    │
       │4 of 4 items                                       ▀│
       └────────────────────────────────────────────────────┘


    "
  `)
  expect(atBanana).toContain('› Banana')

  // Navigate down again
  await session.press('down')
  const atCarrot = await session.text({
    waitFor: (text) => text.includes('› Carrot'),
  })

  expect(atCarrot).toContain('› Carrot')

  // Navigate up
  await session.press('up')
  const backToBanana = await session.text({
    waitFor: (text) => text.includes('› Banana'),
  })

  expect(backToBanana).toContain('› Banana')

  session.close()
}, 30000)

test('dropdown search filtering', async () => {
  const session = await launchTerminal({
    command: 'bun',
    args: ['src/examples/internal/custom-dropdown.tsx'],
    cols: 60,
    rows: 15,
  })

  await session.text({ waitFor: (text) => text.includes('› Apple') })

  // Type to search
  await session.type('ban')
  const filtered = await session.text({
    waitFor: (text) => text.includes('› Banana') && !text.includes('Apple'),
  })

  expect(filtered).toMatchInlineSnapshot(`
    "



       Custom Dropdown Example
       Hover: Banana

       ┌────────────────────────────────────────────────────┐
       │ban                                                 │
       │› Banana                                            │
       │                                                    │
       │1 of 4 items • "ban"                                │
       └────────────────────────────────────────────────────┘


    "
  `)
  expect(filtered).toContain('› Banana')
  expect(filtered).not.toContain('Apple')

  session.close()
}, 30000)

test('dropdown enter triggers onSelect callback', async () => {
  const session = await launchTerminal({
    command: 'bun',
    args: ['src/examples/internal/custom-dropdown.tsx'],
    cols: 60,
    rows: 15,
  })

  await session.text({ waitFor: (text) => text.includes('› Apple') })

  // Press enter to select
  await session.press('return')
  const afterSelect = await session.text({
    waitFor: (text) => text.includes('Selected: Apple'),
  })

  expect(afterSelect).toMatchInlineSnapshot()
  expect(afterSelect).toContain('Selected: Apple')

  session.close()
}, 30000)

test('dropdown scroll with many items', async () => {
  const session = await launchTerminal({
    command: 'bun',
    args: ['src/examples/internal/custom-dropdown.tsx', '--many'],
    cols: 60,
    rows: 12,
  })

  await session.text({ waitFor: (text) => text.includes('Item 1') })

  // Navigate down multiple times to trigger scroll
  for (let i = 0; i < 8; i++) {
    await session.press('down')
  }

  const scrolled = await session.text({
    waitFor: (text) => text.includes('› Item 9'),
  })

  expect(scrolled).toMatchInlineSnapshot(`
    "



       Custom Dropdown Example
       Hover: Item 9
       ┌────────────────────────────────────────────────────┐
       │› Item 9                                            │
       │20Iofm200items                                     ▀│
       └────────────────────────────────────────────────────┘


    "
  `)
  expect(scrolled).toContain('› Item 9')

  session.close()
}, 30000)

test('dropdown onSelectionChange callback', async () => {
  const session = await launchTerminal({
    command: 'bun',
    args: ['src/examples/internal/custom-dropdown.tsx'],
    cols: 60,
    rows: 15,
  })

  await session.text({ waitFor: (text) => text.includes('› Apple') })

  // Navigate to trigger onSelectionChange
  await session.press('down')
  const changed = await session.text({
    waitFor: (text) => text.includes('Hover: Banana'),
  })

  expect(changed).toContain('Hover: Banana')

  session.close()
}, 30000)
