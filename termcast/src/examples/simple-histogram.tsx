// Example: Histogram component showing action distribution from an AI coding session.
// Replicates the horizontal distribution table with colored dots, counts, percentages,
// and bar visualization.

import React from 'react'
import { List, Histogram, Color } from 'termcast'
import { renderWithProviders } from '../utils'

// ── Data ─────────────────────────────────────────────────────────────

interface SessionData {
  title: string
  subtitle: string
  actions: Array<{ label: string; value: number; color?: Color.ColorLike }>
}

const sessions: SessionData[] = [
  {
    title: 'Session: refactor(dataset)',
    subtitle: '257 steps · 47m 12s wall · 5.4M tokens',
    actions: [
      { label: 'user', value: 5, color: Color.Orange },
      { label: 'think', value: 13, color: Color.SecondaryText },
      { label: 'read', value: 44, color: '#00CCCC' },
      { label: 'edit', value: 108, color: Color.Purple },
      { label: 'bash', value: 64, color: Color.Yellow },
      { label: 'write', value: 17, color: Color.Green },
      { label: 'grep/glob', value: 6, color: Color.Blue },
    ],
  },
  {
    title: 'Session: add dark mode',
    subtitle: '89 steps · 12m 30s wall · 1.2M tokens',
    actions: [
      { label: 'user', value: 8 },
      { label: 'think', value: 20 },
      { label: 'read', value: 15 },
      { label: 'edit', value: 30 },
      { label: 'bash', value: 12 },
      { label: 'write', value: 4 },
    ],
  },
  {
    title: 'Session: fix auth bug',
    subtitle: '42 steps · 5m 18s wall · 800K tokens',
    actions: [
      { label: 'think', value: 10 },
      { label: 'read', value: 8 },
      { label: 'edit', value: 15 },
      { label: 'bash', value: 7 },
      { label: 'grep/glob', value: 2 },
    ],
  },
]

// ── Component ────────────────────────────────────────────────────────

function HistogramExample() {
  return (
    <List navigationTitle="Histogram Showcase" isShowingDetail={true}>
      {sessions.map((session) => (
        <List.Item
          key={session.title}
          title={session.title}
          subtitle={session.subtitle}
          detail={
            <List.Item.Detail
              metadata={
                <List.Item.Detail.Metadata>
                  <Histogram maxBarWidth={30}>
                    {session.actions.map((action) => (
                      <Histogram.Item
                        key={action.label}
                        label={action.label}
                        value={action.value}
                        color={action.color}
                      />
                    ))}
                  </Histogram>
                </List.Item.Detail.Metadata>
              }
            />
          }
        />
      ))}
    </List>
  )
}

renderWithProviders(<HistogramExample />)
