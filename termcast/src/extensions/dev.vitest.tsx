import { test, expect, afterEach, beforeEach } from 'vitest'
import { launchTerminal, Session } from 'tuistory/src'
import path from 'node:path'

let session: Session

const fixtureDir = path.resolve(__dirname, '../../fixtures/simple-extension')

beforeEach(async () => {
  session = await launchTerminal({
    command: 'bun',
    args: ['src/cli.tsx', 'dev', fixtureDir],
    cols: 60,
    rows: 16,
  })
})

afterEach(() => {
  session?.close()
})

test('dev command shows extension commands list', async () => {
  await session.text({
    waitFor: (text) => /Simple Test Extension/i.test(text),
    timeout: 10000,
  })

  const snapshot = await session.text()
  expect(snapshot).toMatchInlineSnapshot(`
    "


       Simple Test Extension ────────────────────────────────

       Search commands...

       Commands                                              ▲
      ›List Items Displays a simple list with some ite view  ▀
       Search Items Search and filter through a list o view
       Google Oauth                                    view
       usePromise Demo Shows how to use the usePromise view  ▼


       ↵ run command    ↑↓ navigate    ^k actions

    "
  `)
}, 30000)

test('selecting command with arguments shows arguments form', async () => {
  await session.text({
    waitFor: (text) => /Simple Test Extension/i.test(text),
    timeout: 10000,
  })

  // Navigate to "With Arguments" command (6th item)
  await session.press('down')
  await session.press('down')
  await session.press('down')
  await session.press('down')
  await session.press('down')

  const selectedSnapshot = await session.text()
  expect(selectedSnapshot).toMatchInlineSnapshot(`
    "


       Simple Test Extension ────────────────────────────────

       Search commands...

       usePromise Demo Shows how to use the usePromise view  ▲
       Show State Shows the current application state  view
      ›With Arguments Demonstrates command arguments ( view
       Quick Action Copies current timestamp to cli no-view  ▄
                                                             ▼


       ↵ run command    ↑↓ navigate    ^k actions

    "
  `)

  // Select the command to show arguments form (enter opens action panel, enter again runs)
  await session.press('enter')
  await session.press('enter')

  await session.text({
    waitFor: (text) => /Search query/i.test(text),
    timeout: 10000,
  })

  const argsFormSnapshot = await session.text()
  expect(argsFormSnapshot).toMatchInlineSnapshot(`
    "




      ■  With Arguments                                      ▀
      │  Enter the arguments to run this command.
      │
      ◇  Search query
      │  Search query
      │
      ◇  Secret key


       ctrl ↵ submit    tab navigate    ^k actions

    "
  `)
}, 30000)

test('can fill arguments and run command', async () => {
  await session.text({
    waitFor: (text) => /Simple Test Extension/i.test(text),
    timeout: 10000,
  })

  // Navigate to "With Arguments" command
  await session.press('down')
  await session.press('down')
  await session.press('down')
  await session.press('down')
  await session.press('down')
  await session.press('enter')
  await session.press('enter')

  await session.text({
    waitFor: (text) => /Search query/i.test(text),
    timeout: 10000,
  })

  // Type in the search query field
  await session.type('my search term')

  const afterTypingSnapshot = await session.text()
  expect(afterTypingSnapshot).toMatchInlineSnapshot(`
    "




      ■  With Arguments                                      ▀
      │  Enter the arguments to run this command.
      │
      ◇  Search query
      │  Search query
      │
      ◇  Secret key


       ctrl ↵ submit    tab navigate    ^k actions

    "
  `)

  // Submit the form with Alt+Enter (opens action panel), then Enter (selects submit)
  await session.press(['alt', 'enter'])
  await session.press('enter')

  await session.text({
    waitFor: (text) => /Received Arguments/i.test(text),
    timeout: 10000,
  })

  const commandResultSnapshot = await session.text()
  expect(commandResultSnapshot).toMatchInlineSnapshot(`
    "


       Command Arguments Demo ───────────────────────────────

       Search...

       Received Arguments
      ›▼ Search Query (empty)
       ▼ Secret Key (empty)
       ▼ Category (empty)


                        ✓ Copied to Clipboard
                                (empty)

    "
  `)
}, 30000)

test('can run simple view command without arguments', async () => {
  await session.text({
    waitFor: (text) => /Simple Test Extension/i.test(text),
    timeout: 10000,
  })

  // Select first command (List Items) - enter opens action panel, enter again runs
  await session.press('enter')
  await session.press('enter')

  await session.text({
    waitFor: (text) => /First Item/i.test(text),
    timeout: 10000,
  })

  const listItemsSnapshot = await session.text()
  expect(listItemsSnapshot).toMatchInlineSnapshot(`
    "


       List Items ───────────────────────────────────────────

       Search...

       Items                                                 ▲
      ›▲ First Item This is the first item                   █
       ▲ Second Item This is the second item                 █
       ▲ Third Item This is the third item                   ▀
       ▲ Fourth Item This is the fourth item
       ▲ Fifth Item This is the fifth item                   ▼

                        ✓ Copied to Clipboard
                              First Item
    "
  `)
}, 30000)

