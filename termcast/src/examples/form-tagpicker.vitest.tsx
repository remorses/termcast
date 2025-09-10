// node-pty does not work in bun, so we use vitest to run this test
import { test, expect, afterEach, beforeEach } from 'vitest'
import { NodeTuiDriver } from '@termcast/cli/src/e2e-node'

let driver: NodeTuiDriver

beforeEach(() => {
  driver = new NodeTuiDriver('bun', ['src/examples/form-tagpicker.tsx'], {
    cols: 70,
    rows: 50,
  })
})

afterEach(() => {
  driver?.dispose()
})

test('form tagpicker shows inline options', async () => {
  await driver.text({
    waitFor: (text) => {
      // wait for form to show up
      return /TagPicker Component Demo/i.test(text)
    },
  })

  const initialSnapshot = await driver.text()
  expect(initialSnapshot).toMatchInlineSnapshot(`
      "

      ▪︎ TagPicker Component Demo
      │ Test tag picker with multiple selection support
      │
      ◆ Favorite Sport
      │ Choose your favorite sport...
      │
      │ ○ Basketball
      │ ○ Football
      │ ○ Tennis
      │ ○ Baseball
      │ ↑↓ to see more options
      │
      │ Select your favorite sport from the list
      │
      ◇ Country
      │ Germany
      │
      │ ● Germany
      │ ○ India
      │ ○ Netherlands
      │ ○ Norway
      │ ↑↓ to see more options
      │
      └


       ↵ submit   ↑↓ navigate   ^k actions"
    `)

  // Open the first tagpicker
  await driver.keys.space()

  const tagpickerOpenSnapshot = await driver.text()
  expect(tagpickerOpenSnapshot).toMatchInlineSnapshot(`
      "

      ▪︎ TagPicker Component Demo
      │ Test tag picker with multiple selection support
      │
      ◆ Favorite Sport
      │ Basketball
      │
      │ ● Basketball
      │ ○ Football
      │ ○ Tennis
      │ ○ Baseball
      │ ↑↓ to see more options
      │
      │ Select your favorite sport from the list
      │
      ◇ Country
      │ Germany
      │
      │ ● Germany
      │ ○ India
      │ ○ Netherlands
      │ ○ Norway
      │ ↑↓ to see more options
      │
      └


       ↵ submit   ↑↓ navigate   ^k actions"
    `)

  // Navigate down
  await driver.keys.down()

  const afterDownSnapshot = await driver.text()
  expect(afterDownSnapshot).toMatchInlineSnapshot(`
      "

      ▪︎ TagPicker Component Demo
      │ Test tag picker with multiple selection support
      │
      ◆ Favorite Sport
      │ Basketball
      │
      │ ● Basketball
      │ ○ Football
      │ ○ Tennis
      │ ○ Baseball
      │ ↑↓ to see more options
      │
      │ Select your favorite sport from the list
      │
      ◇ Country
      │ Germany
      │
      │ ● Germany
      │ ○ India
      │ ○ Netherlands
      │ ○ Norway
      │ ↑↓ to see more options
      │
      └


       ↵ submit   ↑↓ navigate   ^k actions"
    `)

  // Navigate down to see pagination
  await driver.keys.down()
  await driver.keys.down()
  await driver.keys.down()
  await driver.keys.down()

  const afterMultipleDownSnapshot = await driver.text()
  expect(afterMultipleDownSnapshot).toMatchInlineSnapshot(`
      "

      ▪︎ TagPicker Component Demo
      │ Test tag picker with multiple selection support
      │
      ◆ Favorite Sport
      │ Basketball
      │
      │ ○ Baseball
      │ ○ Golf
      │ ○ Swimming
      │ ○ Cycling
      │ ↑↓ to see more options
      │
      │ Select your favorite sport from the list
      │
      ◇ Country
      │ Germany
      │
      │ ● Germany
      │ ○ India
      │ ○ Netherlands
      │ ○ Norway
      │ ↑↓ to see more options
      │
      └


       ↵ submit   ↑↓ navigate   ^k actions"
    `)

  // Select an item
  await driver.keys.enter()

  const afterSelectSnapshot = await driver.text()
  expect(afterSelectSnapshot).toMatchInlineSnapshot(`
      "

      ▪︎ TagPicker Component Demo
      │ Test tag picker with multiple selection support
      │
      ◆ Favorite Sport
      │ Basketball, Swimming
      │
      │ ○ Baseball
      │ ○ Golf
      │ ● Swimming
      │ ○ Cycling
      │ ↑↓ to see more options
      │
      │ Select your favorite sport from the list
      │
      ◇ Country
      │ Germany
      │
      │ ● Germany
      │ ○ India
      │ ○ Netherlands
      │ ○ Norway
      │ ↑↓ to see more options
      │
      └


       ↵ submit   ↑↓ navigate   ^k actions"
    `)
}, 10000)

