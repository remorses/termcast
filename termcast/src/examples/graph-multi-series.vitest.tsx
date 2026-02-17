import { test, expect, afterEach, beforeEach } from 'vitest'
import { launchTerminal, Session } from 'tuistory/src'

let session: Session

beforeEach(async () => {
  session = await launchTerminal({
    command: 'bun',
    args: ['src/examples/graph-multi-series.tsx'],
    cols: 70,
    rows: 24,
  })
})

afterEach(() => {
  session?.close()
})

test('multi-series graph renders both lines', async () => {
  const text = await session.text({
    waitFor: (text) => {
      return text.includes('Multi-Series') && text.includes('│')
    },
    timeout: 10000,
  })

  expect(text).toMatchInlineSnapshot(`
    "




      Multi-Series Chart
      211.0│                                                       ⣠
           │                                                ⢀⣠⣄⣀ ⣠⣾⣿
           │                                         ⣀   ⢀⣴⣾⣿⣿⣿⣿⣿⣿⣿⣿
      194.5│                                   ⣀⣀ ⢀⣤⣾⣿⣿⣶⣴⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
           │                                ⣠⣴⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
           │                         ⢀⣠⣄⡀⢀⣤⣾⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
      178.0│                       ⣠⣶⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
           │                ⣠⣴⣦⣤⣀⣴⣾⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
      161.5│         ⡀   ⢀⣴⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
           │        ⣼⣿⣷⣦⣾⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
           │⣀⣤⣶⣷⣤⡀⢀⣾⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
      145.0│⣿⣿⣿⣿⣿⣿⣾⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
            Day 1       Day 5        Day 10       Day 15      Day 20



      esc go back

    "
  `)

  // Should contain braille characters
  expect(text).toMatch(/[\u2800-\u28FF]/)
  // Y-axis separator
  expect(text).toContain('│')
  // Title
  expect(text).toContain('Multi-Series')
  // X-axis labels
  expect(text).toContain('Day 1')
  expect(text).toContain('Day 20')
}, 30000)

test('multi-series uses different colors per series', async () => {
  const text = await session.text({
    waitFor: (text) => {
      return text.includes('Multi-Series') && text.includes('│')
    },
    timeout: 10000,
  })

  // Check that orange-colored braille chars exist (price series)
  const orangeText = await session.text({
    only: { foreground: '#ff8000' },
    timeout: 5000,
  })

  // Check that blue-colored braille chars exist (SMA series)
  const blueText = await session.text({
    only: { foreground: '#0080ff' },
    timeout: 5000,
  })

  // Both series should produce braille output
  expect(orangeText).toMatch(/[\u2800-\u28FF]/)
  expect(blueText).toMatch(/[\u2800-\u28FF]/)
}, 30000)