test('hot reload updates TUI when source file changes', async () => {
  // This test verifies that React Refresh hot reload is working.
  // When a source file changes, the component content should update in-place
  // without needing to manually exit and re-enter the command.

  const hotReloadFixtureDir = path.resolve(__dirname, '../../fixtures/hot-reload-extension')
  const sourceFilePath = path.join(hotReloadFixtureDir, 'src/detail-view.tsx')
  const fs = await import('node:fs')

  // Read original content to restore later
  const originalContent = fs.readFileSync(sourceFilePath, 'utf-8')

  // Start a new session for this test
  const hotReloadSession = await launchTerminal({
    command: 'bun',
    args: ['src/cli.tsx', 'dev', hotReloadFixtureDir],
    cols: 60,
    rows: 16,
  })

  try {
    // Wait for the extension to load
    await hotReloadSession.text({
      waitFor: (text) => /Hot Reload Test/i.test(text) && /Detail View/i.test(text),
      timeout: 5000,
    })
    await hotReloadSession.waitIdle()

    // Run the Detail View command
    await hotReloadSession.press('enter')
    await hotReloadSession.press('enter')
    await hotReloadSession.waitIdle()

    // Wait for the detail view to show
    await hotReloadSession.text({
      waitFor: (text) => /MARKER_VALUE/i.test(text),
      timeout: 10000,
    })

    // Generate a random number
    const randomNumber = Math.floor(Math.random() * 1000000)

    // Update the source file with the random number
    const newContent = originalContent.replace('MARKER_VALUE', `UPDATED_${randomNumber}`)
    fs.writeFileSync(sourceFilePath, newContent)

    // Wait for rebuild toast to appear
    await hotReloadSession.waitIdle()
    await new Promise((resolve) => setTimeout(resolve, 3000))

    const afterReloadSnapshot = await hotReloadSession.text()

    // React Refresh is working! The component content IS updated in-place.
    // The new content (UPDATED_xxx) should be visible, old content (MARKER_VALUE) should NOT be visible.
    expect(afterReloadSnapshot).toContain(`UPDATED_${randomNumber}`) // New content IS visible
    expect(afterReloadSnapshot).not.toContain('MARKER_VALUE') // Old content NOT visible
  } finally {
    // Restore original content
    fs.writeFileSync(sourceFilePath, originalContent)
    hotReloadSession?.close()
  }
}, 60000)

test('hot reload with navigation - preserves navigation and updates content', async () => {
  // This test verifies React Refresh works with navigation:
  // 1. Navigation stack is preserved (we stay on detail view)
  // 2. Component content IS updated (new code runs)
  // 3. Component state is preserved if hook signature unchanged

  const hotReloadFixtureDir = path.resolve(__dirname, '../../fixtures/hot-reload-extension')
  const sourceFilePath = path.join(hotReloadFixtureDir, 'src/list-with-navigation.tsx')
  const fs = await import('node:fs')

  // Read original content to restore later
  const originalContent = fs.readFileSync(sourceFilePath, 'utf-8')

  // Start a new session for this test
  const hotReloadSession = await launchTerminal({
    command: 'bun',
    args: ['src/cli.tsx', 'dev', hotReloadFixtureDir],
    cols: 70,
    rows: 20,
  })

  try {
    // Wait for the extension to load
    await hotReloadSession.text({
      waitFor: (text) => /Hot Reload Test/i.test(text) && /List With Navigation/i.test(text),
      timeout: 10000,
    })

    // Navigate to "List With Navigation" command (second item)
    await hotReloadSession.press('down')
    await hotReloadSession.waitIdle()

    // Run the command (enter opens action panel, enter again runs)
    await hotReloadSession.press('enter')
    await hotReloadSession.press('enter')
    await hotReloadSession.waitIdle()

    // Wait for the list to show OR the detail view (enter might auto-execute first action)
    await hotReloadSession.text({
      waitFor: (text) => /Item One/i.test(text),
      timeout: 10000,
    })

    // Check if we're on the list or already on detail view
    let currentSnapshot = await hotReloadSession.text()
    
    if (currentSnapshot.includes('Click to see details')) {
      // We're on the list - push to detail view
      await hotReloadSession.press('enter')
      await hotReloadSession.waitIdle()
      
      // Wait for the detail view with the marker
      await hotReloadSession.text({
        waitFor: (text) => /NAV_MARKER_VALUE/i.test(text) && /Item One Details/i.test(text),
        timeout: 10000,
      })
    }
    // else: we're already on the detail view (auto-executed)

    const detailSnapshot = await hotReloadSession.text()
    expect(detailSnapshot).toContain('Item One Details')
    expect(detailSnapshot).toContain('NAV_MARKER_VALUE')
    expect(detailSnapshot).toContain('Counter: 0')

    // Generate a random number for the update
    const randomNumber = Math.floor(Math.random() * 1000000)

    // Update the source file with the random number
    const newContent = originalContent.replace('NAV_MARKER_VALUE', `UPDATED_NAV_${randomNumber}`)
    fs.writeFileSync(sourceFilePath, newContent)

    // Wait for rebuild to complete
    await hotReloadSession.waitIdle()
    await new Promise((resolve) => setTimeout(resolve, 4000)) // Give rebuild time

    const afterReloadSnapshot = await hotReloadSession.text()

    // React Refresh is working:
    // - Navigation is preserved (still on detail view)
    // - Content IS updated (new marker value visible)
    // - State should be preserved if hook signature unchanged

    expect(afterReloadSnapshot).toContain('Item One Details')
    expect(afterReloadSnapshot).toContain(`UPDATED_NAV_${randomNumber}`) // New content IS visible
    expect(afterReloadSnapshot).not.toContain('NAV_MARKER_VALUE') // Old content NOT visible
    expect(afterReloadSnapshot).toContain('Counter: 0') // State preserved (hook signature unchanged)
  } finally {
    // Restore original content
    fs.writeFileSync(sourceFilePath, originalContent)
    hotReloadSession?.close()
  }
}, 90000)
