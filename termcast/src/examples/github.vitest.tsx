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
  const initialView = await session.text({
    waitFor: (text) => text.includes('My Pul...quests') && text.includes('Search Repositorie'),
    timeout: 30000,
  })

  expect(initialView).toContain('My Pul...quests')
  expect(initialView).toContain('Search Repositorie')
  expect(initialView).toMatchInlineSnapshot(`
    "


       GitHub ───────────────────────────────────────────────────────────────────

       > Search commands...

       Commands
      ›My Pul...questsList pull requests you cr... in, or were mentioned in. view
       Search Pull Request Search recent pull requ...ly in all repositories. view
       Create Pull Reques Create a pull request i...our GitHub repositories. view
       My IssuesList issues created by you, ...ned to you or mentioning you. view
       Search Issues Search recent issues globally in all repositories.      view
       Create Issue Create an issue in one of your GitHub repositories.      view
       Create Branch Create a branch in one of your GitHub repositories      view
       Search Repositorie Search in your public o...te repositories by name. view
       My Latest Repositories List your repositories by latest updated       view
       My Starred Repositories List repositories you have starred            view
       Workflow Runs Manage workflow runs for a selected GitHub repository.  view
       Notification List inbox notifications f...s or a selected repository. view
       Search DiscussionsSearch recent Discussion...ally in all repositories view
       My Discussions Show your Discussions                                  view
       My Projects Show your Projects                                        view



       ↵ run command   ↑↓ navigate   ^k actions   :vim    powered by termcast.app



    "
  `)
}, 60000)

test.skipIf(!extensionExists)('github extension can navigate commands', async () => {
  // Wait for command list
  await session.text({
    waitFor: (text) => text.includes('My Pul...quests') && text.includes('Search Repositorie'),
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
       My Pul...questsList pull requests you cr... in, or were mentioned in. view
       Search Pull Request Search recent pull requ...ly in all repositories. view
      ›Create Pull Reques Create a pull request i...our GitHub repositories. view
       My IssuesList issues created by you, ...ned to you or mentioning you. view
       Search Issues Search recent issues globally in all repositories.      view
       Create Issue Create an issue in one of your GitHub repositories.      view
       Create Branch Create a branch in one of your GitHub repositories      view
       Search Repositorie Search in your public o...te repositories by name. view
       My Latest Repositories List your repositories by latest updated       view
       My Starred Repositories List repositories you have starred            view
       Workflow Runs Manage workflow runs for a selected GitHub repository.  view
       Notification List inbox notifications f...s or a selected repository. view
       Search DiscussionsSearch recent Discussion...ally in all repositories view
       My Discussions Show your Discussions                                  view
       My Projects Show your Projects                                        view



       ↵ run command   ↑↓ navigate   ^k actions   :vim    powered by termcast.app



    "
  `)
}, 60000)

test.skipIf(!extensionExists)('github extension can open actions panel', async () => {
  // Wait for command list
  await session.text({
    waitFor: (text) => /My Pu.*uest|Search .*sitories/i.test(text),
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
      │   Enable Vim Mode                                                        │
      │   Toggle Console Logs                                                    │
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
    waitFor: (text) => /My Pu.*uest|Search .*sitories/i.test(text),
    timeout: 30000,
  })

  await session.waitIdle()

  // Type to filter commands
  await session.type('workflow')

  const filteredList = await session.text({
    waitFor: (text) => /Workflow Runs/i.test(text) && !/My Pu.*uest/i.test(text),
    timeout: 5000,
  })

  expect(filteredList).toMatchInlineSnapshot(`
    "


       GitHub ───────────────────────────────────────────────────────────────────

       > workflow

      ›Workflow Runs Manage workflow runs for a selected GitHub repository.  view











       ↵ run command   ↑↓ navigate   ^k actions   :vim    powered by termcast.app










    "
  `)
}, 60000)
