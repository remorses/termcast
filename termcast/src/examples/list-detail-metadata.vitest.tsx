import { test, expect, afterEach, beforeEach } from 'vitest'
import { launchTerminal, Session } from 'tuistory/src'

let session: Session

beforeEach(async () => {
  session = await launchTerminal({
    command: 'bun',
    args: ['src/examples/list-detail-metadata.tsx'],
    cols: 80,
    rows: 20,
  })
})

afterEach(() => {
  session?.close()
})

test('list detail metadata label renders title and text in column layout', async () => {
  const snapshot = await session.text({
    waitFor: (text) => {
      return (
        text.includes('Metadata Test') &&
        text.includes('Name') &&
        text.includes('John Doe') &&
        text.includes('Email')
      )
    },
  })

  expect(snapshot).toMatchInlineSnapshot(`
    "


       Metadata Test ────────────────────────────────────────────────────────────

       > Search...

      ›Item with Metadata
       Another Item                         │                                   ▲
                                            │ ───────────────────────────────── █
                                            │                                   ▀
                                            │ Name:
                                            │ John Doe
                                            │
                                            │ Email:
                                            │ john@example.com
                                            │ ─────────────────
                                            │
       ↑↓ navigate   ^k actions             │ Status:                           ▼

    "
  `)
}, 10000)

test('list detail metadata navigation shows different metadata', async () => {
  await session.text({
    waitFor: (text) => text.includes('Metadata Test'),
  })

  await session.press('down')

  const snapshot = await session.text({
    waitFor: (text) => {
      return text.includes('Count') && text.includes('42')
    },
  })

  expect(snapshot).toMatchInlineSnapshot(`
    "


       Metadata Test ────────────────────────────────────────────────────────────

       > Search...

       Item with Metadata
      ›Another Item                         │ Info
                                            │ ──────────────────────────────────
                                            │
                                            │ Count:
                                            │ 42
                                            │
                                            │ Price:
       ↑↓ navigate   ^k actions             │ $99.99




    "
  `)
}, 10000)
