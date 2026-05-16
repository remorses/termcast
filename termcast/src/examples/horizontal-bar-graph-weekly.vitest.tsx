// E2E tests for HorizontalBarGraph stacked horizontal rows and right-side legend.

import { afterEach, beforeEach, expect, test } from 'vitest'
import { launchTerminal, Session } from 'tuistory/src'

let session: Session

beforeEach(async () => {
  session = await launchTerminal({
    command: 'bun',
    args: ['src/examples/horizontal-bar-graph-weekly.tsx'],
    cols: 90,
    rows: 30,
  })
})

afterEach(() => {
  session?.close()
})

test('renders horizontal stacked rows and compact legend', async () => {
  const text = await session.text({
    waitFor: (content) => {
      return content.includes('Mon') && content.includes('Direct') && content.includes('%')
    },
    timeout: 10000,
  })

  expect(text).toMatchInlineSnapshot(`
    "


       HorizontalBarGraph Showcase ────────────────────────────────────────────────────────

       > Search...

      ›Weekly Traffic Direct / Organic / Referra │ category  distribution  legend
       Revenue by Region Americas / EMEA / APAC  │ ──────────────────────  ───────────────
       Long Labels The left label column truncat │ Mon    ╻╻╻╻╻╻╻╻╻╻╻╻     ● Direct    42%
       Many Series Legend grows only as wide as  │ Tue    ╻╻╻╻╻╻╻╻╻╻╻╻     ● Organic   35%
                                                 │ Wed    ╻╻╻╻╻╻╻          ● Referral  23%
                                                 │ Thu    ╻╻╻╻╻╻
                                                 │ Fri    ╻╻╻╻╻╻╻╻╻╻╻╻╻╻╻
                                                 │ Sat    ╻╻╻╻╻╻╻╻╻╻╻╻
       ↵ open detail   ↑↓ navigate   ^k actions  │














    "
  `)
  expect(text).toContain('Mon')
  expect(text).toContain('Direct')
  expect(text).toContain('╻')
}, 30000)

test('long labels truncate and leave legend visible', async () => {
  await session.text({ waitFor: (content) => content.includes('Long Labels'), timeout: 10000 })
  session.sendKey('down')
  session.sendKey('down')

  const text = await session.text({
    waitFor: (content) => {
      return content.includes('›Long Labels') && content.includes('Views')
    },
    timeout: 10000,
  })

  expect(text).toMatchInlineSnapshot(`
    "


       HorizontalBarGraph Showcase ────────────────────────────────────────────────────────

       > Search...

       Weekly Traffic Direct / Organic / Referra │ category          distri  legend
       Revenue by Region Americas / EMEA / APAC  │ ────────────────────────  ─────────────
      ›Long Labels The left label column truncat │ Monday            ╻╻╻╻╻   ● Views   65%
       Many Series Legend grows only as wide as  │ Tuesday           ╻╻╻╻    ● Clicks  35%
                                                 │ Wednesday         ╻╻╻
                                                 │ Thursday          ╻╻
                                                 │ Friday            ╻╻╻╻╻╻
                                                 │ Saturday & Sund…  ╻╻╻╻╻
       ↵ open detail   ↑↓ navigate   ^k actions  │














    "
  `)
  expect(text).toContain('Saturday')
  expect(text).toContain('Views')
}, 30000)

test('many series keeps bars readable and clips legend vertically', async () => {
  await session.text({ waitFor: (content) => content.includes('Many Series'), timeout: 10000 })
  session.sendKey('down')
  session.sendKey('down')
  session.sendKey('down')

  const text = await session.text({
    waitFor: (content) => {
      return content.includes('›Many Series') && content.includes('Series 8')
    },
    timeout: 10000,
  })

  expect(text).toMatchInlineSnapshot(`
    "


       HorizontalBarGraph Showcase ────────────────────────────────────────────────────────

       > Search...

       Weekly Traffic Direct / Organic / Referra │ category  distribution  legend
       Revenue by Region Americas / EMEA / APAC  │ ──────────────────────  ───────────────
       Long Labels The left label column truncat │ Mon    ╻╻╻╻╻╻╻╻╻╻       ● Series 8  20%
      ›Many Series Legend grows only as wide as  │ Tue    ╻╻╻╻╻╻╻╻╻        ● Series 7  18%
                                                 │ Wed    ╻╻╻╻╻╻╻╻         ● Series 6  16%
                                                 │ Thu    ╻╻╻╻╻╻╻          ● Series 5  14%
                                                 │ Fri    ╻╻╻╻╻╻╻╻╻╻╻╻╻╻╻  ● Series 4  11%
                                                 │ Sat    ╻╻╻╻╻╻╻╻╻╻╻      ● Series 3   9%
       ↵ open detail   ↑↓ navigate   ^k actions  │














    "
  `)
  expect(text).toContain('Series 8')
  expect(text).toContain('╻')
}, 30000)
