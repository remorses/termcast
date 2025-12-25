import { test, expect, afterEach, beforeEach } from 'vitest'
import { launchTerminal, Session } from 'tuistory/src'

let session: Session

beforeEach(async () => {
  session = await launchTerminal({
    command: 'bun',
    args: ['src/examples/simple-grid.tsx'],
    cols: 70,
    rows: 25,
  })
})

afterEach(() => {
  session?.close()
})

test('grid navigation and display', async () => {
  const initialSnapshot = await session.text({
    waitFor: (text) => {
      // wait for grid to show up with all sections and items
      return (
        /Simple Grid Example/i.test(text) &&
        text.includes('Fruits') &&
        text.includes('Animals') &&
        text.includes('Others') &&
        text.includes('Apple')
      )
    },
  })

  expect(initialSnapshot).toMatchInlineSnapshot(`
    "


       Simple Grid Example ────────────────────────────────────────────

       Search items...

       Fruits                                                          ▲
      ›🍎 Apple                                                        ▀
       🍌 Banana
       🍒 Cherry

       Animals
       🐕 Dog
       🐱 Cat
       🐰 Rabbit

       Others
       🏠 House
       🚗 Car                                                          ▼


       ↵ show details    ↑↓ navigate    ^k actions

       Settings
    "
  `)

  // Navigate down
  await session.press('down')

  const afterDownSnapshot = await session.text()
  expect(afterDownSnapshot).toMatchInlineSnapshot(`
    "


       Simple Grid Example ────────────────────────────────────────────

       Search items...

       Fruits                                                          ▲
       🍎 Apple                                                        ▀
      ›🍌 Banana
       🍒 Cherry

       Animals
       🐕 Dog
       🐱 Cat
       🐰 Rabbit

       Others
       🏠 House
       🚗 Car                                                          ▼


       ↵ show details    ↑↓ navigate    ^k actions

       Settings
    "
  `)

  // Navigate right to Animals section
  await session.press('down')
  await session.press('down')

  const animalsSnapshot = await session.text()
  expect(animalsSnapshot).toMatchInlineSnapshot(`
    "


       Simple Grid Example ────────────────────────────────────────────

       Search items...

       Fruits                                                          ▲
       🍎 Apple                                                        ▀
       🍌 Banana
       🍒 Cherry

       Animals
      ›🐕 Dog
       🐱 Cat
       🐰 Rabbit

       Others
       🏠 House
       🚗 Car                                                          ▼


       ↵ show details    ↑↓ navigate    ^k actions

       Settings
    "
  `)

  // Open actions with ctrl+k
  await session.press(['ctrl', 'k'])

  const actionsSnapshot = await session.text()
  expect(actionsSnapshot).toMatchInlineSnapshot(`
    "


       Simple Grid Example ────────────────────────────────────────────

       Search items...

       Fruits                                                          ▲
          Apple                                                        ▀
      ┌────────────────────────────────────────────────────────────────┐
      │                                                          esc   │
      │                                                                │
      │   Search actions...                                            │
      │                                                                │
      │  ›Show Details                                                 │
      │   Copy Emoji                                             ⌃C    │
      │                                                                │
      │   Settings                                                     │
      │   Change Theme...                                              │
      │                                                                │
      │   ↵ select   ↑↓ navigate                                       │
      │                                                                │
      └────────────────────────────────────────────────────────────────┘

       Settings
    "
  `)

  // Close actions with escape
  await session.press('esc')

  const afterEscapeSnapshot = await session.text()
  expect(afterEscapeSnapshot).toMatchInlineSnapshot(`
    "


       Simple Grid Example ────────────────────────────────────────────

       Search items...

       Fruits                                                          ▲
       🍎 Apple                                                        ▀
       🍌 Banana
       🍒 Cherry

       Animals
      ›🐕 Dog
       🐱 Cat
       🐰 Rabbit

       Others
       🏠 House
       🚗 Car                                                          ▼


       ↵ show details    ↑↓ navigate    ^k actions

       Settings
    "
  `)
}, 15000)

