// Example: Graph variants and color combinations showcase.
// Demonstrates all three variants (area, filled, striped) with various
// color schemes, theme defaults, multi-series charts, and detail views
// combining graphs with metadata and markdown.

import React from 'react'
import { List, Detail, Graph, Color, Action, ActionPanel } from 'termcast'
import { useNavigation } from 'termcast/src/internal/navigation'
import { renderWithProviders } from '../utils'

// ── Data sets ────────────────────────────────────────────────────────

const stockPrices = [
  150, 155, 148, 162, 158, 165, 170, 168, 175, 180,
  178, 185, 190, 188, 195, 192, 198, 202, 200, 208,
]
const cpuUsage = [
  25, 30, 45, 60, 55, 72, 80, 65, 50, 40,
  35, 55, 70, 85, 90, 75, 60, 45, 38, 30,
]
const memoryUsage = [
  40, 42, 44, 48, 52, 55, 58, 60, 62, 65,
  68, 70, 72, 74, 76, 78, 80, 82, 84, 86,
]
const revenue = [
  10, 15, 12, 18, 25, 22, 30, 35, 28, 40,
  45, 42, 50, 55, 60, 58, 65, 70, 68, 75,
]
const temperature = [
  15, 14, 16, 18, 22, 25, 28, 30, 29, 27,
  24, 20, 17, 15, 14, 16, 19, 23, 26, 28,
]
const sineWave = Array.from({ length: 20 }, (_, i) => {
  return Math.sin(i * 0.5) * 40 + 50
})
const cosWave = Array.from({ length: 20 }, (_, i) => {
  return Math.cos(i * 0.5) * 40 + 50
})

const stockLabels = ['1', '5', '10', '15', '20']
const monthLabels = ['Jan', 'Apr', 'Jul', 'Oct']
const hourLabels = ['0h', '6h', '12h', '18h', '24h']

// ── Item definitions ─────────────────────────────────────────────────

interface GraphItem {
  title: string
  subtitle: string
  variant: 'area' | 'filled' | 'striped'
  series: Array<{ data: number[]; color?: Color.ColorLike }>
  xLabels: string[]
  yRange?: [number, number]
  yTicks?: number
  stripeColors?: [Color.ColorLike, Color.ColorLike]
  markdown?: string
  meta: Array<{ title: string; text: string; color?: Color.ColorLike }>
  tags?: Array<{ text: string; color: Color.ColorLike }>
}

