import { test, expect, afterEach, beforeEach } from 'vitest'
import { launchTerminal, Session } from 'tuistory/src'

let session: Session

beforeEach(async () => {
  session = await launchTerminal({
    command: 'bun',
    args: ['src/examples/store.tsx'],
    cols: 80,
    rows: 30,
  })
})

afterEach(() => {
  session?.close()
})

test('Store extension - searching for spiceblow shows Database', async () => {
  // Wait for store interface to load
  const initialOutput = await session.text({
    waitFor: (text) => {
      // Wait until we see the store title
      return text.includes('Store - Install Extensions')
    },
    timeout: 15000,
  })

  // Verify the store interface loads
  expect(initialOutput).toContain('Store - Install Extensions')

  // Type "spiceblow" in the search bar
  await session.type('spiceblow')

  // Get the output after search, waiting for Database to appear
  // This will automatically wait for the API request to complete and results to show
  const afterSearchOutput = await session.text({
    waitFor: (text) => {
      return text.includes('Search, update, insert')
    },
    timeout: 15000,
  })

  // Store the snapshot after searching for spiceblow
  expect(afterSearchOutput).toMatchInlineSnapshot(`
    "


     Store - Install Extensions ───────────────────────────────────────────────

     spiceblow

    ›piceblow - Sql       Search, update, insert and delete rows in your Sql
    Database Management  database, deeply integrated with AI


     ↵ select   ↑↓ navigate   ^k actions"
  `)
}, 30000)
