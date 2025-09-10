// node-pty does not work in bun, so we use vitest to run this test
import { test, expect, afterEach, afterAll, beforeEach } from 'vitest'
import { NodeTuiDriver } from '@termcast/cli/src/e2e-node'

let driver: NodeTuiDriver

beforeEach(() => {
  driver = new NodeTuiDriver('bun', ['src/examples/list-with-sections.tsx'], {
    cols: 70,
    rows: 50,
  })
})

afterEach(() => {
  driver?.dispose()
})

test('list with sections navigation', async () => {
  await driver.text({
    waitFor: (text) => {
      // wait for list to show up
      return /search/i.test(text)
    },
  })

  const initialSnapshot = await driver.text()
  expect(initialSnapshot).toMatchInlineSnapshot(`
      "

       Simple List Example ────────────────────────────────────────────

       Search items...


       Fruits
      ›Apple Red and sweet                              Fresh [Popular]
       Banana Yellow and nutritious                                Ripe

       Vegetables
       Carrot Orange and crunchy                              [Healthy]
       Lettuce Green and fresh
       Bread Freshly baked                                  Today [New]


       ↵ select   ↑↓ navigate   ^k actions"
    `)

  await driver.keys.down()

  const afterDownSnapshot = await driver.text()
  expect(afterDownSnapshot).toMatchInlineSnapshot(`
      "

       Simple List Example ────────────────────────────────────────────

       Search items...


       Fruits
       Apple Red and sweet                              Fresh [Popular]
      ›Banana Yellow and nutritious                                Ripe

       Vegetables
       Carrot Orange and crunchy                              [Healthy]
       Lettuce Green and fresh
       Bread Freshly baked                                  Today [New]


       ↵ select   ↑↓ navigate   ^k actions"
    `)

  await driver.keys.down()

  const secondDownSnapshot = await driver.text()
  expect(secondDownSnapshot).toMatchInlineSnapshot(`
      "

       Simple List Example ────────────────────────────────────────────

       Search items...


       Fruits
       Apple Red and sweet                              Fresh [Popular]
       Banana Yellow and nutritious                                Ripe

       Vegetables
      ›Carrot Orange and crunchy                              [Healthy]
       Lettuce Green and fresh
       Bread Freshly baked                                  Today [New]


       ↵ select   ↑↓ navigate   ^k actions"
    `)

  await driver.keys.enter()

  const afterEnterSnapshot = await driver.text()
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
  await driver.keys.escape()

  const afterEscapeSnapshot = await driver.text()
  expect(afterEscapeSnapshot).toMatchInlineSnapshot(`
      "

       Simple List Example ────────────────────────────────────────────

       Search items...


       Fruits
      ›Apple Red and sweet                              Fresh [Popular]
       Banana Yellow and nutritious                                Ripe

       Vegetables
       Carrot Orange and crunchy                              [Healthy]
       Lettuce Green and fresh
       Bread Freshly baked                                  Today [New]


       ↵ select   ↑↓ navigate   ^k actions"
    `)
})

test('list with sections search functionality', async () => {
  await driver.text({
    waitFor: (text) => {
      // wait for list to show up
      return /search/i.test(text)
    },
  })

  await driver.keys.type('ban')

  const afterSearchBanSnapshot = await driver.text({
    waitFor: (text) => {
      return /\bban\b/.test(text)
    },
  })
  expect(afterSearchBanSnapshot).toMatchInlineSnapshot(`
    "

    Simple List Example ────────────────────────────────────────────

    ban

    Banana Yellow and nutritious                                Ripe


    ↵ select   ↑↓ navigate   ^k actions"
  `)

  // Clear search and type "let" to search for Lettuce
  await driver.keys.backspace()
  await driver.keys.backspace()
  await driver.keys.backspace()
  await driver.keys.type('let')

  const afterSearchLetSnapshot = await driver.text({
    waitFor: (text) => {
      return /\blet\b/.test(text)
    },
  })
  expect(afterSearchLetSnapshot).toMatchInlineSnapshot(`
    "

    Simple List Example ────────────────────────────────────────────

    let

    Lettuce Green and fresh


    ↵ select   ↑↓ navigate   ^k actions"
  `)

  // Clear search to show all items again
  await driver.keys.backspace()
  await driver.keys.backspace()
  await driver.keys.backspace()

  const afterClearSearchSnapshot = await driver.text()
  expect(afterClearSearchSnapshot).toMatchInlineSnapshot(`
      "

       Simple List Example ────────────────────────────────────────────

       Search items...


       Fruits
      ›Apple Red and sweet                              Fresh [Popular]
       Banana Yellow and nutritious                                Ripe

       Vegetables
       Carrot Orange and crunchy                              [Healthy]
       Lettuce Green and fresh
       Bread Freshly baked                                  Today [New]


       ↵ select   ↑↓ navigate   ^k actions"
    `)

  // Search for "bread"
  await driver.keys.type('bread')

  const afterSearchBreadSnapshot = await driver.text({
    waitFor: (text) => {
      return /bread/i.test(text)
    },
  })
  expect(afterSearchBreadSnapshot).toMatchInlineSnapshot(`
    "

    Simple List Example ────────────────────────────────────────────

    bread

    Bread Freshly baked                                  Today [New]


    ↵ select   ↑↓ navigate   ^k actions"
  `)

  // Select the bread item
  await driver.keys.enter()

  const afterSelectBreadSnapshot = await driver.text()
  expect(afterSelectBreadSnapshot).toMatchInlineSnapshot(`
    "

    Simple List Example ────────────────────────────────────────────

    bread

    Bread Freshly baked                                  Today [New]


    ↵ select   ↑↓ navigate   ^k actions



                                                                esc

     Search actions...
     View Details
     Add to Cart


     ↵ select   ↑↓ navigate"
  `)
}, 10000)

