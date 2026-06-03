/**
 * E2E test for accessoryTagsLayout alignment with variable-width text accessories.
 * Verifies that text accessories are padded when accessoryTagsLayout includes
 * a width for their position, keeping all columns aligned across items.
 */
import { test, expect, afterEach, beforeEach } from 'vitest'
import { launchTerminal, Session } from 'tuistory/src'

let session: Session

beforeEach(async () => {
  session = await launchTerminal({
    command: 'bun',
    args: ['src/examples/list-accessory-text-align.tsx'],
    cols: 100,
    rows: 15,
  })
})

afterEach(() => {
  session?.close()
})

test('text accessories are padded so tag columns stay aligned', async () => {
  await session.text({ waitFor: (text) => /Issues/.test(text) })

  const snapshot = await session.text()
  expect(snapshot).toMatchInlineSnapshot(`
    "


       Issues ───────────────────────────────────────────────────────────────────────────────────────

       > Search...

      ›TypeError: Cannot read properties of undefined                       api-gateway  15   7h ago
       Error: Hydration failed because rendered HTML did not match          web-frontend 6    22h ago
       Error: subscription metadata points at unknown org                   api-gateway  2    21h ago
       Error: Minified React error #418                                     web-frontend 2    21h ago
       AI_NoOutputGeneratedError: No output                                 api-gateway  1    23h ago



    "
  `)

  // Tag columns should start at the same position across all lines.
  // Extract the column where "api-gateway" or "web-frontend" starts.
  const lines = snapshot.split('\n').filter((l) => {
    return l.includes('api-gateway') || l.includes('web-frontend')
  })
  expect(lines.length).toBe(5)
  const serviceColStarts = lines.map((l) => {
    const m = l.match(/(api-gateway|web-frontend)/)
    return m ? l.indexOf(m[0]) : -1
  })
  expect(new Set(serviceColStarts).size).toBe(1)
}, 15000)
