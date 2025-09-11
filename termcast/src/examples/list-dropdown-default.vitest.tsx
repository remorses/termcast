// node-pty does not work in bun, so we use vitest to run this test
import { test, expect, afterEach, beforeEach } from 'vitest'
import { NodeTuiDriver } from '@termcast/cli/src/e2e-node'

let driver: NodeTuiDriver

beforeEach(() => {
  driver = new NodeTuiDriver('bun', ['src/examples/list-dropdown-default.tsx'], {
    cols: 80,
    rows: 30,
  })
})

afterEach(() => {
  driver?.dispose()
})

test('dropdown defaults to first item when no value is provided', async () => {
  await driver.text({
    waitFor: (text) => {
      // wait for list to show up
      return /Dropdown Default Value Example/i.test(text)
    },
  })

  // Add small delay to ensure all items have registered
  await new Promise(resolve => setTimeout(resolve, 100))

  const initialSnapshot = await driver.text()
  expect(initialSnapshot).toMatchInlineSnapshot(`
    "

     Dropdown Default Value Example ───────────────────────────────────────────


     Search...                                                          Apple ▾


    ›First Item This list has a dropdown
     Second Item The dropdown should default to first item

     Vegetables
     Carrot With another dropdown


     ↵ select   ↑↓ navigate   ^k actions"
  `)

  // The dropdown should show "Apple" as the default value
  // since it's the first item and no value/defaultValue was provided
}, 10000)

test('dropdown opens and shows items', async () => {
  await driver.text({
    waitFor: (text) => {
      return /Dropdown Default Value Example/i.test(text)
    },
  })

  // Open dropdown with ctrl+p
  await driver.keys.ctrlP()

  const dropdownOpenSnapshot = await driver.text()
  expect(dropdownOpenSnapshot).toMatchInlineSnapshot(`
    "


      Filter by category                                                 esc

      Select category...
     ›Apple
      Banana
      Orange
      Grape


      ↵ select   ↑↓ navigate


    ↵ select   ↑↓ navigate   ^k actions"
  `)

  // Navigate down to second item
  await driver.keys.down()

  const afterDownSnapshot = await driver.text()
  expect(afterDownSnapshot).toMatchInlineSnapshot(`
    "


      Filter by category                                                 esc

      Select category...
      Apple
     ›Banana
      Orange
      Grape


      ↵ select   ↑↓ navigate


    ↵ select   ↑↓ navigate   ^k actions"
  `)

  // Select the second item
  await driver.keys.enter()

  const afterSelectSnapshot = await driver.text()
  expect(afterSelectSnapshot).toMatchInlineSnapshot(`
    "

     Dropdown Default Value Example ───────────────────────────────────────────


     Search...                                                         Banana ▾


    ›First Item This list has a dropdown
     Second Item The dropdown should default to first item

     Vegetables
     Carrot With another dropdown


     ↵ select   ↑↓ navigate   ^k actions"
  `)
}, 10000)

test('clicking dropdown opens it', async () => {
  await driver.text({
    waitFor: (text) => {
      return /Dropdown Default Value Example/i.test(text)
    },
  })

  // Click on the dropdown (it should show "Apple" by default)
  await driver.clickText('Apple')

  const afterClickSnapshot = await driver.text()
  expect(afterClickSnapshot).toMatchInlineSnapshot(`
    "


      Filter by category                                                 esc

      Select category...
     ›Apple
      Banana
      Orange
      Grape


      ↵ select   ↑↓ navigate


    ↵ select   ↑↓ navigate   ^k actions"
  `)

  // Select Orange
  await driver.clickText('Orange')

  const afterSelectOrangeSnapshot = await driver.text()
  expect(afterSelectOrangeSnapshot).toMatchInlineSnapshot(`
    "

     Dropdown Default Value Example ───────────────────────────────────────────


     Search...                                                         Orange ▾


    ›First Item This list has a dropdown
     Second Item The dropdown should default to first item

     Vegetables
     Carrot With another dropdown


     ↵ select   ↑↓ navigate   ^k actions"
  `)
}, 10000)