import { test, expect, afterEach, beforeEach } from 'vitest'
import { launchTerminal, Session } from 'tuistory/src'

let session: Session

beforeEach(async () => {
  session = await launchTerminal({
    command: 'bun',
    args: ['src/examples/graph-bar-chart.tsx'],
    cols: 100,
    rows: 30,
  })
})

afterEach(() => {
  session?.close()
})

test('initial render shows bar chart for Monthly Budget', async () => {
  const text = await session.text({
    waitFor: (text) => {
      return text.includes('Monthly Budget') && text.includes('Spent')
    },
    timeout: 10000,
  })

  expect(text).toMatchInlineSnapshot(`
    "


       BarChart Showcase ────────────────────────────────────────────────────────────────────────────

       > Search...

      ›Monthly Budget Spent / Remaining / Savings     │ ┌Spent: 78.6%┐
       Disk Usage System / Apps / Media / Free        │
       Investment Portfolio Stocks / Bonds / Cash / C │
       CPU Time User / System / IO Wait / Idle        │ ───────────────────────────────────────────
       Revenue by Product 6 product lines             │
       A/B Test Split Control vs Variant (50/50)      │ Total: $6,174
       Storage Full 100% used                         │
       Market Share One dominant + many tiny players  │ Spent: 78.6%
       Equal Distribution 10 equal segments           │
       Custom Colors Explicit color per segment       │ Saved: 10.0%
       Needs vs Wants 50/30/20 budget rule            │
       Stress Test (20 items) Many small equal segmen │
                                                      │
                                                      │
                                                      │
                                                      │
                                                      │
                                                      │
                                                      │
                                                      │
                                                      │
       ↵ open detail   ↑↓ navigate   ^k actions       │

    "
  `)
  expect(text).toContain('Monthly Budget')
  expect(text).toContain('Spent')
}, 30000)

test('navigate to Market Share - dominant + tiny segments', async () => {
  await session.text({
    waitFor: (text) => {
      return text.includes('Monthly Budget')
    },
    timeout: 10000,
  })

  // Navigate to "Market Share" (8th item, 7 presses down)
  for (let i = 0; i < 7; i++) {
    await session.press('down')
  }

  const text = await session.text({
    waitFor: (text) => {
      return text.includes('›Market Share')
    },
    timeout: 5000,
  })

  expect(text).toMatchInlineSnapshot(`
    "


       BarChart Showcase ────────────────────────────────────────────────────────────────────────────

       > Search...

       Monthly Budget Spent / Remaining / Savings     │ ┌Leader: 85.0%┐
       Disk Usage System / Apps / Media / Free        │
       Investment Portfolio Stocks / Bonds / Cash / C │
       CPU Time User / System / IO Wait / Idle        │ ────────────────────────────────────────────
       Revenue by Product 6 product lines             │
       A/B Test Split Control vs Variant (50/50)      │ HHI:      7,264 (monopoly)
       Storage Full 100% used                         │
      ›Market Share One dominant + many tiny players  │ Segments: 14 total
       Equal Distribution 10 equal segments           │
       Custom Colors Explicit color per segment       │ Visible:  Tiny ones hidden
       Needs vs Wants 50/30/20 budget rule            │
       Stress Test (20 items) Many small equal segmen │
                                                      │
                                                      │
       ↵ open detail   ↑↓ navigate   ^k actions       │








    "
  `)
  expect(text).toContain('Market Share')
}, 30000)

test('navigate to Equal Distribution - 10 segments', async () => {
  await session.text({
    waitFor: (text) => {
      return text.includes('Monthly Budget')
    },
    timeout: 10000,
  })

  // Navigate to "Equal Distribution" (9th item)
  for (let i = 0; i < 8; i++) {
    await session.press('down')
  }

  const text = await session.text({
    waitFor: (text) => {
      return text.includes('›Equal Distribution')
    },
    timeout: 5000,
  })

  expect(text).toMatchInlineSnapshot(`
    "


       BarChart Showcase ────────────────────────────────────────────────────────────────────────────

       > Search...

       Monthly Budget Spent / Remaining / Savings     │
       Disk Usage System / Apps / Media / Free        │
       Investment Portfolio Stocks / Bonds / Cash / C │ ────────────────────────────────────────────
       CPU Time User / System / IO Wait / Idle        │
       Revenue by Product 6 product lines             │ Segments: 10
       A/B Test Split Control vs Variant (50/50)      │
       Storage Full 100% used                         │ Each:     10%
       Market Share One dominant + many tiny players  │
      ›Equal Distribution 10 equal segments           │
       Custom Colors Explicit color per segment       │
       Needs vs Wants 50/30/20 budget rule            │
       Stress Test (20 items) Many small equal segmen │
                                                      │
                                                      │
       ↵ open detail   ↑↓ navigate   ^k actions       │








    "
  `)
  expect(text).toContain('Equal Distribution')
}, 30000)

test('navigate to Stress Test - 20 segments', async () => {
  await session.text({
    waitFor: (text) => {
      return text.includes('Monthly Budget')
    },
    timeout: 10000,
  })

  // Navigate to "Stress Test" (12th item, index 11)
  for (let i = 0; i < 11; i++) {
    await session.press('down')
  }

  const text = await session.text({
    waitFor: (text) => {
      return text.includes('›Stress Test')
    },
    timeout: 5000,
  })

  expect(text).toMatchInlineSnapshot(`
    "


       BarChart Showcase ────────────────────────────────────────────────────────────────────────────

       > Search...

       Monthly Budget Spent / Remaining / Savings     │
       Disk Usage System / Apps / Media / Free        │
       Investment Portfolio Stocks / Bonds / Cash / C │ ────────────────────────────────────────────
       CPU Time User / System / IO Wait / Idle        │
       Revenue by Product 6 product lines             │ Segments: 20
       A/B Test Split Control vs Variant (50/50)      │
       Storage Full 100% used                         │ Colors:   7 (cycling)
       Market Share One dominant + many tiny players  │
       Equal Distribution 10 equal segments           │
       Custom Colors Explicit color per segment       │
       Needs vs Wants 50/30/20 budget rule            │
      ›Stress Test (20 items) Many small equal segmen │
                                                      │
                                                      │
       ↵ open detail   ↑↓ navigate   ^k actions       │








    "
  `)
  expect(text).toContain('Stress Test')
}, 30000)

test('enter pushes full detail view with bar chart', async () => {
  await session.text({
    waitFor: (text) => {
      return text.includes('Monthly Budget')
    },
    timeout: 10000,
  })

  await session.press('return')

  const text = await session.text({
    waitFor: (text) => {
      return text.includes('Monthly Budget') && text.includes('Segments:')
    },
    timeout: 5000,
  })

  expect(text).toMatchInlineSnapshot(`
    "


                                                                                                     █
                                                                                                     █
      Monthly Budget                                                                                 █
                                                                                                     ▀
      Spent / Remaining / Savings

      Monthly Budget

      Budget allocation for the current month.

      - Spent: $4,850 (78.6%)
      - Remaining: $707 (11.5%)
      - Savings: $617 (10.0%)


      Segments: 3
      Total: 6,174

      ┌Spent: 78.6%┐


      ────────────────────────────────────────────────────────────────────────────────────────────



      esc go back   ^k actions   ↵ Go Back                                     powered by termcast.app

    "
  `)
  expect(text).toContain('Monthly Budget')
}, 30000)
