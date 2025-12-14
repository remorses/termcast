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

     Search commands...                                    ▲
     Commands                                              █
    ›List Items Displays a simple list with some ite view  ▀
     Search Items Search and filter through a list o view
     Google Oauth                                    view
     usePromise Demo Shows how to use the usePromise view
     Show State Shows the current application state  view  ▼


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

     Commandsommands...                                    ▲
     List Items Displays a simple list with some ite view
     Search Items Search and filter through a list o view
     Google Oauth                                    view  █
     usePromise Demo Shows how to use the usePromise view  ▀
     Show State Shows the current application state  view
    ›With Arguments Demonstrates command arguments ( view  ▼


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


    ▪  With Arguments                                      ▲
    │  Enter the arguments to run this command.            █
    │
    ◆  Search query
    ┃  Search query
    ┃
    ◇  Secret key
    │  Secret key
    ◇  Category
    │  Category                                            ▼


      submit   ↑↓ navigate   ^k actions"
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


    ▪  With Arguments                                      ▲
    │  Enter the arguments to run this command.            █
    │
    ◆  Search query
    ┃  my search term
    ┃
    ◇  Secret key
    │  Secret key
    ◇  Category
    │  Category                                            ▼


      submit   ↑↓ navigate   ^k actions"
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

     Search...                                             ▲
     Received Arguments                                    █
    ›Search Query my search term                           █
     Secret Key (empty)                                    █
     Category (empty)                                      ▼


     ┌────────────────────────────────────────┐
     │ ✓ Copied to Clipboard - my search term │
     └────────────────────────────────────────┘"
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

     Search...                                             ▲
     Items                                                 █
    ›First Item This is the first item                     █
     Second Item This is the second item                   █
     Third Item This is the third item                     █
     Fourth Item This is the fourth item                   █
     Fifth Item This is the fifth item                     ▼


     ↵ select  ↑↓ navigate  ^k actions"
  `)
}, 30000)
