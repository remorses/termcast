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
     Empty section should be hidden                                  ▀

     Fruits
    ›Apple Red and sweet                             Fresh [Popular]
     Banana Yellow and nutritious                               Ripe
     Orange Citrus and juicy                                   Fresh
     Grape Sweet clusters                                 [Seasonal]
     Mango Tropical delight                                 Imported
     Pineapple Sweet and tangy
     Strawberry Red and sweet                              [Popular] ▼


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
     Empty section should be hidden                                  ▀

     Fruits
     Apple Red and sweet                             Fresh [Popular]
    ›Banana Yellow and nutritious                               Ripe
     Orange Citrus and juicy                                   Fresh
     Grape Sweet clusters                                 [Seasonal]
     Mango Tropical delight                                 Imported
     Pineapple Sweet and tangy
     Strawberry Red and sweet                              [Popular] ▼


     ↵ select   ↑↓ navigate   ^k actions"
  `)

  await session.press('down')

  const secondDownSnapshot = await session.text()
  expect(secondDownSnapshot).toMatchInlineSnapshot(`
    "


     Simple List Example ────────────────────────────────────────────

     Search items...
                                                                     ▲
     Empty section should be hidden                                  ▀

     Fruits
     Apple Red and sweet                             Fresh [Popular]
     Banana Yellow and nutritious                               Ripe
    ›Orange Citrus and juicy                                   Fresh
     Grape Sweet clusters                                 [Seasonal]
     Mango Tropical delight                                 Imported
     Pineapple Sweet and tangy
     Strawberry Red and sweet                              [Popular] ▼


     ↵ select   ↑↓ navigate   ^k actions"
  `)

  await session.press('enter')

  const afterEnterSnapshot = await session.text()
  expect(afterEnterSnapshot).toMatchInlineSnapshot(`
    "


     Simple List Example ────────────────────────────────────────────

     Search items...
                                                                     ▲
     Empty section should be hidden                                  ▀

     Fruits
     Apple Red and sweet                             Fresh [Popular]
     Banana Yellow and nutritious                               Ripe
    ›Orange Citrus and juicy                                   Fresh
     Grape Sweet clusters                                 [Seasonal]
     Mango Tropical delight                                 Imported
     Pineapple Sweet and tangy
     Strawberry Red and sweet                              [Popular] ▼


     ↵ select   ↑↓ navigate   ^k actions"
  `)

  // Go back to list with Escape
  await session.press('esc')

  const afterEscapeSnapshot = await session.text()
  expect(afterEscapeSnapshot).toMatchInlineSnapshot(`
    "


     Simple List Example ────────────────────────────────────────────

     Search items...
                                                                     ▲
     Empty section should be hidden                                  ▀

     Fruits
     Apple Red and sweet                             Fresh [Popular]
     Banana Yellow and nutritious                               Ripe
    ›Orange Citrus and juicy                                   Fresh
     Grape Sweet clusters                                 [Seasonal]
     Mango Tropical delight                                 Imported
     Pineapple Sweet and tangy
     Strawberry Red and sweet                              [Popular] ▼


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
     Empty section should be hidden                                  ▀

     Fruits
    ›Apple Red and sweet                             Fresh [Popular]
     Banana Yellow and nutritious                               Ripe
     Orange Citrus and juicy                                   Fresh
     Grape Sweet clusters                                 [Seasonal]
     Mango Tropical delight                                 Imported
     Pineapple Sweet and tangy
     Strawberry Red and sweet                              [Popular] ▼


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
      return /search/i.test(text)
    },
  })

  // Click on "Banana" item (visible in initial view)
  await session.click('Banana', { first: true })

  const afterClickBananaSnapshot = await session.text()
  expect(afterClickBananaSnapshot).toMatchInlineSnapshot(`
    "


     Simple List Example ────────────────────────────────────────────

     Search items...
                                                                     ▲
     Empty section should be hidden                                  ▀

     Fruits
     Apple Red and sweet                             Fresh [Popular]
    ›Banana Yellow and nutritious                               Ripe
     Orange Citrus and juicy                                   Fresh
     Grape Sweet clusters                                 [Seasonal]
     Mango Tropical delight                                 Imported
     Pineapple Sweet and tangy
     Strawberry Red and sweet                              [Popular] ▼


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
     Empty section should be hidden                                  ▀

     Fruits
    ›Apple Red and sweet                             Fresh [Popular]
     Banana Yellow and nutritious                               Ripe
     Orange Citrus and juicy                                   Fresh
     Grape Sweet clusters                                 [Seasonal]
     Mango Tropical delight                                 Imported
     Pineapple Sweet and tangy
     Strawberry Red and sweet                              [Popular] ▼


     ↵ select   ↑↓ navigate   ^k actions"
  `)

  // Click on "Grape" item (visible in initial view)
  await session.click('Grape', { first: true })

  const afterClickGrapeSnapshot = await session.text()
  expect(afterClickGrapeSnapshot).toMatchInlineSnapshot(`
    "


     Simple List Example ────────────────────────────────────────────

     Search items...
                                                                     ▲
     Empty section should be hidden                                  ▀

     Fruits
     Apple Red and sweet                             Fresh [Popular]
     Banana Yellow and nutritious                               Ripe
     Orange Citrus and juicy                                   Fresh
    ›Grape Sweet clusters                                 [Seasonal]
     Mango Tropical delight                                 Imported
     Pineapple Sweet and tangy
     Strawberry Red and sweet                              [Popular] ▼


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
     Fruits                                                          █
    ›Apple Red and sweet                             Fresh [Popular] ▀
     Banana Yellow and nutritious                               Ripe
     Orange Citrus and juicy                                   Fresh
     Grape Sweet clusters                                 [Seasonal]
     Mango Tropical delight                                 Imported
     Pineapple Sweet and tangy                                       ▼


     ┌─✓─Added─to─Cart─-─Apple─has─been─added─to─your─cart─┐
     └─────────────────────────────────────────────────────┘"
  `)
}, 10000)

