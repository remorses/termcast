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


     ↵ select  ↑↓ navigate  ^k actions"
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


     ↵ select  ↑↓ navigate  ^k actions"
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


     With Arguments ───────────────────────────────────────
    ■  With Arguments                                      ▀
    │  Enter the arguments to run this command.
    │
    ◇  Search query
    │  Search query
    │
    ◇  Secret key
    │  Secret key
    ◇  Category


     ctrl ↵ submit   tab navigate   ^k actions"
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


     With Arguments ───────────────────────────────────────
    ■  With Arguments                                      ▀
    │  Enter the arguments to run this command.
    │
    ◇  Search query
    │  Search query
    │
    ◇  Secret key
    │  Secret key
    ◇  Category


     ctrl ↵ submit   tab navigate   ^k actions"
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



     ↵ select  ┌─────────────────────────────────┐
               │ ✓ Copied to Clipboard - (empty) │
               └─────────────────────────────────┘"
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
     ▲ Second Item This is the second item
     ▲ Third Item This is the third item
     ▲ Fourth Item This is the fourth item                 ▼


     ↵ select┌────────────────────────────────────┐
             │ ✓ Copied to Clipboard - First Item │
             └────────────────────────────────────┘"
  `)
}, 30000)

test('hot reload updates TUI when source file changes', async () => {
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
      waitFor: (text) => /Hot Reload Test/i.test(text),
      timeout: 10000,
    })

    // Run the Detail View command
    await hotReloadSession.press('enter')
    await hotReloadSession.press('enter')

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

    // Wait for rebuild - navigation resets to commands list
    await hotReloadSession.text({
      waitFor: (text) => /Hot Reload Test/i.test(text) && /Detail View/i.test(text),
      timeout: 15000,
    })

    // Run the command again to see updated content
    await hotReloadSession.press('enter')
    await hotReloadSession.press('enter')

    // Wait for the updated content
    await hotReloadSession.text({
      waitFor: (text) => text.includes(`UPDATED_${randomNumber}`),
      timeout: 10000,
    })

    const updatedSnapshot = await hotReloadSession.text()
    expect(updatedSnapshot).toContain(`UPDATED_${randomNumber}`)
  } finally {
    // Restore original content
    fs.writeFileSync(sourceFilePath, originalContent)
    hotReloadSession?.close()
  }
}, 60000)