const items: GraphItem[] = [
  // ── Area variants ──────────────────────────────────────────
  {
    title: 'Area - Stock Price',
    subtitle: 'Orange braille dots',
    variant: 'area',
    series: [{ data: stockPrices, color: Color.Orange }],
    xLabels: stockLabels,
    meta: [
      { title: 'Variant', text: 'area' },
      { title: 'Color', text: 'Orange', color: Color.Orange },
      { title: 'Points', text: '20' },
    ],
  },
  {
    title: 'Area - Multi Series',
    subtitle: 'CPU + Memory overlay',
    variant: 'area',
    series: [
      { data: cpuUsage, color: Color.Blue },
      { data: memoryUsage, color: Color.Green },
    ],
    xLabels: hourLabels,
    yRange: [0, 100],
    yTicks: 5,
    markdown: [
      '## System Metrics',
      '',
      'CPU usage (blue) vs memory usage (green) over 24 hours.',
      '',
      '- Peak CPU at **90%** around 15h',
      '- Memory steadily climbing to **86%**',
      '- CPU has high variance, memory is monotonic',
    ].join('\n'),
    meta: [
      { title: 'CPU Peak', text: '90%', color: Color.Blue },
      { title: 'Mem Peak', text: '86%', color: Color.Green },
    ],
    tags: [
      { text: 'CPU', color: Color.Blue },
      { text: 'Memory', color: Color.Green },
    ],
  },
  {
    title: 'Area - Waves',
    subtitle: 'Purple + Magenta sine/cosine',
    variant: 'area',
    series: [
      { data: sineWave, color: Color.Purple },
      { data: cosWave, color: Color.Magenta },
    ],
    xLabels: ['0', '\u03C0', '2\u03C0', '3\u03C0'],
    yRange: [0, 100],
    meta: [
      { title: 'Functions', text: 'sin(x), cos(x)' },
      { title: 'Phase', text: '\u03C0/2 offset' },
      { title: 'Points', text: '20' },
    ],
    tags: [
      { text: 'sin', color: Color.Purple },
      { text: 'cos', color: Color.Magenta },
    ],
  },
  {
    title: 'Area - Blue Revenue',
    subtitle: 'Single series, auto range',
    variant: 'area',
    series: [{ data: revenue, color: Color.Blue }],
    xLabels: monthLabels,
    meta: [
      { title: 'Color', text: 'Blue', color: Color.Blue },
      { title: 'Min', text: '$10k' },
      { title: 'Max', text: '$75k' },
    ],
  },

  // ── Filled variants ────────────────────────────────────────
  {
    title: 'Filled - Red Revenue',
    subtitle: 'Solid block growth chart',
    variant: 'filled',
    series: [{ data: revenue, color: Color.Red }],
    xLabels: monthLabels,
    markdown: [
      '## Revenue Growth',
      '',
      'Quarterly revenue from **$10k** to **$75k**.',
      '',
      '```',
      'Q1: $10k  \u2192 Q2: $25k (+150%)',
      'Q2: $25k  \u2192 Q3: $50k (+100%)',
      'Q3: $50k  \u2192 Q4: $75k (+50%)',
      '```',
    ].join('\n'),
    meta: [
      { title: 'Growth', text: '+650%', color: Color.Green },
      { title: 'Color', text: 'Red', color: Color.Red },
    ],
  },
  {
    title: 'Filled - Green Temp',
    subtitle: 'Daily temperature curve',
    variant: 'filled',
    series: [{ data: temperature, color: Color.Green }],
    xLabels: hourLabels,
    yRange: [10, 35],
    yTicks: 6,
    meta: [
      { title: 'Min', text: '14\u00B0C', color: Color.Blue },
      { title: 'Max', text: '30\u00B0C', color: Color.Red },
      { title: 'Avg', text: '21\u00B0C', color: Color.Green },
    ],
  },
  {
    title: 'Filled - Yellow CPU',
    subtitle: 'High contrast on dark',
    variant: 'filled',
    series: [{ data: cpuUsage, color: Color.Yellow }],
    xLabels: hourLabels,
    yRange: [0, 100],
    meta: [
      { title: 'Color', text: 'Yellow', color: Color.Yellow },
      { title: 'Peak', text: '90%' },
      { title: 'Avg', text: '54%' },
    ],
  },
  {
    title: 'Filled - Magenta Waves',
    subtitle: 'Smooth curve with blocks',
    variant: 'filled',
    series: [{ data: sineWave, color: Color.Magenta }],
    xLabels: ['0', '\u03C0', '2\u03C0', '3\u03C0'],
    yRange: [0, 100],
    meta: [
      { title: 'Color', text: 'Magenta', color: Color.Magenta },
      { title: 'Range', text: '10\u201390' },
    ],
  },

  // ── Striped variants ───────────────────────────────────────
  {
    title: 'Striped - Purple/Orange',
    subtitle: 'Warm alternating colors',
    variant: 'striped',
    series: [{ data: stockPrices }],
    xLabels: stockLabels,
    stripeColors: [Color.Purple, Color.Orange],
    meta: [
      { title: 'Even cols', text: 'Purple', color: Color.Purple },
      { title: 'Odd cols', text: 'Orange', color: Color.Orange },
    ],
    tags: [
      { text: 'Purple', color: Color.Purple },
      { text: 'Orange', color: Color.Orange },
    ],
  },
  {
    title: 'Striped - Blue/Red',
    subtitle: 'High contrast stripes',
    variant: 'striped',
    series: [{ data: revenue }],
    xLabels: monthLabels,
    stripeColors: [Color.Blue, Color.Red],
    markdown: [
      '## Stripe Colors',
      '',
      'Pass `stripeColors` as a tuple of two colors.',
      'Even columns get the first color, odd columns the second.',
      '',
      '```tsx',
      'stripeColors={[Color.Blue, Color.Red]}',
      '```',
    ].join('\n'),
    meta: [
      { title: 'Color 1', text: 'Blue', color: Color.Blue },
      { title: 'Color 2', text: 'Red', color: Color.Red },
    ],
  },
  {
    title: 'Striped - Theme Default',
    subtitle: 'primary + accent (no prop)',
    variant: 'striped',
    series: [{ data: cpuUsage }],
    xLabels: hourLabels,
    yRange: [0, 100],
    // no stripeColors → defaults to theme.primary + theme.accent
    markdown: [
      '## Theme Colors',
      '',
      'When `stripeColors` is omitted the graph',
      'defaults to **theme.primary** and **theme.accent**.',
      '',
      'Switch themes to see different combinations.',
    ].join('\n'),
    meta: [
      { title: 'Color 1', text: 'theme.primary' },
      { title: 'Color 2', text: 'theme.accent' },
    ],
  },
  {
    title: 'Striped - Green/Yellow',
    subtitle: 'Nature-inspired',
    variant: 'striped',
    series: [{ data: sineWave }],
    xLabels: ['0', '\u03C0', '2\u03C0', '3\u03C0'],
    yRange: [0, 100],
    stripeColors: [Color.Green, Color.Yellow],
    meta: [
      { title: 'Color 1', text: 'Green', color: Color.Green },
      { title: 'Color 2', text: 'Yellow', color: Color.Yellow },
    ],
  },
  {
    title: 'Striped - Red/Magenta',
    subtitle: 'Warm gradient feel',
    variant: 'striped',
    series: [{ data: temperature }],
    xLabels: hourLabels,
    yRange: [10, 35],
    stripeColors: [Color.Red, Color.Magenta],
    meta: [
      { title: 'Color 1', text: 'Red', color: Color.Red },
      { title: 'Color 2', text: 'Magenta', color: Color.Magenta },
      { title: 'Min', text: '14\u00B0C' },
      { title: 'Max', text: '30\u00B0C' },
    ],
  },
  {
    title: 'Striped - Blue/Green',
    subtitle: 'Cool tones memory chart',
    variant: 'striped',
    series: [{ data: memoryUsage }],
    xLabels: hourLabels,
    yRange: [30, 90],
    stripeColors: [Color.Blue, Color.Green],
    markdown: [
      '## Memory Trend',
      '',
      'Steady climb from **40%** to **86%** over 24h.',
      'Blue/green stripes give a cool-toned look.',
    ].join('\n'),
    meta: [
      { title: 'Start', text: '40%' },
      { title: 'End', text: '86%' },
      { title: 'Trend', text: 'monotonic rise', color: Color.Green },
    ],
  },
]

