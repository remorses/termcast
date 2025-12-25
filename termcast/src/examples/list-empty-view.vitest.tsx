import { test, expect, afterEach, beforeEach } from 'vitest'

import { launchTerminal, Session } from 'tuistory/src'

let session: Session

beforeEach(async () => {
  session = await launchTerminal({
    command: 'bun',
    args: ['src/examples/simple-list.tsx'],
    cols: 60,
    rows: 15,
  })
})

afterEach(() => {
  session?.close()
})

test('default empty view should NOT show when items exist', async () => {
  await session.text({
    waitFor: (text) => {
      return /First Item/.test(text)
    },
  })

  const snapshot = await session.text()
  
  // Should show items
  expect(snapshot).toContain('First Item')
  expect(snapshot).toContain('Second Item')
  
  // Should NOT show "No items found" when items exist
  expect(snapshot).not.toContain('No items found')
}, 10000)

test('default empty view should show when filtering leaves no items', async () => {
  await session.text({
    waitFor: (text) => {
      return /First Item/.test(text)
    },
  })

  // Search for something that doesn't exist
  await session.type('xyznonexistent')

  const snapshot = await session.text({
    waitFor: (text) => {
      return /xyznonexistent/.test(text)
    },
  })
  
  // Should NOT show any items
  expect(snapshot).not.toContain('First Item')
  expect(snapshot).not.toContain('Second Item')
  
  // Should show "No items found"
  expect(snapshot).toContain('No items found')
}, 10000)

test('default empty view should hide when filter is cleared', async () => {
  await session.text({
    waitFor: (text) => {
      return /First Item/.test(text)
    },
  })

  // Search for something that doesn't exist
  await session.type('xyz')

  await session.text({
    waitFor: (text) => {
      return /xyz/.test(text)
    },
  })

  // Clear the search
  await session.press('backspace')
  await session.press('backspace')
  await session.press('backspace')

  const snapshot = await session.text({
    waitFor: (text) => {
      return /First Item/.test(text)
    },
  })
  
  // Should show items again
  expect(snapshot).toContain('First Item')
  
  // Should NOT show "No items found"
  expect(snapshot).not.toContain('No items found')
}, 10000)