test('list click functionality', async () => {
  await driver.text({
    waitFor: (text) => {
      // wait for list to show up
      return /search/i.test(text)
    },
  })

  // Click on "Lettuce" item
  await driver.clickText('Lettuce')

  const afterClickLettuceSnapshot = await driver.text()
  expect(afterClickLettuceSnapshot).toMatchInlineSnapshot(`
      "

       Simple List Example ────────────────────────────────────────────

       Search items...


       Fruits
       Apple Red and sweet                              Fresh [Popular]
       Banana Yellow and nutritious                                Ripe

       Vegetables
       Carrot Orange and crunchy                              [Healthy]
      ›Lettuce Green and fresh
       Bread Freshly baked                                  Today [New]


       ↵ select   ↑↓ navigate   ^k actions"
    `)

  // Click on "Apple" item
  await driver.clickText('Apple')

  const afterClickAppleSnapshot = await driver.text()
  expect(afterClickAppleSnapshot).toMatchInlineSnapshot(`
      "

       Simple List Example ────────────────────────────────────────────

       Search items...


       Fruits
      ›Apple Red and sweet                              Fresh [Popular]
       Banana Yellow and nutritious                                Ripe

       Vegetables
       Carrot Orange and crunchy                              [Healthy]
       Lettuce Green and fresh
       Bread Freshly baked                                  Today [New]


       ↵ select   ↑↓ navigate   ^k actions"
    `)

  // Click on the last item "Bread"
  await driver.clickText('Bread')

  const afterClickBreadSnapshot = await driver.text()
  expect(afterClickBreadSnapshot).toMatchInlineSnapshot(`
      "

       Simple List Example ────────────────────────────────────────────

       Search items...


       Fruits
       Apple Red and sweet                              Fresh [Popular]
       Banana Yellow and nutritious                                Ripe

       Vegetables
       Carrot Orange and crunchy                              [Healthy]
       Lettuce Green and fresh
      ›Bread Freshly baked                                  Today [New]


       ↵ select   ↑↓ navigate   ^k actions"
    `)
}, 10000)

test('list actions panel with ctrl+k', async () => {
  await driver.text({
    waitFor: (text) => {
      // wait for list to show up
      return /search/i.test(text)
    },
  })

  // Press ctrl+k to open actions panel
  await driver.keys.ctrlK()

  const afterCtrlKSnapshot = await driver.text()
  expect(afterCtrlKSnapshot).toMatchInlineSnapshot(`
      "

       Simple List Example ────────────────────────────────────────────

       Search items...


       Fruits
      ›Apple Red and sweet                              Fresh [Popular]
       Banana Yellow and nutritious                                Ripe

       Vegetables

                                                                   esc

        Search actions...
        View Details
        Add to Cart


        ↵ select   ↑↓ navigate"
    `)

  // Navigate down to second action
  await driver.keys.down()

  const afterDownInActionsSnapshot = await driver.text()
  expect(afterDownInActionsSnapshot).toMatchInlineSnapshot(`
      "

       Simple List Example ────────────────────────────────────────────

       Search items...


       Fruits
      ›Apple Red and sweet                              Fresh [Popular]
       Banana Yellow and nutritious                                Ripe

       Vegetables

                                                                   esc

        Search actions...
        View Details
        Add to Cart


        ↵ select   ↑↓ navigate"
    `)

  // Trigger the second action (Add to Cart)
  await driver.keys.enter()

  const afterSelectSecondActionSnapshot = await driver.text()
  expect(afterSelectSecondActionSnapshot).toMatchInlineSnapshot(`
      "

       Simple List Example ────────────────────────────────────────────

       Search items...


       Fruits
      ›Apple Red and sweet                              Fresh [Popular]
       Banana Yellow and nutritious                                Ripe

       Vegetables
       Carrot Orange and crunchy                              [Healthy]
       Lettuce Green and fresh
       Bread Freshly baked                                  Today [New]


       ┌─────────────────────────────────────────────────────┐
       │ ✓ Added to Cart - Apple has been added to your cart │
       └─────────────────────────────────────────────────────┘"
    `)
}, 10000)
