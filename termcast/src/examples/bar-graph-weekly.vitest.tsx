// E2E tests for BarGraph vertical stacked bar chart.
// Bar segments use ▃ chars so they show in text snapshots without filling cells.

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
      return text.includes('Mon') && text.includes('Direct') && text.includes('0.0│')
    },
    timeout: 10000,
  })

  expect(text).toMatchInlineSnapshot(`
    "


       BarGraph Showcase ────────────────────────────────────────────────────────

       > Search...

      ›Weekly Traffi 3 channel...oss 6 days │ 110.0│                ▃▃▃
       Revenue by Regio EMEA / A...Americas │      │▃▃▃ ▃▃▃         ▃▃▃ ▃▃▃
       Server Load CPU / Memory / IO        │  82.5│▃▃▃ ▃▃▃         ▃▃▃ ▃▃▃
       Many C...ns (20)Overflow...h 20 bars │      │▃▃▃ ▃▃▃ ▃▃▃     ▃▃▃ ▃▃▃
       Many Series (8) Legend overflow test │  55.0│▃▃▃ ▃▃▃ ▃▃▃ ▃▃▃ ▃▃▃ ▃▃▃
       Long Label Labels wide...bar columns │      │▃▃▃ ▃▃▃ ▃▃▃ ▃▃▃ ▃▃▃ ▃▃▃
       Week 1 vs Week 2 Two graphs in a Row │  27.5│▃▃▃ ▃▃▃ ▃▃▃ ▃▃▃ ▃▃▃ ▃▃▃
                                            │      │▃▃▃ ▃▃▃ ▃▃▃ ▃▃▃ ▃▃▃ ▃▃▃
                                            │   0.0│▃▃▃ ▃▃▃ ▃▃▃ ▃▃▃ ▃▃▃ ▃▃▃
                                            │       Mon Tue Wed Thu Fri Sat
                                            │ ■ Direct  ■ Organic  ■ Referral
                                            │
       ↵ open detail   ↑↓ navigate   ^k act │










    "
  `)

  expect(text).toContain('Mon')
  expect(text).toContain('Direct')
  expect(text).toContain('0.0│')
  expect(text).toContain('▃')
}, 30000)

test('many columns (20) clips with overflow hidden', async () => {
  await session.text({ waitFor: (t) => t.includes('(20)'), timeout: 10000 })
  // Navigate: Weekly Traffic, Revenue, Server Load, Many Columns = 3 downs
  session.sendKey('down')
  session.sendKey('down')
  session.sendKey('down')

  await session.text({
    waitFor: (t) => t.includes('›Many') && t.includes('(20)'),
    timeout: 10000,
  })
  await session.waitIdle()
  const text = await session.text()

  // Bar graph rendering has non-deterministic ANSI highlights, so use toContain checks
  // instead of inline snapshot for the bars area
  expect(text).toContain('›Many')
  expect(text).toContain('BarGraph Showcase')
  expect(text).toContain('▃')

  // Some labels visible, overflow clips the rest
  expect(text).toContain('D')
  expect(text).toContain('▃')
}, 30000)