test('list scrollbox scrolling with sections', async () => {
  await session.text({
    waitFor: (text) => {
      return /search/i.test(text)
    },
  })

  const initialSnapshot = await session.text()
  expect(initialSnapshot).toMatchInlineSnapshot(`
    "


     Simple List Example ────────────────────────────────────────────

     Search items...
                                                                     ▲
     Empty section should be hidden                                  ▀

     Fruits
    ›Apple Red and sweet                             Fresh [Popular]
     Banana Yellow and nutritious                               Ripe
     Orange Citrus and juicy                                   Fresh
     Grape Sweet clusters                                 [Seasonal]
     Mango Tropical delight                                 Imported
     Pineapple Sweet and tangy
     Strawberry Red and sweet                              [Popular] ▼


     ↵ select   ↑↓ navigate   ^k actions"
  `)

  // Navigate down through Fruits section
  await session.press('down') // Banana
  await session.press('down') // Orange
  await session.press('down') // Grape
  await session.press('down') // Mango
  await session.press('down') // Pineapple
  await session.press('down') // Strawberry (last fruit)

  const afterFruitsSnapshot = await session.text()
  expect(afterFruitsSnapshot).toMatchInlineSnapshot(`
    "


     Simple List Example ────────────────────────────────────────────

     Search items...
                                                                     ▲
     Empty section should be hidden                                  ▀

     Fruits
     Apple Red and sweet                             Fresh [Popular]
     Banana Yellow and nutritious                               Ripe
     Orange Citrus and juicy                                   Fresh
     Grape Sweet clusters                                 [Seasonal]
     Mango Tropical delight                                 Imported
     Pineapple Sweet and tangy
    ›Strawberry Red and sweet                              [Popular] ▼


     ↵ select   ↑↓ navigate   ^k actions"
  `)

  // Continue to Vegetables section
  await session.press('down') // Carrot (first vegetable)
  await session.press('down') // Lettuce
  await session.press('down') // Broccoli

  const afterVegetablesSnapshot = await session.text()
  expect(afterVegetablesSnapshot).toMatchInlineSnapshot(`
    "


     Simple List Example ────────────────────────────────────────────

     Search items...
     Banana Yellow and nutritious                               Ripe ▲
     Orange Citrus and juicy                                   Fresh
     Grape Sweet clusters                                 [Seasonal]
     Mango Tropical delight                                 Imported
     Pineapple Sweet and tangy
     Strawberry Red and sweet                              [Popular] ▄

     Vegetables
     Carrot Orange and crunchy                             [Healthy]
     Lettuce Green and fresh
    ›Broccoli Green florets                                [Healthy] ▼


     ↵ select   ↑↓ navigate   ^k actions"
  `)

  // Navigate to the last items
  await session.press('down') // Spinach
  await session.press('down') // Tomato
  await session.press('down') // Cucumber
  await session.press('down') // Bell Pepper
  await session.press('down') // Bread (last item)

  const afterLastItemSnapshot = await session.text()
  expect(afterLastItemSnapshot).toMatchInlineSnapshot(`
    "


     Simple List Example ────────────────────────────────────────────

     Search items...
     Strawberry Red and sweet                              [Popular] ▲

     Vegetables
     Carrot Orange and crunchy                             [Healthy]
     Lettuce Green and fresh
     Broccoli Green florets                                [Healthy]
     Spinach Leafy greens                                    Organic
     Tomato Red and ripe
     Cucumber Cool and crisp
     Bell Pepper Colorful and crunchy                        [Fresh] ▄
    ›Bread Freshly baked                                 Today [New] ▼


     ↵ select   ↑↓ navigate   ^k actions"
  `)

  // Navigate back up to top
  for (let i = 0; i < 15; i++) {
    await session.press('up')
  }

  const afterScrollBackUpSnapshot = await session.text()
  expect(afterScrollBackUpSnapshot).toMatchInlineSnapshot(`
    "


     Simple List Example ────────────────────────────────────────────

     Search items...
     Strawberry Red and sweet                              [Popular] ▲

     Vegetables
     Carrot Orange and crunchy                             [Healthy]
     Lettuce Green and fresh
     Broccoli Green florets                                [Healthy]
     Spinach Leafy greens                                    Organic
     Tomato Red and ripe
     Cucumber Cool and crisp
     Bell Pepper Colorful and crunchy                        [Fresh] ▄
    ›Bread Freshly baked                                 Today [New] ▼


     ↵ select   ↑↓ navigate   ^k actions"
  `)
}, 15000)
