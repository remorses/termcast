// Example: Graph with multiple series - stock price and moving average.
// Demonstrates multi-series rendering with different colors.

import { Detail, Graph, Color } from 'termcast'
import { renderWithProviders } from '../utils'

// 20 days of price data
const prices = [
  150, 155, 148, 162, 158, 165, 170, 168, 175, 180,
  178, 185, 190, 188, 195, 192, 198, 202, 200, 208,
]

// Simple moving average (5-day window)
const sma: number[] = prices.map((_, i) => {
  if (i < 4) return prices[i]!
  const window = prices.slice(i - 4, i + 1)
  return window.reduce((sum, v) => sum + v, 0) / window.length
})

const xLabels = ['Day 1', 'Day 5', 'Day 10', 'Day 15', 'Day 20']

function GraphMultiSeries() {
  return (
    <Detail
      markdown="# Multi-Series Chart"
      metadata={
        <Graph height={12} xLabels={xLabels} yTicks={5}>
          <Graph.Line data={prices} color={Color.Orange} title="Price" />
          <Graph.Line data={sma} color={Color.Blue} title="SMA(5)" />
        </Graph>
      }
    />
  )
}

renderWithProviders(<GraphMultiSeries />)