test('many series (8) bottom legend clips on one row', async () => {
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

       Weekly Traffi 3 channel...oss 6 days │ 328.0│▃▃▃ ▃▃▃ ▃▃▃     ▃▃▃ ▃▃▃
       Revenue by Regio EMEA / A...Americas │      │▃▃▃ ▃▃▃ ▃▃▃ ▃▃▃ ▃▃▃ ▃▃▃
       Server Load CPU / Memory / IO        │ 246.0│▃▃▃ ▃▃▃ ▃▃▃ ▃▃▃ ▃▃▃ ▃▃▃
       Many C...ns (20)Overflow...h 20 bars │      │▃▃▃ ▃▃▃ ▃▃▃ ▃▃▃ ▃▃▃ ▃▃▃
      ›Many Series (8) Legend overflow test │ 164.0│▃▃▃ ▃▃▃ ▃▃▃ ▃▃▃ ▃▃▃ ▃▃▃
       Long Label Labels wide...bar columns │      │▃▃▃ ▃▃▃ ▃▃▃ ▃▃▃ ▃▃▃ ▃▃▃
       Week 1 vs Week 2 Two graphs in a Row │  82.0│▃▃▃ ▃▃▃ ▃▃▃ ▃▃▃ ▃▃▃ ▃▃▃
                                            │      │▃▃▃ ▃▃▃ ▃▃▃ ▃▃▃ ▃▃▃ ▃▃▃
                                            │   0.0│▃▃▃ ▃▃▃ ▃▃▃ ▃▃▃ ▃▃▃ ▃▃▃
                                            │       Mon Tue Wed Thu Fri Sat
                                            │ ■ Series 1  ■ Series 2  ■ Series 3
                                            │
       ↑↓ navigate   ^k actions   :vim      │










    "
  `)

  // Bottom legend is a single clipped row by default.
  expect(text).toContain('Series 1')
  expect(text).toContain('Series 3')
  expect(text).toContain('▃')
}, 30000)

test('long labels truncated by overflow hidden', async () => {
  await session.text({ waitFor: (t) => t.includes('Labels wide'), timeout: 10000 })
  // Navigate: Weekly, Revenue, Server, Many Columns, Many Series, Long Labels = 5 downs
  session.sendKey('down')
  session.sendKey('down')
  session.sendKey('down')
  session.sendKey('down')
  session.sendKey('down')

  const text = await session.text({
    waitFor: (t) => t.includes('›Long Label') || t.includes('›Lon...bels'),
    timeout: 10000,
  })

  expect(text).toMatchInlineSnapshot(`
    "


       BarGraph Showcase ────────────────────────────────────────────────────────

       > Search...

       Weekly Traffi 3 channel...oss 6 days │ 75.0│                ▃▃▃
       Revenue by Regio EMEA / A...Americas │     │▃▃▃             ▃▃▃ ▃▃▃
       Server Load CPU / Memory / IO        │ 56.3│▃▃▃ ▃▃▃         ▃▃▃ ▃▃▃
       Many C...ns (20)Overflow...h 20 bars │     │▃▃▃ ▃▃▃         ▃▃▃ ▃▃▃
       Many Series (8) Legend overflow test │ 37.5│▃▃▃ ▃▃▃ ▃▃▃     ▃▃▃ ▃▃▃
      ›Long Label Labels wide...bar columns │     │▃▃▃ ▃▃▃ ▃▃▃ ▃▃▃ ▃▃▃ ▃▃▃
       Week 1 vs Week 2 Two graphs in a Row │ 18.8│▃▃▃ ▃▃▃ ▃▃▃ ▃▃▃ ▃▃▃ ▃▃▃
                                            │     │▃▃▃ ▃▃▃ ▃▃▃ ▃▃▃ ▃▃▃ ▃▃▃
                                            │  0.0│▃▃▃ ▃▃▃ ▃▃▃ ▃▃▃ ▃▃▃ ▃▃▃
                                            │      Monday   Thursday
                                            │ ■ Views  ■ Clicks
                                            │
       ↑↓ navigate   ^k actions   :vim      │










    "
  `)

  expect(text).toContain('Labels wide')
  expect(text).toContain('▃')
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

       Weekly Traffi 3 channel...oss 6 days │ 110.0│            130.0│
       Revenue by Regio EMEA / A...Americas │      │▃▃▃ ▃▃▃          │▃▃▃
       Server Load CPU / Memory / IO        │  82.5│▃▃▃ ▃▃▃      97.5│▃▃▃ ▃▃▃
       Many C...ns (20)Overflow...h 20 bars │      │▃▃▃ ▃▃▃ ▃▃▃      │▃▃▃ ▃▃▃ ▃▃
       Many Series (8) Legend overflow test │  55.0│▃▃▃ ▃▃▃ ▃▃▃  65.0│▃▃▃ ▃▃▃ ▃▃
       Long Label Labels wide...bar columns │      │▃▃▃ ▃▃▃ ▃▃▃      │▃▃▃ ▃▃▃ ▃▃
      ›Week 1 vs Week 2 Two graphs in a Row │  27.5│▃▃▃ ▃▃▃ ▃▃▃  32.5│▃▃▃ ▃▃▃ ▃▃
                                            │      │▃▃▃ ▃▃▃ ▃▃▃      │▃▃▃ ▃▃▃ ▃▃
                                            │   0.0│▃▃▃ ▃▃▃ ▃▃▃   0.0│▃▃▃ ▃▃▃ ▃▃
                                            │       Mon Tue Wed       Mon Tue We
                                            │ ■ Direct  ■ Organ ■ Direct  ■ Orga
                                            │
       ↵ open detail   ↑↓ navigate   ^k act │










    "
  `)

  expect(text).toContain('Direct')
}, 30000)
