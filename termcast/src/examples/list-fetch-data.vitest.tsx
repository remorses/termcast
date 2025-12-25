import { test, expect, beforeEach, afterEach } from 'vitest'
import { launchTerminal, Session } from 'tuistory/src'

let session: Session

beforeEach(async () => {
  session = await launchTerminal({
    command: 'bun',
    args: ['src/examples/list-fetch-data.tsx'],
    cols: 70,
    rows: 25,
  })
})

afterEach(() => {
  session?.close()
})

test('list shows initial items after fetch', async () => {
  await session.text({
    waitFor: (text) => {
      return /SVG Library/i.test(text)
    },
  })

  const afterFetchSnapshot = await session.text({
    waitFor: (text) => {
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



                               No items found




       ↑↓ navigate    ^k actions

    "
  `)



  await session.press('down')
  const afterDownSnapshot = await session.text()
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



                               No items found




       ↑↓ navigate    ^k actions

    "
  `)

  await session.press('down')
  await session.press('down')
  const afterThreeDownsSnapshot = await session.text()
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



                               No items found




       ↑↓ navigate    ^k actions

    "
  `)
}, 10000)
