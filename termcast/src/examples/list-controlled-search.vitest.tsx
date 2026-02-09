// Repro: controlled searchText + filtering must reset selection to first visible item.
// Bug: when parent manages searchText, List never calls setSelectedIndex on search change,
// so the › marker stays on a stale (now-hidden) item or disappears entirely.
import { test, expect, afterEach, beforeEach } from 'vitest'
import { launchTerminal, Session } from 'tuistory/src'

let session: Session

beforeEach(async () => {
  session = await launchTerminal({
    command: 'bun',
    args: ['src/examples/list-controlled-search.tsx'],
    cols: 60,
    rows: 16,
  })
})

afterEach(() => {
  session?.close()
})

test('controlled search resets selection to first visible item', async () => {
  await session.text({
    waitFor: (text) => {
      return /search items/i.test(text) && text.includes('Apple')
    },
  })

  // Navigate down to select Grape (4th item)
  await session.press('down')
  await session.press('down')
  await session.press('down')

  const beforeSearch = await session.text()
  expect(beforeSearch).toContain('›Grape')

  // Type "let" — only Lettuce should match.
  // Selection MUST move to Lettuce (first visible item).
  await session.type('let')

  const afterSearch = await session.text({
    waitFor: (text) => {
      return text.includes('let') && text.includes('Lettuce')
    },
  })

  // BUG REPRO: without the fix, › is missing or on a stale item
  expect(afterSearch).toContain('›Lettuce')
}, 10000)
