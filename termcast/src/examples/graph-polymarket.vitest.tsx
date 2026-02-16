import { test, expect, afterEach, beforeEach } from 'vitest'
import { launchTerminal, Session } from 'tuistory/src'

let session: Session

beforeEach(async () => {
  session = await launchTerminal({
    command: 'bun',
    args: ['src/examples/graph-polymarket.tsx'],
    cols: 100,
    rows: 30,
  })
})

afterEach(() => {
  session?.close()
})

test('polymarket list with graph detail renders correctly', async () => {
  const text = await session.text({
    waitFor: (text) => {
      return text.includes('Polymarket') && text.includes('│') && text.includes('Bitcoin')
    },
    timeout: 10000,
  })

  expect(text).toMatchInlineSnapshot(`
    "


       Polymarket ───────────────────────────────────────────────────────────────────────────────────

       > Search markets...

       Trending Markets                               │ 100%│
      ›Bitcoin above $100k by EOY Crypto              │     │                              ⣠⣀
       ETH above $5k by Q2 2026 Crypto                │     │          ⢠⣀       ⢀⣴⣷⡀      ⣰⣿⣿⣷⣀⣤⣴⣦⢀⣴
       Fed cuts rates below 4% Economics              │     │⣠⣴⡀   ⢀  ⢠⣿⣿⣷⡀ ⣀⣤⣀⣀⣾⣿⣿⣿⣶⣴⣿⣿⣶⣼⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
       S&P 500 reaches 6,000 Markets                  │  50%│⣿⣿⣷⣄⢀⣴⣿⣿⣾⣿⣿⣿⣿⣷⣾⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
       Presidential pardon for SBF Politics           │     │⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
       AGI announced by major lab Tech                │     │⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
       Solana flips Ethereum market cap Crypto        │   0%│⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
       US enters recession in 2026 Economics          │      30d         20d         10d         Now
                                                      │
                                                      │ Odds:   72% Yes
                                                      │
                                                      │ Volume: $4.2M
                                                      │
                                                      │ Ends:   Dec 31, 2026
                                                      │
                                                      │ ────────────────────────────────────────────
                                                      │
       ↵ buy yes   ↑↓ navigate   ^k actions           │ Probability (30d)




    "
  `)

  // Market list visible
  expect(text).toContain('Bitcoin')
  expect(text).toContain('Polymarket')
  // Detail panel with graph
  expect(text).toContain('│')
  expect(text).toMatch(/[\u2800-\u28FF]/)
  // Metadata labels
  expect(text).toContain('Odds')
  expect(text).toContain('Volume')
}, 30000)

test('navigating to different market updates the graph', async () => {
  await session.text({
    waitFor: (text) => {
      return text.includes('Bitcoin') && text.includes('│')
    },
    timeout: 10000,
  })

  // Navigate down to second market (ETH)
  await session.press('down')

  const text = await session.text({
    waitFor: (text) => {
      return text.includes('›ETH')
    },
    timeout: 5000,
  })

  expect(text).toMatchInlineSnapshot(`
    "


       Polymarket ───────────────────────────────────────────────────────────────────────────────────

       > Search markets...

       Trending Markets                               │ 100%│
       Bitcoin above $100k by EOY Crypto              │     │
      ›ETH above $5k by Q2 2026 Crypto                │     │ ⣀
       Fed cuts rates below 4% Economics              │     │⣿⣿⣆   ⢀⡀ ⣀⣾⣶⣄      ⢀⣤⣦        ⢀⡀
       S&P 500 reaches 6,000 Markets                  │  50%│⣿⣿⣿⣷⣴⣾⣿⣿⣿⣿⣿⣿⣿⣦⣤⣶⣷⣦⣤⣿⣿⣿⣷⣤⣀⣤⣤⣀⢀⣴⣿⣿⣧ ⣀⣀⡀ ⢀
       Presidential pardon for SBF Politics           │     │⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣴⣿
       AGI announced by major lab Tech                │     │⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
       Solana flips Ethereum market cap Crypto        │   0%│⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
       US enters recession in 2026 Economics          │      30d         20d         10d         Now
                                                      │
                                                      │ Odds:   38% Yes
                                                      │
                                                      │ Volume: $1.8M
                                                      │
                                                      │ Ends:   Jun 30, 2026
                                                      │
                                                      │ ────────────────────────────────────────────
                                                      │
       ↵ buy yes   ↑↓ navigate   ^k actions           │ Probability (30d)




    "
  `)

  // Second market selected
  expect(text).toContain('›ETH')
  // Detail should update
  expect(text).toContain('Volume')
  // Graph still renders
  expect(text).toMatch(/[\u2800-\u28FF]/)
}, 30000)
