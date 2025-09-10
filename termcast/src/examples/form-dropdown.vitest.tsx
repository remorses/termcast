// node-pty does not work in bun, so we use vitest to run this test
import { test, expect, afterEach, beforeEach } from 'vitest'
import { NodeTuiDriver } from '@termcast/cli/src/e2e-node'

let driver: NodeTuiDriver

beforeEach(() => {
  driver = new NodeTuiDriver('bun', ['src/examples/form-dropdown.tsx'], {
    cols: 70,
    rows: 50,
  })
})

afterEach(() => {
  driver?.dispose()
})

test('form dropdown shows inline options', async () => {
  await driver.text({
    waitFor: (text) => {
      // wait for form to show up
      return /Dropdown Component Demo/i.test(text)
    },
  })

  const initialSnapshot = await driver.text()
  expect(initialSnapshot).toMatchInlineSnapshot(`
    "

    ▪︎ Dropdown Component Demo
    │ Test dropdown with sections, multiple selection, and more featur
    │
    ◆ Programming Languages
    │ TypeScript, Rust
    │
    │ Frontend
    │ › ● TypeScript
    │   ○ JavaScript
    │   ○ React
    │   ○ Vue

    │ ↑↓ to see more options
    │
    │ Choose your preferred programming languages
    │
    ◇ Editor Theme
    │ Dracula
    │
    │   ○ Monokai
    │   ● Dracula
    │   ○ One Dark
    │   ○ Nord
    │ ↑↓ to see more options
    │
    │ Select your preferred editor color theme
    │
    ◇ Task Priority
    │ Select priority level
    │
    │   ○ Critical
    │   ○ High
    │   ○ Medium
    │   ○ Low
    └


     ↵ submit   ↑↓ navigate   ^k actions"
  `)

  // Open the first dropdown
  await driver.keys.space()

  const dropdownOpenSnapshot = await driver.text()
  expect(dropdownOpenSnapshot).toMatchInlineSnapshot(`
    "

    ▪︎ Dropdown Component Demo
    │ Test dropdown with sections, multiple selection, and more featur
    │
    ◆ Programming Languages
    │ Rust
    │
    │ Frontend
    │ › ○ TypeScript
    │   ○ JavaScript
    │   ○ React
    │   ○ Vue

    │ ↑↓ to see more options
    │
    │ Choose your preferred programming languages
    │
    ◇ Editor Theme
    │ Dracula
    │
    │   ○ Monokai
    │   ● Dracula
    │   ○ One Dark
    │   ○ Nord
    │ ↑↓ to see more options
    │
    │ Select your preferred editor color theme
    │
    ◇ Task Priority
    │ Select priority level
    │
    │   ○ Critical
    │   ○ High
    │   ○ Medium
    │   ○ Low
    └


     ↵ submit   ↑↓ navigate   ^k actions"
  `)

  // Navigate down
  await driver.keys.down()

  const afterDownSnapshot = await driver.text()
  expect(afterDownSnapshot).toMatchInlineSnapshot(`
    "

    ▪︎ Dropdown Component Demo
    │ Test dropdown with sections, multiple selection, and more featur
    │
    ◆ Programming Languages
    │ Rust
    │
    │ Frontend
    │   ○ TypeScript
    │ › ○ JavaScript
    │   ○ React
    │   ○ Vue

    │ ↑↓ to see more options
    │
    │ Choose your preferred programming languages
    │
    ◇ Editor Theme
    │ Dracula
    │
    │   ○ Monokai
    │   ● Dracula
    │   ○ One Dark
    │   ○ Nord
    │ ↑↓ to see more options
    │
    │ Select your preferred editor color theme
    │
    ◇ Task Priority
    │ Select priority level
    │
    │   ○ Critical
    │   ○ High
    │   ○ Medium
    │   ○ Low
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

    ▪︎ Dropdown Component Demo
    │ Test dropdown with sections, multiple selection, and more featur
    │
    ◆ Programming Languages
    │ Rust
    │
    │ Frontend
    │   ○ React
    │   ○ Vue
    │   ○ Svelte

    │ Backend
    │ › ○ Node.js

    │ ↑↓ to see more options
    │
    │ Choose your preferred programming languages
    │
    ◇ Editor Theme
    │ Dracula
    │
    │   ○ Monokai
    │   ● Dracula
    │   ○ One Dark
    │   ○ Nord
    │ ↑↓ to see more options
    │
    │ Select your preferred editor color theme
    │
    ◇ Task Priority
    │ Select priority level
    │
    │   ○ Critical
    │   ○ High
    │   ○ Medium
    │   ○ Low
    └


     ↵ submit   ↑↓ navigate   ^k actions"
  `)

  // Select an item
  await driver.keys.enter()

  const afterSelectSnapshot = await driver.text()
  expect(afterSelectSnapshot).toMatchInlineSnapshot(`
    "

    ▪︎ Dropdown Component Demo
    │ Test dropdown with sections, multiple selection, and more featur
    │
    ◆ Programming Languages
    │ Rust, Node.js
    │
    │ Frontend
    │   ○ React
    │   ○ Vue
    │   ○ Svelte

    │ Backend
    │ › ● Node.js

    │ ↑↓ to see more options
    │
    │ Choose your preferred programming languages
    │
    ◇ Editor Theme
    │ Dracula
    │
    │   ○ Monokai
    │   ● Dracula
    │   ○ One Dark
    │   ○ Nord
    │ ↑↓ to see more options
    │
    │ Select your preferred editor color theme
    │
    ◇ Task Priority
    │ Select priority level
    │
    │   ○ Critical
    │   ○ High
    │   ○ Medium
    │   ○ Low
    └


     ↵ submit   ↑↓ navigate   ^k actions"
  `)
}, 10000)

