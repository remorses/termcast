// Example: BarChart component showcase with horizontal stacked bars.
// Demonstrates budget breakdowns, disk usage, portfolios, and stress tests
// with many segments. Shows BarChart in list detail metadata and full Detail view.

import React from 'react'
import { List, Detail, BarChart, Graph, Color, Action, ActionPanel } from 'termcast'
import { useNavigation } from 'termcast/src/internal/navigation'
import { renderWithProviders } from '../utils'

// ── Item definitions ─────────────────────────────────────────────────

interface BarItem {
  title: string
  subtitle: string
  segments: Array<{ value: number; label?: string; color?: Color.ColorLike }>
  markdown?: string
  meta: Array<{ title: string; text: string; color?: Color.ColorLike }>
  /** Optional line chart data shown alongside the bar */
  lineData?: { data: number[]; xLabels: string[] }
}

const items: BarItem[] = [
  // ── Budget breakdown (3 segments) ──────────────────────────
  {
    title: 'Monthly Budget',
    subtitle: 'Spent / Remaining / Savings',
    segments: [
      { value: 4850, label: 'Spent' },
      { value: 707, label: 'Remaining' },
      { value: 617, label: 'Savings' },
    ],
    markdown: [
      '## Monthly Budget',
      '',
      'Budget allocation for the current month.',
      '',
      '- **Spent**: $4,850 (78.6%)',
      '- **Remaining**: $707 (11.5%)',
      '- **Savings**: $617 (10.0%)',
    ].join('\n'),
    meta: [
      { title: 'Total', text: '$6,174' },
      { title: 'Spent', text: '78.6%', color: Color.Red },
      { title: 'Saved', text: '10.0%', color: Color.Green },
    ],
  },

  // ── Disk usage (4 segments) ────────────────────────────────
  {
    title: 'Disk Usage',
    subtitle: 'System / Apps / Media / Free',
    segments: [
      { value: 120, label: 'System' },
      { value: 85, label: 'Apps' },
      { value: 210, label: 'Media' },
      { value: 85, label: 'Free' },
    ],
    meta: [
      { title: 'Total', text: '500 GB' },
      { title: 'Used', text: '415 GB (83%)', color: Color.Orange },
      { title: 'Free', text: '85 GB (17%)', color: Color.Green },
    ],
  },

  // ── Portfolio (5 segments) ─────────────────────────────────
  {
    title: 'Investment Portfolio',
    subtitle: 'Stocks / Bonds / Cash / Crypto / Real Estate',
    segments: [
      { value: 45000, label: 'Stocks' },
      { value: 20000, label: 'Bonds' },
      { value: 10000, label: 'Cash' },
      { value: 8000, label: 'Crypto' },
      { value: 17000, label: 'Real Estate' },
    ],
    markdown: [
      '## Portfolio Allocation',
      '',
      'Diversified across 5 asset classes.',
      '',
      '| Asset | Value | % |',
      '|-------|-------|---|',
      '| Stocks | $45k | 45% |',
      '| Bonds | $20k | 20% |',
      '| Real Estate | $17k | 17% |',
      '| Cash | $10k | 10% |',
      '| Crypto | $8k | 8% |',
    ].join('\n'),
    meta: [
      { title: 'Total', text: '$100,000' },
      { title: 'Risk', text: 'Moderate', color: Color.Yellow },
    ],
  },

  // ── CPU breakdown (4 segments) ─────────────────────────────
  {
    title: 'CPU Time',
    subtitle: 'User / System / IO Wait / Idle',
    segments: [
      { value: 42, label: 'User' },
      { value: 18, label: 'System' },
      { value: 5, label: 'IO Wait' },
      { value: 35, label: 'Idle' },
    ],
    lineData: {
      data: [25, 30, 45, 60, 55, 72, 80, 65, 50, 40, 35, 55, 70, 85, 90, 75, 60, 45, 38, 30],
      xLabels: ['0h', '6h', '12h', '18h', '24h'],
    },
    meta: [
      { title: 'User', text: '42%', color: Color.Blue },
      { title: 'System', text: '18%', color: Color.Orange },
      { title: 'Idle', text: '35%', color: Color.Green },
    ],
  },

  // ── Revenue split (6 segments) ─────────────────────────────
  {
    title: 'Revenue by Product',
    subtitle: '6 product lines',
    segments: [
      { value: 380, label: 'Enterprise' },
      { value: 240, label: 'Pro' },
      { value: 150, label: 'Starter' },
      { value: 90, label: 'API' },
      { value: 60, label: 'Add-ons' },
      { value: 30, label: 'Support' },
    ],
    meta: [
      { title: 'Total ARR', text: '$950K' },
      { title: 'Top product', text: 'Enterprise (40%)', color: Color.Green },
    ],
  },

  // ── Two even (50/50) ───────────────────────────────────────
  {
    title: 'A/B Test Split',
    subtitle: 'Control vs Variant (50/50)',
    segments: [
      { value: 50, label: 'Control' },
      { value: 50, label: 'Variant' },
    ],
    meta: [
      { title: 'Control', text: '50%' },
      { title: 'Variant', text: '50%' },
      { title: 'p-value', text: '0.043', color: Color.Green },
    ],
  },

  // ── Single segment (100%) ──────────────────────────────────
  {
    title: 'Storage Full',
    subtitle: '100% used',
    segments: [
      { value: 100, label: 'Used' },
    ],
    meta: [
      { title: 'Status', text: 'FULL', color: Color.Red },
      { title: 'Action', text: 'Delete files!' },
    ],
  },

  // ── Dominant + tiny segments ───────────────────────────────
  {
    title: 'Market Share',
    subtitle: 'One dominant + many tiny players',
    segments: [
      { value: 85, label: 'Leader' },
      { value: 5, label: 'Runner-up' },
      { value: 3, label: 'Third' },
      { value: 2, label: 'Fourth' },
      { value: 1.5, label: 'Fifth' },
      { value: 1, label: 'Sixth' },
      { value: 0.8 },
      { value: 0.5 },
      { value: 0.4 },
      { value: 0.3 },
      { value: 0.2 },
      { value: 0.1 },
      { value: 0.1 },
      { value: 0.1 },
    ],
    markdown: [
      '## Market Concentration',
      '',
      'Highly concentrated market with one dominant player at **85%**.',
      'Many tiny segments should be hidden or collapsed.',
      '',
      'Tests behavior with 14 segments where most are < 1%.',
    ].join('\n'),
    meta: [
      { title: 'HHI', text: '7,264 (monopoly)', color: Color.Red },
      { title: 'Segments', text: '14 total' },
      { title: 'Visible', text: 'Tiny ones hidden' },
    ],
  },

  // ── Many equal segments ────────────────────────────────────
  {
    title: 'Equal Distribution',
    subtitle: '10 equal segments',
    segments: Array.from({ length: 10 }, (_, i) => ({
      value: 10,
      label: `Slice ${i + 1}`,
    })),
    meta: [
      { title: 'Segments', text: '10' },
      { title: 'Each', text: '10%' },
    ],
  },

  // ── Custom colors ──────────────────────────────────────────
  {
    title: 'Custom Colors',
    subtitle: 'Explicit color per segment',
    segments: [
      { value: 40, label: 'Red', color: Color.Red },
      { value: 30, label: 'Green', color: Color.Green },
      { value: 20, label: 'Blue', color: Color.Blue },
      { value: 10, label: 'Yellow', color: Color.Yellow },
    ],
    meta: [
      { title: 'Mode', text: 'Manual colors' },
      { title: 'Override', text: 'Per-segment color prop' },
    ],
  },

  // ── Needs/Wants budget ─────────────────────────────────────
  {
    title: 'Needs vs Wants',
    subtitle: '50/30/20 budget rule',
    segments: [
      { value: 2826, label: 'Needs' },
      { value: 2023, label: 'Wants' },
      { value: 617, label: 'Savings' },
    ],
    lineData: {
      data: [150, 155, 148, 162, 158, 165, 170, 168, 175, 180, 178, 185, 190, 188, 195, 192, 198, 202, 200, 208],
      xLabels: ['W1', 'W2', 'W3', 'W4'],
    },
    meta: [
      { title: 'Needs', text: '51.7%', color: Color.Orange },
      { title: 'Wants', text: '37.0%', color: Color.Blue },
      { title: 'Savings', text: '11.3%', color: Color.Green },
    ],
  },

  // ── Stress test: 20 segments ───────────────────────────────
  {
    title: 'Stress Test (20 items)',
    subtitle: 'Many small equal segments',
    segments: Array.from({ length: 20 }, (_, i) => ({
      value: 5,
      label: `S${i + 1}`,
    })),
    markdown: [
      '## Stress Test',
      '',
      '20 equal segments at 5% each.',
      'Tests color cycling (7 colors, wraps around).',
      'Labels may be hidden when segments are narrow.',
    ].join('\n'),
    meta: [
      { title: 'Segments', text: '20' },
      { title: 'Colors', text: '7 (cycling)' },
    ],
  },
]

