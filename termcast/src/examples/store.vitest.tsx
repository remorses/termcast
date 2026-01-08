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

       > spiceblow

      ›Spiceblow - Sql Database Management Search, update, insert and delete row







       ✗ Unhandled Promise Rejection  database is locked






                                   Console (Focused)          [Copy (ctrl+shift+c)]
       /query-persist-client-core/build/modern/persist.js:40:38)
             at <anonymous> (/Users/morse/Documents/GitHub/termcast/node_modules/.bu
       @tanstack+query-persist-client-core@5.91.11/node_modules/@tanstack/query-pers
       ist-client-core/build/modern/persist.js:56:7)
             at <anonymous> (/Users/morse/Documents/GitHub/termcast/node_modules/.bu
       @tanstack+query-core@5.90.12/node_modules/@tanstack/query-core/build/modern/q
       ueryCache.js:75:9)
    >        at forEach (native:1:11)"
  `)
}, 30000)
