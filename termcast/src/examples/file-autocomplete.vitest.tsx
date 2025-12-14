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

test('autocomplete shows on ./ input with proper background', async () => {
  await session.text({
    waitFor: (text) => text.includes('Select Files') && text.includes('Select Folder'),
  })

  await session.press('tab')
  await session.press('tab')

  await session.type('./')

  const snapshot = await session.text({
    waitFor: (text) => text.includes('📁'),
  })
  expect(snapshot).toMatchInlineSnapshot(`
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
    │  ./
    │  ┌─────────────────────────────────────────────────────────────┐
    │  │ 📁 dist                                                     │
    │  │ 📁 fixtures                                                 │
    ◇  SelectoSingleuFile                                            │
    │  Entersfile path...                                            │
    │  │    app.log                                                  │
    │  ChooseRexactlyUonemfile                                       │
    │  │    bin                                                      │
    └  │ 📄 bunfig.toml                                              │
       └─────────────────────────────────────────────────────────────┘





     ↵ submit   ↑↓ navigate   ^k actions"
  `)
}, 10000)

test('autocomplete dropdown covers background content', async () => {
  await session.text({
    waitFor: (text) => text.includes('Select Files'),
  })

  await session.press('tab')
  await session.press('tab')

  await session.type('src/')

  const snapshot = await session.text({
    waitFor: (text) => text.includes('📁 apis'),
  })
  expect(snapshot).toMatchInlineSnapshot(`
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
    │  src/
    │  ┌─────────────────────────────────────────────────────────────┐
    │  │ 📁 apis                                                     │
    │  │ 📁 components                                               │
    ◇  SelectxSingle File                                            │
    │  Enterefilespath...                                            │
    │  │    hooks                                                    │
    │  Choosenexactly one file                                       │
    │  │    store-api                                                │
    └  │ 📁 utils                                                    │
       └─────────────────────────────────────────────────────────────┘





     ↵ submit   ↑↓ navigate   ^k actions"
  `)
}, 10000)

test('autocomplete navigation with down/up keys', async () => {
  await session.text({
    waitFor: (text) => text.includes('Select Files'),
  })

  await session.press('tab')
  await session.press('tab')
  await session.type('src/')

  await session.text({
    waitFor: (text) => text.includes('📁 apis'),
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
    │  Choose one or more files to upload
    │
    ◆  Select Folder
    │  src/
    │  ┌─────────────────────────────────────────────────────────────┐
    │  │ 📁 apis                                                     │
    │  │ 📁 components                                               │
    ◇  SelectxSingle File                                            │
    │  Enterefilespath...                                            │
    │  │    hooks                                                    │
    │  Choosenexactly one file                                       │
    │  │    store-api                                                │
    └  │ 📁 utils                                                    │
       └─────────────────────────────────────────────────────────────┘





     ↵ submit   ↑↓ navigate   ^k actions"
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
    │  Choose one or more files to upload
    │
    ◆  Select Folder
    │  src/
    │  ┌─────────────────────────────────────────────────────────────┐
    │  │ 📁 apis                                                     │
    │  │ 📁 components                                               │
    ◇  SelectxSingle File                                            │
    │  Enterefilespath...                                            │
    │  │    hooks                                                    │
    │  Choosenexactly one file                                       │
    │  │    store-api                                                │
    └  │ 📁 utils                                                    │
       └─────────────────────────────────────────────────────────────┘





     ↵ submit   ↑↓ navigate   ^k actions"
  `)
}, 10000)

test('escape closes autocomplete', async () => {
  await session.text({
    waitFor: (text) => text.includes('Select Files'),
  })

  await session.press('tab')
  await session.press('tab')
  await session.type('./')

  await session.text({
    waitFor: (text) => text.includes('📁'),
  })

  await session.press('esc')

  const afterEsc = await session.text({
    waitFor: (text) => !text.includes('📁'),
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
    │  ./
    │
    │  Choose a folder for output
    │
    ◇  Select Single File
    │  Enter file path...
    │
    │  Choose exactly one file
    │
    └






     ↵ submit   ↑↓ navigate   ^k actions"
  `)
}, 10000)
