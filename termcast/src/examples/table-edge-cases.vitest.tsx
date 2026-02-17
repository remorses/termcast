// E2E tests for table edge cases: inline formatting, single column/row,
// empty cells, wide tables, various column counts, and numeric data.

import { test, expect, afterEach, beforeEach } from 'vitest'
import { launchTerminal, Session } from 'tuistory/src'

let session: Session

beforeEach(async () => {
  session = await launchTerminal({
    command: 'bun',
    args: ['src/examples/table-edge-cases.tsx'],
    cols: 80,
    rows: 80,
  })
})

afterEach(() => {
  session?.close()
})

test('inline formatting table renders all rows', async () => {
  const text = await session.text({
    waitFor: (text) => {
      return text.includes('Inline Formatting') && text.includes('bold text') && text.includes('combined')
    },
    timeout: 10000,
  })

  expect(text).toMatchInlineSnapshot(`
    "




      Table Edge Cases

      Inline Formatting

      Feature  Syntax           Result
      Bold     text             bold text
      Italic   text             italic text
      Code     code             inline code
      Link     docs             clickable link
      Mixed    bold and italic  combined

      Single Column

      Name
      Alice
      Bob
      Charlie

      Single Row

      A  B  C  D  E
      1  2  3  4  5

      Empty Cells

      Key   Value      Notes
      host  localhost
            8080       default port
      ssl              not configured

      Wide Table

      ID  Name           Email              Role      Department   Location
      1   Alice Johnson  alice@example.com  Engineer  Engineering  SF
      2   Bob Smith      bob@example.com    Designer  Design       NYC

      Two Columns

      Key      Value
      version  2.1.0
      license  MIT
      author   termcast

      Numeric Data

      Metric   Q1    Q2    Q3    Q4
      Revenue  100   150   200   250
      Users    1000  1500  2000  3000
      Churn    5%    4%    3%    2%

      Done.


      esc go back                                          powered by termcast.app





















    "
  `)

  // All formatting rows present
  expect(text).toContain('bold text')
  expect(text).toContain('italic text')
  expect(text).toContain('inline code')
  expect(text).toContain('clickable link')
  expect(text).toContain('combined')
  // Headers
  expect(text).toContain('Feature')
  expect(text).toContain('Syntax')
  expect(text).toContain('Result')
}, 30000)

test('single column table', async () => {
  const text = await session.text({
    waitFor: (text) => text.includes('Single Column') && text.includes('Charlie'),
    timeout: 10000,
  })

  expect(text).toContain('Alice')
  expect(text).toContain('Bob')
  expect(text).toContain('Charlie')
}, 30000)

test('single row table', async () => {
  const text = await session.text({
    waitFor: (text) => text.includes('Single Row'),
    timeout: 10000,
  })

  // 5 columns with single data row
  expect(text).toContain('A')
  expect(text).toContain('B')
  expect(text).toContain('C')
  expect(text).toContain('D')
  expect(text).toContain('E')
}, 30000)

test('empty cells do not break layout', async () => {
  const text = await session.text({
    waitFor: (text) => text.includes('Empty Cells') && text.includes('not configured'),
    timeout: 10000,
  })

  expect(text).toContain('localhost')
  expect(text).toContain('default port')
  expect(text).toContain('not configured')
}, 30000)

test('wide table with 6 columns fits within terminal', async () => {
  const text = await session.text({
    waitFor: (text) => text.includes('Wide Table') && text.includes('Engineer'),
    timeout: 10000,
  })

  // Headers
  expect(text).toContain('ID')
  expect(text).toContain('Name')
  expect(text).toContain('Email')
  expect(text).toContain('Role')
  // Data - some fields may be truncated at 80 cols with 6 equal-width columns
  expect(text).toContain('Alice Johnso')
  expect(text).toContain('Bob Smith')
  expect(text).toContain('Engineer')
  expect(text).toContain('Designer')
}, 30000)

test('two column key-value table', async () => {
  const text = await session.text({
    waitFor: (text) => text.includes('Two Columns') && text.includes('2.1.0'),
    timeout: 10000,
  })

  expect(text).toContain('version')
  expect(text).toContain('2.1.0')
  expect(text).toContain('license')
  expect(text).toContain('MIT')
  expect(text).toContain('author')
  expect(text).toContain('termcast')
}, 30000)

test('numeric data table', async () => {
  const text = await session.text({
    waitFor: (text) => text.includes('Numeric Data') && text.includes('Revenue'),
    timeout: 10000,
  })

  expect(text).toContain('Revenue')
  expect(text).toContain('Users')
  expect(text).toContain('Churn')
  expect(text).toContain('250')
  expect(text).toContain('3000')
  expect(text).toContain('2%')
}, 30000)

test('all tables render without crash - full page snapshot', async () => {
  const text = await session.text({
    waitFor: (text) => text.includes('Done.'),
    timeout: 10000,
  })

  expect(text).toMatchInlineSnapshot(`
    "




      Table Edge Cases

      Inline Formatting

      Feature  Syntax           Result
      Bold     text             bold text
      Italic   text             italic text
      Code     code             inline code
      Link     docs             clickable link
      Mixed    bold and italic  combined

      Single Column

      Name
      Alice
      Bob
      Charlie

      Single Row

      A  B  C  D  E
      1  2  3  4  5

      Empty Cells

      Key   Value      Notes
      host  localhost
            8080       default port
      ssl              not configured

      Wide Table

      ID  Name           Email              Role      Department   Location
      1   Alice Johnson  alice@example.com  Engineer  Engineering  SF
      2   Bob Smith      bob@example.com    Designer  Design       NYC

      Two Columns

      Key      Value
      version  2.1.0
      license  MIT
      author   termcast

      Numeric Data

      Metric   Q1    Q2    Q3    Q4
      Revenue  100   150   200   250
      Users    1000  1500  2000  3000
      Churn    5%    4%    3%    2%

      Done.






















      esc go back                                          powered by termcast.app

    "
  `)

  // Verify all section headings present
  expect(text).toContain('Inline Formatting')
  expect(text).toContain('Single Column')
  expect(text).toContain('Single Row')
  expect(text).toContain('Empty Cells')
  expect(text).toContain('Wide Table')
  expect(text).toContain('Two Columns')
  expect(text).toContain('Numeric Data')
  expect(text).toContain('Done.')
}, 30000)
