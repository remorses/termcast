// Example: BarGraph vertical stacked bar chart in a List with side detail.
// Shows weekly data with default palette colors. Enter pushes to full Detail.

import React from 'react'
import { List, Detail, BarGraph, Row, Action, ActionPanel } from 'termcast'
import { useNavigation } from 'termcast/src/internal/navigation'
import { renderWithProviders } from '../utils'

// ── Data ─────────────────────────────────────────────────────────────

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

interface DataSet {
  title: string
  subtitle: string
  series: Array<{ data: number[]; title: string }>
}

const dataSets: DataSet[] = [
  {
    title: 'Weekly Traffic',
    subtitle: '3 channels across 6 days',
    series: [
      { data: [40, 30, 25, 15, 50, 40], title: 'Direct' },
      { data: [30, 35, 15, 20, 35, 30], title: 'Organic' },
      { data: [20, 25, 10, 10, 25, 20], title: 'Referral' },
    ],
  },
  {
    title: 'Revenue by Region',
    subtitle: 'EMEA / APAC / Americas',
    series: [
      { data: [60, 45, 30, 55, 70, 50], title: 'Americas' },
      { data: [25, 30, 20, 35, 25, 30], title: 'EMEA' },
      { data: [15, 20, 10, 10, 20, 15], title: 'APAC' },
    ],
  },
  {
    title: 'Server Load',
    subtitle: 'CPU / Memory / IO',
    series: [
      { data: [45, 55, 35, 70, 60, 40], title: 'CPU' },
      { data: [30, 25, 40, 20, 35, 30], title: 'Memory' },
    ],
  },
]

// Second week data for side-by-side comparison
const week2Series = [
  { data: [50, 40, 30, 25, 60, 45], title: 'Direct' },
  { data: [35, 30, 20, 25, 40, 35], title: 'Organic' },
  { data: [25, 20, 15, 15, 30, 25], title: 'Referral' },
]

// Stress test: many columns (20 bars)
const manyColsLabels = Array.from({ length: 20 }, (_, i) => `D${i + 1}`)
const manyColsSeries = [
  { data: Array.from({ length: 20 }, () => 20 + Math.floor(Math.random() * 60)), title: 'A' },
  { data: Array.from({ length: 20 }, () => 10 + Math.floor(Math.random() * 40)), title: 'B' },
]

// Stress test: long labels
const longLabels = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday & Sunday']
const longLabelsSeries = [
  { data: [40, 30, 25, 15, 50, 40], title: 'Views' },
  { data: [20, 25, 10, 10, 25, 20], title: 'Clicks' },
]

// Stress test: many series (8 series)
const manySeriesData: Array<{ data: number[]; title: string }> = Array.from(
  { length: 8 },
  (_, i) => ({
    data: [10 + i * 5, 15 + i * 3, 8 + i * 4, 12 + i * 2, 20 + i * 6, 5 + i * 7],
    title: `Series ${i + 1}`,
  }),
)

// ── Full Detail view (pushed on Enter) ───────────────────────────────

function BarGraphDetailView({ item }: { item: DataSet }): any {
  const { pop } = useNavigation()

  return (
    <Detail
      navigationTitle={item.title}
      markdown={[
        `# ${item.title}`,
        '',
        item.subtitle,
      ].join('\n')}
      metadata={
        <Detail.Metadata>
          <BarGraph height={15} labels={days}>
            {item.series.map((s, i) => {
              return <BarGraph.Series key={i} data={s.data} title={s.title} />
            })}
          </BarGraph>
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

// ── Main list ────────────────────────────────────────────────────────

function BarGraphWeeklyExample() {
  const { push, pop } = useNavigation()

  return (
    <List navigationTitle="BarGraph Showcase" isShowingDetail={true}>
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
                    <BarGraph height={10} labels={days}>
                      {item.series.map((s, i) => {
                        return <BarGraph.Series key={i} data={s.data} title={s.title} />
                      })}
                    </BarGraph>
                  </List.Item.Detail.Metadata>
                }
              />
            }
            actions={
              <ActionPanel>
                <Action
                  title="Open Detail"
                  onAction={() => { push(<BarGraphDetailView item={item} />) }}
                />
              </ActionPanel>
            }
          />
        )
      })}
      <List.Item
        key="many-columns"
        title="Many Columns (20)"
        subtitle="Overflow test with 20 bars"
        detail={
          <List.Item.Detail
            metadata={
              <List.Item.Detail.Metadata>
                <BarGraph height={10} labels={manyColsLabels}>
                  {manyColsSeries.map((s, i) => {
                    return <BarGraph.Series key={i} data={s.data} title={s.title} />
                  })}
                </BarGraph>
              </List.Item.Detail.Metadata>
            }
          />
        }
      />
      <List.Item
        key="many-series"
        title="Many Series (8)"
        subtitle="Legend overflow test"
        detail={
          <List.Item.Detail
            metadata={
              <List.Item.Detail.Metadata>
                <BarGraph height={10} labels={days}>
                  {manySeriesData.map((s, i) => {
                    return <BarGraph.Series key={i} data={s.data} title={s.title} />
                  })}
                </BarGraph>
              </List.Item.Detail.Metadata>
            }
          />
        }
      />
      <List.Item
        key="long-labels"
        title="Long Labels"
        subtitle="Labels wider than bar columns"
        detail={
          <List.Item.Detail
            metadata={
              <List.Item.Detail.Metadata>
                <BarGraph height={10} labels={longLabels}>
                  {longLabelsSeries.map((s, i) => {
                    return <BarGraph.Series key={i} data={s.data} title={s.title} />
                  })}
                </BarGraph>
              </List.Item.Detail.Metadata>
            }
          />
        }
      />
      <List.Item
        key="side-by-side"
        title="Week 1 vs Week 2"
        subtitle="Two graphs in a Row"
        detail={
          <List.Item.Detail
            metadata={
              <List.Item.Detail.Metadata>
                <Row>
                  <BarGraph height={10} labels={days}>
                    {dataSets[0]!.series.map((s, i) => {
                      return <BarGraph.Series key={i} data={s.data} title={s.title} />
                    })}
                  </BarGraph>
                  <BarGraph height={10} labels={days}>
                    {week2Series.map((s, i) => {
                      return <BarGraph.Series key={i} data={s.data} title={s.title} />
                    })}
                  </BarGraph>
                </Row>
              </List.Item.Detail.Metadata>
            }
          />
        }
        actions={
          <ActionPanel>
            <Action
              title="Open Detail"
              onAction={() => {
                push(
                  <Detail
                    navigationTitle="Week 1 vs Week 2"
                    metadata={
                      <Detail.Metadata>
                        <Row>
                          <BarGraph height={15} labels={days}>
                            {dataSets[0]!.series.map((s, i) => {
                              return <BarGraph.Series key={i} data={s.data} title={s.title} />
                            })}
                          </BarGraph>
                          <BarGraph height={15} labels={days}>
                            {week2Series.map((s, i) => {
                              return <BarGraph.Series key={i} data={s.data} title={s.title} />
                            })}
                          </BarGraph>
                        </Row>
                      </Detail.Metadata>
                    }
                    actions={
                      <ActionPanel>
                        <Action title="Go Back" onAction={() => { pop() }} />
                      </ActionPanel>
                    }
                  />
                )
              }}
            />
          </ActionPanel>
        }
      />
    </List>
  )
}

renderWithProviders(<BarGraphWeeklyExample />)
