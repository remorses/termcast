// node-pty does not work in bun, so we use vitest to run this test
import { test, expect, afterEach } from 'vitest'
import { NodeTuiDriver } from '../e2e-node'

let driver = new NodeTuiDriver('bun', ['src/examples/list-with-sections.tsx'], {
    cols: 100,
    rows: 50,
})

afterEach(() => {
    driver?.dispose()
})

test('list with sections navigation', async () => {
    // Wait for the process to start and render
    await driver.waitIdle({ timeout: 3000 })

    const initialSnapshot = await driver.text()
    expect(initialSnapshot).toMatchInlineSnapshot(`""`)

    await driver.keys.down()

    const afterDownSnapshot = await driver.text()
    expect(afterDownSnapshot).toMatchInlineSnapshot(`
      "

       Simple List Example

       Search items...


       Fruits
      ›Apple Red and sweet                                                            Fresh [Popular]
       Banana Yellow and nutritious                                                              Ripe

       Vegetables
       Carrot Orange and crunchy                                                            [Healthy]
       Lettuce Green and fresh
       Bread Freshly baked                                                                Today [New]


       ↵ select   ↑↓ navigate   ^k actions"
    `)

    await driver.keys.down()

    const secondDownSnapshot = await driver.text()
    expect(secondDownSnapshot).toMatchInlineSnapshot(`
      "

       Simple List Example

       Search items...


       Fruits
       Apple Red and sweet                                                            Fresh [Popular]
      ›Banana Yellow and nutritious                                                              Ripe

       Vegetables
       Carrot Orange and crunchy                                                            [Healthy]
       Lettuce Green and fresh
       Bread Freshly baked                                                                Today [New]


       ↵ select   ↑↓ navigate   ^k actions"
    `)

    await driver.keys.enter()

    const afterEnterSnapshot = await driver.text()
    expect(afterEnterSnapshot).toMatchInlineSnapshot(`
      "



      # Banana

      A yellow tropical fruit that's nutritious and energy-rich.

      ## Benefits
      - High in potassium
      - Natural energy booster
      - Aids digestion









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
      ›Apple Red and sweet                                                            Fresh [Popular]
       Banana Yellow and nutritious                                                              Ripe

       Vegetables
       Carrot Orange and crunchy                                                            [Healthy]
       Lettuce Green and fresh
       Bread Freshly baked                                                                Today [New]


       ↵ select   ↑↓ navigate   ^k actions"
    `)
})
