// E2E tests for CandleChart component showing realistic crypto OHLC candles.
// Verifies candle body (▌/▘/▖) and wick (│) characters render,
// Y-axis labels, X-axis labels, and navigation between tickers.
// Also tests full-page Detail view and mixed component types
// (CandleChart + Graph, CandleChart + BarChart, Row side-by-side).

import { test, expect, afterEach, beforeEach } from 'vitest'
import { launchTerminal, Session } from 'tuistory/src'

let session: Session

beforeEach(async () => {
  session = await launchTerminal({
    command: 'bun',
    args: ['src/examples/simple-candle-chart.tsx'],
    cols: 100,
    rows: 30,
  })
})

afterEach(() => {
  session?.close()
})

test('candle chart renders in list detail with axes', async () => {
  const text = await session.text({
    waitFor: (text) => {
      return text.includes('BTC') && text.includes('$') && text.includes('12d')
    },
    timeout: 10000,
  })

  expect(text).toMatchInlineSnapshot(`
    "


       Crypto Markets ───────────────────────────────────────────────────────────────────────────────

       > Search markets...

       Watchlist                                      │ $74,678│                           │
      ›BTC Bitcoin                                    │        │                          ▌▌▖│
       ETH Ethereum                                   │        │                          ▌│▘▌▖│
       SOL Solana                                     │ $70,438│       │             │    ▌  │▘▘▌
       XRP XRP                                        │        │      ▖▖▖▖           ▌▌ ▖▖▌     ▌││
       DOGE Dogecoin                                  │        │      ▌││▌▖▖    ▖▖│││▌▘▌▌│      ▘▘▘▌
       BNB BNB                                        │ $66,197│▖▖   │▌  ▘▘▘▌▖▖▌▘▌▖▌▌▌ ▘▘
                                                      │        ││▌▖ │▌▘     ▘▘▌▌  ▘▘▘▘
       Mixed Components                               │        │ │▌▌▘▘        ▘▘
       BTC - Candles Real BTC/USD hourly candles      │ $61,957│  ││
       ETH - Candle + Line Candles plus closing line  │         12d        8d         4d         Now
       SOL - Candle + Volume Candles plus volume spli │
       BTC vs ETH Side-by-side crypto leaders         │ Price:    $67,641
       DOGE - Candle + Line Low-priced asset formatti │
                                                      │ Change:   -0.2%
                                                      │
                                                      │ Category: Store of Value
                                                      │
                                                      │ ────────────────────────────────────────────
                                                      │
       ↵ open detail   ↑↓ navigate   ^k actions       │ BTC-USD Hourly OHLC


    "
  `)

  expect(text).toContain('BTC')
  expect(text).toContain('12d')
  expect(text).toContain('Now')
  expect(text).toContain('$')
}, 30000)

test('push to full-page detail view on Enter', async () => {
  await session.text({ waitFor: (t) => t.includes('BTC'), timeout: 10000 })
  // Press Enter to push to Detail view
  session.sendKey('return')

  const text = await session.text({
    waitFor: (t) => t.includes('candle-only') && t.includes('Go Back'),
    timeout: 10000,
  })

  expect(text).toMatchInlineSnapshot(`
    "


                                                                                                     █

      BTC - Bitcoin

      Category: Store of Value

      Price: $67,641
      24h change: -0.2%

      Mode: candle-only

      300 hourly candles from Coinbase Exchange, frozen so the example stays deterministic.

      $74,678│                                                                │
             │                                                              ▖▌▌│  │
             │                                                              ▌│▘▌▖▖▌▌
             │                                                             │▌   ││ ▌│││
             │                                                             ▌▘      ▘▌▖▌▌▖▖
      $70,438│                 │                               │          │▌          │││▌
             │                ▌▌ │                             ▌▌▖▖   ││││▌▘             ▘▌
             │                ▌▘▌▌▘▌▖│  ││           │         ▌││▘▌▖│▌▌▖▖▌               ▌▖▖▖▖▖▖▖
             │               ▖▌ │││ ▌▌▘▌▌▌         │▖▖▖ ││ ││  ▌   │▌│▌││▘▘               ││  ▘▘│▘
      $66,197│▖▖▖         │  ▌      ▘▘ │ ▘▌▖      │▌▘ ▘▌▌▌│▖▌▌▖▌    ▘▌▌


      esc go back   ^k actions   ↵ Go Back                                     powered by termcast.app

    "
  `)

  // Full-page detail has larger chart and markdown content
  expect(text).toContain('Bitcoin')
  expect(text).toContain('candle-only')
}, 30000)

