import { test, expect, afterEach, beforeEach } from 'vitest'
import { launchTerminal, Session } from 'tuistory/src'

let session: Session

beforeEach(async () => {
  session = await launchTerminal({
    command: 'bun',
    args: ['src/examples/list-item-accessories.tsx'],
    cols: 80,
    rows: 25,
  })
})

afterEach(() => {
  session?.close()
})

test('shows all inline item features: icon, title, subtitle, text/tag/date accessories', async () => {
  await session.text({
    waitFor: (text) => {
      return /Title Only/.test(text)
    },
  })

  const snapshot = await session.text()
  expect(snapshot).toMatchInlineSnapshot(`
    "


       List Item Accessories ────────────────────────────────────────────────────

       > Search...

      ›Title Only
       With Subtitle a subtitle
       ★ With Icon
       ▷ Icon and Subtitle description
       Text Accessory                                                        info
       Colored Text                                                        orange
       Tag Accessory                                                       [beta]
       Colored Tag                                                           [v2]
       Date Accessory                                                          1d
       Colored Date                                                            1w
       ⊤ Multiple Accessories all types                             note [new] 1d
       ● All Colored                                                red [blue] 1w


       ↑↓ navigate   ^k actions                           powered by termcast.app



    "
  `)

  // title-only item
  expect(snapshot).toContain('Title Only')
  // subtitle
  expect(snapshot).toContain('a subtitle')
  // text accessory
  expect(snapshot).toContain('info')
  // tag accessory renders in brackets
  expect(snapshot).toContain('[beta]')
  // colored tag
  expect(snapshot).toContain('[v2]')
  // date accessory renders relative time
  expect(snapshot).toContain('1d')
  // multiple accessories on one row
  expect(snapshot).toContain('note')
  expect(snapshot).toContain('[new]')
}, 15000)

test('navigation through all item types', async () => {
  await session.text({
    waitFor: (text) => {
      return /Title Only/.test(text)
    },
  })

  // Navigate to "With Icon" (3rd item)
  await session.press('down')
  await session.press('down')

  const afterNav = await session.text()
  expect(afterNav).toMatchInlineSnapshot(`
    "


       List Item Accessories ────────────────────────────────────────────────────

       > Search...

       Title Only
       With Subtitle a subtitle
      ›★ With Icon
       ▷ Icon and Subtitle description
       Text Accessory                                                        info
       Colored Text                                                        orange
       Tag Accessory                                                       [beta]
       Colored Tag                                                           [v2]
       Date Accessory                                                          1d
       Colored Date                                                            1w
       ⊤ Multiple Accessories all types                             note [new] 1d
       ● All Colored                                                red [blue] 1w


       ↑↓ navigate   ^k actions                           powered by termcast.app



    "
  `)
  // Icon item should be selected
  expect(afterNav).toContain('›')
}, 15000)
