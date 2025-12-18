import { test, expect, afterEach, beforeEach } from 'vitest'
import { launchTerminal, Session } from 'tuistory/src'

let session: Session

beforeEach(async () => {
  session = await launchTerminal({
    command: 'bun',
    args: ['src/examples/simple-file-picker.tsx'],
    cols: 70,
    rows: 30,
  })
})

afterEach(() => {
  session?.close()
})

test('autocomplete shows flat file list in dialog', async () => {
  await session.text({
    waitFor: (text) => text.includes('Select Files') && text.includes('Select Folder'),
  })

  // Navigate to folder picker (canChooseDirectories=true)
  await session.press('tab')
  await session.press('tab')

  await session.type('s')

  const snapshot = await session.text({
    waitFor: (text) => text.includes('Filter:') && text.includes('📁'),
  })
  expect(snapshot).toMatchInlineSnapshot(`
    "




    ◇  Your Name
    │  John Doe
    │
    ◇  Select Files
    │  Enter file path...
    │
    │┃
    │┃ Filter: s
    ◆┃
    │┃  📁 fixtures/
    │┃  📁 fixtures/hot-reload-extension/
    │┃  📁 fixtures/hot-reload-extension/src/
    │┃  📁 fixtures/simple-extension/
    ◇┃  📁 fixtures/simple-extension/src/
    │┃  📁 fixtures/swift-extension/
    │┃  📁 fixtures/swift-extension/src/
    │┃  📁 fixtures/swift-extension/swift/
    │┃  📁 fixtures/swift-extension/swift/Sources/
    └┃  📁 fixtures/swift-extension/swift/Sources/SwiftAPI/
     ┃
     ┃ ↑↓ navigate  ⏎/tab select  esc close


     ctrl ↵ submit   ↑↓ navigate   ^k actions"
  `)
}, 10000)

test('autocomplete navigation with down/up keys', async () => {
  await session.text({
    waitFor: (text) => text.includes('Select Files'),
  })

  await session.press('tab')
  await session.press('tab')
  await session.type('s')

  await session.text({
    waitFor: (text) => text.includes('📁'),
  })

  await session.press('down')
  await session.press('down')

  const afterDown = await session.text({})
  expect(afterDown).toMatchInlineSnapshot(`
    "




    ◇  Your Name
    │  John Doe
    │
    ◇  Select Files
    │  Enter file path...
    │
    │┃
    │┃ Filter: s
    ◆┃
    │┃  📁 fixtures/
    │┃  📁 fixtures/hot-reload-extension/
    │┃  📁 fixtures/hot-reload-extension/src/
    │┃  📁 fixtures/simple-extension/
    ◇┃  📁 fixtures/simple-extension/src/
    │┃  📁 fixtures/swift-extension/
    │┃  📁 fixtures/swift-extension/src/
    │┃  📁 fixtures/swift-extension/swift/
    │┃  📁 fixtures/swift-extension/swift/Sources/
    └┃  📁 fixtures/swift-extension/swift/Sources/SwiftAPI/
     ┃
     ┃ ↑↓ navigate  ⏎/tab select  esc close


     ctrl ↵ submit   ↑↓ navigate   ^k actions"
  `)

  await session.press('up')

  const afterUp = await session.text({})
  expect(afterUp).toMatchInlineSnapshot(`
    "




    ◇  Your Name
    │  John Doe
    │
    ◇  Select Files
    │  Enter file path...
    │
    │┃
    │┃ Filter: s
    ◆┃
    │┃  📁 fixtures/
    │┃  📁 fixtures/hot-reload-extension/
    │┃  📁 fixtures/hot-reload-extension/src/
    │┃  📁 fixtures/simple-extension/
    ◇┃  📁 fixtures/simple-extension/src/
    │┃  📁 fixtures/swift-extension/
    │┃  📁 fixtures/swift-extension/src/
    │┃  📁 fixtures/swift-extension/swift/
    │┃  📁 fixtures/swift-extension/swift/Sources/
    └┃  📁 fixtures/swift-extension/swift/Sources/SwiftAPI/
     ┃
     ┃ ↑↓ navigate  ⏎/tab select  esc close


     ctrl ↵ submit   ↑↓ navigate   ^k actions"
  `)
}, 10000)

test('file picker shows only files, not folders', async () => {
  await session.text({
    waitFor: (text) => text.includes('Select Files'),
  })

  // Navigate to file picker (canChooseFiles=true, canChooseDirectories=false)
  await session.press('tab') // to Select Files field

  await session.type('t')

  const snapshot = await session.text({
    waitFor: (text) => text.includes('Filter:') && text.includes('📄'),
  })
  
  // Should show files (📄) not folders (📁)
  expect(snapshot).toMatchInlineSnapshot(`
    "




    ◇  Your Name
    │  John Doe
    │
    ◆  Select Files
    │  t
    │
    │┃
    │┃ Filter: t
    ◇┃
    │┃  📄 AGENTS.md
    │┃  📄 CONTRIBUTING.md
    │┃  📄 ghostty-opentui/AGENTS.md
    │┃  📄 ghostty-opentui/CHANGELOG.md
    ◇┃  📄 ghostty-opentui/LICENSE
    │┃  📄 ghostty-opentui/README.md
    │┃  📄 ghostty-opentui/TESTING.md
    │┃  📄 ghostty-opentui/build.zig
    │┃  📄 ghostty-opentui/build.zig.zon
    └┃  📄 ghostty-opentui/bun.lock
     ┃
     ┃ ↑↓ navigate  ⏎/tab select  esc close


     ctrl ↵ submit   ↑↓ navigate   ^k actions"
  `)
  expect(snapshot).toContain('📄')
  expect(snapshot).not.toContain('📁')
}, 10000)

test('escape closes autocomplete and form stays visible', async () => {
  await session.text({
    waitFor: (text) => text.includes('Select Files'),
  })

  await session.press('tab')
  await session.press('tab')
  await session.type('s')

  await session.text({
    waitFor: (text) => text.includes('Filter:'),
  })

  await session.press('esc')

  const afterEsc = await session.text({
    waitFor: (text) => text.includes('Select Folder') && !text.includes('Filter:'),
  })
  expect(afterEsc).toMatchInlineSnapshot(`
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
}, 10000)
