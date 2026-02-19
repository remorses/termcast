import { test, expect, beforeEach, afterEach, beforeAll } from 'vitest'
import { launchTerminal, Session } from 'tuistory/src'
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import fs from 'node:fs'

const extensionDir = path.resolve(__dirname, '../../extensions/github')

// The extensions folder is gitignored, so this test only runs locally
const extensionExists = fs.existsSync(extensionDir)

// Install dependencies before running tests (only if extension exists locally)
beforeAll(() => {
  if (!extensionExists) {
    return // Extension folder doesn't exist (gitignored, not in CI)
  }

  // Skip if already installed
  if (fs.existsSync(path.join(extensionDir, 'node_modules', '.bin'))) {
    return
  }

  const result = spawnSync('npm', ['install'], {
    cwd: extensionDir,
    stdio: 'inherit',
    timeout: 120000,
  })

  if (result.status !== 0 || result.signal) {
    throw new Error(
      `npm install failed: status=${result.status}, signal=${result.signal}`,
    )
  }
}, 180000)

let session: Session

beforeEach(async (ctx) => {
  if (!extensionExists) {
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

test.skipIf(!extensionExists)('github extension shows command list on launch', async () => {
  // Wait for command list to appear (extension has multiple commands)
  // Don't match "Commands" alone - it falsely matches "Building 18 commands..." build log
  const initialView = await session.text({
    waitFor: (text) => /My Pull Requests|Search Repositories/i.test(text),
    timeout: 30000,
  })

  // Wait for the full command list to render.
  // The list can paint the first item before all descendants are registered.
  await session.text({
    waitFor: (text) => text.includes('My Pull Requests') && text.includes('Search Repositories'),
    timeout: 30000,
  })

  expect(initialView).toContain('My Pull Requests')
  expect(initialView).toContain('Search Repositories')
  expect(initialView).toMatchInlineSnapshot(`
    "


       GitHub ───────────────────────────────────────────────────────────────────

       > Search commands...

       Commands
      ›My Pull Requests List pull requests you created, participated in, or  view
       Search Pull Requests Search recent pull requests globally in all repo view
       Create Pull Request Create a pull request in one of your GitHub repos view
       My Issues List issues created by you, assigned to you or mentioning y view
       Search Issues Search recent issues globally in all repositories.      view
       Create Issue Create an issue in one of your GitHub repositories.      view
       Create Branch Create a branch in one of your GitHub repositories      view
       Search Repositories Search in your public or private repositories by  view
       My Latest Repositories List your repositories by latest updated       view
       My Starred Repositories List repositories you have starred            view
       Workflow Runs Manage workflow runs for a selected GitHub repository.  view
       Notifications List inbox notifications from all repositories or a sel view
       Search Discussions Search recent Discussions globally in all reposito view
       My Discussions Show your Discussions                                  view
       My Projects Show your Projects                                        view



       ↵ run command   ↑↓ navigate   ^k actions           powered by termcast.app



    "
  `)
}, 60000)

test.skipIf(!extensionExists)('github extension can navigate commands', async () => {
  // Wait for command list
  await session.text({
    waitFor: (text) => text.includes('My Pull Requests') && text.includes('Search Repositories'),
    timeout: 30000,
  })

  await session.waitIdle()

  // Navigate down
  await session.press('down')
  await session.press('down')

  const afterNavigate = await session.text()
  expect(afterNavigate).toMatchInlineSnapshot(`
    "


       GitHub ───────────────────────────────────────────────────────────────────

       > Search commands...

       Commands
       My Pull Requests List pull requests you created, participated in, or  view
       Search Pull Requests Search recent pull requests globally in all repo view
      ›Create Pull Request Create a pull request in one of your GitHub repos view
       My Issues List issues created by you, assigned to you or mentioning y view
       Search Issues Search recent issues globally in all repositories.      view
       Create Issue Create an issue in one of your GitHub repositories.      view
       Create Branch Create a branch in one of your GitHub repositories      view
       Search Repositories Search in your public or private repositories by  view
       My Latest Repositories List your repositories by latest updated       view
       My Starred Repositories List repositories you have starred            view
       Workflow Runs Manage workflow runs for a selected GitHub repository.  view
       Notifications List inbox notifications from all repositories or a sel view
       Search Discussions Search recent Discussions globally in all reposito view
       My Discussions Show your Discussions                                  view
       My Projects Show your Projects                                        view



       ↵ run command   ↑↓ navigate   ^k actions           powered by termcast.app



    "
  `)
}, 60000)

test.skipIf(!extensionExists)('github extension can open actions panel', async () => {
  // Wait for command list
  await session.text({
    waitFor: (text) => /My Pull Requests|Search Repositories/i.test(text),
    timeout: 30000,
  })

  await session.waitIdle()

  // Open actions panel with ctrl+k
  await session.press(['ctrl', 'k'])

  const actionsPanel = await session.text({
    waitFor: (text) => /Actions|Open/i.test(text),
    timeout: 5000,
  })

  expect(actionsPanel).toMatchInlineSnapshot(`
    "


       GitHub ───────────────────────────────────────────────────────────────────

       > Search commands...

      ╭──────────────────────────────────────────────────────────────────────────╮
      │                                                                          │
      │   Actions                                                          esc   │
      │                                                                          │
      │   > Search actions...                                                    │
      │                                                                          │
      │  ›Run Command                                                            │
      │   Copy File Path                                                         │
      │   Copy Command Info                                                      │
      │                                                                          │
      │   Settings                                                               │
      │   Configure GitHub...                                             ⌃⇧,    │
      │   Change Theme...                                                        │
      │   Toggle Console Logs                                                    │
      │                                                                          │
      │                                                                          │
      │                                                                          │
      │   ↵ select   ↑↓ navigate                                                 │
      │                                                                          │
      ╰──────────────────────────────────────────────────────────────────────────╯



    "
  `)
}, 60000)

test.skipIf(!extensionExists)('github extension can search commands', async () => {
  // Wait for command list
  await session.text({
    waitFor: (text) => /My Pull Requests|Search Repositories/i.test(text),
    timeout: 30000,
  })

  await session.waitIdle()

  // Type to filter commands
  await session.type('workflow')

  const filteredList = await session.text({
    waitFor: (text) => /Workflow Runs/i.test(text) && !/My Pull Requests/i.test(text),
    timeout: 5000,
  })

  expect(filteredList).toMatchInlineSnapshot(`
    "


       GitHub ───────────────────────────────────────────────────────────────────

       > workflow

      ›Workflow Runs Manage workflow runs for a selected GitHub repository.  view







       ↵ run command   ↑↓ navigate   ^k actions           powered by termcast.app














    "
  `)
}, 60000)
