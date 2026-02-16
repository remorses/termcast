// Example: Two graphs side by side using the Row component.
// Shows horizontal graph layouts in both List side-detail and
// full Detail view (pushed on Enter).

import React from 'react'
import { List, Detail, Graph, Color, Action, ActionPanel, Row } from 'termcast'
import { useNavigation } from 'termcast/src/internal/navigation'
import { renderWithProviders } from '../utils'

// ── Data ─────────────────────────────────────────────────────────────

const cpuData = [
  25, 30, 45, 60, 55, 72, 80, 65, 50, 40,
  35, 55, 70, 85, 90, 75, 60, 45, 38, 30,
]
const memData = [
  40, 42, 44, 48, 52, 55, 58, 60, 62, 65,
  68, 70, 72, 74, 76, 78, 80, 82, 84, 86,
]
const readOps = [
  120, 85, 150, 200, 180, 95, 110, 250, 300, 275,
  190, 160, 140, 220, 280, 310, 200, 170, 130, 100,
]
const writeOps = [
  40, 55, 30, 80, 70, 45, 60, 90, 120, 100,
  65, 50, 70, 85, 110, 130, 75, 60, 45, 35,
]
const revenue = [
  10, 15, 12, 18, 25, 22, 30, 35, 28, 40,
  45, 42, 50, 55, 60, 58, 65, 70, 68, 75,
]
const expenses = [
  8, 10, 11, 14, 16, 18, 20, 22, 21, 25,
  28, 30, 32, 34, 36, 38, 40, 42, 41, 45,
]
const temperature = [
  15, 14, 16, 18, 22, 25, 28, 30, 29, 27,
  24, 20, 17, 15, 14, 16, 19, 23, 26, 28,
]
const humidity = [
  80, 82, 78, 72, 65, 58, 52, 48, 50, 55,
  62, 70, 75, 80, 83, 78, 72, 60, 54, 52,
]

const sparseData = [
  0, 0, 15, 30, 0, 0, 50, 80, 0, 0,
  0, 45, 60, 0, 0, 0, 70, 90, 0, 0,
]

const hourLabels = ['0h', '6h', '12h', '18h', '24h']
const monthLabels = ['Jan', 'Apr', 'Jul', 'Oct']

// ── Items ────────────────────────────────────────────────────────────

interface PairItem {
  title: string
  subtitle: string
  left: {
    variant: 'area' | 'filled' | 'striped'
    series: Array<{ data: number[]; color?: Color.ColorLike }>
    xLabels: string[]
    yRange?: [number, number]
    stripeColors?: [Color.ColorLike, Color.ColorLike]
  }
  right: {
    variant: 'area' | 'filled' | 'striped'
    series: Array<{ data: number[]; color?: Color.ColorLike }>
    xLabels: string[]
    yRange?: [number, number]
    stripeColors?: [Color.ColorLike, Color.ColorLike]
  }
  markdown?: string
  meta: Array<{ title: string; text: string; color?: Color.ColorLike }>
}

