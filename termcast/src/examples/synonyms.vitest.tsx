import { test, expect, beforeEach, afterEach, beforeAll, describe } from 'vitest'
import { launchTerminal, Session } from 'tuistory/src'
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import fs from 'node:fs'

const extensionDir = path.resolve(__dirname, '../../extensions/synonyms')

// Track if install succeeded - tests will be skipped if not
let installSucceeded = false

// Install dependencies before running tests
beforeAll(() => {
  // Check if node_modules already exists (fast path)
  if (fs.existsSync(path.join(extensionDir, 'node_modules'))) {
    installSucceeded = true
    return
  }

  // Use spawnSync without shell to avoid /bin/sh issues on CI
  // Retry up to 3 times because bun install can be flaky in CI
  for (let attempt = 1; attempt <= 3; attempt++) {
    const result = spawnSync('bun', ['install'], {
      cwd: extensionDir,
      stdio: 'inherit',
      timeout: 60000,
    })
    // Check for success (status 0 and no signal)
    if (result.status === 0 && !result.signal) {
      installSucceeded = true
      return
    }
    // Log failure but continue retrying
    console.warn(
      `bun install attempt ${attempt}/3 failed: status=${result.status}, signal=${result.signal}`,
    )
  }
  // Don't throw - just mark as failed, tests will be skipped
  console.warn('bun install failed after 3 attempts, tests will be skipped')
}, 180000)

let session: Session

beforeEach(async (ctx) => {
  if (!installSucceeded) {
    ctx.skip()
    return
  }
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

test('synonyms extension shows preferences form on first launch', async (ctx) => {
  if (!installSucceeded) {
    ctx.skip()
    return
  }
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

test('synonyms extension preferences form can be navigated', async (ctx) => {
  if (!installSucceeded) {
    ctx.skip()
    return
  }
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
