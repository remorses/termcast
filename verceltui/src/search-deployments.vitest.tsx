// E2E tests for search-deployments using hardcoded demo data.
// Validates list rendering, navigation, search filtering, and status icons.

import { test, expect, beforeEach, afterEach } from 'vitest'
import { launchTerminal, Session } from 'tuistory/src'

let session: Session

beforeEach(async () => {
  session = await launchTerminal({
    command: 'bun',
    args: ['src/search-deployments-demo.tsx'],
    cols: 140,
    rows: 30,
    cwd: __dirname + '/..',
  })
})

afterEach(() => {
  session?.close()
})

test('list shows deployments after loading', async () => {
  const text = await session.text({
    waitFor: (t) => t.includes('dark mode'),
    timeout: 10000,
  })
  expect(text).toMatchInlineSnapshot(`
    "


       Vercel Deployments ───────────────────────────────────────────────────────────────────────────────────────────────────────────────────

       > Search Deployments...

      ›● fea...gle my-app                             Ready      5m ago   │ my-app
       ● fix...out my-app                             Building   30m ago  │ feat: add dark mode toggle
       ● cho...ies docs-site                          Failed     2h ago   │
       ● per...ies api-service                        Ready      1d ago   │ Project: my-app
       ● No ...age landing-page                       Canceled   3d ago   │
                                                                          │ Status:  Ready
                                                                          │
                                                                          │ Target:  production
                                                                          │
                                                                          │ ────────────────────────────────────────────────────────────────
                                                                          │
                                                                          │ Branch:  main
                                                                          │
                                                                          │ Created: 7/17/2026, 5:30:41 PM
                                                                          │
                                                                          │ Author:  tommy
                                                                          │
                                                                          │ ────────────────────────────────────────────────────────────────
                                                                          │
                                                                          │ URL:     my-app-abc123.vercel.app
                                                                          │
       ↵ open on vercel   ↑↓ navigate   ^k actions                        │ Source:  git

    "
  `)
  expect(text).toContain('dark mode')
  expect(text).toContain('my-app')
}, 15000)

test('navigate between deployments with arrow keys', async () => {
  await session.text({
    waitFor: (t) => t.includes('dark mode'),
    timeout: 10000,
  })

  await session.press('down')
  const afterDown = await session.text()
  expect(afterDown).toMatchInlineSnapshot(`
    "


       Vercel Deployments ───────────────────────────────────────────────────────────────────────────────────────────────────────────────────

       > Search Deployments...

       ● fea...gle my-app                             Ready      5m ago   │ my-app
      ›● fix...out my-app                             Building   30m ago  │ fix: resolve login timeout
       ● cho...ies docs-site                          Failed     2h ago   │
       ● per...ies api-service                        Ready      1d ago   │ Project: my-app
       ● No ...age landing-page                       Canceled   3d ago   │
                                                                          │ Status:  Building
                                                                          │
                                                                          │ Target:  staging
                                                                          │
                                                                          │ ────────────────────────────────────────────────────────────────
                                                                          │
                                                                          │ Branch:  fix/login-timeout
                                                                          │
                                                                          │ Created: 7/17/2026, 5:05:42 PM
                                                                          │
                                                                          │ Author:  tommy
                                                                          │
                                                                          │ ────────────────────────────────────────────────────────────────
                                                                          │
                                                                          │ URL:     my-app-def456.vercel.app
                                                                          │
       ↵ open on vercel   ↑↓ navigate   ^k actions                        │ Source:  git

    "
  `)
  expect(afterDown).toContain('login timeout')

  await session.press('down')
  const afterTwoDown = await session.text()
  expect(afterTwoDown).toMatchInlineSnapshot(`
    "


       Vercel Deployments ───────────────────────────────────────────────────────────────────────────────────────────────────────────────────

       > Search Deployments...

       ● fea...gle my-app                             Ready      5m ago   │ docs-site
       ● fix...out my-app                             Building   30m ago  │ chore: update dependencies
      ›● cho...ies docs-site                          Failed     2h ago   │
       ● per...ies api-service                        Ready      1d ago   │ Project: docs-site
       ● No ...age landing-page                       Canceled   3d ago   │
                                                                          │ Status:  Failed
                                                                          │
                                                                          │ Target:  preview
                                                                          │
                                                                          │ ────────────────────────────────────────────────────────────────
                                                                          │
                                                                          │ Branch:  chore/deps
                                                                          │
                                                                          │ Created: 7/17/2026, 3:35:42 PM
                                                                          │
                                                                          │ Author:  alice
                                                                          │
                                                                          │ ────────────────────────────────────────────────────────────────
                                                                          │
                                                                          │ URL:     docs-site-ghi789.vercel.app
                                                                          │
       ↵ open on vercel   ↑↓ navigate   ^k actions                        │ Source:  git

    "
  `)
  expect(afterTwoDown).toContain('update dependencies')
}, 15000)

test('search filters deployments', async () => {
  await session.text({
    waitFor: (t) => t.includes('dark mode'),
    timeout: 10000,
  })

  await session.type('optimize')
  const filtered = await session.text({
    waitFor: (t) => t.includes('optimize'),
  })
  expect(filtered).toMatchInlineSnapshot(`
    "


       Vercel Deployments ───────────────────────────────────────────────────────────────────────────────────────────────────────────────────

       > optimize

      ›● per...ies api-service                        Ready      1d ago   │ api-service
                                                                          │ perf: optimize database queries
                                                                          │
                                                                          │ Project: api-service
                                                                          │
                                                                          │ Status:  Ready
                                                                          │
                                                                          │ Target:  production
                                                                          │
                                                                          │ ────────────────────────────────────────────────────────────────
                                                                          │
                                                                          │ Branch:  main
                                                                          │
                                                                          │ Created: 7/16/2026, 5:35:43 PM
                                                                          │
                                                                          │ Author:  tommy
                                                                          │
                                                                          │ ────────────────────────────────────────────────────────────────
                                                                          │
                                                                          │ URL:     api-service-jkl012.vercel.app
                                                                          │
       ↵ open on vercel   ↑↓ navigate   ^k actions                        │ Source:  git

    "
  `)
  expect(filtered).toContain('optimize')
  expect(filtered).toContain('api-service')
}, 15000)
