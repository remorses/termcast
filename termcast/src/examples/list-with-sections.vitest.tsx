import { test, expect, afterEach, beforeEach } from 'vitest'
import { launchTerminal, Session } from 'tuistory/src'

let session: Session

beforeEach(async () => {
  session = await launchTerminal({
    command: 'bun',
    args: ['src/examples/list-with-sections.tsx'],
    cols: 70,
    rows: 20,
  })
})

afterEach(() => {
  session?.close()
})

test('list with sections navigation', async () => {
  await session.text({
    waitFor: (text) => {
      // wait for list to show up
      return /search/i.test(text)
    },
  })

  const initialSnapshot = await session.text()
  expect(initialSnapshot).toMatchInlineSnapshot(`
    "


     Simple List Example ────────────────────────────────────────────

     Search items...
                                                                     ▲
     Empty section should be hidden                                  █
                                                                     █
     Fruits                                                          █
    ›Apple Red and sweet                             Fresh [Popular] █
     Banana Yellow and nutritious                               Ripe █
                                                                     █
     Vegetables                                                      █
     Carrot Orange and crunchy                             [Healthy] █
     Lettuce Green and fresh                                         █
     Bread Freshly baked                                 Today [New] ▼


     ↵ select   ↑↓ navigate   ^k actions"
  `)

  // Add small delay to ensure all items have registered
  await new Promise((resolve) => setTimeout(resolve, 100))

  await session.press('down')

  const afterDownSnapshot = await session.text()
  expect(afterDownSnapshot).toMatchInlineSnapshot(`
    "


     Simple List Example ────────────────────────────────────────────

     Search items...
                                                                     ▲
     Empty section should be hidden                                  █
                                                                     █
     Fruits                                                          █
     Apple Red and sweet                             Fresh [Popular] █
    ›Banana Yellow and nutritious                               Ripe █
                                                                     █
     Vegetables                                                      █
     Carrot Orange and crunchy                             [Healthy] █
     Lettuce Green and fresh                                         █
     Bread Freshly baked                                 Today [New] ▼


     ↵ select   ↑↓ navigate   ^k actions"
  `)

  await session.press('down')

  const secondDownSnapshot = await session.text()
  expect(secondDownSnapshot).toMatchInlineSnapshot(`
    "


     Simple List Example ────────────────────────────────────────────

     Search items...
                                                                     ▲
     Empty section should be hidden                                  █
                                                                     █
     Fruits                                                          █
     Apple Red and sweet                             Fresh [Popular] █
     Banana Yellow and nutritious                               Ripe █
                                                                     █
     Vegetables                                                      █
    ›Carrot Orange and crunchy                             [Healthy] █
     Lettuce Green and fresh                                         █
     Bread Freshly baked                                 Today [New] ▼


     ↵ select   ↑↓ navigate   ^k actions"
  `)

  await session.press('enter')

  const afterEnterSnapshot = await session.text()
  expect(afterEnterSnapshot).toMatchInlineSnapshot(`
    "




    # Carrot

    A crunchy orange vegetable rich in vitamins.

    ## Health Benefits
    - Excellent source of beta carotene
    - Improves eye health
    - Boosts immune system
    - Low in calories




     esc go back"
  `)

  // Go back to list with Escape
  await session.press('esc')

  const afterEscapeSnapshot = await session.text()
  expect(afterEscapeSnapshot).toMatchInlineSnapshot(`
    "


     Simple List Example ────────────────────────────────────────────

     Search items...
                                                                     ▲
     Empty section should be hidden                                  █
                                                                     █
     Fruits                                                          █
    ›Apple Red and sweet                             Fresh [Popular] █
     Banana Yellow and nutritious                               Ripe █
                                                                     █
     Vegetables                                                      █
     Carrot Orange and crunchy                             [Healthy] █
     Lettuce Green and fresh                                         █
     Bread Freshly baked                                 Today [New] ▼


     ↵ select   ↑↓ navigate   ^k actions"
  `)
})

