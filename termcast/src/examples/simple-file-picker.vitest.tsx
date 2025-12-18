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

test('file picker shows form fields', async () => {
  const initialSnapshot = await session.text({
    waitFor: (text) => {
      return (
        /Your Name/i.test(text) &&
        text.includes('Select Files') &&
        text.includes('Select Folder') &&
        text.includes('submit')
      )
    },
  })
  expect(initialSnapshot).toMatchInlineSnapshot(`
    "














    ◆  Your Name
    │  John Doe
    │
    ◇  Select Files
    │  Enter file path...
    │
    │  Choose one or more files to upload
    │
    ◇  Select Folder
    │  Enter file path...
    │
    │  Choose a folder for output
    │
    ◇  Select Single File
    │  Enter file path...
    │
    │  Choose exactly one file
    │
    └














     ctrl ↵ submit   ↑↓ navigate   ^k actions"
  `)
}, 10000)

test('typing opens autocomplete dialog with file list', async () => {
  await session.text({
    waitFor: (text) => /Your Name/i.test(text),
  })

  // Tab to file picker field
  await session.press('tab')
  await session.press('tab')

  // Type to trigger autocomplete
  await session.type('s')

  const autocompleteSnapshot = await session.text({
    waitFor: (text) => text.includes('Filter:') && text.includes('📁'),
  })
  expect(autocompleteSnapshot).toMatchInlineSnapshot(`
    "














    ◇  Your Name
    │┃
    │┃ Filter: s
    ◇┃
    │┃  📁 fixtures/
    │┃  📁 fixtures/hot-reload-extension/
    │┃  📁 fixtures/hot-reload-extension/src/
    │┃  📁 fixtures/simple-extension/
    ◆┃  📁 fixtures/simple-extension/src/
    │┃  📁 fixtures/swift-extension/
    │┃  📁 fixtures/swift-extension/src/
    │┃  📁 fixtures/swift-extension/swift/
    │┃  📁 fixtures/swift-extension/swift/Sources/
    ◇┃  📁 fixtures/swift-extension/swift/Sources/SwiftAPI/
    │┃
    │┃ ↑↓ navigate  ⏎/tab select  esc close
    │  Choose exactly one file
    │
    └














     ctrl ↵ submit   ↑↓ navigate   ^k actions"
  `)
}, 15000)

test('escape closes autocomplete without going back', async () => {
  await session.text({
    waitFor: (text) => /Your Name/i.test(text),
  })

  // Tab to file picker field
  await session.press('tab')
  await session.press('tab')

  // Type to trigger autocomplete
  await session.type('s')

  await session.text({
    waitFor: (text) => text.includes('Filter:'),
  })

  // Press escape to close autocomplete
  await session.press('esc')

  // Verify form is still visible (didn't navigate away)
  const afterEscapeSnapshot = await session.text({
    waitFor: (text) => text.includes('Select Folder') && !text.includes('Filter:'),
  })
  expect(afterEscapeSnapshot).toMatchInlineSnapshot(`
    "














    ◇  Your Name
    │  John Doe
    │
    ◇  Select Files
    │  Enter file path...
    │
    │  Choose one or more files to upload
    │
    ◆  Select Folder
    │  s
    │
    │  Choose a folder for output
    │
    ◇  Select Single File
    │  Enter file path...
    │
    │  Choose exactly one file
    │
    └














     ctrl ↵ submit   ↑↓ navigate   ^k actions"
  `)
}, 15000)

test('selecting first item with enter adds it to the list', async () => {
  await session.text({
    waitFor: (text) => /Your Name/i.test(text),
  })

  // Tab to folder picker field (which shows directories)
  await session.press('tab')
  await session.press('tab')

  // Type to trigger autocomplete
  await session.type('s')

  // Wait for dialog to appear with folders
  await session.text({
    waitFor: (text) => text.includes('📁'),
  })

  // Press enter to select first match
  await session.press('enter')

  // Verify file was added
  const afterSelectSnapshot = await session.text({
    waitFor: (text) => text.includes('Selected files:'),
  })
  expect(afterSelectSnapshot).toMatchInlineSnapshot(`
    "













    ◇  Your Name
    │  John Doe
    │
    ◇  Select Files
    │  Enter file path...
    │
    │  Choose one or more files to upload
    │
    ◆  Select Folder
    │  Enter file path...
    │
    │  Selected files:
    │  • fixtures
    │
    │  Choose a folder for output
    │
    ◇  Select Single File
    │  Enter file path...
    │
    │  Choose exactly one file
    └













     ctrl ↵ submit   ↑↓ navigate   ^k actions"
  `)
}, 15000)