// ── Full Detail view (pushed on Enter) ───────────────────────────────

function BarChartDetailView({ item }: { item: BarItem }): any {
  const { pop } = useNavigation()

  const markdown = [
    `# ${item.title}`,
    '',
    item.subtitle,
    '',
    ...(item.markdown ? [item.markdown, ''] : []),
    `**Segments:** ${item.segments.length}  `,
    `**Total:** ${item.segments.reduce((s, seg) => s + seg.value, 0).toLocaleString()}`,
  ].join('\n')

  return (
    <Detail
      navigationTitle={item.title}
      markdown={markdown}
      metadata={
        <Detail.Metadata>
          <BarChart height={1}>
            {item.segments.map((seg, i) => {
              return (
                <BarChart.Segment
                  key={i}
                  value={seg.value}
                  label={seg.label}
                  color={seg.color}
                />
              )
            })}
          </BarChart>
          {Boolean(item.lineData) && (
            <>
              <Detail.Metadata.Separator />
              <Graph
                height={10}
                xLabels={item.lineData!.xLabels}
                variant="area"
                yFormat={(v) => v.toFixed(0)}
              >
                <Graph.Line data={item.lineData!.data} color={Color.Orange} />
              </Graph>
            </>
          )}
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

function GraphBarChartExample() {
  const { push } = useNavigation()

  return (
    <List navigationTitle="BarChart Showcase" isShowingDetail={true}>
      {items.map((item) => {
        return (
          <List.Item
            key={item.title}
            title={item.title}
            subtitle={item.subtitle}
            detail={
              <List.Item.Detail
                metadata={
                  <List.Item.Detail.Metadata>
                    <BarChart height={1}>
                      {item.segments.map((seg, i) => {
                        return (
                          <BarChart.Segment
                            key={i}
                            value={seg.value}
                            label={seg.label}
                            color={seg.color}
                          />
                        )
                      })}
                    </BarChart>
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
                    {Boolean(item.lineData) && (
                      <>
                        <List.Item.Detail.Metadata.Separator />
                        <Graph
                          height={6}
                          xLabels={item.lineData!.xLabels}
                          variant="area"
                          yTicks={3}
                          yFormat={(v) => v.toFixed(0)}
                        >
                          <Graph.Line data={item.lineData!.data} color={Color.Orange} />
                        </Graph>
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
                  onAction={() => { push(<BarChartDetailView item={item} />) }}
                />
              </ActionPanel>
            }
          />
        )
      })}
    </List>
  )
}

renderWithProviders(<GraphBarChartExample />)
