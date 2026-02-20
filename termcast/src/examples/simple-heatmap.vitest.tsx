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
                                                                                         ▀
      Heatmap Color Showcase

      Each heatmap demonstrates a different color combination.
      Data has a late-fall gap to show that empty weeks are skipped.
      Last heatmap renders multi-year data to verify width truncation.

      May      Jun        Jul      Aug        Sep      Oct      Nov
      ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼ ◼
      ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼ ◼  Mon
      ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼ ◼
      ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼ ◼  Wed
      ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼ ◼
      ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼ ◼  Fri
      ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼ ◼
                                                       Less ◼ ◼ ◼ ◼ ◼ More

      Jun        Jul      Aug        Sep  Jan      Feb
      ◼ ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼ ◼  ◼ ◼  ◼ ◼ ◼ ◼  ◼ ◼ ◼
      ◼ ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼ ◼  ◼ ◼  ◼ ◼ ◼ ◼  ◼ ◼ ◼  Mon
      ◼ ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼ ◼  ◼ ◼  ◼ ◼ ◼ ◼  ◼ ◼ ◼
      ◼ ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼ ◼  ◼ ◼  ◼ ◼ ◼ ◼  ◼ ◼ ◼  Wed
      ◼ ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼ ◼  ◼ ◼  ◼ ◼ ◼ ◼  ◼ ◼ ◼
      ◼ ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼ ◼  ◼ ◼  ◼ ◼ ◼ ◼  ◼ ◼ ◼  Fri
      ◼ ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼ ◼  ◼ ◼  ◼ ◼ ◼ ◼  ◼ ◼ ◼
                                      Less ◼ ◼ ◼ ◼ ◼ More

      Se Oct      Nov        Dec      Jan      Feb
      ◼  ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼
      ◼  ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼  Mon
      ◼  ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼
      ◼  ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼  Wed
      ◼  ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼
      ◼  ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼  Fri
      ◼  ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼
                                    Less ◼ ◼ ◼ ◼ ◼ More

      Au Sep      Oct      Nov        Dec      Jan      Feb
      ◼  ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼
      ◼  ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼  Mon
      ◼  ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼
      ◼  ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼  Wed


      esc go back   ^k actions                                     powered by termcast.app

    "
  `)

  const maxLineLength = text.split('\n').reduce((maxLength, line) => {
    return Math.max(maxLength, line.length)
  }, 0)
  expect(maxLineLength).toBeLessThanOrEqual(88)
}, 30000)
