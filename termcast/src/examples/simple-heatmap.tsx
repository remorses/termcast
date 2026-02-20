// Example: Heatmap component showcase with various color combinations.
// Shows month splits, width-based truncation, and different color palettes.
// Demonstrates Markdown component interleaved with Heatmaps for descriptions.

import { Color, Detail, Heatmap, Markdown } from 'termcast'
import type { HeatmapData } from 'termcast'
import { renderWithProviders } from '../utils'

function createRangeData(start: Date, dayCount: number, offset: number): HeatmapData[] {
  return Array.from({ length: dayCount }, (_, index) => {
    const date = new Date(start)
    date.setDate(start.getDate() + index)

    const dayOfWeek = date.getDay()
    const weekendPenalty = dayOfWeek === 0 || dayOfWeek === 6 ? 0.35 : 1
    const wave = (Math.sin((index + offset) / 6) + 1) / 2
    const value = Math.round((1 + wave * 7) * weekendPenalty)

    return {
      date,
      value,
    }
  })
}

const summerData = createRangeData(new Date(2025, 5, 1), 110, 0)
const winterData = createRangeData(new Date(2026, 0, 5), 45, 31)
const longHistoryData = createRangeData(new Date(2021, 0, 1), 1800, 13)
const recentData = createRangeData(new Date(2025, 9, 1), 150, 7)
const shortBurst = createRangeData(new Date(2025, 8, 1), 180, 3)
const journalData = [...summerData, ...winterData]

function SimpleHeatmap() {
  return (
    <Detail
      markdown={[
        '# Heatmap Color Showcase',
        '',
        'Each heatmap demonstrates a different color combination.',
        'Data has a late-fall gap to show that empty weeks are skipped.',
        'Last heatmap renders multi-year data to verify width truncation.',
      ].join('\n')}
      metadata={
        <Detail.Metadata>
          <Markdown content="**Long history** — 5 years of daily data in purple. Months that don't fit the terminal width are truncated from the left." />
          <Heatmap data={longHistoryData} color={Color.Purple} />
          <Markdown content="**Journal** — summer + winter entries in green, with a fall gap between the two ranges." />
          <Heatmap data={journalData} color={Color.Green} />
          <Markdown content="**Recent activity** — last 150 days in red, showing the sine-wave pattern clearly." />
          <Heatmap data={recentData} color={Color.Red} />
          <Markdown content="**Short burst** — 180 days in blue on a purple empty background." />
          <Heatmap data={shortBurst} color={Color.Blue} emptyColor={Color.Purple} />
          <Markdown content="**Warm tones** — orange cells on magenta empty, same journal data." />
          <Heatmap data={journalData} color={Color.Orange} emptyColor={Color.Magenta} />
          <Markdown content="**Yellow on blue** — high-contrast palette for the recent data set." />
          <Heatmap data={recentData} color={Color.Yellow} emptyColor={Color.Blue} />
        </Detail.Metadata>
      }
    />
  )
}

renderWithProviders(<SimpleHeatmap />)
