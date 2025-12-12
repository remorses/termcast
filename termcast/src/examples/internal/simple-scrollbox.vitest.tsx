import { expect, test } from 'vitest'
import { launchTerminal, Session } from 'tuistory/src'

test('simple scrollbox navigation and scrolling', async () => {
  const session = await launchTerminal({
    command: 'bun',
    args: ['src/examples/internal/simple-scrollbox.tsx'],
  })

  await session.text({
    waitFor: (text) => text.includes('Simple ScrollBox Demo'),
  })

  const initialText = await session.text()
  expect(initialText).toMatchInlineSnapshot(`
    "



    Simple ScrollBox Demo
                                                                              ▲
    Item 1 - This is content for item number 1. Lorem ipsum dolor sit amet,   ▀
    consectetur adipiscing elit.



    Item 2 - This is content for item number 2. Lorem ipsum dolor sit amet,
    consectetur adipiscing elit.



    Item 3 - This is content for item number 3. Lorem ipsum dolor sit amet,
    consectetur adipiscing elit.


                                                                              ▼

    Use mouse scroll or arrow keys | Press [q] to quit"
  `)

  // Scroll down to see more items
  await session.scrollDown(3)

  const afterScrollDownSnapshot = await session.text()
  expect(afterScrollDownSnapshot).toMatchInlineSnapshot(`
    "



    Simple ScrollBox Demo
                                                                              ▲
                                                                              ▄

    Item 2 - This is content for item number 2. Lorem ipsum dolor sit amet,
    consectetur adipiscing elit.



    Item 3 - This is content for item number 3. Lorem ipsum dolor sit amet,
    consectetur adipiscing elit.



    Item 4 - This is content for item number 4. Lorem ipsum dolor sit amet,
    consectetur adipiscing elit.
                                                                              ▼

    Use mouse scroll or arrow keys | Press [q] to quit"
  `)

  // Scroll back up
  await session.scrollUp(2)

  const afterScrollUpSnapshot = await session.text()
  expect(afterScrollUpSnapshot).toMatchInlineSnapshot(`
    "



    Simple ScrollBox Demo
    Item 1 - This is content for item number 1. Lorem ipsum dolor sit amet,   ▲
    consectetur adipiscing elit.                                              ▀



    Item 2 - This is content for item number 2. Lorem ipsum dolor sit amet,
    consectetur adipiscing elit.



    Item 3 - This is content for item number 3. Lorem ipsum dolor sit amet,
    consectetur adipiscing elit.



    Item 4 - This is content for item number 4. Lorem ipsum dolor sit amet,   ▼

    Use mouse scroll or arrow keys | Press [q] to quit"
  `)

  await session.press('esc')

  session.close()
}, 30000)
