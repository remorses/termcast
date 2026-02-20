// E2E tests for Heatmap with normal and overflow data ranges.
// Verifies month truncation does not overflow terminal width.

import { test, expect, afterEach, beforeEach } from 'vitest'
import { launchTerminal, Session } from 'tuistory/src'

let session: Session

beforeEach(async () => {
  session = await launchTerminal({
    command: 'bun',
    args: ['src/examples/simple-heatmap.tsx'],
    cols: 88,
    rows: 50,
  })
})

afterEach(() => {
  session?.close()
})

test('renders heatmaps with various color combinations', async () => {
  const text = await session.text({
    waitFor: (text) => {
      return text.includes('Heatmap Color Showcase') && text.includes('Less')
    },
    timeout: 10000,
  })

  expect(text).toMatchInlineSnapshot(`
    "


                                                                                         █

      Heatmap Color Showcase

      Each heatmap demonstrates a different color combination.
      Data has a late-fall gap to show that empty weeks are skipped.
      Last heatmap renders multi-year data to verify width truncation.

      Long history — 5 years of daily data in purple. Months that don't fit the
      terminal width are truncated from the left.

      May      Jun        Jul      Aug        Sep      Oct      Nov
      ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼ ◼
      ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼ ◼  Mon
      ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼ ◼
      ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼ ◼  Wed
      ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼ ◼
      ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼ ◼  Fri
      ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼ ◼
                                                       Less ◼ ◼ ◼ ◼ ◼ More

      Journal — summer + winter entries in green, with a fall gap between the two
      ranges.

      Jun        Jul      Aug        Sep  Jan      Feb
      ◼ ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼ ◼  ◼ ◼  ◼ ◼ ◼ ◼  ◼ ◼ ◼
      ◼ ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼ ◼  ◼ ◼  ◼ ◼ ◼ ◼  ◼ ◼ ◼  Mon
      ◼ ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼ ◼  ◼ ◼  ◼ ◼ ◼ ◼  ◼ ◼ ◼
      ◼ ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼ ◼  ◼ ◼  ◼ ◼ ◼ ◼  ◼ ◼ ◼  Wed
      ◼ ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼ ◼  ◼ ◼  ◼ ◼ ◼ ◼  ◼ ◼ ◼
      ◼ ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼ ◼  ◼ ◼  ◼ ◼ ◼ ◼  ◼ ◼ ◼  Fri
      ◼ ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼ ◼  ◼ ◼  ◼ ◼ ◼ ◼  ◼ ◼ ◼
                                      Less ◼ ◼ ◼ ◼ ◼ More

      Recent activity — last 150 days in red, showing the sine-wave pattern clearly.

      Se Oct      Nov        Dec      Jan      Feb
      ◼  ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼
      ◼  ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼  Mon
      ◼  ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼
      ◼  ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼  Wed
      ◼  ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼
      ◼  ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼  Fri


      esc go back   ^k actions                                     powered by termcast.app

    "
  `)

  const maxLineLength = text.split('\n').reduce((maxLength, line) => {
    return Math.max(maxLength, line.length)
  }, 0)
  expect(maxLineLength).toBeLessThanOrEqual(88)
}, 30000)