test('form dropdown keyboard navigation', async () => {
  await driver.text({
    waitFor: (text) => {
      // wait for form to show up
      return /Dropdown Component Demo/i.test(text)
    },
  })

  // Open dropdown
  await driver.keys.space()

  const openSnapshot = await driver.text()
  expect(openSnapshot).toMatchInlineSnapshot(`
    "

    ▪︎ Dropdown Component Demo
    │ Test dropdown with sections, multiple selection, and more featur
    │
    ◆ Programming Languages
    │ Rust
    │
    │ Frontend
    │ › ○ TypeScript
    │   ○ JavaScript
    │   ○ React
    │   ○ Vue

    │ ↑↓ to see more options
    │
    │ Choose your preferred programming languages
    │
    ◇ Editor Theme
    │ Dracula
    │
    │   ○ Monokai
    │   ● Dracula
    │   ○ One Dark
    │   ○ Nord
    │ ↑↓ to see more options
    │
    │ Select your preferred editor color theme
    │
    ◇ Task Priority
    │ Select priority level
    │
    │   ○ Critical
    │   ○ High
    │   ○ Medium
    │   ○ Low
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

    ▪︎ Dropdown Component Demo
    │ Test dropdown with sections, multiple selection, and more featur
    │
    ◆ Programming Languages
    │ Rust
    │
    │ Frontend
    │   ○ JavaScript
    │   ○ React
    │   ○ Vue
    │ › ○ Svelte

    │ ↑↓ to see more options
    │
    │ Choose your preferred programming languages
    │
    ◇ Editor Theme
    │ Dracula
    │
    │   ○ Monokai
    │   ● Dracula
    │   ○ One Dark
    │   ○ Nord
    │ ↑↓ to see more options
    │
    │ Select your preferred editor color theme
    │
    ◇ Task Priority
    │ Select priority level
    │
    │   ○ Critical
    │   ○ High
    │   ○ Medium
    │   ○ Low
    └


     ↵ submit   ↑↓ navigate   ^k actions"
  `)

  // Navigate to next page
  await driver.keys.down()

  const nextPageSnapshot = await driver.text()
  expect(nextPageSnapshot).toMatchInlineSnapshot(`
    "

    ▪︎ Dropdown Component Demo
    │ Test dropdown with sections, multiple selection, and more featur
    │
    ◆ Programming Languages
    │ Rust
    │
    │ Frontend
    │   ○ React
    │   ○ Vue
    │   ○ Svelte

    │ Backend
    │ › ○ Node.js

    │ ↑↓ to see more options
    │
    │ Choose your preferred programming languages
    │
    ◇ Editor Theme
    │ Dracula
    │
    │   ○ Monokai
    │   ● Dracula
    │   ○ One Dark
    │   ○ Nord
    │ ↑↓ to see more options
    │
    │ Select your preferred editor color theme
    │
    ◇ Task Priority
    │ Select priority level
    │
    │   ○ Critical
    │   ○ High
    │   ○ Medium
    │   ○ Low
    └


     ↵ submit   ↑↓ navigate   ^k actions"
  `)

  // Go back up
  await driver.keys.up()

  const backToPreviousPageSnapshot = await driver.text()
  expect(backToPreviousPageSnapshot).toMatchInlineSnapshot(`
    "

    ▪︎ Dropdown Component Demo
    │ Test dropdown with sections, multiple selection, and more featur
    │
    ◆ Programming Languages
    │ Rust
    │
    │ Frontend
    │   ○ React
    │   ○ Vue
    │ › ○ Svelte

    │ Backend
    │   ○ Node.js

    │ ↑↓ to see more options
    │
    │ Choose your preferred programming languages
    │
    ◇ Editor Theme
    │ Dracula
    │
    │   ○ Monokai
    │   ● Dracula
    │   ○ One Dark
    │   ○ Nord
    │ ↑↓ to see more options
    │
    │ Select your preferred editor color theme
    │
    ◇ Task Priority
    │ Select priority level
    │
    │   ○ Critical
    │   ○ High
    │   ○ Medium
    │   ○ Low
    └


     ↵ submit   ↑↓ navigate   ^k actions"
  `)

  // Close with escape
  await driver.keys.escape()

  const closedSnapshot = await driver.text()
  expect(closedSnapshot).toMatchInlineSnapshot(`
    "

    ▪︎ Dropdown Component Demo
    │ Test dropdown with sections, multiple selection, and more featur
    │
    ◆ Programming Languages
    │ Rust
    │
    │ Frontend
    │   ○ React
    │   ○ Vue
    │ › ○ Svelte

    │ Backend
    │   ○ Node.js

    │ ↑↓ to see more options
    │
    │ Choose your preferred programming languages
    │
    ◇ Editor Theme
    │ Dracula
    │
    │   ○ Monokai
    │   ● Dracula
    │   ○ One Dark
    │   ○ Nord
    │ ↑↓ to see more options
    │
    │ Select your preferred editor color theme
    │
    ◇ Task Priority
    │ Select priority level
    │
    │   ○ Critical
    │   ○ High
    │   ○ Medium
    │   ○ Low
    └


     ↵ submit   ↑↓ navigate   ^k actions"
  `)
}, 10000)

