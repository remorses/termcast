import { test, expect, afterEach, beforeEach } from 'vitest'
import { launchTerminal, Session } from 'tuistory/src'

let session: Session

beforeEach(async () => {
  session = await launchTerminal({
    command: 'bun',
    args: ['src/examples/simple-dropdown.tsx'],
    cols: 60,
    rows: 20,
  })
})

afterEach(() => {
  session?.close()
})

test('dropdown highlights item matching initial value prop', async () => {
  const initial = await session.text({
    waitFor: (text) => {
      return text.includes('Alcoholic Beverages') && text.includes('Beer')
    },
  })
  expect(initial).toMatchInlineSnapshot(`
    "


         Select Drink Type                              esc

         > Search drinks...

                                                           ▀
         Alcoholic Beverages
        ›🍺 Beer                                       ⌃B
         🍷 Wine                                       ⌃W
         🥃 Whiskey                                    ⌘W

         Non-Alcoholic

         ↵ select   ↑↓ navigate




    "
  `)

  // The › indicator should be on Beer (value='beer' matches initial state)
  expect(initial).toContain('›🍺 Beer')
  // Textarea shows search placeholder, not selected value
  expect(initial).toContain('Search drinks')
}, 10000)

test('dropdown navigation and selection', async () => {
  await session.text({
    waitFor: (text) => {
      return text.includes('Alcoholic Beverages')
    },
  })

  // Navigate down to Wine
  await session.press('down')
  const afterDown = await session.text()
  expect(afterDown).toMatchInlineSnapshot(`
    "


         Select Drink Type                              esc

         > Search drinks...

                                                           ▀
         Alcoholic Beverages
         🍺 Beer                                       ⌃B
        ›🍷 Wine                                       ⌃W
         🥃 Whiskey                                    ⌘W

         Non-Alcoholic

         ↵ select   ↑↓ navigate




    "
  `)

  // Now Wine should have the › indicator
  expect(afterDown).toContain('›🍷 Wine')

  // Select Wine
  await session.press('enter')
  const afterSelect = await session.text()
  expect(afterSelect).toMatchInlineSnapshot(`
    "


         Select Drink Type                              esc

         > Search drinks...

                                                           ▀
         Alcoholic Beverages
         🍺 Beer                                       ⌃B
        ›🍷 Wine                                       ⌃W
         🥃 Whiskey                                    ⌘W

         Non-Alcoholic

         ↵ select   ↑↓ navigate




    "
  `)

  // Wine should still be selected
  expect(afterSelect).toContain('›🍷 Wine')
}, 10000)

test('dropdown search filters items and shows typed text', async () => {
  await session.text({
    waitFor: (text) => text.includes('Alcoholic Beverages'),
  })

  // Type 'wine' to search
  await session.type('wine')
  const afterTyping = await session.text()
  expect(afterTyping).toMatchInlineSnapshot(`
    "


         Select Drink Type                              esc

         > wine


         Alcoholic Beverages
        ›🍷 Wine                                        ⌃W





         ↵ select   ↑↓ navigate




    "
  `)

  // Textarea should show 'wine', not placeholder
  expect(afterTyping).toContain('wine')
}, 10000)

test('dropdown shows dynamic items added after delay', async () => {
  // Wait for initial render
  await session.text({
    waitFor: (text) => text.includes('Alcoholic Beverages'),
  })

  // Wait for dynamic items to be added (500ms delay in example)
  await session.waitIdle(800)

  // Type 'smoothie' to filter - should show dynamic item
  await session.type('smoothie')
  const afterTyping = await session.text()

  expect(afterTyping).toMatchInlineSnapshot(`
    "


         Select Drink Type                              esc

         > smoothie


         Dynamic Items
        ›🥤 Smoothie





         ↵ select   ↑↓ navigate




    "
  `)

  // Verify dynamic item is visible after filtering
  expect(afterTyping).toContain('Smoothie')
}, 15000)
