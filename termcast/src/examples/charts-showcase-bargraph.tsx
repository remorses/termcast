// Showcase: BarGraph vertical stacked bar chart inside a Detail view.
// Recreates a monthly model spend chart with stacked per-day usage.

import { BarGraph, Detail } from 'termcast'
import { renderWithProviders } from '../utils'

const labels = Array.from({ length: 30 }, (_, i) => {
  const day = i + 1
  if (day % 2 === 0) {
    return ''
  }
  return String(day).padStart(2, '0')
})

const emptyMonth = Array.from({ length: 30 }, () => 0)

function withSpend(points: Record<number, number>): number[] {
  return emptyMonth.map((_, i) => points[i + 1] || 0)
}

const modelSpend = [
  {
    title: 'deepseek-v4-flash (go)',
    color: '#b5bb69',
    data: withSpend({ 21: 0.6, 25: 1.05, 26: 1.3, 27: 1.9, 28: 0.55, 29: 0.8, 30: 1.1 }),
  },
  {
    title: 'deepseek-v4-pro (go)',
    color: '#8f59b5',
    data: withSpend({ 25: 0.12 }),
  },
  {
    title: 'kimi-k2.6 (go)',
    color: '#64b86a',
    data: withSpend({ 22: 3.25, 23: 1.65, 24: 2.2, 25: 2.05 }),
  },
  {
    title: 'mimo-v2-omni (go)',
    color: '#aaa25f',
    data: withSpend({ 25: 0.12, 26: 0.15 }),
  },
  {
    title: 'mimo-v2-pro (go)',
    color: '#5ba895',
    data: withSpend({ 16: 1.5, 17: 0.75, 21: 2.5 }),
  },
  {
    title: 'minimax-m2.7 (go)',
    color: '#6c6cb8',
    data: withSpend({ 20: 5 }),
  },
  {
    title: 'qwen3.6-plus (go)',
    color: '#b07a5c',
    data: withSpend({ 17: 2.65, 18: 6.55, 19: 3.15 }),
  },
]

function ChartsShowcaseBarGraph() {
  return (
    <Detail
      navigationTitle="Model Spend"
      markdown="# Model Spend\n\nApril 2026 usage by model and API key."
      metadata={
        <Detail.Metadata>
          <box flexDirection="row" gap={2} paddingBottom={1}>
            <box border borderColor="#2a2a2a" paddingLeft={2} paddingRight={2} height={3} justifyContent="center">
              <text>‹  April 2026  ›</text>
            </box>
            <box border borderColor="#2d5fa8" paddingLeft={2} paddingRight={2} height={3} justifyContent="center">
              <text>All Models⌄</text>
            </box>
            <box border borderColor="#2a2a2a" paddingLeft={2} paddingRight={2} height={3} justifyContent="center">
              <text>All Keys⌄</text>
            </box>
          </box>
          <box border borderColor="#2a2a2a" paddingTop={2} paddingLeft={2} paddingRight={2} paddingBottom={1}>
            <BarGraph
              height={24}
              labels={labels}
              barGap={1}
              yFormat={(value) => `$${value.toFixed(0)}`}
              showLegend
            >
              {modelSpend.map((series) => {
                return (
                  <BarGraph.Series
                    key={series.title}
                    color={series.color}
                    data={series.data}
                    title={series.title}
                  />
                )
              })}
            </BarGraph>
          </box>
        </Detail.Metadata>
      }
    />
  )
}

void renderWithProviders(<ChartsShowcaseBarGraph />)
