// E2E tests for CalendarHeatmap with normal and overflow data ranges.
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

test('renders calendar heatmaps with various color combinations', async () => {
  const text = await session.text({
    waitFor: (text) => {
      return text.includes('Calendar Heatmap Color Showcase') && text.includes('Less')
    },
    timeout: 10000,
  })

  expect(text).toMatchInlineSnapshot(`
    "


                                                                                         █

      Calendar Heatmap Color Showcase









      May      Jun        Jul      Aug        Sep      Oct      Nov
      ◼ ◼   ◼  ◼ ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼    ◼ ◼ ◼ ◼    ◼ ◼ ◼  ◼ ◼   ◼  ◼ ◼ ◼   ◼
      ■ ◼ ◼ ◼  ■ ■ ◼ ◼ ◼  ■ ■ ■ ◼  ◼ ◼ ■ ■ ◼  ◼ ◼ ■ ■  ■ ◼ ◼ ■  ■ ■ ◼ ◼ ◼  Mon
      ■ ◼ ◼ ◼  ■ ■ ◼ ◼ ◼  ■ ■ ■ ◼  ◼ ■ ■ ■ ◼  ◼ ◼ ■ ■  ■ ◼ ◼ ■  ■ ■ ◼ ◼ ◼
      ■ ◼ ◼ ◼  ■ ■ ◼ ◼ ◼  ■ ■ ■ ◼  ◼ ■ ■ ■ ◼  ◼ ◼ ■ ■  ◼ ◼ ◼ ■  ■ ■ ◼ ◼ ■  Wed
      ■ ◼ ◼ ■  ■ ■ ◼ ◼ ◼  ■ ■ ◼ ◼  ◼ ■ ■ ■ ◼  ◼ ◼ ■ ■  ◼ ◼ ◼ ■  ■ ■ ◼ ◼ ■
      ■ ◼ ◼ ■  ■ ■ ◼ ◼ ◼  ■ ■ ◼ ◼  ◼ ■ ■ ■ ◼  ◼ ■ ■ ■  ◼ ◼ ◼ ■  ■ ◼ ◼ ◼ ■  Fri
      ◼   ◼ ◼  ◼ ◼ ◼   ◼  ◼ ◼ ◼    ◼ ◼ ◼ ◼    ◼ ◼ ◼ ◼  ◼   ◼ ◼  ◼ ◼   ◼
                                                       Less   ◼ ◼ ■ ■ More




      Jun        Jul      Aug        Sep  Jan      Feb
      ◼ ◼ ◼ ◼    ◼ ◼ ◼ ◼    ◼ ◼ ◼ ◼  ◼      ◼ ◼ ◼  ◼   ◼
      ■ ■ ■ ◼ ◼  ◼ ■ ■ ◼  ◼ ◼ ■ ■ ■  ◼ ◼  ◼ ■ ■ ■  ◼ ◼ ◼  Mon
      ■ ■ ■ ◼ ◼  ◼ ■ ■ ◼  ◼ ◼ ■ ■ ■  ◼ ◼  ◼ ■ ■ ■  ◼ ◼ ◼
      ■ ■ ■ ◼ ◼  ■ ■ ■ ◼  ◼ ◼ ■ ■ ■  ◼ ◼  ◼ ■ ■ ■  ◼ ◼ ◼  Wed
      ■ ■ ■ ◼ ◼  ■ ■ ■ ◼  ◼ ◼ ■ ■ ◼  ◼ ◼  ◼ ■ ■ ■  ◼ ◼
      ■ ■ ◼ ◼ ◼  ■ ■ ■ ◼  ◼ ◼ ■ ■ ◼  ◼    ◼ ■ ■ ■  ◼ ◼    Fri
      ◼ ◼ ◼   ◼  ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼ ◼       ◼ ◼ ◼ ◼    ◼
                                      Less   ◼ ◼ ■ ■ More




      Se Oct      Nov        Dec      Jan      Feb
         ◼ ◼ ◼ ◼  ◼ ◼ ◼ ◼    ◼ ◼ ◼ ◼    ◼ ◼ ◼  ◼ ◼   ◼
         ■ ◼ ◼ ◼  ■ ■ ■ ◼ ◼  ◼ ■ ■ ◼  ◼ ◼ ■ ■  ■ ◼ ◼ ■  Mon
         ■ ◼ ◼ ◼  ■ ■ ■ ◼ ◼  ■ ■ ■ ◼  ◼ ◼ ■ ■  ◼ ◼ ◼ ■
      ■  ■ ◼ ◼ ◼  ■ ■ ■ ◼ ◼  ■ ■ ■ ◼  ◼ ◼ ■ ■  ◼ ◼ ◼ ■  Wed


      esc go back   ^k actions                                     powered by termcast.app

    "
  `)

  const maxLineLength = text.split('\n').reduce((maxLength, line) => {
    return Math.max(maxLength, line.length)
  }, 0)
  expect(maxLineLength).toBeLessThanOrEqual(88)
}, 30000)
