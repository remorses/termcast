import { expect, test } from 'vitest'
import { NodeTuiDriver } from 'termcast/src/e2e-node'

test('simple scrollbox navigation and scrolling', async () => {
  const driver = new NodeTuiDriver('bun', ['src/examples/internal/simple-scrollbox.tsx'])

  await driver.text({
    waitFor: (text) => text.includes('Simple ScrollBox Demo'),
  })

  const initialText = await driver.text()
  expect(initialText).toMatchInlineSnapshot(`
    "


    Simple ScrollBox Demo


    Item 1 - This is content for item number 1. Lorem ipsum dolor sit amet, cons



    Item 2 - This is content for item number 2. Lorem ipsum dolor sit amet, cons



    Item 3 - This is content for item number 3. Lorem ipsum dolor sit amet, cons



    Item 4 - This is content for item number 4. Lorem ipsum dolor sit amet, cons



    Item 5 - This is content for item number 5. Lorem ipsum dolor sit amet, cons"
  `)

  await driver.scrollDown(3)
  const afterScrollDown = await driver.text()
  expect(afterScrollDown).toMatchInlineSnapshot(`
    "


    Simple ScrollBox Demo




    Item 2 - This is content for item number 2. Lorem ipsum dolor sit amet, cons



    Item 3 - This is content for item number 3. Lorem ipsum dolor sit amet, cons



    Item 4 - This is content for item number 4. Lorem ipsum dolor sit amet, cons



    Item 5 - This is content for item number 5. Lorem ipsum dolor sit amet, cons"
  `)

  await driver.scrollUp(2)
  const afterScrollUp = await driver.text()
  expect(afterScrollUp).toMatchInlineSnapshot(`
    "


    Simple ScrollBox Demo

    Item 1 - This is content for item number 1. Lorem ipsum dolor sit amet, cons



    Item 2 - This is content for item number 2. Lorem ipsum dolor sit amet, cons



    Item 3 - This is content for item number 3. Lorem ipsum dolor sit amet, cons



    Item 4 - This is content for item number 4. Lorem ipsum dolor sit amet, cons



    Item 5 - This is content for item number 5. Lorem ipsum dolor sit amet, cons"
  `)

  await driver.keys.escape()

  driver.dispose()
}, 30000)