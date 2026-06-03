// Example: Chart tooltip showcase. Hover over any bar, segment, or data point
// to see an absolute-positioned tooltip showing the label and value.
// Demonstrates tooltips on BarGraph, Graph, BarChart, and HorizontalBarGraph.

import React from 'react'
import { Detail, BarGraph, Graph, BarChart, HorizontalBarGraph, Row } from 'termcast'
import { renderWithProviders } from '../utils'

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const values1 = [40, 30, 25, 15, 50, 40]
const values2 = [20, 25, 10, 10, 25, 20]

function ChartTooltipsExample() {
  return (
    <Detail
      navigationTitle="Chart Tooltips"
      markdown={[
        '# Chart Tooltips',
        '',
        'Hover over any chart element to see a tooltip with the data label and value.',
        'Works on BarGraph, Graph, BarChart, and HorizontalBarGraph.',
      ].join('\n')}
      metadata={
        <Detail.Metadata>
          <Detail.Metadata.Label title="BarGraph (vertical stacked)" />
          <BarGraph height={10} labels={days}>
            <BarGraph.Series data={values1} title="Direct" />
            <BarGraph.Series data={values2} title="Referral" />
          </BarGraph>
          <Detail.Metadata.Separator />
          <Detail.Metadata.Label title="Graph (line chart)" />
          <Graph height={8} xLabels={days}>
            <Graph.Line data={values1} title="Traffic" />
          </Graph>
          <Detail.Metadata.Separator />
          <Detail.Metadata.Label title="BarChart (horizontal segments)" />
          <BarChart>
            <BarChart.Segment value={60} label="Spent" />
            <BarChart.Segment value={25} label="Remaining" />
            <BarChart.Segment value={15} label="Reserved" />
          </BarChart>
          <Detail.Metadata.Separator />
          <Detail.Metadata.Label title="HorizontalBarGraph (stacked rows)" />
          <HorizontalBarGraph labels={days.slice(0, 4)}>
            <HorizontalBarGraph.Series data={[40, 30, 25, 15]} title="Organic" />
            <HorizontalBarGraph.Series data={[20, 25, 10, 10]} title="Paid" />
          </HorizontalBarGraph>
        </Detail.Metadata>
      }
    />
  )
}

void renderWithProviders(<ChartTooltipsExample />)
