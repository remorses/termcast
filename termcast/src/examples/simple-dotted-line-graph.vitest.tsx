import { test, expect, afterEach, beforeEach } from 'vitest'
import { launchTerminal, Session } from 'tuistory/src'

let session: Session

beforeEach(async () => {
  session = await launchTerminal({
    command: 'bun',
    args: ['src/examples/simple-dotted-line-graph.tsx'],
    cols: 90,
    rows: 28,
  })
})

afterEach(() => {
  session?.close()
})

test('dotted line graph renders metric lines and legend', async () => {
  const text = await session.text({
    waitFor: (text) => {
      return text.includes('Dotted metrics') && text.includes('CPU') && text.includes('│')
    },
    timeout: 10000,
  })

  expect(text).toMatchInlineSnapshot(`
    "


      Dotted metrics
      Metric-style dotted lines with braille subcell movement.
      100%│
          │
          │                                  ⠄⠈⢀ ⠄⠈⢀ ⠠⠈⢀ ⠠
          │                                ⠠ ⠁  ⠁ ⠠ ⠁   ⠁⠰      ⠄
       67%│                                ⠈⠊ ⠠ ⠂⠁ ⠂ ⠠⠐ ⠁ ⠂ ⠄⠐ ⠁⠐                      ⠐ ⡃⠃⠘
          │⡀⢀⢀ ⡀⢀ ⡀⡀⢀ ⡀⢀⢀ ⡀⢀⢀ ⡀⢀ ⡀⡀⢀ ⡀⢀⢀ ⡀⢀⢁⠈⡁⢀ ⡀⡀⢀ ⡁⢀⢀ ⡀⢀⠂⡁⡀⢀ ⡀⡐⢀ ⡀                   ⠁⢀
          │                                ⠁⠈             ⠐      ⠂  ⢄⢀ ⡀⢀ ⡀⡀⢀ ⡀⡀⢀ ⡀⢀⢀ ⡈ ⡀
       33%│⡀⢀⢀ ⡀⢀ ⡀⡀⢀ ⡀⢀⢀ ⡀⢀⢀ ⡀⢀ ⡀⡀⢀ ⡀⢀⢀ ⡀⢈ ⠁             ⠐      ⠰ ⠄⠠⠠ ⠄⠠ ⠄⠄⠠ ⠄⠄⠠ ⠄⠠⠠ ⠄⠠⡀⠄⠄⠠
          │                ⠐⠐ ⠂⠐ ⠂⠂⠐ ⠂⠐⠐ ⠂⠐⠐⠁⠂⠐ ⠂⠂⠐ ⠂⠐⠐ ⠂⠐⠐⠂⠂⠐ ⠂⠂⠐ ⠂⠐⠐ ⠂⠠ ⠄⠄⠠ ⠄⠄⠠ ⠄⠠⠠ ⠄⢠ ⠄⠄⠠
          │⡁⢈⢈ ⡁⢈ ⡁⡁⢈ ⡁⢈⢈ ⡁⢀⢀ ⡀⢀ ⡀⡀⢀ ⡀⢀⢀ ⡀⢀⢈               ⠆⠄⠠ ⠄⠄⠠ ⠄⠠⠠ ⠄⠠ ⠄⠄⠠ ⠄⠄⠠ ⠄⠠⠠ ⠄⠠
          │
        0%│
           7:28 AM          7:43 AM             7:58 AM             8:13 AM          8:28 AM
           ● CPU  ● Memory  ● 2xx  ● 5xx









    "
  `)
  expect(text).toContain('Dotted metrics')
  expect(text).toContain('CPU')
  expect(text).toContain('8:28 AM')
  expect(text).toMatch(/[\u2800-\u28FF]/)
}, 30000)
