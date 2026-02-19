// E2E tests for BarGraph vertical stacked bar chart.
// Bar segments are filled with █ chars so they show in text snapshots.

import { test, expect, afterEach, beforeEach } from 'vitest'
import { launchTerminal, Session } from 'tuistory/src'

let session: Session

beforeEach(async () => {
  session = await launchTerminal({
    command: 'bun',
    args: ['src/examples/bar-graph-weekly.tsx'],
    cols: 80,
    rows: 30,
  })
})

afterEach(() => {
  session?.close()
})

test('bar graph renders bars, labels, and legend', async () => {
  const text = await session.text({
    waitFor: (text) => {
      return text.includes('Mon') && text.includes('Sat') && text.includes('Direct')
    },
    timeout: 10000,
  })

  expect(text).toMatchInlineSnapshot(`
    "


       BarGraph Showcase ────────────────────────────────────────────────────────

       > Search...

      ›Weekly Traffic 3 channels across 6 d │                 ███
       Revenue by Region EMEA / APAC / Amer │ ███ ███         ███ ███
       Server Load CPU / Memory / IO        │ ███ ███         ███ ███
       Many Columns (20) Overflow test with │ ███ ███ ███     ███ ███
       Many Series (8) Legend overflow test │ ███ ███ ███ ███ ███ ███
       Long Labels Labels wider than bar co │ ███ ███ ███ ███ ███ ███
       Week 1 vs Week 2 Two graphs in a Row │ ███ ███ ███ ███ ███ ███
                                            │ ███ ███ ███ ███ ███ ███
                                            │ ███ ███ ███ ███ ███ ███
                                            │ Mon Tue Wed Thu Fri Sat
       ↵ open detail   ↑↓ navigate   ^k act │ ■ Direct ■ Organic ■ Referral












    "
  `)

  expect(text).toContain('Mon')
  expect(text).toContain('Sat')
  expect(text).toContain('Direct')
  expect(text).toContain('█')
}, 30000)

test('many columns (20) clips with overflow hidden', async () => {
  await session.text({ waitFor: (t) => t.includes('Many Columns'), timeout: 10000 })
  // Navigate: Weekly Traffic, Revenue, Server Load, Many Columns = 3 downs
  session.sendKey('down')
  session.sendKey('down')
  session.sendKey('down')

  const text = await session.text({
    waitFor: (t) => t.includes('›Many Columns'),
    timeout: 10000,
  })

  expect(text).toMatchInlineSnapshot(`
    "


       BarGraph Showcase ────────────────────────────────────────────────────────

       > Search...

       Weekly Traffic 3 channels across 6 d │         ███         ███ ███
       Revenue by Region EMEA / APAC / Amer │         ███         ███ ███ ███
       Server Load CPU / Memory / IO        │ ███     ███ ███     ███ ███ ███
      ›Many Columns (20) Overflow test with │ ███ ███ ███ ███ ███ ███ ███ ███ ██
       Many Series (8) Legend overflow test │ ███ ███ ███ ███ ███ ███ ███ ███ ██
       Long Labels Labels wider than bar co │ ███ ███ ███ ███ ███ ███ ███ ███ ██
       Week 1 vs Week 2 Two graphs in a Row │ ███ ███ ███ ███ ███ ███ ███ ███ ██
                                            │ ███ ███ ███ ███ ███ ███ ███ ███ ██
                                            │ ███ ███ ███ ███ ███ ███ ███ ███ ██
                                            │ D1  D2  D3  D4  D5  D6  D7  D8  D9
       ↑↓ navigate   ^k actions             │ ■ A ■ B












    "
  `)

  // Some labels visible, overflow clips the rest
  expect(text).toContain('D1')
  expect(text).toContain('█')
}, 30000)