test('list with sections search functionality', async () => {
  await session.text({
    waitFor: (text) => {
      // wait for list to show up
      return /search/i.test(text)
    },
  })

  await session.type('ban')

  const afterSearchBanSnapshot = await session.text({
    waitFor: (text) => {
      return /\bban\b/.test(text)
    },
  })
  // NOTE: No selection indicator (›) is expected here - this is OK
  expect(afterSearchBanSnapshot).toMatchInlineSnapshot(`
    "


    Simple List Example ────────────────────────────────────────────

    ban
    Banana Yellow and nutritious                               Ripe ▲
                                                                    █
                                                                    █
                                                                    █
                                                                    █
                                                                    █
                                                                    █
                                                                    █
                                                                    █
                                                                    █
                                                                    ▼


    ↵ select   ↑↓ navigate   ^k actions"
  `)

  // Clear search and type "let" to search for Lettuce
  await session.press('backspace')
  await session.press('backspace')
  await session.press('backspace')
  await session.type('let')

  const afterSearchLetSnapshot = await session.text({
    waitFor: (text) => {
      return /\blet\b/.test(text)
    },
  })
  // NOTE: No selection indicator (›) is expected here - this is OK
  expect(afterSearchLetSnapshot).toMatchInlineSnapshot(`
    "


    Simple List Example ────────────────────────────────────────────

    let
    Lettuce Green and fresh                                         ▲
                                                                    █
                                                                    █
                                                                    █
                                                                    █
                                                                    █
                                                                    █
                                                                    █
                                                                    █
                                                                    █
                                                                    ▼


    ↵ select   ↑↓ navigate   ^k actions"
  `)

  // Clear search to show all items again
  await session.press('backspace')
  await session.press('backspace')
  await session.press('backspace')

  const afterClearSearchSnapshot = await session.text()
  expect(afterClearSearchSnapshot).toMatchInlineSnapshot(`
    "


     Simple List Example ────────────────────────────────────────────

     Search items...
                                                                     ▲
     Empty section should be hidden                                  █
                                                                     █
     Fruits                                                          █
    ›Apple Red and sweet                             Fresh [Popular] █
     Banana Yellow and nutritious                               Ripe █
                                                                     █
     Vegetables                                                      █
     Carrot Orange and crunchy                             [Healthy] █
     Lettuce Green and fresh                                         █
     Bread Freshly baked                                 Today [New] ▼


     ↵ select   ↑↓ navigate   ^k actions"
  `)

  // Search for "bread"
  await session.type('bread')

  const afterSearchBreadSnapshot = await session.text({
    waitFor: (text) => {
      return /bread/i.test(text)
    },
  })
  // NOTE: No selection indicator (›) is expected here - this is OK
  expect(afterSearchBreadSnapshot).toMatchInlineSnapshot(`
    "


    Simple List Example ────────────────────────────────────────────

    bread
    Bread Freshly baked                                 Today [New] ▲
                                                                    █
                                                                    █
                                                                    █
                                                                    █
                                                                    █
                                                                    █
                                                                    █
                                                                    █
                                                                    █
                                                                    ▼


    ↵ select   ↑↓ navigate   ^k actions"
  `)

  // Select the bread item
  await session.press('enter')

  const afterSelectBreadSnapshot = await session.text()
  expect(afterSelectBreadSnapshot).toMatchInlineSnapshot(`
    "


      Simple List Example ────────────────────────────────────────────

      bread
    ┃┃Bread Freshly baked                                 Today [New] ▲
    ┃                                                                  ┃
    ┃                                                            esc   ┃
    ┃                                                                  ┃
    ┃   Search actions...                                              ┃
    ┃  ›View Details                                                   ┃
    ┃   Add to Cart                                                    ┃
    ┃                                                                  ┃
    ┃                                                                  ┃
    ┃   ↵ select   ↑↓ navigate                                         ┃
    ┃                                                                  ┃
    ┃┃

      ↵ select   ↑↓ navigate   ^k actions"
  `)
}, 10000)

test('list click functionality', async () => {
  await session.text({
    waitFor: (text) => {
      // wait for list to show up
      return /search/i.test(text)
    },
  })

  // Click on "Lettuce" item
  await session.click('Lettuce', { first: true })

  const afterClickLettuceSnapshot = await session.text()
  expect(afterClickLettuceSnapshot).toMatchInlineSnapshot(`
    "


     Simple List Example ────────────────────────────────────────────

     Search items...
                                                                     ▲
     Empty section should be hidden                                  █
                                                                     █
     Fruits                                                          █
     Apple Red and sweet                             Fresh [Popular] █
     Banana Yellow and nutritious                               Ripe █
                                                                     █
     Vegetables                                                      █
     Carrot Orange and crunchy                             [Healthy] █
    ›Lettuce Green and fresh                                         █
     Bread Freshly baked                                 Today [New] ▼


     ↵ select   ↑↓ navigate   ^k actions"
  `)

  // Click on "Apple" item
  await session.click('Apple', { first: true })

  const afterClickAppleSnapshot = await session.text()
  expect(afterClickAppleSnapshot).toMatchInlineSnapshot(`
    "


     Simple List Example ────────────────────────────────────────────

     Search items...
                                                                     ▲
     Empty section should be hidden                                  █
                                                                     █
     Fruits                                                          █
    ›Apple Red and sweet                             Fresh [Popular] █
     Banana Yellow and nutritious                               Ripe █
                                                                     █
     Vegetables                                                      █
     Carrot Orange and crunchy                             [Healthy] █
     Lettuce Green and fresh                                         █
     Bread Freshly baked                                 Today [New] ▼


     ↵ select   ↑↓ navigate   ^k actions"
  `)

  // Navigate down to "Bread" item (it's scrolled out of view)
  await session.press('down') // to Banana
  await session.press('down') // to Carrot
  await session.press('down') // to Lettuce
  await session.press('down') // to Bread

  const afterNavigateToBreadSnapshot = await session.text()
  expect(afterNavigateToBreadSnapshot).toMatchInlineSnapshot(`
    "


     Simple List Example ────────────────────────────────────────────

     Search items...
                                                                     ▲
     Empty section should be hidden                                  █
                                                                     █
     Fruits                                                          █
     Apple Red and sweet                             Fresh [Popular] █
     Banana Yellow and nutritious                               Ripe █
                                                                     █
     Vegetables                                                      █
     Carrot Orange and crunchy                             [Healthy] █
     Lettuce Green and fresh                                         █
    ›Bread Freshly baked                                 Today [New] ▼


     ↵ select   ↑↓ navigate   ^k actions"
  `)
}, 10000)

