import { test, expect, afterEach, beforeEach } from 'vitest'
import { launchTerminal, Session } from 'tuistory/src'

let session: Session

beforeEach(async () => {
  session = await launchTerminal({
    command: 'bun',
    args: ['src/examples/simple-grid-images.tsx'],
    cols: 70,
    rows: 28,
    env: {
      ...process.env,
      OPENTUI_IMAGE_PROTOCOL: 'blocks',
    },
  })
})

afterEach(() => {
  session?.close()
})

test('grid renders raster, emoji, and color cells', async () => {
  const text = await session.text({
    waitFor: (value) => {
      return value.includes('Raster') && value.includes('Emoji') && value.includes('Color')
    },
    timeout: 5000,
  })

  expect(text).toMatchInlineSnapshot(`
    "


       Grid Images ────────────────────────────────────────────────────

       > Search...

       ████████████████████          🍎
       ████████████████████ Emoji
       ████████████████████
       ████████████████████
       ████████████████████
       ████████████████████
       ████████████████████
       ████████████████████
       ████████████████████
       ████████████████████
      ›Raster                                     Color


       ↵ select   ↑↓ navigate   ^k actions







    "
  `)
  expect(text).toContain('Raster')
  expect(text).toContain('Emoji')
  expect(text).toContain('Color')
}, 30000)
