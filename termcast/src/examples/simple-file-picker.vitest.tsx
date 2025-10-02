import { test, expect, afterEach, beforeEach } from 'vitest'
import { NodeTuiDriver } from 'termcast/src/e2e-node'

let driver: NodeTuiDriver

beforeEach(() => {
  driver = new NodeTuiDriver('bun', ['src/examples/simple-file-picker.tsx'], {
    cols: 70,
    rows: 50,
  })
})

afterEach(() => {
  driver?.dispose()
})

test('file picker with autocomplete', async () => {
  await driver.text({
    waitFor: (text) => {
      // wait for form to show up
      return /Your Name/i.test(text)
    },
  })

  const initialSnapshot = await driver.text()
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
  await driver.keys.tab()
  await driver.keys.tab()

  // Type "src" to trigger autocomplete
  await driver.keys.type('src')

  // Wait for autocomplete to appear
  await new Promise((resolve) => setTimeout(resolve, 200))

  const autocompleteSnapshot = await driver.text()
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
    │  │ 📁a src                                                      │
    ◇  Select─Single─File────────────────────────────────────────────┘
    │  Enter file path...
    │  Choose exactly one file
    │
    └


     ↵ submit   ↑↓ navigate   ^k actions"
  `)

  // Navigate down in autocomplete
  await driver.keys.down()

  const afterDownSnapshot = await driver.text()
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
    │  │ 📁a src                                                      │
    ◇  Select─Single─File────────────────────────────────────────────┘
    │  Enter file path...
    │  Choose exactly one file
    │
    └


     ↵ submit   ↑↓ navigate   ^k actions"
  `)

  // Select item with Enter
  await driver.keys.enter()

  const afterSelectSnapshot = await driver.text()
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
    │  │ 📁a apis                                                     │
    ◇  SelectoSingletFile                                            │
    │  Enterefilelpath...                                            │
    │  Choosexexactlysone file                                       │
    │  │    hooks                                                    │
    └  │ 📁  internal                                                 │
       │ 📁  store-api                                                │
       │    utils                                                    │
     ↵ submitcti↑↓-navigatex──^k─actions─────────────────────────────┘
         📄  build.test.tsx"
  `)

  // Clear and test absolute path
  await driver.keys.backspace()
  await driver.keys.backspace()
  await driver.keys.backspace()
  await driver.keys.type('/tmp')

  await new Promise((resolve) => setTimeout(resolve, 200))

  const absolutePathSnapshot = await driver.text()
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
    │  │ 📁  bunx-501-@alignui                                        │
    ◇  SelectuSingle-Fileeya                                         │
    │  Enterbfile5path...elcontextprotocol                           │
    │  Chooseuexactly@onecfile                                       │
    │  │    bunx-501-npkill@latest                                   │
    └  │ 📁  com.apple.launchd.D0VRoDoOHk                             │
       │ 📁  com.apple.launchd.i00Yz9AggD                             │
       │    node-compile-cache                                       │
     ↵ submitode↑↓inavigate───^k─actions─────────────────────────────┘
         📁  powerlog"
  `)

  // Test ~ home directory expansion
  await driver.keys.backspace()
  await driver.keys.backspace()
  await driver.keys.backspace()
  await driver.keys.backspace()
  await driver.keys.type('~/')

  await new Promise((resolve) => setTimeout(resolve, 200))

  const homeDirectorySnapshot = await driver.text()
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
    │  │ 📁a Applications                                             │
    ◇  SelectwSingle File                                            │
    │  Entercfileepath...                                            │
    │  Chooseoexactly_one_filee                                      │
    │  │    conductor                                                │
    └  │ 📁  Desktop                                                  │
       │ 📁  Documents                                                │
       │    Downloads                                                │
     ↵ submityad↑↓pnavigate───^k─actions─────────────────────────────┘
         📁  example-pnpm-pubcket"
  `)
}, 15000)

test('file picker keyboard navigation', async () => {
  await driver.text({
    waitFor: (text) => {
      return /Your Name/i.test(text)
    },
  })

  // Tab to file picker
  await driver.keys.tab()
  await driver.keys.tab()

  // Type to trigger autocomplete
  await driver.keys.type('.')

  await new Promise((resolve) => setTimeout(resolve, 200))

  const withDotSnapshot = await driver.text()
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
    │  │ 📁  .termcast-bundle                                         │
    ◇  SelectgSinglerFile                                            │
    │  Enter─file─path...────────────────────────────────────────────┘
    │  Choose exactly one file
    │
    └


     ↵ submit   ↑↓ navigate   ^k actions"
  `)

  // Test escape key to close autocomplete
  await driver.keys.escape()

  const afterEscapeSnapshot = await driver.text()
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
  await driver.keys.type('s')

  await new Promise((resolve) => setTimeout(resolve, 200))

  // Navigate down multiple times
  await driver.keys.down()
  await driver.keys.down()
  await driver.keys.up()

  const afterNavigationSnapshot = await driver.text()
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
