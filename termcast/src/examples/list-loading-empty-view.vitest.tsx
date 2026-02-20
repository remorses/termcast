// E2E: verify List empty view shows a unicode squares spinner when isLoading.

import { test, expect, beforeEach, afterEach } from 'vitest'
import { launchTerminal, Session } from 'tuistory/src'

let session: Session

beforeEach(async () => {
  session = await launchTerminal({
    command: 'bun',
    args: ['src/examples/list-loading-empty-view.tsx'],
    cols: 60,
    rows: 15,
  })
})

afterEach(() => {
  session?.close()
})

test('empty view shows spinner when list is loading', async () => {
  const text = await session.text({
    waitFor: (t) => {
      return t.includes('loading...')
    },
  })

  // Spinner animates (pulsing dots: ' ' · •). Normalize for stable snapshots.
  const normalized = text.replace(/[·•]/g, '•')
  expect(normalized).toMatchInlineSnapshot(`
    "


       Loading Empty View ───────────────────────────────────

         Search...



                              loading...





       ↑↓ navigate   ^k actions"
  `)
  expect(text).toMatch(/[·• ]\s*loading\.\.\./)
}, 10000)