test('grid search functionality', async () => {
  await session.text({
    waitFor: (text) => {
      // wait for grid to show up
      return /Simple Grid Example/i.test(text)
    },
  })

  // Search for "cat"
  await session.type('cat')

  const searchCatSnapshot = await session.text({
    waitFor: (text) => {
      return /cat/i.test(text)
    },
  })
  expect(searchCatSnapshot).toMatchInlineSnapshot(`
    "


       Simple Grid Example ────────────────────────────────────────────

       cat

      ›🍎 Apple                                                        ▲
       🍌 Banana                                                       █
       🍒 Cherry
       🐕 Dog
       🐱 Cat
       🐰 Rabbit
       🏠 House
       🚗 Car
       🚀 Rocket
       ⭐ Star
       🌙 Moon
       ☀ Sun
                                                                       ▼


       ↵ show details    ↑↓ navigate    ^k actions

       Settings
    "
  `)

  // Clear search and search for "space"
  await session.press('backspace')
  await session.press('backspace')
  await session.press('backspace')
  await session.type('space')

  const searchSpaceSnapshot = await session.text({
    waitFor: (text) => {
      return /space/i.test(text)
    },
  })
  expect(searchSpaceSnapshot).toMatchInlineSnapshot(`
    "


       Simple Grid Example ────────────────────────────────────────────

       space

      ›🍎 Apple                                                        ▲
       🍌 Banana                                                       █
       🍒 Cherry
       🐕 Dog
       🐱 Cat
       🐰 Rabbit
       🏠 House
       🚗 Car
       🚀 Rocket
       ⭐ Star
       🌙 Moon
       ☀ Sun
                                                                       ▼


       ↵ show details    ↑↓ navigate    ^k actions

       Settings
    "
  `)

  // Clear search completely
  await session.press('backspace')
  await session.press('backspace')
  await session.press('backspace')
  await session.press('backspace')
  await session.press('backspace')

  const clearedSearchSnapshot = await session.text()
  expect(clearedSearchSnapshot).toMatchInlineSnapshot(`
    "


       Simple Grid Example ────────────────────────────────────────────

       Search items...

       Fruits                                                          ▲
      ›🍎 Apple                                                        ▀
       🍌 Banana
       🍒 Cherry

       Animals
       🐕 Dog
       🐱 Cat
       🐰 Rabbit

       Others
       🏠 House
       🚗 Car                                                          ▼


       ↵ show details    ↑↓ navigate    ^k actions

       Settings
    "
  `)

  // Search for something that doesn't exist
  await session.type('xyz123')

  const noResultsSnapshot = await session.text({
    waitFor: (text) => {
      return /xyz123/i.test(text)
    },
  })
  expect(noResultsSnapshot).toMatchInlineSnapshot(`
    "


       Simple Grid Example ────────────────────────────────────────────

       xyz123

      ›🍎 Apple                                                        ▲
       🍌 Banana                                                       █
       🍒 Cherry
       🐕 Dog
       🐱 Cat
       🐰 Rabbit
       🏠 House
       🚗 Car
       🚀 Rocket
       ⭐ Star
       🌙 Moon
       ☀ Sun
                                                                       ▼


       ↵ show details    ↑↓ navigate    ^k actions

       Settings
    "
  `)
}, 10000)

