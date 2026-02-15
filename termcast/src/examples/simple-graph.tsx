// Example: Graph component showing stock price data in a Detail view.
// Demonstrates line chart with braille rendering, multiple series,
// Y-axis labels, and X-axis date labels.

import { Detail, Graph, Color } from 'termcast'
import { renderWithProviders } from '../utils'

// 30 days of AAPL stock price (simulated)
const prices = [
  150.2, 152.1, 148.7, 155.3, 162.8, 158.4, 156.1,
  160.5, 163.2, 167.8, 165.4, 170.1, 172.5, 169.3,
  174.8, 178.2, 175.6, 180.1, 183.4, 179.8, 185.2,
  188.6, 186.3, 190.1, 187.5, 192.8, 195.3, 193.7,
  198.1, 201.4,
]

// Volume data (in hundreds, to keep scale reasonable)
const volume = [
  12, 8, 15, 22, 45, 18, 10,
  14, 16, 25, 12, 20, 18, 11,
  30, 35, 15, 28, 32, 14, 38,
  42, 20, 35, 18, 40, 45, 22,
  48, 55,
]

const days = Array.from({ length: 30 }, (_, i) => {
  return String(i + 1).padStart(2, '0')
})

// Show labels every 5 days
const xLabels = days.filter((_, i) => i % 5 === 0)

function SimpleGraph() {
  return (
    <Detail
      markdown={`# AAPL Stock - 30 Day\n\nPrice range: $${Math.min(...prices).toFixed(2)} - $${Math.max(...prices).toFixed(2)}`}
      metadata={
        <Graph
          height={15}
          xLabels={xLabels}
          yTicks={6}
          yFormat={(v) => v.toFixed(1)}
        >
          <Graph.Line data={prices} color={Color.Orange} title="Price" />
        </Graph>
      }
    />
  )
}

renderWithProviders(<SimpleGraph />)