test('list actions panel with ctrl+k', async () => {
  await session.text({
    waitFor: (text) => {
      // wait for list to show up
      return /search/i.test(text)
    },
  })

  // Press ctrl+k to open actions panel
  await session.press(['ctrl', 'k'])

  const afterCtrlKSnapshot = await session.text()
  expect(afterCtrlKSnapshot).toMatchInlineSnapshot(`
    "


      Simple List Example ────────────────────────────────────────────

      Search items...
    ┃┃                                                                ▲
    ┃                                                                  ┃
    ┃                                                            esc   ┃
    ┃                                                                  ┃
    ┃   Search actions...                                              ┃
    ┃  ›View Details                                                   ┃
    ┃   Add to Cart                                                    ┃
    ┃                                                                  ┃
    ┃                                                                  ┃
    ┃   ↵ select   ↑↓ navigate                                         ┃
    ┃                                                                  ┃
    ┃┃

      ↵ select   ↑↓ navigate   ^k actions"
  `)

  // Navigate down to second action
  await session.press('down')

  const afterDownInActionsSnapshot = await session.text()
  expect(afterDownInActionsSnapshot).toMatchInlineSnapshot(`
    "


      Simple List Example ────────────────────────────────────────────

      Search items...
    ┃┃                                                                ▲
    ┃                                                                  ┃
    ┃                                                            esc   ┃
    ┃                                                                  ┃
    ┃   Search actions...                                              ┃
    ┃   View Details                                                   ┃
    ┃  ›Add to Cart                                                    ┃
    ┃                                                                  ┃
    ┃                                                                  ┃
    ┃   ↵ select   ↑↓ navigate                                         ┃
    ┃                                                                  ┃
    ┃┃

      ↵ select   ↑↓ navigate   ^k actions"
  `)

  // Trigger the second action (Add to Cart)
  await session.press('enter')

  const afterSelectSecondActionSnapshot = await session.text()
  expect(afterSelectSecondActionSnapshot).toMatchInlineSnapshot(`
    "


     Simple List Example ────────────────────────────────────────────

     Search items...
                                                                     ▲
     Empty section should be hidden                                  █
                                                                     █
     Fruits
    ›Apple Red and sweet                             Fresh [Popular]
     Banana Yellow and nutritious                               Ripe

     Vegetables
     Carrot Orange and crunchy                             [Healthy]
                                                                     ▼


     ┌─✓─Added─to─Cart─-─Apple─has─been─added─to─your─cart─┐
     └─────────────────────────────────────────────────────┘"
  `)
}, 10000)

test('list scrollbox scrolling with arrow keys', async () => {
  await session.text({
    waitFor: (text) => {
      return /search/i.test(text)
    },
  })

  // Initial state - Apple is selected at the top
  const initialSnapshot = await session.text()
  expect(initialSnapshot).toMatchInlineSnapshot()

  // Navigate down through all items to test scrolling
  await session.press('down') // Banana
  await session.press('down') // Carrot
  await session.press('down') // Lettuce
  await session.press('down') // Bread (last item)

  const afterScrollDownSnapshot = await session.text()
  expect(afterScrollDownSnapshot).toMatchInlineSnapshot()

  // Navigate back up
  await session.press('up') // Lettuce
  await session.press('up') // Carrot
  await session.press('up') // Banana
  await session.press('up') // Apple

  const afterScrollUpSnapshot = await session.text()
  expect(afterScrollUpSnapshot).toMatchInlineSnapshot()

  // Test page down navigation
  await session.press('pagedown')

  const afterPageDownSnapshot = await session.text()
  expect(afterPageDownSnapshot).toMatchInlineSnapshot()

  // Test page up navigation
  await session.press('pageup')

  const afterPageUpSnapshot = await session.text()
  expect(afterPageUpSnapshot).toMatchInlineSnapshot()
}, 10000)
