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


                                                                     █
                                                                     █
                                                                     █
                                                                     █
                                                                     █
                                                                     █
                                                                     █
                                                                     █
                                                                     █
                                                                     █
                                                                     █
                                                                     █
    ◆  Your Name                                                     █
    ┃  John Doe                                                      █
    ┃                                                                █
    ◇  Select Files                                                  █
    │  Enter file path...                                            █
    │                                                                █
    │  Choose one or more files to upload                            █
    │                                                                █
    ◇  Select Folder                                                 █
    │  Enter file path...                                            ▀
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

  // Tab to navigate to file picker field
  await session.press('tab')
  await session.press('tab')

  // Type "src" to trigger autocomplete
  await session.type('src')

  const autocompleteSnapshot = await session.text({
    waitFor: (text) => text.includes('📁 src'),
  })
  expect(autocompleteSnapshot).toMatchInlineSnapshot(`
    "














    ◇  Your Name
    │  John Doe
    │
    ◇  Select Files
    │  Enter file path...
    │
    │  ┌─────────────────────────────────────────────────────────────┐
    │  │ 📁 src                                                      │
    ◆  └─────────────────────────────────────────────────────────────┘
    ┃  src
    ┃
    ┃  Choose a folder for output
    ┃
    ◇  Select Single File
    │  Enter file path...
    │
    │  Choose exactly one file
    │
    └














     ↵ submit   ↑↓ navigate   ^k actions"
  `)

  // Navigate down in autocomplete
  await session.press('down')

  const afterDownSnapshot = await session.text({
    waitFor: (text) => text.includes('📁 src'),
  })
  expect(afterDownSnapshot).toMatchInlineSnapshot(`
    "














    ◇  Your Name
    │  John Doe
    │
    ◇  Select Files
    │  Enter file path...
    │
    │  ┌─────────────────────────────────────────────────────────────┐
    │  │ 📁 src                                                      │
    ◆  └─────────────────────────────────────────────────────────────┘
    ┃  src
    ┃
    ┃  Choose a folder for output
    ┃
    ◇  Select Single File
    │  Enter file path...
    │
    │  Choose exactly one file
    │
    └














     ↵ submit   ↑↓ navigate   ^k actions"
  `)

  // Select item with Enter
  await session.press('enter')

  const afterSelectSnapshot = await session.text({
    waitFor: (text) => text.includes('src/') && text.includes('📁 apis'),
  })
  expect(afterSelectSnapshot).toMatchInlineSnapshot(`
    "













       ┌─────────────────────────────────────────────────────────────┐
    ◇  │ 📁 apis                                                     │
    │  │ 📁 components                                               │
    │  │ 📁 examples                                                 │
    ◇  │ 📁 extensions                                               │
    │  │ 📁 hooks                                                    │
    │  │ 📁 internal                                                 │
    │  │ 📁 store-api                                                │
    │  │ 📁 utils                                                    │
    ◆  └─────────────────────────────────────────────────────────────┘
    ┃  src/
    ┃
    ┃  Choose a folder for output
    ┃
    ◇  Select Single File
    │  Enter file path...
    │
    │  Choose exactly one file
    │
    └














     ↵ submit   ↑↓ navigate   ^k actions"
  `)

  // Clear and test absolute path
  await session.press('backspace')
  await session.press('backspace')
  await session.press('backspace')
  await session.type('/tmp')

  const absolutePathSnapshot = await session.text({
    waitFor: (text) => text.includes('/tmp'),
  })
  expect(absolutePathSnapshot).toMatchInlineSnapshot(`
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
    ┃  s/tmp
    ┃
    ┃  Choose a folder for output
    ┃
    ◇  Select Single File
    │  Enter file path...
    │
    │  Choose exactly one file
    │
    └














     ↵ submit   ↑↓ navigate   ^k actions"
  `)

  // Test ~ home directory expansion
  await session.press('backspace')
  await session.press('backspace')
  await session.press('backspace')
  await session.press('backspace')
  await session.type('~/')

  const homeDirectorySnapshot = await session.text({
    waitFor: (text) => text.includes('~/'),
  })
  expect(homeDirectorySnapshot).toMatchInlineSnapshot(`
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
      ┃  s~/
      ┃
      ┃  Choose a folder for output
      ┃
      ◇  Select Single File
      │  Enter file path...
      │
      │  Choose exactly one file
      │
      └



                              Console (Focused)
       st/node_modules/.bun/@tanstack+query-persist-client-core@5.91.11/no
       de_modules/@tanstack/query-persist-client-core/build/modern/persist
       .js:51:19)
             at persistQueryClientSave (/Users/morse/Documents/GitHub/term
       st/node_modules/.bun/@tanstack+query-persist-client-core@5.91.11/no
       de_modules/@tanstack/query-persist-client-core/build/modern/persist
       .js:40:38)
             at <anonymous> (/Users/morse/Documents/GitHub/termcast/node_m
       ules/.bun/@tanstack+query-persist-client-core@5.91.11/node_modules/
       @tanstack/query-persist-client-core/build/modern/persist.js:56:7)
       │ ✗ Unatn<anonymous>e(/Users/morse/Documents/GitHub/termcast/node_m
       ules/.bun/@tanstack+query-core@5.90.12/node_modules/@tanstack/query
       -core/build/modern/queryCache.js:75:9)
    >        at forEach (native:1:11)"
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

  const withDotSnapshot = await session.text({
    waitFor: (text) => text.includes('📁 .termcast-bundle'),
  })
  expect(withDotSnapshot).toMatchInlineSnapshot(`
    "














    ◇  Your Name
    │  John Doe
    │
    ◇  Select Files
    │  Enter file path...
    │  ┌─────────────────────────────────────────────────────────────┐
    │  │ 📁 .termcast-bundle                                         │
    │  │ 📄 .gitignore                                               │
    ◆  └─────────────────────────────────────────────────────────────┘
    ┃  .
    ┃
    ┃  Choose a folder for output
    ┃
    ◇  Select Single File
    │  Enter file path...
    │
    │  Choose exactly one file
    │
    └














     ↵ submit   ↑↓ navigate   ^k actions"
  `)

  // Test escape key to close autocomplete
  await session.press('esc')

  const afterEscapeSnapshot = await session.text({
    waitFor: (text) => text.includes('Select Folder') && !text.includes('📁 .termcast-bundle'),
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
    ┃  .
    ┃
    ┃  Choose a folder for output
    ┃
    ◇  Select Single File
    │  Enter file path...
    │
    │  Choose exactly one file
    │
    └














     ↵ submit   ↑↓ navigate   ^k actions"
  `)

  // Type again and navigate with arrows
  await session.type('s')

  await session.text({
    waitFor: (text) => text.includes('.s'),
  })

  // Navigate down multiple times
  await session.press('down')
  await session.press('down')
  await session.press('up')

  const afterNavigationSnapshot = await session.text({
    waitFor: (text) => text.includes('.s') && text.includes('Select Folder'),
  })
  expect(afterNavigationSnapshot).toMatchInlineSnapshot(`
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
    ┃  .s
    ┃
    ┃  Choose a folder for output
    ┃
    ◇  Select Single File
    │  Enter file path...
    │
    │  Choose exactly one file
    │
    └














     ↵ submit   ↑↓ navigate   ^k actions"
  `)
}, 10000)