test('form dropdown with default value', async () => {
  await driver.text({
    waitFor: (text) => {
      // wait for form to show up
      return /Dropdown Component Demo/i.test(text)
    },
  })

  // Navigate to second dropdown
  await driver.keys.tab()

  const secondDropdownFocusedSnapshot = await driver.text()
  expect(secondDropdownFocusedSnapshot).toMatchInlineSnapshot(`
    "

    ▪︎ Dropdown Component Demo
    │ Test dropdown with sections, multiple selection, and more featur
    │
    ◇ Programming Languages
    │ TypeScript, Rust
    │
    │ Frontend
    │   ● TypeScript
    │   ○ JavaScript
    │   ○ React
    │   ○ Vue

    │ ↑↓ to see more options
    │
    │ Choose your preferred programming languages
    │
    ◆ Editor Theme
    │ Dracula
    │
    │ › ○ Monokai
    │   ● Dracula
    │   ○ One Dark
    │   ○ Nord
    │ ↑↓ to see more options
    │
    │ Select your preferred editor color theme
    │
    ◇ Task Priority
    │ Select priority level
    │
    │   ○ Critical
    │   ○ High
    │   ○ Medium
    │   ○ Low
    └


     ↵ submit   ↑↓ navigate   ^k actions"
  `)

  // Open dropdown
  await driver.keys.space()

  const secondDropdownOpenSnapshot = await driver.text()
  expect(secondDropdownOpenSnapshot).toMatchInlineSnapshot(`
    "

    ▪︎ Dropdown Component Demo
    │ Test dropdown with sections, multiple selection, and more featur
    │
    ◇ Programming Languages
    │ TypeScript, Rust
    │
    │ Frontend
    │   ● TypeScript
    │   ○ JavaScript
    │   ○ React
    │   ○ Vue

    │ ↑↓ to see more options
    │
    │ Choose your preferred programming languages
    │
    ◆ Editor Theme
    │ Monokai
    │
    │ › ● Monokai
    │   ○ Dracula
    │   ○ One Dark
    │   ○ Nord
    │ ↑↓ to see more options
    │
    │ Select your preferred editor color theme
    │
    ◇ Task Priority
    │ Select priority level
    │
    │   ○ Critical
    │   ○ High
    │   ○ Medium
    │   ○ Low
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

    ▪︎ Dropdown Component Demo
    │ Test dropdown with sections, multiple selection, and more featur
    │
    ◇ Programming Languages
    │ TypeScript, Rust
    │
    │ Frontend
    │   ● TypeScript
    │   ○ JavaScript
    │   ○ React
    │   ○ Vue

    │ ↑↓ to see more options
    │
    │ Choose your preferred programming languages
    │
    ◆ Editor Theme
    │ Monokai
    │
    │ › ● Monokai
    │   ○ Dracula
    │   ○ One Dark
    │   ○ Nord
    │ ↑↓ to see more options
    │
    │ Select your preferred editor color theme
    │
    ◇ Task Priority
    │ Select priority level
    │
    │   ○ Critical
    │   ○ High
    │   ○ Medium
    │   ○ Low
    └


     ↵ submit   ↑↓ navigate   ^k actions"
  `)
}, 10000)