test('form tagpicker keyboard navigation', async () => {
  await driver.text({
    waitFor: (text) => {
      // wait for form to show up
      return /TagPicker Component Demo/i.test(text)
    },
  })

  // Open tagpicker
  await driver.keys.space()

  const openSnapshot = await driver.text()
  expect(openSnapshot).toMatchInlineSnapshot(`
      "

      ▪︎ TagPicker Component Demo
      │ Test tag picker with multiple selection support
      │
      ◆ Favorite Sport
      │ Basketball
      │
      │ ● Basketball
      │ ○ Football
      │ ○ Tennis
      │ ○ Baseball
      │ ↑↓ to see more options
      │
      │ Select your favorite sport from the list
      │
      ◇ Country
      │ Germany
      │
      │ ● Germany
      │ ○ India
      │ ○ Netherlands
      │ ○ Norway
      │ ↑↓ to see more options
      │
      └


       ↵ submit   ↑↓ navigate   ^k actions"
    `)

  // Navigate to last visible item
  await driver.keys.down()
  await driver.keys.down()
  await driver.keys.down()
  await driver.keys.down()

  const lastVisibleSnapshot = await driver.text()
  expect(lastVisibleSnapshot).toMatchInlineSnapshot(`
      "

      ▪︎ TagPicker Component Demo
      │ Test tag picker with multiple selection support
      │
      ◆ Favorite Sport
      │ Basketball
      │
      │ ○ Tennis
      │ ○ Baseball
      │ ○ Golf
      │ ○ Swimming
      │ ↑↓ to see more options
      │
      │ Select your favorite sport from the list
      │
      ◇ Country
      │ Germany
      │
      │ ● Germany
      │ ○ India
      │ ○ Netherlands
      │ ○ Norway
      │ ↑↓ to see more options
      │
      └


       ↵ submit   ↑↓ navigate   ^k actions"
    `)

  // Navigate to next page
  await driver.keys.down()

  const nextPageSnapshot = await driver.text()
  expect(nextPageSnapshot).toMatchInlineSnapshot(`
      "

      ▪︎ TagPicker Component Demo
      │ Test tag picker with multiple selection support
      │
      ◆ Favorite Sport
      │ Basketball
      │
      │ ○ Baseball
      │ ○ Golf
      │ ○ Swimming
      │ ○ Cycling
      │ ↑↓ to see more options
      │
      │ Select your favorite sport from the list
      │
      ◇ Country
      │ Germany
      │
      │ ● Germany
      │ ○ India
      │ ○ Netherlands
      │ ○ Norway
      │ ↑↓ to see more options
      │
      └


       ↵ submit   ↑↓ navigate   ^k actions"
    `)

  // Go back up
  await driver.keys.up()

  const backToPreviousPageSnapshot = await driver.text()
  expect(backToPreviousPageSnapshot).toMatchInlineSnapshot(`
      "

      ▪︎ TagPicker Component Demo
      │ Test tag picker with multiple selection support
      │
      ◆ Favorite Sport
      │ Basketball
      │
      │ ○ Baseball
      │ ○ Golf
      │ ○ Swimming
      │ ○ Cycling
      │ ↑↓ to see more options
      │
      │ Select your favorite sport from the list
      │
      ◇ Country
      │ Germany
      │
      │ ● Germany
      │ ○ India
      │ ○ Netherlands
      │ ○ Norway
      │ ↑↓ to see more options
      │
      └


       ↵ submit   ↑↓ navigate   ^k actions"
    `)

  // Close with escape
  await driver.keys.escape()

  const closedSnapshot = await driver.text()
  expect(closedSnapshot).toMatchInlineSnapshot(`
      "

      ▪︎ TagPicker Component Demo
      │ Test tag picker with multiple selection support
      │
      ◆ Favorite Sport
      │ Basketball
      │
      │ ○ Baseball
      │ ○ Golf
      │ ○ Swimming
      │ ○ Cycling
      │ ↑↓ to see more options
      │
      │ Select your favorite sport from the list
      │
      ◇ Country
      │ Germany
      │
      │ ● Germany
      │ ○ India
      │ ○ Netherlands
      │ ○ Norway
      │ ↑↓ to see more options
      │
      └


       ↵ submit   ↑↓ navigate   ^k actions"
    `)
}, 10000)