test('candle + line overlay (mixed components)', async () => {
  await session.text({ waitFor: (t) => t.includes('Mixed Components'), timeout: 10000 })
  // Navigate past Watchlist (6 items) to Mixed Components section,
  // then one more item to ETH - Candle + Line.
  for (let i = 0; i < 7; i++) {
    session.sendKey('down')
  }

  const text = await session.text({
    waitFor: (t) => t.includes('›ETH - Candle + Line') && t.includes('closing line'),
    timeout: 10000,
  })

  expect(text).toMatchInlineSnapshot(`
    "


       Crypto Markets ───────────────────────────────────────────────────────────────────────────────

       > Search markets...

       Watchlist                                      │ $2,220│                            │
       BTC Bitcoin                                    │       │       │                   ▌▌▖▖
       ETH Ethereum                                   │ $2,073│       ▖▖▖ │         ▖▖   ▖▌▘▘▌▖▖▖
       SOL Solana                                     │       │      │▌│▘▌▌▌    ▖▖  ▌▘▌││▌│  │││▌
       XRP XRP                                        │       │     │▌▘  │ ▌▖  ▖▌▘▌▖▌ ▌▌▘▘      ▌▌▘▘
       DOGE Dogecoin                                  │ $1,927│▖▖   ▖▌     │▘▌▖▌  │││  │
       BNB BNB                                        │       │▘▘▌▖▌▘│       ▘▘
                                                      │ $1,780│  ▘▘
       Mixed Components                               │        12d        8d          4d         Now
       BTC - Candles Real BTC/USD hourly candles      │
      ›ETH - Candle + Line Candles plus closing line  │ $2,197│                           ⢠⣆⣠⡀
       SOL - Candle + Volume Candles plus volume spli │       │       ⣴⣤⣤ ⣀         ⢠⣀   ⢠⣿⣿⣿⣷⣶⣦⡀
       BTC vs ETH Side-by-side crypto leaders         │ $1,997│      ⢰⣿⣿⣿⣿⣿⣇   ⣠⣷⣴⣄⣀⢸⣿⣶⣠⣤⣼⣿⣿⣿⣿⣿⣿⣧⣤⣤⣤
       DOGE - Candle + Line Low-priced asset formatti │       │⣶⡄   ⣦⣾⣿⣿⣿⣿⣿⣿⣶⣶⢠⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
                                                      │ $1,797│⣿⣿⣷⣦⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
                                                      │        12d        8d          4d         Now
                                                      │
                                                      │ ────────────────────────────────────────────
                                                      │
                                                      │ Price:  $1,971
                                                      │
       ↵ open detail   ↑↓ navigate   ^k actions       │ Change: -0.3%

    "
  `)

  expect(text).toContain('Candle + Line')
}, 30000)

test('candle + volume bar chart (mixed components)', async () => {
  await session.text({ waitFor: (t) => t.includes('Mixed Components'), timeout: 10000 })
  // Navigate to "Candle + Volume" item (8 downs from top)
  for (let i = 0; i < 8; i++) {
    session.sendKey('down')
  }

  const text = await session.text({
    waitFor: (t) => t.includes('›SOL - Candle + Volume') && t.includes('half'),
    timeout: 10000,
  })

  expect(text).toMatchInlineSnapshot(`
    "


       Crypto Markets ───────────────────────────────────────────────────────────────────────────────

       > Search markets...

       Watchlist                                      │ $95.03│                           ││
       BTC Bitcoin                                    │       │       │             │     ▖▖▖▖
       ETH Ethereum                                   │ $88.26│       ▌▌▖ ││    │   ▖▖   ▌▘▘▘▌▌▌│
       SOL Solana                                     │       │      ▖▌│▘▌▌▌   │▌▌▖▖▌▘▌▖▌▘     ▘▌│││
       XRP XRP                                        │       │     │▌   │ ▌▖│ ▌▘▘▘▌▌ ▘▘││      ▘▘▘▌
       DOGE Dogecoin                                  │ $81.48│▖▖   ▌▘     │▘▌▌▘  │
       BNB BNB                                        │       │▘▘▌▖▌▘        ▘▘
                                                      │ $74.71│  ▘▘│
       Mixed Components                               │        12d        8d          4d         Now
       BTC - Candles Real BTC/USD hourly candles      │
       ETH - Candle + Line Candles plus closing line  │   ┌Second half: 95.3%┐
      ›SOL - Candle + Volume Candles plus volume spli │
       BTC vs ETH Side-by-side crypto leaders         │
       DOGE - Candle + Line Low-priced asset formatti │ ────────────────────────────────────────────
                                                      │
                                                      │ Price:  $83.31
                                                      │
       ↵ open detail   ↑↓ navigate   ^k actions       │ Change: -0.4%





    "
  `)

  expect(text).toContain('Candle + Volume')
}, 30000)

test('side-by-side candle charts in Row', async () => {
  await session.text({ waitFor: (t) => t.includes('Mixed Components'), timeout: 10000 })
  // Navigate to "BTC vs ETH" item (9 downs from top)
  for (let i = 0; i < 9; i++) {
    session.sendKey('down')
  }

  const text = await session.text({
    waitFor: (t) => t.includes('›BTC vs ETH'),
    timeout: 10000,
  })

  expect(text).toMatchInlineSnapshot(`
    "


       Crypto Markets ───────────────────────────────────────────────────────────────────────────────

       > Search markets...

       Watchlist                                      │ $74,678│          ││   $2,220│          │
       BTC Bitcoin                                    │        │          ▌▌         │  │       ││
       ETH Ethereum                                   │        │  │     │ ▌▘▌        │  ▖▖│   │ ▌▌▖
       SOL Solana                                     │        │  ▖▖    ││▌ ▌│       │  ▌▘▌ ││││▌│▌
       XRP XRP                                        │ $68,318│  ▌▘▌ ││▌▘▘ ▘▘ $2,000│  ▌│▌ ▌▌▌▌▌ ▘▘
       DOGE Dogecoin                                  │        │▖ ▌│▌▖▌▘▘│           ││ ▌ ▘▌▌│││
       BNB BNB                                        │        │▌▌▘  ▘▘              │▌▖▌  ││
                                                      │ $61,957│ │   │         $1,780│││
       Mixed Components                               │         30d        Now        30d        Now
       BTC - Candles Real BTC/USD hourly candles      │
       ETH - Candle + Line Candles plus closing line  │ ────────────────────────────────────────────
       SOL - Candle + Volume Candles plus volume spli │
      ›BTC vs ETH Side-by-side crypto leaders         │ Price:  $67,641
       DOGE - Candle + Line Low-priced asset formatti │
                                                      │ Change: -0.2%
                                                      │
                                                      │
       ↵ open detail   ↑↓ navigate   ^k actions       │





    "
  `)

  expect(text).toContain('BTC vs ETH')
  expect(text).toContain('Side-by-side')
}, 30000)
