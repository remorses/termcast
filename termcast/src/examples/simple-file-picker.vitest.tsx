import { test, expect, afterEach, beforeEach } from 'vitest'
import { launchTerminal, Session } from 'tuistory/src'

let session: Session

beforeEach(async () => {
  session = await launchTerminal({
    command: 'bun',
    args: ['src/examples/simple-file-picker.tsx'],
    cols: 70,
    rows: 50,
  })
})

afterEach(() => {
  session?.close()
})

test('file picker with autocomplete', async () => {
  await session.text({
    waitFor: (text) => {
      // wait for form to show up
      return /Your Name/i.test(text)
    },
  })

  const initialSnapshot = await session.text()
  expect(initialSnapshot).toMatchInlineSnapshot(`
    "


    ◆  Your Name
    │  John Doe
    ◇  Select Files
    │  Enter file path...
    │  Choose one or more files to upload
    │
    ◇  Select Folder
    │  Enter file path...
    │  Choose a folder for output
    │
    ◇  Select Single File
    │  Enter file path...
    │  Choose exactly one file
    │
    └


     ↵ submit   ↑↓ navigate   ^k actions"
  `)

  // Tab to navigate to file picker field
  await session.press('tab')
  await session.press('tab')

  // Type "src" to trigger autocomplete
  await session.type('src')

  // Wait for autocomplete to appear
  await new Promise((resolve) => setTimeout(resolve, 200))

  const autocompleteSnapshot = await session.text()
  expect(autocompleteSnapshot).toMatchInlineSnapshot(`
    "


    ◇  Your Name
    │  John Doe
    ◇  Select Files
    │  Enter file path...
    │  Choose one or more files to upload
    │
    ◆  Select Folder
    │  src
    │  ┌─────────────────────────────────────────────────────────────┐
    │  │ 📁 src                                                      │
    ◇  Select─Single─File────────────────────────────────────────────┘
    │  Enter file path...
    │  Choose exactly one file
    │
    └


     ↵ submit   ↑↓ navigate   ^k actions"
  `)

  // Navigate down in autocomplete
  await session.press('down')

  const afterDownSnapshot = await session.text()
  expect(afterDownSnapshot).toMatchInlineSnapshot(`
    "


    ◇  Your Name
    │  John Doe
    ◇  Select Files
    │  Enter file path...
    │  Choose one or more files to upload
    │
    ◆  Select Folder
    │  src
    │  ┌─────────────────────────────────────────────────────────────┐
    │  │ 📁 src                                                      │
    ◇  Select─Single─File────────────────────────────────────────────┘
    │  Enter file path...
    │  Choose exactly one file
    │
    └


     ↵ submit   ↑↓ navigate   ^k actions"
  `)

  // Select item with Enter
  await session.press('enter')

  const afterSelectSnapshot = await session.text()
  expect(afterSelectSnapshot).toMatchInlineSnapshot(`
    "


    ◇  Your Name
    │  John Doe
    ◇  Select Files
    │  Enter file path...
    │  Choose one or more files to upload
    │
    ◆  Select Folder
    │  src/
    │  ┌─────────────────────────────────────────────────────────────┐
    │  │ 📁 apis                                                     │
    ◇  SelectoSingletFile                                            │
    │  Enterefilespath...                                            │
    │  Chooseoexactly one file                                       │
    │  │    internal                                                 │
    └  │ 📁 store-api                                                │
       │ 📄 action-utils.tsx                                         │
       │    build.test.tsx                                           │
     ↵ submit───↑↓─navigate───^k─actions─────────────────────────────┘"
  `)

  // Clear and test absolute path
  await session.press('backspace')
  await session.press('backspace')
  await session.press('backspace')
  await session.type('/tmp')

  await new Promise((resolve) => setTimeout(resolve, 200))

  const absolutePathSnapshot = await session.text()
  expect(absolutePathSnapshot).toMatchInlineSnapshot(`
    "


    ◇  Your Name
    │  John Doe
    ◇  Select Files
    │  Enter file path...
    │  Choose one or more files to upload
    │
    ◆  Select Folder
    │  /tmp/
    │  ┌─────────────────────────────────────────────────────────────┐
    │  │ 📁 1.3.4                                                    │
    ◇  SelectuSingle-File01c73                                       │
    │  Enterbfile5path...ll@latest                                   │
    │  Chooseoexactly.onenfileHaIInyg4um                             │
    │  │    node-compile-cache                                       │
    └  │ 📁 opentui-test                                             │
       │ 📁 tmp-mount-512bLW                                         │
       │    tmp-mount-5pOIbV                                         │
     ↵ submit───↑↓─navigate───^k─actions─────────────────────────────┘"
  `)

  // Test ~ home directory expansion
  await session.press('backspace')
  await session.press('backspace')
  await session.press('backspace')
  await session.press('backspace')
  await session.type('~/')

  await new Promise((resolve) => setTimeout(resolve, 200))

  const homeDirectorySnapshot = await session.text()
  expect(homeDirectorySnapshot).toMatchInlineSnapshot(`
    "


    ◇  Your Name
    │  John Doe
    ◇  Select Files
    │  Enter file path...
    │  Choose one or more files to upload
    │
    ◆  Select Folder
    │  ~//
    │  ┌─────────────────────────────────────────────────────────────┐
    │  │ 📁 Applications                                             │
    ◇  SelectwSingle File                                            │
    │  Entercfilenpath..._cache                                      │
    │  Chooseoexactly one file                                       │
    │  │    Desktop                                                  │
    └  │ 📁 Documents                                                │
       │ 📁 dyad-apps                                                │
       │    example-pnpm-pubcket                                     │
     ↵ submit───↑↓─navigate───^k─actions─────────────────────────────┘"
  `)
}, 15000)

