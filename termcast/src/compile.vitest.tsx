import { test, expect, afterEach, beforeAll } from 'vitest'
import { launchTerminal, Session } from 'tuistory/src'
import path from 'node:path'
import fs from 'node:fs'
import { execSync } from 'node:child_process'

const fixtureDir = path.resolve(__dirname, '../fixtures/simple-extension')
const distDir = path.join(fixtureDir, 'dist')
const bundleDir = path.join(fixtureDir, '.termcast-bundle')
const executablePath = path.join(distDir, 'simple-extension')

const singleErrorFixtureDir = path.resolve(__dirname, '../fixtures/single-error-extension')
const singleErrorDistDir = path.join(singleErrorFixtureDir, 'dist')
const singleErrorBundleDir = path.join(singleErrorFixtureDir, '.termcast-bundle')
const singleErrorExecutablePath = path.join(singleErrorDistDir, 'single-error-extension')

let session: Session

afterEach(() => {
  session?.close()
})

// Compile once before all tests
function ensureCompiled() {
  if (!fs.existsSync(executablePath)) {
    // Clean dist directory
    if (fs.existsSync(distDir)) {
      fs.rmSync(distDir, { recursive: true, force: true })
    }

    // Compile using CLI (runs in Bun context)
    execSync(`bun src/cli.tsx compile ${fixtureDir}`, {
      cwd: path.resolve(__dirname, '..'),
      stdio: 'pipe',
    })
  }

  if (!fs.existsSync(executablePath)) {
    throw new Error(`Compiled executable not found at ${executablePath}`)
  }
}

beforeAll(() => {
  if (fs.existsSync(executablePath)) {
    fs.unlinkSync(executablePath)
  }
  if (fs.existsSync(distDir)) {
    fs.rmSync(distDir, { recursive: true, force: true })
  }
  if (fs.existsSync(bundleDir)) {
    fs.rmSync(bundleDir, { recursive: true, force: true })
  }

  if (fs.existsSync(singleErrorExecutablePath)) {
    fs.unlinkSync(singleErrorExecutablePath)
  }
  if (fs.existsSync(singleErrorDistDir)) {
    fs.rmSync(singleErrorDistDir, { recursive: true, force: true })
  }
  if (fs.existsSync(singleErrorBundleDir)) {
    fs.rmSync(singleErrorBundleDir, { recursive: true, force: true })
  }
})


test('compile extension and run executable', async () => {
  ensureCompiled()

  // Run the compiled executable
  session = await launchTerminal({
    command: executablePath,
    args: [],
    cols: 60,
    rows: 16,
  })

  await session.text({
    waitFor: (text) => /Simple Test Extension/i.test(text),
    timeout: 10000,
  })

  const snapshot = await session.text()
  expect(snapshot).toMatchInlineSnapshot(`
    "


       Simple Test Extension ────────────────────────────────

       > Search commands...

       Commands
      ›List Items Displays a simple list with some items view
       Search Items Search and filter through a list of  view
       Google Oauth                                      view
       usePromise Demo Shows how to use the usePromise h view
       Show State Shows the current application state in view


       ↵ run command   ↑↓ navigate   ^k actions
    "
  `)
}, 60000)

test('compiled executable can run command', async () => {
  ensureCompiled()

  session = await launchTerminal({
    command: executablePath,
    args: [],
    cols: 60,
    rows: 16,
  })

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

  const listSnapshot = await session.text()
  expect(listSnapshot).toMatchInlineSnapshot(`
    "


       List Items ───────────────────────────────────────────

       > Search...

       Items
      ›○ First Item This is the first item
       ○ Second Item This is the second item
       ○ Third Item This is the third item
       ○ Fourth Item This is the fourth item
       ○ Fifth Item This is the fifth item


     ✓ Copied to Clipboard  First Item
    "
  `)
}, 60000)

test('compiled executable can navigate back', async () => {
  ensureCompiled()

  session = await launchTerminal({
    command: executablePath,
    args: [],
    cols: 60,
    rows: 16,
  })

  await session.text({
    waitFor: (text) => /Simple Test Extension/i.test(text),
    timeout: 10000,
  })

  // Run first command
  await session.press('enter')
  await session.press('enter')

  await session.text({
    waitFor: (text) => /First Item/i.test(text),
    timeout: 10000,
  })

  // Navigate back with escape - this should either:
  // 1. Go back to command list (if push was used)
  // 2. Exit (if replace was used because only one command is visible)
  await session.press('escape')

  // Wait a bit for navigation to complete
  await session.waitIdle()

  const backSnapshot = await session.text()
  // If we're back at the command list, we'll see "Simple Test Extension"
  // If the command exited, the terminal might be empty
  expect(backSnapshot).toMatchInlineSnapshot(`
    "


       List Items ───────────────────────────────────────────

       > Search...

       Items
      ›○ First Item This is the first item
       ○ Second Item This is the second item
       ○ Third Item This is the third item
       ○ Fourth Item This is the fourth item
       ○ Fifth Item This is the fifth item


       ↵ copy item title   ↑↓ navigate   ^k actions
    "
  `)
}, 60000)

test('compiled executable shows error when command throws at root scope', async () => {
  ensureCompiled()

  session = await launchTerminal({
    command: executablePath,
    args: [],
    cols: 60,
    rows: 20,
  })

  // With lazy loading, the command list should appear first
  await session.text({
    waitFor: (text) => /Simple Test Extension/i.test(text),
    timeout: 10000,
  })

  // Filter to the Throw Error command
  await session.type('throw error')
  await session.waitIdle()

  // Select and run the command
  await session.press('enter')
  await session.press('enter')

  // Wait for error to be displayed
  await session.text({
    waitFor: (text) => /error/i.test(text),
    timeout: 10000,
  })

  const errorSnapshot = await session.text()
  expect(errorSnapshot).toMatchInlineSnapshot(`
    "




        Error: This is a test error thrown at root scope
            at <anonymous> (fixtures/simple-extension/src/th
            at processTicksAndRejections (native:7:39)












    "
  `)
}, 60000)

function ensureSingleErrorCompiled() {
  if (!fs.existsSync(singleErrorExecutablePath)) {
    if (fs.existsSync(singleErrorDistDir)) {
      fs.rmSync(singleErrorDistDir, { recursive: true, force: true })
    }

    execSync(`bun src/cli.tsx compile ${singleErrorFixtureDir}`, {
      cwd: path.resolve(__dirname, '..'),
      stdio: 'pipe',
    })
  }

  if (!fs.existsSync(singleErrorExecutablePath)) {
    throw new Error(`Compiled executable not found at ${singleErrorExecutablePath}`)
  }
}

test('single command extension shows error when command throws at root scope', async () => {
  ensureSingleErrorCompiled()

  session = await launchTerminal({
    command: singleErrorExecutablePath,
    args: [],
    cols: 60,
    rows: 20,
  })

  // Wait for something to appear
  await session.waitIdle()

  const errorSnapshot = await session.text()
  expect(errorSnapshot).not.toContain('Failed to load native binding')
  expect(errorSnapshot).not.toContain('@swc/core/binding.js')
  expect(errorSnapshot).toMatchInlineSnapshot(`
    "




        Error
            at <anonymous> (fixtures/single-error-extension/
            at processTicksAndRejections (unknown:7:39)












    "
  `)
}, 60000)
