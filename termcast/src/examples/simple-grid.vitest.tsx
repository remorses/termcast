// node-pty does not work in bun, so we use vitest to run this test
import { test, expect, afterEach, beforeEach } from 'vitest'
import { NodeTuiDriver } from '@termcast/cli/src/e2e-node'

let driver: NodeTuiDriver

beforeEach(() => {
  driver = new NodeTuiDriver('bun', ['src/examples/simple-grid.tsx'], {
    cols: 70,
    rows: 50,
  })
})

afterEach(() => {
  driver?.dispose()
})

test('grid navigation and display', async () => {
  const initialSnapshot = await driver.text({
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


     Fruits
    ›Apple
     Banana
     Cherry

     Animals
     Dog
     Cat
     Rabbit

     Others
     House
     Car
     Rocket
     Star
     Moon
     Sun


     ↵ select   ↑↓ navigate   ^k actions"
  `)

  // Navigate down
  await driver.keys.down()

  const afterDownSnapshot = await driver.text()
  expect(afterDownSnapshot).toMatchInlineSnapshot(`
    "

     Simple Grid Example ────────────────────────────────────────────

     Search items...


     Fruits
     Apple
    ›Banana
     Cherry

     Animals
     Dog
     Cat
     Rabbit

     Others
     House
     Car
     Rocket
     Star
     Moon
     Sun


     ↵ select   ↑↓ navigate   ^k actions"
  `)

  // Navigate right to Animals section
  await driver.keys.down()
  await driver.keys.down()

  const animalsSnapshot = await driver.text()
  expect(animalsSnapshot).toMatchInlineSnapshot(`
    "

     Simple Grid Example ────────────────────────────────────────────

     Search items...


     Fruits
     Apple
     Banana
     Cherry

     Animals
    ›Dog
     Cat
     Rabbit

     Others
     House
     Car
     Rocket
     Star
     Moon
     Sun


     ↵ select   ↑↓ navigate   ^k actions"
  `)

  // Open actions with ctrl+k
  await driver.keys.ctrlK()

  const actionsSnapshot = await driver.text()
  expect(actionsSnapshot).toMatchInlineSnapshot(`
    "

     Simple Grid Example ────────────────────────────────────────────

     Search items...


     Fruits
    ›Apple
     Banana
     Cherry


                                                                 esc

      Search actions...
     ›Show Details
      Copy Emoji                                                  ⌃C


      ↵ select   ↑↓ navigate

     Moon
     Sun


     ↵ select   ↑↓ navigate   ^k actions"
  `)

  // Close actions with escape
  await driver.keys.escape()

  const afterEscapeSnapshot = await driver.text()
  expect(afterEscapeSnapshot).toMatchInlineSnapshot(`
    "

     Simple Grid Example ────────────────────────────────────────────

     Search items...


     Fruits
    ›Apple
     Banana
     Cherry

     Animals
     Dog
     Cat
     Rabbit

     Others
     House
     Car
     Rocket
     Star
     Moon
     Sun


     ↵ select   ↑↓ navigate   ^k actions"
  `)
}, 15000)

test('grid search functionality', async () => {
  await driver.text({
    waitFor: (text) => {
      // wait for grid to show up
      return /Simple Grid Example/i.test(text)
    },
  })

  // Search for "cat"
  await driver.keys.type('cat')

  const searchCatSnapshot = await driver.text({
    waitFor: (text) => {
      return /cat/i.test(text)
    },
  })
  expect(searchCatSnapshot).toMatchInlineSnapshot(`
    "

    Simple Grid Example ────────────────────────────────────────────

    cat

    Cat


    ↵ select   ↑↓ navigate   ^k actions"
  `)

  // Clear search and search for "space"
  await driver.keys.backspace()
  await driver.keys.backspace()
  await driver.keys.backspace()
  await driver.keys.type('space')

  const searchSpaceSnapshot = await driver.text({
    waitFor: (text) => {
      return /space/i.test(text)
    },
  })
  expect(searchSpaceSnapshot).toMatchInlineSnapshot(`
    "

    Simple Grid Example ────────────────────────────────────────────

    space

    Rocket
    Star
    Moon
    Sun


    ↵ select   ↑↓ navigate   ^k actions"
  `)

  // Clear search completely
  await driver.keys.backspace()
  await driver.keys.backspace()
  await driver.keys.backspace()
  await driver.keys.backspace()
  await driver.keys.backspace()

  const clearedSearchSnapshot = await driver.text()
  expect(clearedSearchSnapshot).toMatchInlineSnapshot(`
    "

     Simple Grid Example ────────────────────────────────────────────

     Search items...


     Fruits
    ›Apple
     Banana
     Cherry

     Animals
     Dog
     Cat
     Rabbit

     Others
     House
     Car
     Rocket
     Star
     Moon
     Sun


     ↵ select   ↑↓ navigate   ^k actions"
  `)

  // Search for something that doesn't exist
  await driver.keys.type('xyz123')

  const noResultsSnapshot = await driver.text({
    waitFor: (text) => {
      return /xyz123/i.test(text)
    },
  })
  expect(noResultsSnapshot).toMatchInlineSnapshot(`
    "

    Simple Grid Example ────────────────────────────────────────────

    xyz123



    ↵ select   ↑↓ navigate   ^k actions"
  `)
}, 10000)

test('grid item selection and actions', async () => {
  await driver.text({
    waitFor: (text) => {
      // wait for grid to show up
      return /Simple Grid Example/i.test(text)
    },
  })

  // Select first item and open actions
  await driver.keys.enter()

  const firstItemActionsSnapshot = await driver.text()
  expect(firstItemActionsSnapshot).toMatchInlineSnapshot(`
    "

     Simple Grid Example ────────────────────────────────────────────

     Search items...


     Fruits
    ›Apple
     Banana
     Cherry


                                                                 esc

      Search actions...
     ›Show Details
      Copy Emoji                                                  ⌃C


      ↵ select   ↑↓ navigate

     Moon
     Sun


     ↵ select   ↑↓ navigate   ^k actions"
  `)

  // Navigate down in actions
  await driver.keys.down()

  const secondActionSnapshot = await driver.text()
  expect(secondActionSnapshot).toMatchInlineSnapshot(`
    "

     Simple Grid Example ────────────────────────────────────────────

     Search items...


     Fruits
    ›Apple
     Banana
     Cherry


                                                                 esc

      Search actions...
      Show Details
     ›Copy Emoji                                                  ⌃C


      ↵ select   ↑↓ navigate

     Moon
     Sun


     ↵ select   ↑↓ navigate   ^k actions"
  `)

  // Select "Copy Emoji" action
  await driver.keys.enter()

  const afterCopySnapshot = await driver.text()
  expect(afterCopySnapshot).toMatchInlineSnapshot(`
    "

     Simple Grid Example ────────────────────────────────────────────

     Search items...


     Fruits
    ›Apple
     Banana
     Cherry

     Animals
     Dog
     Cat
     Rabbit

     Others
     House
     Car
     Rocket
     Star
     Moon
     Sun


     ↵ select   ↑↓ navigate   ^k actions"
  `)
}, 10000)

test('grid mouse interaction', async () => {
  await driver.text({
    waitFor: (text) => {
      // wait for grid to show up
      return /Simple Grid Example/i.test(text)
    },
  })

  // Click on "Dog" item
  await driver.clickText('Dog')

  const afterClickDogSnapshot = await driver.text()
  expect(afterClickDogSnapshot).toMatchInlineSnapshot(`
    "

     Simple Grid Example ────────────────────────────────────────────

     Search items...


     Fruits
     Apple
     Banana
     Cherry

     Animals
    ›Dog
     Cat
     Rabbit

     Others
     House
     Car
     Rocket
     Star
     Moon
     Sun


     ↵ select   ↑↓ navigate   ^k actions"
  `)

  // Click on "Star" item
  await driver.clickText('Star')

  const afterClickStarSnapshot = await driver.text()
  expect(afterClickStarSnapshot).toMatchInlineSnapshot(`
    "

     Simple Grid Example ────────────────────────────────────────────

     Search items...


     Fruits
     Apple
     Banana
     Cherry

     Animals
     Dog
     Cat
     Rabbit

     Others
     House
     Car
     Rocket
    ›Star
     Moon
     Sun


     ↵ select   ↑↓ navigate   ^k actions"
  `)

  // Click on "Apple" to go back to first section
  await driver.clickText('Apple')

  const afterClickAppleSnapshot = await driver.text()
  expect(afterClickAppleSnapshot).toMatchInlineSnapshot(`
    "

     Simple Grid Example ────────────────────────────────────────────

     Search items...


     Fruits
    ›Apple
     Banana
     Cherry

     Animals
     Dog
     Cat
     Rabbit

     Others
     House
     Car
     Rocket
     Star
     Moon
     Sun


     ↵ select   ↑↓ navigate   ^k actions"
  `)
}, 10000)
