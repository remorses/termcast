// E2E test: search text persists across push/pop navigation.
// When user types a search query, pushes a detail view (Enter), then pops back (Esc),
// the search text and filtered results should be restored.
import { test, expect, afterEach, beforeEach } from 'vitest'
import { launchTerminal, Session } from 'tuistory/src'

let session: Session

beforeEach(async () => {
  session = await launchTerminal({
    command: 'bun',
    args: ['src/examples/simple-list-search.tsx'],
    cols: 70,
    rows: 20,
  })
})

afterEach(() => {
  session?.close()
})

test('search text persists after push and pop', async () => {
  // Wait for initial render
  await session.text({
    waitFor: (text) => {
      return /search items/i.test(text) && text.includes('First Item')
    },
  })

  // Type "apple" to filter to the Apple item
  await session.type('apple')

  const afterSearch = await session.text({
    waitFor: (text) => {
      return text.includes('apple') && text.includes('Apple')
    },
  })
  expect(afterSearch).toContain('apple')
  expect(afterSearch).toContain('›Apple')

  // Press Enter to push the Detail view (Apple has a "View Details" action)
  await session.press('enter')

  const detailView = await session.text({
    waitFor: (text) => {
      return text.includes('First Item') || text.includes('Apple')
    },
  })
  // Should be in the detail view now
  expect(detailView).toContain('go back')

  // Press Esc to pop back to the list
  await session.press('escape')

  const afterPop = await session.text({
    waitFor: (text) => {
      return text.includes('apple')
    },
  })

  // Search text "apple" should be restored
  expect(afterPop).toContain('apple')
  // The filtered result should still show Apple
  expect(afterPop).toContain('Apple')
}, 15000)
