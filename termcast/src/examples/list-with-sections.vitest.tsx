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

       Simple List Example

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

       Simple List Example

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

       Simple List Example

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

       Simple List Example

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

    // Type 'ban' to filter for Banana
    await driver.keys.type('ban')

    const afterSearchBanSnapshot = await driver.text({
        waitFor: (text) => {
            return /\bban\b/.test(text)
        },
    })
    expect(afterSearchBanSnapshot).toMatchInlineSnapshot(`
      "

       Simple List Example

       ban

      ›Banana Yellow and nutritious                                Ripe


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

       Simple List Example

       let

      ›Lettuce Green and fresh


       ↵ select   ↑↓ navigate   ^k actions"
    `)

    // Clear search to show all items again
    await driver.keys.backspace()
    await driver.keys.backspace()
    await driver.keys.backspace()

    const afterClearSearchSnapshot = await driver.text()
    expect(afterClearSearchSnapshot).toMatchInlineSnapshot(`
      "

       Simple List Example

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

       Simple List Example

       bread

      ›Bread Freshly baked                                  Today [New]


       ↵ select   ↑↓ navigate   ^k actions"
    `)

    // Select the bread item
    await driver.keys.enter()

    const afterSelectBreadSnapshot = await driver.text()
    expect(afterSelectBreadSnapshot).toMatchInlineSnapshot(`
      "



      # Bread

      Freshly baked bread from our bakery.

      ## Product Details
      - Baked fresh daily
      - Made with organic flour
      - No preservatives
      - Perfect for sandwiches or toast


       esc go back"
    `)
}, 10000)
