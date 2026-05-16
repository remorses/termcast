// Example: HorizontalBarGraph stacked horizontal rows with a compact right legend.

import React from 'react'
import { Action, ActionPanel, Detail, HorizontalBarGraph, List } from 'termcast'
import { useNavigation } from 'termcast/src/internal/navigation'
import { renderWithProviders } from '../utils'

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

interface DataSet {
  title: string
  subtitle: string
  labels: string[]
  series: Array<{ data: number[]; title: string }>
}

const dataSets: DataSet[] = [
  {
    title: 'Weekly Traffic',
    subtitle: 'Direct / Organic / Referral across 6 days',
    labels: days,
    series: [
      { data: [40, 30, 25, 15, 50, 40], title: 'Direct' },
      { data: [30, 35, 15, 20, 35, 30], title: 'Organic' },
      { data: [20, 25, 10, 10, 25, 20], title: 'Referral' },
    ],
  },
  {
    title: 'Revenue by Region',
    subtitle: 'Americas / EMEA / APAC',
    labels: days,
    series: [
      { data: [60, 45, 30, 55, 70, 50], title: 'Americas' },
      { data: [25, 30, 20, 35, 25, 30], title: 'EMEA' },
      { data: [15, 20, 10, 10, 20, 15], title: 'APAC' },
    ],
  },
  {
    title: 'Long Labels',
    subtitle: 'The left label column truncates without stealing legend space',
    labels: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday & Sunday'],
    series: [
      { data: [40, 30, 25, 15, 50, 40], title: 'Views' },
      { data: [20, 25, 10, 10, 25, 20], title: 'Clicks' },
    ],
  },
  {
    title: 'Many Series',
    subtitle: 'Legend grows only as wide as its content needs',
    labels: days,
    series: Array.from({ length: 8 }, (_, i) => {
      return {
        data: [10 + i * 5, 15 + i * 3, 8 + i * 4, 12 + i * 2, 20 + i * 6, 5 + i * 7],
        title: `Series ${i + 1}`,
      }
    }),
  },
]

function Chart({ item, height }: { item: DataSet; height: number }): any {
  return (
    <HorizontalBarGraph labels={item.labels} height={height}>
      {item.series.map((series) => {
        return <HorizontalBarGraph.Series key={series.title} data={series.data} title={series.title} />
      })}
    </HorizontalBarGraph>
  )
}

function HorizontalBarGraphDetailView({ item }: { item: DataSet }): any {
  const { pop } = useNavigation()

  return (
    <Detail
      navigationTitle={item.title}
      markdown={`# ${item.title}\n\n${item.subtitle}`}
      metadata={
        <Detail.Metadata>
          <Chart item={item} height={12} />
        </Detail.Metadata>
      }
      actions={
        <ActionPanel>
          <Action title="Go Back" onAction={() => { pop() }} />
        </ActionPanel>
      }
    />
  )
}

function HorizontalBarGraphWeeklyExample() {
  const { push } = useNavigation()

  return (
    <List navigationTitle="HorizontalBarGraph Showcase" isShowingDetail={true}>
      {dataSets.map((item) => {
        return (
          <List.Item
            key={item.title}
            title={item.title}
            subtitle={item.subtitle}
            detail={
              <List.Item.Detail
                metadata={
                  <List.Item.Detail.Metadata>
                    <Chart item={item} height={10} />
                  </List.Item.Detail.Metadata>
                }
              />
            }
            actions={
              <ActionPanel>
                <Action
                  title="Open Detail"
                  onAction={() => { push(<HorizontalBarGraphDetailView item={item} />) }}
                />
              </ActionPanel>
            }
          />
        )
      })}
    </List>
  )
}

void renderWithProviders(<HorizontalBarGraphWeeklyExample />)
