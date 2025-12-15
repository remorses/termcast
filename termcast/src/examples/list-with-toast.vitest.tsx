import { test, expect, afterEach, beforeEach } from 'vitest'
import { launchTerminal, Session } from 'tuistory/src'

let session: Session

beforeEach(async () => {
  session = await launchTerminal({
    command: 'bun',
    args: ['src/examples/list-with-toast.tsx'],
    cols: 70,
    rows: 20,
  })
})

afterEach(() => {
  session?.close()
})

test('list navigation works while toast is shown', async () => {
  await session.text({
    waitFor: (text) => {
      return /First Item/i.test(text)
    },
  })

  const initialSnapshot = await session.text()
  expect(initialSnapshot).toMatchInlineSnapshot(`
    "


     List With Toast ────────────────────────────────────────────────

     Search...

    ›First Item
     Second Item
     Third Item
     Fourth Item
     Fifth Item






     ↵ select  ↑↓ naviga┌─────────────────────────┐
                        │ ✓ Selected - First Item │
                        └─────────────────────────┘"
  `)

  await session.press('down')
  await new Promise((r) => setTimeout(r, 200))

  const afterFirstDown = await session.text()
  expect(afterFirstDown).toMatchInlineSnapshot(`
    "


     List With Toast ────────────────────────────────────────────────

     Search...

     First Item
    ›Second Item
     Third Item
     Fourth Item
     Fifth Item






     ↵ select  ↑↓ navig┌──────────────────────────┐
                       │ ✓ Selected - Second Item │
                       └──────────────────────────┘"
  `)

  await session.press('down')
  await new Promise((r) => setTimeout(r, 200))

  const afterSecondDown = await session.text()
  expect(afterSecondDown).toMatchInlineSnapshot(`
    "


     List With Toast ────────────────────────────────────────────────

     Search...

     First Item
     Second Item
    ›Third Item
     Fourth Item
     Fifth Item






     ↵ select  ↑↓ naviga┌─────────────────────────┐
                        │ ✓ Selected - Third Item │
                        └─────────────────────────┘"
  `)

  await session.press('up')
  await new Promise((r) => setTimeout(r, 200))

  const afterUp = await session.text()
  expect(afterUp).toMatchInlineSnapshot(`
    "


     List With Toast ────────────────────────────────────────────────

     Search...

     First Item
    ›Second Item
     Third Item
     Fourth Item
     Fifth Item






     ↵ select  ↑↓ navig┌──────────────────────────┐
                       │ ✓ Selected - Second Item │
                       └──────────────────────────┘"
  `)
}, 10000)