// ── Full Detail view (pushed on Enter) ───────────────────────────────

function GraphDetailView({ item }: { item: GraphItem }): any {
  const { pop } = useNavigation()

  const markdown = [
    `# ${item.title}`,
    '',
    item.subtitle,
    '',
    ...(item.markdown ? [item.markdown, ''] : []),
    `**Variant:** \`${item.variant}\`  `,
    `**Data points:** ${item.series[0]?.data.length ?? 0}  `,
    ...(item.stripeColors ? [`**Stripe colors:** custom pair`] : []),
  ].join('\n')

  return (
    <Detail
      navigationTitle={item.title}
      markdown={markdown}
      metadata={
        <Detail.Metadata>
          <Graph
            variant={item.variant}
            height={15}
            xLabels={item.xLabels}
            yRange={item.yRange}
            yTicks={item.yTicks ?? 5}
            yFormat={(v) => v.toFixed(0)}
            stripeColors={item.stripeColors}
          >
            {item.series.map((s, si) => {
              return <Graph.Line key={si} data={s.data} color={s.color} />
            })}
          </Graph>
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
          {Boolean(item.tags) && (
            <>
              <Detail.Metadata.Separator />
              <Detail.Metadata.TagList title="Colors">
                {item.tags!.map((t) => {
                  return (
                    <Detail.Metadata.TagList.Item
                      key={t.text}
                      text={t.text}
                      color={t.color}
                    />
                  )
                })}
              </Detail.Metadata.TagList>
            </>
          )}
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

function GraphStylesExample() {
  const { push } = useNavigation()

  return (
    <List navigationTitle="Graph Styles" isShowingDetail={true}>
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
                    <Graph
                      variant={item.variant}
                      height={10}
                      xLabels={item.xLabels}
                      yRange={item.yRange}
                      yTicks={item.yTicks ?? 4}
                      yFormat={(v) => v.toFixed(0)}
                      stripeColors={item.stripeColors}
                    >
                      {item.series.map((s, si) => {
                        return <Graph.Line key={si} data={s.data} color={s.color} />
                      })}
                    </Graph>
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
                    {Boolean(item.tags) && (
                      <>
                        <List.Item.Detail.Metadata.Separator />
                        <List.Item.Detail.Metadata.TagList title="Colors">
                          {item.tags!.map((t) => {
                            return (
                              <List.Item.Detail.Metadata.TagList.Item
                                key={t.text}
                                text={t.text}
                                color={t.color}
                              />
                            )
                          })}
                        </List.Item.Detail.Metadata.TagList>
                      </>
                    )}
                  </List.Item.Detail.Metadata>
                }
              />
            }
            actions={
              <ActionPanel>
                <Action
                  title="Open Detail"
                  onAction={() => { push(<GraphDetailView item={item} />) }}
                />
              </ActionPanel>
            }
          />
        )
      })}
    </List>
  )
}

renderWithProviders(<GraphStylesExample />)
