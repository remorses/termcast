// Example: CandleChart component showing realistic crypto OHLC data.
// List of markets with candlestick charts in the side detail panel.
// Green bars = bullish (close >= open), red bars = bearish (close < open).
// Wicks extend from body to high/low extremes.
//
// Demonstrates:
// - CandleChart in List.Item.Detail (side panel)
// - CandleChart in full-page Detail (pushed on Enter)
// - Mixed component types: CandleChart + Graph overlay, CandleChart + BarChart volume,
//   Row for side-by-side comparisons, metadata with tags
// - Realistic crypto market action from frozen Coinbase daily OHLCV data

import React from 'react'
import { Action, ActionPanel, List, Detail, Color, CandleChart, Graph, BarChart, Row } from 'termcast'
import type { CandleData } from 'termcast'
import { useNavigation } from 'termcast/src/internal/navigation'
import { renderWithProviders } from '../utils'
import { cryptoMarketData } from './simple-candle-chart-data'

interface Market {
  symbol: string
  displaySymbol: string
  name: string
  sector: string
  currentPrice: number
  change: number
  priceDecimals: number
  candles: CandleData[]
  closingPrices: number[]
  volume: number[]
}

interface MixedItem {
  title: string
  subtitle: string
  market: Market
  mode: 'candle-only' | 'candle-with-line' | 'candle-with-volume' | 'side-by-side'
}

const tickers: Market[] = cryptoMarketData.map((market) => {
  const candles: CandleData[] = market.candles.map((candle) => {
    return {
      open: candle.open,
      close: candle.close,
      high: candle.high,
      low: candle.low,
    }
  })

  return {
    symbol: market.symbol,
    displaySymbol: market.symbol.replace('-USD', ''),
    name: market.name,
    sector: market.sector,
    currentPrice: market.currentPrice,
    change: market.change,
    priceDecimals: market.priceDecimals,
    candles,
    closingPrices: candles.map((candle) => {
      return candle.close
    }),
    volume: [...market.volume],
  }
})

const mixedItems: MixedItem[] = [
  { title: 'BTC - Candles', subtitle: 'Real BTC/USD hourly candles', market: tickers[0]!, mode: 'candle-only' },
  { title: 'ETH - Candle + Line', subtitle: 'Candles plus closing line', market: tickers[1]!, mode: 'candle-with-line' },
  { title: 'SOL - Candle + Volume', subtitle: 'Candles plus volume split', market: tickers[2]!, mode: 'candle-with-volume' },
  { title: 'BTC vs ETH', subtitle: 'Side-by-side crypto leaders', market: tickers[0]!, mode: 'side-by-side' },
  { title: 'DOGE - Candle + Line', subtitle: 'Low-priced asset formatting', market: tickers[4]!, mode: 'candle-with-line' },
]

// 300 hourly candles ≈ 12.5 days
const xLabels = ['12d', '8d', '4d', 'Now']

function formatNumber({ value, decimals }: { value: number; decimals: number }): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

function formatPrice({ value, decimals }: { value: number; decimals: number }): string {
  return `$${formatNumber({ value, decimals })}`
}

function formatPercent(change: number): string {
  return change >= 0 ? `+${change.toFixed(1)}%` : `${change.toFixed(1)}%`
}

function changeColor(change: number): Color.ColorLike {
  if (change > 0) return Color.Green
  if (change < 0) return Color.Red
  return Color.SecondaryText
}

function yAxisFormatter({ market }: { market: Market }): (value: number) => string {
  return (value) => {
    return formatPrice({ value, decimals: market.priceDecimals })
  }
}

function ChartForMode({ item, height }: { item: MixedItem; height: number }): any {
  const { market } = item
  const yFormat = yAxisFormatter({ market })

  switch (item.mode) {
    case 'candle-only': {
      return (
        <CandleChart
          data={market.candles}
          height={height}
          xLabels={xLabels}
          yTicks={4}
          yFormat={yFormat}
        />
      )
    }
    case 'candle-with-line': {
      return (
        <>
          <CandleChart
            data={market.candles}
            height={height}
            xLabels={xLabels}
            yTicks={4}
            yFormat={yFormat}
          />
          <Graph
            height={Math.max(5, height - 3)}
            xLabels={xLabels}
            yTicks={3}
            yFormat={yFormat}
            variant="area"
          >
            <Graph.Line data={market.closingPrices} color={Color.Blue} title="Close" />
          </Graph>
        </>
      )
    }
    case 'candle-with-volume': {
      const firstHalf = market.volume.slice(0, 15).reduce((sum, value) => {
        return sum + value
      }, 0)
      const secondHalf = market.volume.slice(15).reduce((sum, value) => {
        return sum + value
      }, 0)

      return (
        <>
          <CandleChart
            data={market.candles}
            height={height}
            xLabels={xLabels}
            yTicks={4}
            yFormat={yFormat}
          />
          <BarChart height={1}>
            <BarChart.Segment value={firstHalf} label="First half" color={Color.Blue} />
            <BarChart.Segment value={secondHalf} label="Second half" color={Color.Orange} />
          </BarChart>
        </>
      )
    }
    case 'side-by-side': {
      const eth = tickers[1]!
      return (
        <Row>
          <CandleChart
            data={market.candles}
            height={height}
            xLabels={['30d', 'Now']}
            yTicks={3}
            yFormat={yAxisFormatter({ market })}
          />
          <CandleChart
            data={eth.candles}
            height={height}
            xLabels={['30d', 'Now']}
            yTicks={3}
            yFormat={yAxisFormatter({ market: eth })}
          />
        </Row>
      )
    }
  }
}