test('selecting second-to-last visible item should not scroll', async () => {
  await driver.text({
    waitFor: (text) => {
      // wait for form to show up
      return /Dropdown Component Demo/i.test(text)
    },
  })

  // Navigate down twice to get to Green (second-to-last visible item)
  await driver.keys.down()
  await driver.keys.down()

  const beforeSelectSnapshot = await driver.text()
  expect(beforeSelectSnapshot).toMatchInlineSnapshot(`
    "

    ▪︎ Dropdown Component Demo
    │ Test dropdown with sections, multiple selection, and more featur
    │
    ◆ Programming Languages
    │ TypeScript, Rust
    │
    │ Frontend
    │   ● TypeScript
    │   ○ JavaScript
    │ › ○ React
    │   ○ Vue

    │ ↑↓ to see more options
    │
    │ Choose your preferred programming languages
    │
    ◇ Editor Theme
    │ Dracula
    │
    │   ○ Monokai
    │   ● Dracula
    │   ○ One Dark
    │   ○ Nord
    │ ↑↓ to see more options
    │
    │ Select your preferred editor color theme
    │
    ◇ Task Priority
    │ Select priority level
    │
    │   ○ Critical
    │   ○ High
    │   ○ Medium
    │   ○ Low
    └


     ↵ submit   ↑↓ navigate   ^k actions"
  `)

  // Press Enter to select Green
  await driver.keys.enter()

  const afterSelectSnapshot = await driver.text()
  expect(afterSelectSnapshot).toMatchInlineSnapshot(`
    "

    ▪︎ Dropdown Component Demo
    │ Test dropdown with sections, multiple selection, and more featur
    │
    ◆ Programming Languages
    │ TypeScript, Rust, React
    │
    │ Frontend
    │   ● TypeScript
    │   ○ JavaScript
    │ › ● React
    │   ○ Vue

    │ ↑↓ to see more options
    │
    │ Choose your preferred programming languages
    │
    ◇ Editor Theme
    │ Dracula
    │
    │   ○ Monokai
    │   ● Dracula
    │   ○ One Dark
    │   ○ Nord
    │ ↑↓ to see more options
    │
    │ Select your preferred editor color theme
    │
    ◇ Task Priority
    │ Select priority level
    │
    │   ○ Critical
    │   ○ High
    │   ○ Medium
    │   ○ Low
    └


     ↵ submit   ↑↓ navigate   ^k actions"
  `)

  // The window should NOT have scrolled - should still show Red, Blue, Green, Yellow
}, 10000)