test('form tagpicker with default value', async () => {
  await driver.text({
    waitFor: (text) => {
      // wait for form to show up
      return /TagPicker Component Demo/i.test(text)
    },
  })

  // Navigate to second tagpicker
  await driver.keys.tab()

  const secondTagpickerFocusedSnapshot = await driver.text()
  expect(secondTagpickerFocusedSnapshot).toMatchInlineSnapshot(`
      "

      ▪︎ TagPicker Component Demo
      │ Test tag picker with multiple selection support
      │
      ◇ Favorite Sport
      │ Choose your favorite sport...
      │
      │ ○ Basketball
      │ ○ Football
      │ ○ Tennis
      │ ○ Baseball
      │ ↑↓ to see more options
      │
      │ Select your favorite sport from the list
      │
      ◆ Country
      │ Germany
      │
      │ ● Germany
      │ ○ India
      │ ○ Netherlands
      │ ○ Norway
      │ ↑↓ to see more options
      │
      └


       ↵ submit   ↑↓ navigate   ^k actions"
    `)

  // Open tagpicker
  await driver.keys.space()

  const secondTagpickerOpenSnapshot = await driver.text()
  expect(secondTagpickerOpenSnapshot).toMatchInlineSnapshot(`
      "

      ▪︎ TagPicker Component Demo
      │ Test tag picker with multiple selection support
      │
      ◇ Favorite Sport
      │ Choose your favorite sport...
      │
      │ ○ Basketball
      │ ○ Football
      │ ○ Tennis
      │ ○ Baseball
      │ ↑↓ to see more options
      │
      │ Select your favorite sport from the list
      │
      ◆ Country
      │ Select a country
      │
      │ ○ Germany
      │ ○ India
      │ ○ Netherlands
      │ ○ Norway
      │ ↑↓ to see more options
      │
      └


       ↵ submit   ↑↓ navigate   ^k actions"
    `)

  // Submit form
  await driver.keys.escape()
  await driver.keys.cmdEnter()

  const afterSubmitSnapshot = await driver.text({
    waitFor: (text) => {
      return /Submitted Data/i.test(text)
    },
  })
  expect(afterSubmitSnapshot).toMatchInlineSnapshot(`
      "

      ▪︎ TagPicker Component Demo
      │ Test tag picker with multiple selection support
      │
      ◇ Favorite Sport
      │ Choose your favorite sport...
      │
      │ ○ Basketball
      │ ○ Football
      │ ○ Tennis
      │ ○ Baseball
      │ ↑↓ to see more options
      │
      │ Select your favorite sport from the list
      │
      ◆ Country
      │ Select a country
      │
      │ ○ Germany
      │ ○ India
      │ ○ Netherlands
      │ ○ Norway
      │ ↑↓ to see more options
      │
      └


       ↵ submit   ↑↓ navigate   ^k actions"
    `)
}, 10000)
