import { test, expect, afterEach, beforeEach } from 'vitest'
import { launchTerminal, Session } from 'tuistory/src'

let session: Session

beforeEach(async () => {
  session = await launchTerminal({
    command: 'bun',
    args: ['src/examples/list-scrollbox.tsx'],
    cols: 50,
    rows: 12,
  })
})

afterEach(() => {
  session?.close()
})

test('list scrollbox auto-scrolls when navigating down', async () => {
  await session.text({
    waitFor: (text) => {
      return /Item 1/i.test(text)
    },
  })

  const initialSnapshot = await session.text()
  expect(initialSnapshot).toMatchInlineSnapshot(`
    "


     Scrollbox Test ─────────────────────────────

     Search items...

    ›▲ Item 1 Description for item 1             ▲
     ■ Item 2 Description for item 2             ▼


       ↑↓ navigate  ^k actions"
  `)

  await session.press('down')
  await session.press('down')
  await session.press('down')
  await session.press('down')
  await session.press('down')

  const afterFiveDownsSnapshot = await session.text()
  expect(afterFiveDownsSnapshot).toMatchInlineSnapshot(`
    "


     Scrollbox Test ─────────────────────────────

     Search items...

     ▼ Item 5 Description for item 5             ▲
    ›● Item 6 Description for item 6             ▼


       ↑↓ navigate  ^k actions"
  `)

  await session.press('down')
  await session.press('down')
  await session.press('down')

  const afterEightDownsSnapshot = await session.text()
  expect(afterEightDownsSnapshot).toMatchInlineSnapshot(`
    "


     Scrollbox Test ─────────────────────────────

     Search items...

     ■ Item 8 Description for item 8             ▲
    ›■ Item 9 Description for item 9             ▼


       ↑↓ navigate  ^k actions"
  `)

  await session.press('up')
  await session.press('up')
  await session.press('up')
  await session.press('up')
  await session.press('up')
  await session.press('up')
  await session.press('up')

  const afterScrollBackUpSnapshot = await session.text()
  expect(afterScrollBackUpSnapshot).toMatchInlineSnapshot(`
    "


     Scrollbox Test ─────────────────────────────

     Search items...

     ▲ Item 1 Description for item 1             ▲
    ›■ Item 2 Description for item 2             ▼


       ↑↓ navigate  ^k actions"
  `)
}, 15000)

test('list scrollbox scrolls with mouse wheel', async () => {
  await session.text({
    waitFor: (text) => {
      return /Item 1/i.test(text)
    },
  })

  const initialSnapshot = await session.text()
  expect(initialSnapshot).toMatchInlineSnapshot(`
    "


     Scrollbox Test ─────────────────────────────

     Search items...

    ›▲ Item 1 Description for item 1             ▲
     ■ Item 2 Description for item 2             ▼


       ↑↓ navigate  ^k actions"
  `)

  await session.scrollDown(3)

  const afterScrollDownSnapshot = await session.text()
  expect(afterScrollDownSnapshot).not.toEqual(initialSnapshot)
  expect(afterScrollDownSnapshot).toMatchInlineSnapshot(`
    "


    Scrollbox Test ─────────────────────────────

    Search items...

    ■ Item 2 Description for item 2             ▲
    ▲ Item 3 Description for item 3             ▼


      ↑↓ navigate  ^k actions"
  `)

  await session.scrollUp(2)

  const afterScrollUpSnapshot = await session.text()
  expect(afterScrollUpSnapshot).not.toEqual(afterScrollDownSnapshot)
  expect(afterScrollUpSnapshot).toMatchInlineSnapshot(`
    "


     Scrollbox Test ─────────────────────────────

     Search items...

    ›▲ Item 1 Description for item 1             ▲
     ■ Item 2 Description for item 2             ▼


       ↑↓ navigate  ^k actions"
  `)
}, 15000)
