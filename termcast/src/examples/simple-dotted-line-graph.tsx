// Example: DottedLineGraph showing metric dashboard lines without box borders.

import { Color, DottedLineGraph, Markdown } from 'termcast'
import { renderWithProviders } from '../utils'

const minutes = Array.from({ length: 60 }, (_, index) => {
  if (index < 25) return 18
  if (index < 35) return 74 + (index % 3) * 4
  if (index < 57) return 20
  return 66
})

const memory = Array.from({ length: 60 }, (_, index) => {
  if (index < 24) return 34
  if (index < 40) return 58 + (index % 5) * 3
  return 36
})

const requests2xx = Array.from({ length: 60 }, (_, index) => {
  if (index < 42) return 52
  if (index < 56) return 43
  return 63
})

const requests5xx = Array.from({ length: 60 }, (_, index) => {
  if (index < 12) return 24
  if (index < 45) return 30
  return 28
})

function SimpleDottedLineGraph() {
  return (
    <>
      <Markdown content="## Dotted metrics" />
      <Markdown content="Metric-style dotted lines with braille subcell movement." />
      <DottedLineGraph
        height={12}
        xLabels={['7:28 AM', '7:43 AM', '7:58 AM', '8:13 AM', '8:28 AM']}
        yRange={[0, 100]}
        yTicks={4}
        yFormat={(value) => `${value.toFixed(0)}%`}
        dotSpacing={4}
      >
        <DottedLineGraph.Series data={minutes} color={Color.Blue} title="CPU" />
        <DottedLineGraph.Series data={memory} color={Color.Purple} title="Memory" />
        <DottedLineGraph.Series data={requests2xx} color={Color.Green} title="2xx" />
        <DottedLineGraph.Series data={requests5xx} color={Color.Red} title="5xx" />
      </DottedLineGraph>
    </>
  )
}

void renderWithProviders(<SimpleDottedLineGraph />)
