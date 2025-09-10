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

  // Sleep for 1 second to ensure the API request is triggered
  await new Promise((resolve) => setTimeout(resolve, 1000))

  // Wait for search results to load
  await driver.waitIdle({ timeout: 5000 })

  // Get the output after search
  const afterSearchOutput = await driver.text()

  // Verify "Database" appears in the results
  expect(afterSearchOutput).toContain('Database')

  // Store the snapshot after searching for spiceblow
  expect(afterSearchOutput).toMatchInlineSnapshot(`
      "

       Store - Install Extensions ───────────────────────────────────────────────
       spiceblow
      ›Database Manager Manage your databases with ease 1 command 1,234 downloads


       ↵ select   ↑↓ navigate   ^k actions"
    `)
}, 30000)
