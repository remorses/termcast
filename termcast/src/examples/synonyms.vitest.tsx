import { test, expect, beforeEach, afterEach, beforeAll } from 'vitest'
import { launchTerminal, Session } from 'tuistory/src'
import { spawnSync } from 'node:child_process'
import path from 'node:path'

const extensionDir = path.resolve(__dirname, '../../extensions/synonyms')

// Install dependencies before running tests
beforeAll(() => {
  // Use spawnSync and capture output for debugging
  const result = spawnSync('bun', ['install'], {
    cwd: extensionDir,
    stdio: 'pipe',
    timeout: 120000,
    env: {
      ...process.env,
      // Disable color output for cleaner logs
      NO_COLOR: '1',
      FORCE_COLOR: '0',
    },
  })

  // Log full result for debugging CI issues
  console.log('bun install result:', {
    status: result.status,
    signal: result.signal,
    error: result.error?.message,
    stdout: result.stdout?.toString().slice(-2000),
    stderr: result.stderr?.toString().slice(-2000),
  })

  if (result.error) {
    throw new Error(`bun install error: ${result.error.message}`)
  }

  if (result.signal) {
    throw new Error(
      `bun install killed by signal ${result.signal}. stderr: ${result.stderr?.toString().slice(-500)}`,
    )
  }

  if (result.status !== 0) {
    throw new Error(
      `bun install failed with exit code ${result.status}. stderr: ${result.stderr?.toString().slice(-500)}`,
    )
  }
}, 180000)

let session: Session

beforeEach(async () => {
  session = await launchTerminal({
    command: 'bun',
    args: ['src/cli.tsx', 'dev', extensionDir],
    cwd: path.resolve(__dirname, '../..'),
    cols: 80,
    rows: 30,
  })
})

afterEach(() => {
  session?.close()
})

test('synonyms extension shows preferences form on first launch', async () => {
  // Wait for preferences form to appear (extension requires LLM provider setup)
  await session.text({
    waitFor: (text) => /LLM Provider/i.test(text),
    timeout: 30000,
  })
  
  // Wait for auto-focus to settle
  await session.waitIdle()
  
  const preferencesForm = await session.text()

  expect(preferencesForm).toMatchInlineSnapshot(`
    "




         ◇  LLM Provider                                                      ▀
         │  Select...
         │
         │  ○ Raycast AI
         │  ○ OpenAI
         │  ○ OpenAI Compatible
         │  ○ Anthropic
         │  ○ Fireworks.ai
         │
         │  Select the LLM provider you want to use
         │
         ◇  OpenAI API Key
         │
         │  API Key for OpenAI
         │
         ◇  OpenAI Model
         │  gpt-4.1-mini
         │
         │  Model name for OpenAI
         │
         ◇  OpenAI Compatible URL


          ctrl ↵ submit   tab navigate   ^k actions        powered by termcast

    "
  `)
}, 60000)

test('synonyms extension preferences form can be navigated', async () => {
  // Wait for preferences form to appear
  await session.text({
    waitFor: (text) => /LLM Provider/i.test(text),
    timeout: 30000,
  })
  
  // Wait for auto-focus to settle
  await session.waitIdle()

  // Navigate down in the dropdown
  await session.press('down')
  await session.press('down')

  const afterNavigate = await session.text()
  expect(afterNavigate).toMatchInlineSnapshot(`
    "




         ◇  LLM Provider                                                      ▀
         │  Select...
         │
         │  ○ Raycast AI
         │  ○ OpenAI
         │  ○ OpenAI Compatible
         │  ○ Anthropic
         │  ○ Fireworks.ai
         │
         │  Select the LLM provider you want to use
         │
         ◇  OpenAI API Key
         │
         │  API Key for OpenAI
         │
         ◇  OpenAI Model
         │  gpt-4.1-mini
         │
         │  Model name for OpenAI
         │
         ◇  OpenAI Compatible URL


          ctrl ↵ submit   tab navigate   ^k actions        powered by termcast

    "
  `)

  // Press tab to move to next field
  await session.press('tab')

  const afterTab = await session.text()
  expect(afterTab).toMatchInlineSnapshot(`
    "




         ◆  LLM Provider                                                      ▀
         │  Select...
         │
         │› ○ Raycast AI
         │  ○ OpenAI
         │  ○ OpenAI Compatible
         │  ○ Anthropic
         │  ○ Fireworks.ai
         │
         │  Select the LLM provider you want to use
         │
         ◇  OpenAI API Key
         │
         │  API Key for OpenAI
         │
         ◇  OpenAI Model
         │  gpt-4.1-mini
         │
         │  Model name for OpenAI
         │
         ◇  OpenAI Compatible URL


          ctrl ↵ submit   tab navigate   ^k actions        powered by termcast

    "
  `)
}, 60000)
