import { test, expect, beforeEach, afterEach } from 'vitest'
import { NodeTuiDriver } from '@termcast/cli/src/e2e-node'

let driver: NodeTuiDriver

beforeEach(() => {
  driver = new NodeTuiDriver('bun', ['src/examples/list-fetch-data.tsx'], {
    cols: 70,
    rows: 50,
  })
})

afterEach(() => {
  driver?.dispose()
})

test('list shows initial items after fetch', async () => {
  // Wait for initial loading state
  await driver.text({
    waitFor: (text) => {
      return /SVG Library/i.test(text)
    },
  })

  // Wait for items to actually appear
  const afterFetchSnapshot = await driver.text({
    waitFor: (text) => {
      // Wait until we see at least one section title
      return text.includes('Icons') || text.includes('Home Icon')
    },
    timeout: 2000,
  })
  expect(afterFetchSnapshot).toMatchInlineSnapshot(`
    "

     SVG Library ────────────────────────────────────────────────────

     Search...


     Icons
    ›Home Icon Category: Icons
     User Icon Category: Icons
     Settings Icon Category: Icons

     Illustrations
     Welcome Banner Category: Illustrations
     Hero Image Category: Illustrations


     ↵ select   ↑↓ navigate   ^k actions"
  `)

  // Verify that categories and items are displayed
  expect(afterFetchSnapshot).toContain('Icons')
  expect(afterFetchSnapshot).toContain('Illustrations')
  expect(afterFetchSnapshot).toContain('Home Icon')
  expect(afterFetchSnapshot).toContain('User Icon')
  expect(afterFetchSnapshot).toContain('Settings Icon')
  expect(afterFetchSnapshot).toContain('Welcome Banner')
  expect(afterFetchSnapshot).toContain('Hero Image')

  // Test navigation
  await driver.keys.down()
  const afterDownSnapshot = await driver.text()
  expect(afterDownSnapshot).toMatchInlineSnapshot(`
    "

     SVG Library ────────────────────────────────────────────────────

     Search...


     Icons
     Home Icon Category: Icons
    ›User Icon Category: Icons
     Settings Icon Category: Icons

     Illustrations
     Welcome Banner Category: Illustrations
     Hero Image Category: Illustrations


     ↵ select   ↑↓ navigate   ^k actions"
  `)

  await driver.keys.down()
  await driver.keys.down()
  const afterThreeDownsSnapshot = await driver.text()
  expect(afterThreeDownsSnapshot).toMatchInlineSnapshot(`
    "

     SVG Library ────────────────────────────────────────────────────

     Search...


     Icons
     Home Icon Category: Icons
     User Icon Category: Icons
     Settings Icon Category: Icons

     Illustrations
    ›Welcome Banner Category: Illustrations
     Hero Image Category: Illustrations


     ↵ select   ↑↓ navigate   ^k actions"
  `)
}, 10000)