test('many series (8) legend clips on one line', async () => {
  await session.text({ waitFor: (t) => t.includes('Many Series'), timeout: 10000 })
  // Navigate: Weekly, Revenue, Server, Many Columns, Many Series = 4 downs
  session.sendKey('down')
  session.sendKey('down')
  session.sendKey('down')
  session.sendKey('down')

  const text = await session.text({
    waitFor: (t) => t.includes('›Many Series'),
    timeout: 10000,
  })

  expect(text).toMatchInlineSnapshot(`
    "


       BarGraph Showcase ────────────────────────────────────────────────────────

       > Search...

       Weekly Traffic 3 channels across 6 d │ ███ ███ ███     ███ ███
       Revenue by Region EMEA / APAC / Amer │ ███ ███ ███ ███ ███ ███
       Server Load CPU / Memory / IO        │ ███ ███ ███ ███ ███ ███
       Many Columns (20) Overflow test with │ ███ ███ ███ ███ ███ ███
      ›Many Series (8) Legend overflow test │ ███ ███ ███ ███ ███ ███
       Long Labels Labels wider than bar co │ ███ ███ ███ ███ ███ ███
       Week 1 vs Week 2 Two graphs in a Row │ ███ ███ ███ ███ ███ ███
                                            │ ███ ███ ███ ███ ███ ███
                                            │ ███ ███ ███ ███ ███ ███
                                            │ Mon Tue Wed Thu Fri Sat
       ↑↓ navigate   ^k actions             │ ■ Series 1 ■ Series 2 ■ Series 3 ■












    "
  `)

  // First series visible in legend
  expect(text).toContain('Series 1')
  expect(text).toContain('█')
}, 30000)

test('long labels truncated by overflow hidden', async () => {
  await session.text({ waitFor: (t) => t.includes('Long Labels'), timeout: 10000 })
  // Navigate: Weekly, Revenue, Server, Many Columns, Many Series, Long Labels = 5 downs
  session.sendKey('down')
  session.sendKey('down')
  session.sendKey('down')
  session.sendKey('down')
  session.sendKey('down')

  const text = await session.text({
    waitFor: (t) => t.includes('›Long Labels'),
    timeout: 10000,
  })

  expect(text).toMatchInlineSnapshot(`
    "


       BarGraph Showcase ────────────────────────────────────────────────────────

       > Search...

       Weekly Traffic 3 channels across 6 d │                 ███
       Revenue by Region EMEA / APAC / Amer │ ███             ███ ███
       Server Load CPU / Memory / IO        │ ███ ███         ███ ███
       Many Columns (20) Overflow test with │ ███ ███         ███ ███
       Many Series (8) Legend overflow test │ ███ ███ ███     ███ ███
      ›Long Labels Labels wider than bar co │ ███ ███ ███ ███ ███ ███
       Week 1 vs Week 2 Two graphs in a Row │ ███ ███ ███ ███ ███ ███
                                            │ ███ ███ ███ ███ ███ ███
                                            │ ███ ███ ███ ███ ███ ███
                                            │ Mon Tue Wed Thu Fri Sat
       ↑↓ navigate   ^k actions             │ ■ Views ■ Clicks












    "
  `)

  expect(text).toContain('Long Labels')
  expect(text).toContain('█')
}, 30000)

test('side-by-side bar graphs in a Row', async () => {
  await session.text({ waitFor: (t) => t.includes('Week 1'), timeout: 10000 })
  // Navigate: Weekly, Revenue, Server, Many Columns, Many Series, Long Labels, Side-by-side = 6 downs
  session.sendKey('down')
  session.sendKey('down')
  session.sendKey('down')
  session.sendKey('down')
  session.sendKey('down')
  session.sendKey('down')

  const text = await session.text({
    waitFor: (t) => t.includes('›Week 1 vs Week 2'),
    timeout: 10000,
  })

  expect(text).toMatchInlineSnapshot(`
    "


       BarGraph Showcase ────────────────────────────────────────────────────────

       > Search...

       Weekly Traffic 3 channels across 6 d │                 █
       Revenue by Region EMEA / APAC / Amer │ ███ ███         █ ███
       Server Load CPU / Memory / IO        │ ███ ███         █ ███ ███
       Many Columns (20) Overflow test with │ ███ ███ ███     █ ███ ███ ███ ███
       Many Series (8) Legend overflow test │ ███ ███ ███ ███ █ ███ ███ ███ ███
       Long Labels Labels wider than bar co │ ███ ███ ███ ███ █ ███ ███ ███ ███
      ›Week 1 vs Week 2 Two graphs in a Row │ ███ ███ ███ ███ █ ███ ███ ███ ███
                                            │ ███ ███ ███ ███ █ ███ ███ ███ ███
                                            │ ███ ███ ███ ███ █ ███ ███ ███ ███
                                            │ Mon Tue Wed Thu F Mon Tue Wed Thu
       ↵ open detail   ↑↓ navigate   ^k act │ ■ Direct ■ Organi ■ Direct ■ Organ












    "
  `)

  expect(text).toContain('Mon')
}, 30000)