function CandleDetailView({ item }: { item: MixedItem }): any {
  const { pop } = useNavigation()
  const { market } = item
  const changeStr = formatPercent(market.change)

  const markdown = [
    `# ${market.displaySymbol} - ${market.name}`,
    '',
    `**Category:** ${market.sector}`,
    '',
    `**Price:** ${formatPrice({ value: market.currentPrice, decimals: market.priceDecimals })}  `,
    `**24h change:** ${changeStr}`,
    '',
    `**Mode:** \`${item.mode}\``,
    '',
    '300 hourly candles from Coinbase Exchange, frozen so the example stays deterministic.',
  ].join('\n')

  return (
    <Detail
      navigationTitle={`${market.displaySymbol} Detail`}
      markdown={markdown}
      metadata={
        <Detail.Metadata>
          <ChartForMode item={item} height={15} />
          <Detail.Metadata.Separator />
          <Detail.Metadata.Label
            title="Price"
            text={{ value: formatPrice({ value: market.currentPrice, decimals: market.priceDecimals }), color: changeColor(market.change) }}
          />
          <Detail.Metadata.Label
            title="Change"
            text={{ value: changeStr, color: changeColor(market.change) }}
          />
          <Detail.Metadata.Label title="Category" text={market.sector} />
          <Detail.Metadata.Separator />
          <Detail.Metadata.TagList title="Components">
            <Detail.Metadata.TagList.Item text="CandleChart" color={Color.Green} />
            {item.mode === 'candle-with-line' && (
              <Detail.Metadata.TagList.Item text="Graph" color={Color.Blue} />
            )}
            {item.mode === 'candle-with-volume' && (
              <Detail.Metadata.TagList.Item text="BarChart" color={Color.Orange} />
            )}
            {item.mode === 'side-by-side' && (
              <Detail.Metadata.TagList.Item text="Row" color={Color.Purple} />
            )}
          </Detail.Metadata.TagList>
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

function SimpleCandleChart() {
  const { push } = useNavigation()

  return (
    <List
      navigationTitle="Crypto Markets"
      searchBarPlaceholder="Search markets..."
      isShowingDetail={true}
    >
      <List.Section title="Watchlist">
        {tickers.map((market) => {
          const changeStr = formatPercent(market.change)
          return (
            <List.Item
              key={market.symbol}
              id={market.symbol}
              title={market.displaySymbol}
              subtitle={market.name}
              accessories={[
                { text: { value: formatPrice({ value: market.currentPrice, decimals: market.priceDecimals }), color: changeColor(market.change) } },
                { text: { value: changeStr, color: changeColor(market.change) } },
              ]}
              detail={
                <List.Item.Detail
                  metadata={
                    <List.Item.Detail.Metadata>
                      <CandleChart
                        data={market.candles}
                        height={10}
                        xLabels={xLabels}
                        yTicks={4}
                        yFormat={yAxisFormatter({ market })}
                      />
                      <List.Item.Detail.Metadata.Label
                        title="Price"
                        text={{ value: formatPrice({ value: market.currentPrice, decimals: market.priceDecimals }), color: changeColor(market.change) }}
                      />
                      <List.Item.Detail.Metadata.Label
                        title="Change"
                        text={{ value: changeStr, color: changeColor(market.change) }}
                      />
                      <List.Item.Detail.Metadata.Label title="Category" text={market.sector} />
                      <List.Item.Detail.Metadata.Separator />
                      <List.Item.Detail.Metadata.Label title={`${market.symbol} Hourly OHLC`} />
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
                        <CandleDetailView
                          item={{ title: market.displaySymbol, subtitle: market.name, market, mode: 'candle-only' }}
                        />,
                      )
                    }}
                  />
                </ActionPanel>
              }
            />
          )
        })}
      </List.Section>

      <List.Section title="Mixed Components">
        {mixedItems.map((item) => {
          const { market } = item
          const changeStr = formatPercent(market.change)
          return (
            <List.Item
              key={item.title}
              id={item.title}
              title={item.title}
              subtitle={item.subtitle}
              accessories={[
                { text: { value: formatPrice({ value: market.currentPrice, decimals: market.priceDecimals }), color: changeColor(market.change) } },
              ]}
              detail={
                <List.Item.Detail
                  metadata={
                    <List.Item.Detail.Metadata>
                      <ChartForMode item={item} height={8} />
                      <List.Item.Detail.Metadata.Separator />
                      <List.Item.Detail.Metadata.Label
                        title="Price"
                        text={{ value: formatPrice({ value: market.currentPrice, decimals: market.priceDecimals }), color: changeColor(market.change) }}
                      />
                      <List.Item.Detail.Metadata.Label
                        title="Change"
                        text={{ value: changeStr, color: changeColor(market.change) }}
                      />
                    </List.Item.Detail.Metadata>
                  }
                />
              }
              actions={
                <ActionPanel>
                  <Action
                    title="Open Detail"
                    onAction={() => { push(<CandleDetailView item={item} />) }}
                  />
                </ActionPanel>
              }
            />
          )
        })}
      </List.Section>
    </List>
  )
}

renderWithProviders(<SimpleCandleChart />)
