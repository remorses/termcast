import { test, expect, afterEach, beforeEach } from 'vitest'
import { NodeTuiDriver } from '@termcast/cli/src/e2e-node'

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
     Spike Resolve incidents, check who is on-call, and add overrides from Raycast
     Image Modification Apply filters and transformations to various image formats
     Next Run Spin up a Next.js project from Raycast
     Donut Show an animation of a donut


     ↵ select   ↑↓ navigate   ^k actions"
  `)
}, 30000)