test('grid item selection and actions', async () => {
  await session.text({
    waitFor: (text) => {
      // wait for grid to show up
      return /Simple Grid Example/i.test(text)
    },
  })

  // Select first item and open actions
  await session.press('enter')

  const firstItemActionsSnapshot = await session.text()
  expect(firstItemActionsSnapshot).toMatchInlineSnapshot(`
    "


       Simple Grid Example ────────────────────────────────────────────

       Search items...

       Fruits                                                          ▲
      ›🍎 Apple                                                        ▀
       🍌 Banana
       🍒 Cherry

       Animals
       🐕 Dog
       🐱 Cat
       🐰 Rabbit

       Others
       🏠 House
       🚗 Car                                                          ▼


       ↵ show details    ↑↓ navigate    ^k actions

       Settings
    "
  `)

  // Navigate down in actions
  await session.press('down')

  const secondActionSnapshot = await session.text()
  expect(secondActionSnapshot).toMatchInlineSnapshot(`
    "


       Simple Grid Example ────────────────────────────────────────────

       Search items...

       Fruits                                                          ▲
       🍎 Apple                                                        ▀
      ›🍌 Banana
       🍒 Cherry

       Animals
       🐕 Dog
       🐱 Cat
       🐰 Rabbit

       Others
       🏠 House
       🚗 Car                                                          ▼


       ↵ show details    ↑↓ navigate    ^k actions

       Settings
    "
  `)

  // Select "Copy Emoji" action
  await session.press('enter')

  const afterCopySnapshot = await session.text()
  expect(afterCopySnapshot).toMatchInlineSnapshot(`
    "


       Simple Grid Example ────────────────────────────────────────────

       Search items...

       Fruits                                                          ▲
       🍎 Apple                                                        ▀
      ›🍌 Banana
       🍒 Cherry

       Animals
       🐕 Dog
       🐱 Cat
       🐰 Rabbit

       Others
       🏠 House
       🚗 Car                                                          ▼


       ↵ show details    ↑↓ navigate    ^k actions

       Settings
    "
  `)
}, 10000)

test('grid mouse interaction', async () => {
  await session.text({
    waitFor: (text) => {
      // wait for grid to show up
      return /Simple Grid Example/i.test(text)
    },
  })

  // Click on "Dog" item
  await session.click('Dog', { first: true })

  const afterClickDogSnapshot = await session.text()
  expect(afterClickDogSnapshot).toMatchInlineSnapshot(`
    "


       Simple Grid Example ────────────────────────────────────────────

       Search items...

       Fruits                                                          ▲
       🍎 Apple                                                        ▀
       🍌 Banana
       🍒 Cherry

       Animals
      ›🐕 Dog
       🐱 Cat
       🐰 Rabbit

       Others
       🏠 House
       🚗 Car                                                          ▼


       ↵ show details    ↑↓ navigate    ^k actions

       Settings
    "
  `)

  // Navigate down to make "Star" visible (it's below Rocket in Others section)
  // Star is not visible with rows: 25 initially, so we need to scroll/navigate to it
  await session.press('down') // Cat
  await session.press('down') // Rabbit
  await session.press('down') // House
  await session.press('down') // Car
  await session.press('down') // Rocket
  await session.press('down') // Star (now visible)

  // Click on "Star" item (now visible after navigation)
  await session.click('Star', { first: true })

  const afterClickStarSnapshot = await session.text()
  expect(afterClickStarSnapshot).toMatchInlineSnapshot(`
    "


       Simple Grid Example ────────────────────────────────────────────

       Search items...

          Rabbit                                                       ▲

      ┌────────────────────────────────────────────────────────────────┐
      │                                                          esc   │
      │                                                                │
      │   Search actions...                                            │
      │                                                                │
      │  ›Show Details                                                 │
      │   Copy Emoji                                             ⌃C    │
      │                                                                │
      │   Settings                                                     │
      │   Change Theme...                                              │
      │                                                                │
      │   ↵ select   ↑↓ navigate                                       │
      │                                                                │
      └────────────────────────────────────────────────────────────────┘

       Settings
    "
  `)

  // Close the actions panel first
  await session.press('esc')

  // Navigate back up to make Apple visible
  await session.press('up')
  await session.press('up')
  await session.press('up')
  await session.press('up')
  await session.press('up')
  await session.press('up')

  // Click on "Apple" to go back to first section
  await session.click('Apple', { first: true })

  const afterClickAppleSnapshot = await session.text()
  expect(afterClickAppleSnapshot).toMatchInlineSnapshot(`
    "


       Simple Grid Example ────────────────────────────────────────────

       Search items...

       Fruits                                                          ▲
      ›🍎 Apple                                                        ▀
       🍌 Banana
       🍒 Cherry

       Animals
       🐕 Dog
       🐱 Cat
       🐰 Rabbit

       Others
       🏠 House
       🚗 Car                                                          ▼


       ↵ show details    ↑↓ navigate    ^k actions

       Settings
    "
  `)
}, 10000)