test('file picker keyboard navigation', async () => {
  await session.text({
    waitFor: (text) => {
      return /Your Name/i.test(text)
    },
  })

  // Tab to file picker
  await session.press('tab')
  await session.press('tab')

  // Type to trigger autocomplete
  await session.type('.')

  await new Promise((resolve) => setTimeout(resolve, 200))

  const withDotSnapshot = await session.text()
  expect(withDotSnapshot).toMatchInlineSnapshot(`
    "


    ◇  Your Name
    │  John Doe
    ◇  Select Files
    │  Enter file path...
    │  Choose one or more files to upload
    │
    ◆  Select Folder
    │  .
    │  ┌─────────────────────────────────────────────────────────────┐
    │  │ 📁 .termcast-bundle                                         │
    ◇  SelectgSinglerFile                                            │
    │  Enter─file─path...────────────────────────────────────────────┘
    │  Choose exactly one file
    │
    └


     ↵ submit   ↑↓ navigate   ^k actions"
  `)

  // Test escape key to close autocomplete
  await session.press('esc')

  const afterEscapeSnapshot = await session.text()
  expect(afterEscapeSnapshot).toMatchInlineSnapshot(`
    "


    ◇  Your Name
    │  John Doe
    ◇  Select Files
    │  Enter file path...
    │  Choose one or more files to upload
    │
    ◆  Select Folder
    │  .
    │  Choose a folder for output
    │
    ◇  Select Single File
    │  Enter file path...
    │  Choose exactly one file
    │
    └


     ↵ submit   ↑↓ navigate   ^k actions"
  `)

  // Type again and navigate with arrows
  await session.type('s')

  await new Promise((resolve) => setTimeout(resolve, 200))

  // Navigate down multiple times
  await session.press('down')
  await session.press('down')
  await session.press('up')

  const afterNavigationSnapshot = await session.text()
  expect(afterNavigationSnapshot).toMatchInlineSnapshot(`
    "


    ◇  Your Name
    │  John Doe
    ◇  Select Files
    │  Enter file path...
    │  Choose one or more files to upload
    │
    ◆  Select Folder
    │  .s
    │  Choose a folder for output
    │
    ◇  Select Single File
    │  Enter file path...
    │  Choose exactly one file
    │
    └


     ↵ submit   ↑↓ navigate   ^k actions"
  `)
}, 10000)