const items: PairItem[] = [
  {
    title: 'CPU vs Memory',
    subtitle: 'Area + Filled side by side',
    left: {
      variant: 'area',
      series: [{ data: cpuData, color: Color.Blue }],
      xLabels: hourLabels,
      yRange: [0, 100],
    },
    right: {
      variant: 'filled',
      series: [{ data: memData, color: Color.Green }],
      xLabels: hourLabels,
      yRange: [0, 100],
    },
    markdown: [
      '## CPU vs Memory',
      '',
      'Area chart (left) shows CPU with high variance.',
      'Filled chart (right) shows memory steadily climbing.',
    ].join('\n'),
    meta: [
      { title: 'CPU Peak', text: '90%', color: Color.Blue },
      { title: 'Mem Peak', text: '86%', color: Color.Green },
    ],
  },
  {
    title: 'Disk I/O',
    subtitle: 'Read vs Write operations',
    left: {
      variant: 'filled',
      series: [{ data: readOps, color: Color.Orange }],
      xLabels: hourLabels,
    },
    right: {
      variant: 'filled',
      series: [{ data: writeOps, color: Color.Purple }],
      xLabels: hourLabels,
    },
    meta: [
      { title: 'Read Peak', text: '310 ops/s', color: Color.Orange },
      { title: 'Write Peak', text: '130 ops/s', color: Color.Purple },
    ],
  },
  {
    title: 'Revenue vs Expenses',
    subtitle: 'Striped comparison',
    left: {
      variant: 'striped',
      series: [{ data: revenue }],
      xLabels: monthLabels,
      stripeColors: [Color.Green, Color.Blue],
    },
    right: {
      variant: 'striped',
      series: [{ data: expenses }],
      xLabels: monthLabels,
      stripeColors: [Color.Red, Color.Orange],
    },
    markdown: [
      '## Revenue vs Expenses',
      '',
      'Revenue growing faster than expenses.',
      'Profit margin widening over the year.',
      '',
      '- Revenue: **$10k** to **$75k**',
      '- Expenses: **$8k** to **$45k**',
    ].join('\n'),
    meta: [
      { title: 'Revenue', text: '$75k', color: Color.Green },
      { title: 'Expenses', text: '$45k', color: Color.Red },
      { title: 'Margin', text: '40%' },
    ],
  },
  {
    title: 'Weather Station',
    subtitle: 'Temperature + Humidity',
    left: {
      variant: 'area',
      series: [{ data: temperature, color: Color.Red }],
      xLabels: hourLabels,
      yRange: [10, 35],
    },
    right: {
      variant: 'area',
      series: [{ data: humidity, color: Color.Blue }],
      xLabels: hourLabels,
      yRange: [40, 90],
    },
    markdown: [
      '## Weather Station',
      '',
      'Temperature and humidity are **inversely correlated**.',
      'As temperature rises, humidity drops.',
    ].join('\n'),
    meta: [
      { title: 'Temp Range', text: '14-30\u00B0C', color: Color.Red },
      { title: 'Humidity', text: '48-83%', color: Color.Blue },
    ],
  },
  {
    title: 'Mixed Variants',
    subtitle: 'Area left, Striped right',
    left: {
      variant: 'area',
      series: [
        { data: cpuData, color: Color.Blue },
        { data: memData, color: Color.Magenta },
      ],
      xLabels: hourLabels,
      yRange: [0, 100],
    },
    right: {
      variant: 'striped',
      series: [{ data: cpuData }],
      xLabels: hourLabels,
      yRange: [0, 100],
      stripeColors: [Color.Yellow, Color.Red],
    },
    meta: [
      { title: 'Left', text: 'area (2 series)' },
      { title: 'Right', text: 'striped Yellow/Red' },
    ],
  },
  {
    title: 'Sparse Data (Zeros)',
    subtitle: 'Filled vs Striped with zero values',
    left: {
      variant: 'filled',
      series: [{ data: sparseData, color: Color.Red }],
      xLabels: hourLabels,
      yRange: [0, 100],
    },
    right: {
      variant: 'striped',
      series: [{ data: sparseData }],
      xLabels: hourLabels,
      yRange: [0, 100],
      stripeColors: [Color.Blue, Color.Green],
    },
    markdown: [
      '## Sparse Data',
      '',
      'Data with many **zero values** should show a thin',
      'baseline line so bars are visible even at zero.',
    ].join('\n'),
    meta: [
      { title: 'Zeros', text: '12 of 20' },
      { title: 'Peak', text: '90' },
    ],
  },
]

// ── Shared: render a graph from config ───────────────────────────────

function GraphFromConfig({ config, height }: {
  config: PairItem['left']
  height: number
}): any {
  return (
    <Graph
      variant={config.variant}
      height={height}
      xLabels={config.xLabels}
      yRange={config.yRange}
      yTicks={4}
      yFormat={(v) => v.toFixed(0)}
      stripeColors={config.stripeColors}
    >
      {config.series.map((s, i) => {
        return <Graph.Line key={i} data={s.data} color={s.color} />
      })}
    </Graph>
  )
}

// ── Full Detail view ─────────────────────────────────────────────────

function GraphRowDetail({ item }: { item: PairItem }): any {
  const { pop } = useNavigation()

  const markdown = [
    `# ${item.title}`,
    '',
    item.subtitle,
    ...(item.markdown ? ['', item.markdown] : []),
  ].join('\n')

  return (
    <Detail
      navigationTitle={item.title}
      markdown={markdown}
      metadata={
        <Detail.Metadata>
          <Row gap={1}>
            <GraphFromConfig config={item.left} height={12} />
            <GraphFromConfig config={item.right} height={12} />
          </Row>
          <Detail.Metadata.Separator />
          {item.meta.map((m) => {
            return (
              <Detail.Metadata.Label
                key={m.title}
                title={m.title}
                text={m.color ? { value: m.text, color: m.color } : m.text}
              />
            )
          })}
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

function GraphRowExample() {
  const { push } = useNavigation()

  return (
    <List navigationTitle="Graph Rows" isShowingDetail={true}>
      {items.map((item) => {
        return (
          <List.Item
            key={item.title}
            title={item.title}
            subtitle={item.subtitle}
            detail={
              <List.Item.Detail
                markdown={item.markdown}
                metadata={
                  <List.Item.Detail.Metadata>
                    <Row gap={1}>
                      <GraphFromConfig config={item.left} height={8} />
                      <GraphFromConfig config={item.right} height={8} />
                    </Row>
                    <List.Item.Detail.Metadata.Separator />
                    {item.meta.map((m) => {
                      return (
                        <List.Item.Detail.Metadata.Label
                          key={m.title}
                          title={m.title}
                          text={m.color ? { value: m.text, color: m.color } : m.text}
                        />
                      )
                    })}
                  </List.Item.Detail.Metadata>
                }
              />
            }
            actions={
              <ActionPanel>
                <Action
                  title="Open Detail"
                  onAction={() => { push(<GraphRowDetail item={item} />) }}
                />
              </ActionPanel>
            }
          />
        )
      })}
    </List>
  )
}

renderWithProviders(<GraphRowExample />)
