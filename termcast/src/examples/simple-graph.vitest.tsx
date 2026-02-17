import { test, expect, afterEach, beforeEach } from 'vitest'
import { launchTerminal, Session } from 'tuistory/src'

let session: Session

beforeEach(async () => {
  session = await launchTerminal({
    command: 'bun',
    args: ['src/examples/simple-graph.tsx'],
    cols: 80,
    rows: 30,
  })
})

afterEach(() => {
  session?.close()
})

test('graph renders with braille characters and axis labels', async () => {
  const text = await session.text({
    waitFor: (text) => {
      // Wait for graph to render - should have braille chars and axis labels
      return text.includes('AAPL') && text.includes('│')
    },
    timeout: 10000,
  })

  expect(text).toMatchInlineSnapshot(`
    "




      AAPL Stock - 30 Day

      Price range: $148.70 - $201.40
      204.0│                                                                  ⢀
           │                                                               ⢀⣴⣾⣿
           │                                                         ⢀⣠⣴⣦⣄⣠⣿⣿⣿⣿
      192.4│                                                    ⣠⣀  ⣴⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
           │                                              ⣠⣴⣿⣶⣤⣾⣿⣿⣿⣾⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
           │                                       ⢀⣠⣴⣄ ⢠⣾⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
      180.8│                                  ⣠⣀ ⢀⣴⣿⣿⣿⣿⣷⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
           │                               ⢀⣴⣿⣿⣿⣷⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
      169.3│                         ⣠⣴⣾⣶⣤⣠⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
           │                   ⢀⣴⣦⣄⣠⣾⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
           │        ⢀⣄       ⣀⣤⣾⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
      157.7│       ⢀⣾⣿⣿⣦⣀  ⣴⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
           │      ⢀⣾⣿⣿⣿⣿⣿⣿⣾⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
           │⣀⣤⣶⣤⡀⣰⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
      146.1│⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
            01          06           11            16           21           26


      esc go back                                          powered by termcast.app



    "
  `)

  // Should contain the markdown title
  expect(text).toContain('AAPL')
  // Should contain Y-axis separator
  expect(text).toContain('│')
  // Should contain braille characters (U+2800 block)
  expect(text).toMatch(/[\u2800-\u28FF]/)
  // Should contain X-axis labels
  expect(text).toContain('01')
  expect(text).toContain('26')
  // Should contain Y-axis values
  expect(text).toContain('204.0')
  expect(text).toContain('146.1')
}, 30000)

test('graph renders at different terminal sizes', async () => {
  // Close existing session and start a smaller one
  session?.close()
  session = await launchTerminal({
    command: 'bun',
    args: ['src/examples/simple-graph.tsx'],
    cols: 50,
    rows: 24,
  })

  const text = await session.text({
    waitFor: (text) => {
      return text.includes('AAPL') && text.includes('│')
    },
    timeout: 10000,
  })

  expect(text).toMatchInlineSnapshot(`
    "


                                                   █
                                                   █
      AAPL Stock - 30 Day                          █

      Price range: $148.70 - $201.40
      204.0│                                   ⢀
           │                                  ⣠⣿
           │                              ⢀⣤⣦⣰⣿⣿
      192.4│                           ⢀⣄ ⣾⣿⣿⣿⣿⣿
           │                        ⢀⣾⣶⣾⣿⣿⣿⣿⣿⣿⣿⣿
           │                     ⢠⣦ ⣾⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
      180.8│                  ⣠⡀⣰⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
           │                 ⣼⣿⣷⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
      169.3│             ⢀⣾⣦⣼⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
           │          ⢀⣦⣰⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
           │     ⡄   ⣀⣾⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
      157.7│    ⣼⣿⣄ ⣼⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿


      esc go back

    "
  `)

  // Graph should still render with braille
  expect(text).toMatch(/[\u2800-\u28FF]/)
  expect(text).toContain('│')
}, 30000)
