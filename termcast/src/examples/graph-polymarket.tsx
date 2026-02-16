// Example: Polymarket-style prediction market UI.
// List of markets with odds graphs in the side detail panel.
// Each market shows a probability line chart over time.

import React from 'react'
import { Action, ActionPanel, List, Color, Graph } from 'termcast'
import { renderWithProviders } from '../utils'

interface Market {
  id: string
  title: string
  category: string
  currentOdds: number // 0-100 percentage for "Yes"
  volume: string
  endDate: string
  // 30 data points of odds history (0-100)
  oddsHistory: number[]
}

// Generate slightly noisy trend data
function generateOdds({ start, end, volatility = 5 }: { start: number; end: number; volatility?: number }): number[] {
  const points = 30
  const result: number[] = []
  let current = start
  const step = (end - start) / (points - 1)
  for (let i = 0; i < points; i++) {
    const noise = (Math.sin(i * 1.7) + Math.cos(i * 0.8)) * volatility
    current = start + step * i + noise
    result.push(Math.max(1, Math.min(99, Math.round(current * 10) / 10)))
  }
  // Ensure last point matches target
  result[points - 1] = end
  return result
}

const markets: Market[] = [
  {
    id: 'btc-100k',
    title: 'Bitcoin above $100k by EOY',
    category: 'Crypto',
    currentOdds: 72,
    volume: '$4.2M',
    endDate: 'Dec 31, 2026',
    oddsHistory: generateOdds({ start: 45, end: 72, volatility: 8 }),
  },
  {
    id: 'eth-merge',
    title: 'ETH above $5k by Q2 2026',
    category: 'Crypto',
    currentOdds: 38,
    volume: '$1.8M',
    endDate: 'Jun 30, 2026',
    oddsHistory: generateOdds({ start: 55, end: 38, volatility: 6 }),
  },
  {
    id: 'fed-rate',
    title: 'Fed cuts rates below 4%',
    category: 'Economics',
    currentOdds: 61,
    volume: '$8.1M',
    endDate: 'Dec 31, 2026',
    oddsHistory: generateOdds({ start: 40, end: 61, volatility: 4 }),
  },
  {
    id: 'sp500-6k',
    title: 'S&P 500 reaches 6,000',
    category: 'Markets',
    currentOdds: 55,
    volume: '$3.5M',
    endDate: 'Dec 31, 2026',
    oddsHistory: generateOdds({ start: 35, end: 55, volatility: 7 }),
  },
  {
    id: 'trump-pardon',
    title: 'Presidential pardon for SBF',
    category: 'Politics',
    currentOdds: 8,
    volume: '$920K',
    endDate: 'Jan 20, 2027',
    oddsHistory: generateOdds({ start: 15, end: 8, volatility: 3 }),
  },
  {
    id: 'ai-agi',
    title: 'AGI announced by major lab',
    category: 'Tech',
    currentOdds: 12,
    volume: '$2.1M',
    endDate: 'Dec 31, 2026',
    oddsHistory: generateOdds({ start: 5, end: 12, volatility: 3 }),
  },
  {
    id: 'sol-flip-eth',
    title: 'Solana flips Ethereum market cap',
    category: 'Crypto',
    currentOdds: 18,
    volume: '$1.4M',
    endDate: 'Dec 31, 2026',
    oddsHistory: generateOdds({ start: 8, end: 18, volatility: 5 }),
  },
  {
    id: 'recession-2026',
    title: 'US enters recession in 2026',
    category: 'Economics',
    currentOdds: 28,
    volume: '$5.7M',
    endDate: 'Dec 31, 2026',
    oddsHistory: generateOdds({ start: 20, end: 28, volatility: 4 }),
  },
]

const xLabels = ['30d', '20d', '10d', 'Now']

function oddsColor(odds: number): Color.ColorLike {
  if (odds >= 65) return Color.Green
  if (odds >= 40) return Color.Yellow
  return Color.Red
}

function PolymarketExample() {
  return (
    <List
      navigationTitle="Polymarket"
      searchBarPlaceholder="Search markets..."
      isShowingDetail={true}
    >
      <List.Section title="Trending Markets">
        {markets.map((market) => {
          return (
            <List.Item
              key={market.id}
              id={market.id}
              title={market.title}
              subtitle={market.category}
              accessories={[
                { text: { value: `${market.currentOdds}%`, color: oddsColor(market.currentOdds) } },
              ]}
              detail={
                <List.Item.Detail
                  metadata={
                    <List.Item.Detail.Metadata>
                      <Graph
                        height={8}
                        xLabels={xLabels}
                        yRange={[0, 100]}
                        yTicks={3}
                        variant="area"
                        yFormat={(v) => `${v.toFixed(0)}%`}
                      >
                        <Graph.Line
                          data={market.oddsHistory}
                          color={oddsColor(market.currentOdds)}
                          title="Yes"
                        />
                      </Graph>
                      <List.Item.Detail.Metadata.Label
                        title="Odds"
                        text={{ value: `${market.currentOdds}% Yes`, color: oddsColor(market.currentOdds) }}
                      />
                      <List.Item.Detail.Metadata.Label title="Volume" text={market.volume} />
                      <List.Item.Detail.Metadata.Label title="Ends" text={market.endDate} />
                      <List.Item.Detail.Metadata.Separator />
                      <List.Item.Detail.Metadata.Label title="Probability (30d)" />

                    </List.Item.Detail.Metadata>
                  }
                />
              }
              actions={
                <ActionPanel>
                  <Action title="Buy Yes" onAction={() => {}} />
                  <Action title="Buy No" onAction={() => {}} />
                </ActionPanel>
              }
            />
          )
        })}
      </List.Section>
    </List>
  )
}

renderWithProviders(<PolymarketExample />)
