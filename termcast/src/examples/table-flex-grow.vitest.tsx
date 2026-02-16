// E2E tests for Table with flexGrow prop.
// Uses wrapText mode to make the width difference visually obvious:
// in row-based layout, columns distribute evenly so a wider table
// means wider columns. Also checks header background extent.

import { test, expect, afterEach, beforeEach } from 'vitest'
import { launchTerminal, Session } from 'tuistory/src'

let session: Session

beforeEach(async () => {
  session = await launchTerminal({
    command: 'bun',
    args: ['src/examples/table-flex-grow.tsx'],
    cols: 80,
    rows: 40,
  })
})

afterEach(() => {
  session?.close()
})

test('flexGrow table fills remaining space next to fixed-width label', async () => {
  const text = await session.text({
    waitFor: (text) => {
      return text.includes('flexGrow=1') && text.includes('version') && text.includes('Width=auto')
    },
    timeout: 10000,
  })

  expect(text).toMatchInlineSnapshot(`
    "



        With flexGrow=1 + wrapText (fills remaining space)

        Config:     Key                           Value
                    version                       2.1.0
                    license                       MIT
                    author                        termcast


        Width=auto + wrapText (content-sized, no stretch)

        Config:     KeVa
                    ve2.
                    liMI
                    aute


        With flexGrow=1 no wrapText (column-based)

        Config:     Key      Value
                    version  2.1.0
                    license  MIT
                    author   termcast














    "
  `)

  // All three table sections render
  expect(text).toContain('flexGrow=1')
  expect(text).toContain('Width=auto')
  // Table data is visible
  expect(text).toContain('version')
  expect(text).toContain('2.1.0')
  expect(text).toContain('termcast')
  // Fixed label is present
  expect(text).toContain('Config:')
}, 30000)

test('flexGrow header background is wider than width=auto header', async () => {
  await session.text({
    waitFor: (text) => {
      return text.includes('flexGrow=1') && text.includes('Width=auto')
    },
    timeout: 10000,
  })

  // Header bg is yellow (#ffc000) from the theme.
  // With flexGrow=1 the header row should span the full remaining width.
  // With width=auto it should be content-sized (narrower).
  const headerBgText = await session.text({
    only: { background: '#ffc000' },
    timeout: 5000,
  })

  // The flexGrow header should have more trailing spaces (wider bg).
  // Both tables have "Key" and "Value" headers, but the flexGrow one
  // should have significantly more padding/whitespace in the bg.
  expect(headerBgText).toContain('Key')
  expect(headerBgText).toContain('Value')

  // Extract the two header lines - flexGrow header should be longer
  const lines = headerBgText.split('\n').filter((l) => {
    return l.includes('Key')
  })
  // Should have at least 2 header lines (flexGrow + width=auto + column-based)
  expect(lines.length).toBeGreaterThanOrEqual(2)

  // The flexGrow line (first) should be wider than width=auto line (second)
  const flexGrowLine = lines[0]!
  const autoLine = lines[1]!
  expect(flexGrowLine.length).toBeGreaterThan(autoLine.length)
}, 30000)
