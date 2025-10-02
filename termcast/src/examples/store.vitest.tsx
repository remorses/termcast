import { test, expect, afterEach, beforeEach } from 'vitest'
import { NodeTuiDriver } from 'termcast/src/e2e-node'

let driver: NodeTuiDriver

beforeEach(() => {
  driver = new NodeTuiDriver('bun', ['src/examples/store.tsx'], {
    cols: 80,
    rows: 30,
  })
})

afterEach(() => {
  driver?.dispose()
})

test('Store extension - searching for spiceblow shows Database', async () => {
  // Wait for store interface to load
  const initialOutput = await driver.text({
    waitFor: (text) => {
      // Wait until we see the store title
      return text.includes('Store - Install Extensions')
    },
    timeout: 15000,
  })

  // Verify the store interface loads
  expect(initialOutput).toContain('Store - Install Extensions')

  // Type "spiceblow" in the search bar
  await driver.keys.type('spiceblow')

  // Get the output after search, waiting for Database to appear
  // This will automatically wait for the API request to complete and results to show
  const afterSearchOutput = await driver.text({
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

    ›Spiceblow - Sql Database Management Search, update, insert and delete rows in


     ↵ select   ↑↓ navigate   ^k actions"
  `)
}, 30000)
