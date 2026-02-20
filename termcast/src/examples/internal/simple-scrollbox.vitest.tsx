import { expect, test } from 'vitest'
import { launchTerminal, Session } from 'tuistory/src'

test('simple scrollbox navigation and scrolling', async () => {
  const session = await launchTerminal({
    command: 'bun',
    args: ['src/examples/internal/simple-scrollbox.tsx'],
  })

  // Wait for initial render with Item 1 visible
  await session.text({
    waitFor: (text) =>
      text.includes('Simple ScrollBox Demo') && text.includes('Item 1'),
  })

  // Wait for render to stabilize
  await session.waitIdle()

  const initialText = await session.text()
  expect(initialText).toMatchInlineSnapshot(`
    "



       Simple ScrollBox Demo
                                                                                                                         ▀
       Item 1 - This is content for item number 1. Lorem ipsum dolor sit amet, consectetur adipiscing elit.



       Item 2 - This is content for item number 2. Lorem ipsum dolor sit amet, consectetur adipiscing elit.



       Item 3 - This is content for item number 3. Lorem ipsum dolor sit amet, consectetur adipiscing elit.



       Item 4 - This is content for item number 4. Lorem ipsum dolor sit amet, consectetur adipiscing elit.



       Item 5 - This is content for item number 5. Lorem ipsum dolor sit amet, consectetur adipiscing elit.



       Item 6 - This is content for item number 6. Lorem ipsum dolor sit amet, consectetur adipiscing elit.



       Item 7 - This is content for item number 7. Lorem ipsum dolor sit amet, consectetur adipiscing elit.



       Use mouse scroll or arrow keys | Press [q] to quit

    "
  `)

  // Scroll down to see more items - use more scroll events for reliability
  await session.scrollDown(5)

  // Wait for Item 4 to appear (proves scroll happened)
  const afterScrollDownSnapshot = await session.text({
    waitFor: (text) => text.includes('Item 4'),
    timeout: 10000,
  })
  expect(afterScrollDownSnapshot).toMatchInlineSnapshot(`
    "



       Simple ScrollBox Demo
       Item 1 - This is content for item number 1. Lorem ipsum dolor sit amet, consectetur adipiscing elit.              ▄



       Item 2 - This is content for item number 2. Lorem ipsum dolor sit amet, consectetur adipiscing elit.



       Item 3 - This is content for item number 3. Lorem ipsum dolor sit amet, consectetur adipiscing elit.



       Item 4 - This is content for item number 4. Lorem ipsum dolor sit amet, consectetur adipiscing elit.



       Item 5 - This is content for item number 5. Lorem ipsum dolor sit amet, consectetur adipiscing elit.



       Item 6 - This is content for item number 6. Lorem ipsum dolor sit amet, consectetur adipiscing elit.



       Item 7 - This is content for item number 7. Lorem ipsum dolor sit amet, consectetur adipiscing elit.




       Use mouse scroll or arrow keys | Press [q] to quit

    "
  `)

  // Scroll back up - use more scroll events for reliability
  await session.scrollUp(5)

  // Wait for scroll to take effect - Item 4 should no longer be visible
  const afterScrollUpSnapshot = await session.text({
    waitFor: (text) => !text.includes('Item 4'),
    timeout: 10000,
  })
  expect(afterScrollUpSnapshot).toMatchInlineSnapshot(`
    "



       Simple ScrollBox Demo
                                                                                 ▀
       Item 1 - This is content for item number 1. Lorem ipsum dolor sit amet,
       consectetur adipiscing elit.



       Item 2 - This is content for item number 2. Lorem ipsum dolor sit amet,
       consectetur adipiscing elit.



       Item 3 - This is content for item number 3. Lorem ipsum dolor sit amet,
       consectetur adipiscing elit.




       Use mouse scroll or arrow keys | Press [q] to quit

    "
  `)

  await session.press('esc')

  session.close()
}, 30000)
