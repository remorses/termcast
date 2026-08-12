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

      ›● feat: add dark mode toggle my-app               Ready    5m ago  │ my-app
       ● fix: resolve login timeout my-app               Building 30m ago │ feat: add dark mode toggle
       ● chore: update dependencies docs-site            Failed   2h ago  │
       ● perf: optim...base queries api-service          Ready    1d ago  │ Project: my-app
       ● No commit message          landing-page         Canceled 3d ago  │
                                                                          │ Status:  Ready
                                                                          │
                                                                          │ Target:  production
                                                                          │
                                                                          │ ────────────────────────────────────────────────────────────────
                                                                          │
                                                                          │ Branch:  main
                                                                          │
                                                                          │ Created: 8/12/2026, 11:50:20 AM
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

       ● feat: add dark mode toggle my-app               Ready    5m ago  │ my-app
      ›● fix: resolve login timeout my-app               Building 30m ago │ fix: resolve login timeout
       ● chore: update dependencies docs-site            Failed   2h ago  │
       ● perf: optim...base queries api-service          Ready    1d ago  │ Project: my-app
       ● No commit message          landing-page         Canceled 3d ago  │
                                                                          │ Status:  Building
                                                                          │
                                                                          │ Target:  staging
                                                                          │
                                                                          │ ────────────────────────────────────────────────────────────────
                                                                          │
                                                                          │ Branch:  fix/login-timeout
                                                                          │
                                                                          │ Created: 8/12/2026, 11:25:21 AM
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

       ● feat: add dark mode toggle my-app               Ready    5m ago  │ docs-site
       ● fix: resolve login timeout my-app               Building 30m ago │ chore: update dependencies
      ›● chore: update dependencies docs-site            Failed   2h ago  │
       ● perf: optim...base queries api-service          Ready    1d ago  │ Project: docs-site
       ● No commit message          landing-page         Canceled 3d ago  │
                                                                          │ Status:  Failed
                                                                          │
                                                                          │ Target:  preview
                                                                          │
                                                                          │ ────────────────────────────────────────────────────────────────
                                                                          │
                                                                          │ Branch:  chore/deps
                                                                          │
                                                                          │ Created: 8/12/2026, 9:55:21 AM
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

      ›● perf: optim...base queries api-service          Ready    1d ago  │ api-service
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
                                                                          │ Created: 8/11/2026, 11:55:22 AM
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
