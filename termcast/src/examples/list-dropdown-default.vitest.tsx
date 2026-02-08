import { test, expect, afterEach, beforeEach } from 'vitest'
import { launchTerminal, Session } from 'tuistory/src'

let session: Session

beforeEach(async () => {
  session = await launchTerminal({
    command: 'bun',
    args: ['src/examples/list-dropdown-default.tsx'],
    cols: 80,
    rows: 30,
  })
})

afterEach(() => {
  session?.close()
})

test('dropdown defaults to first item when no value is provided', async () => {
  await session.text({
    waitFor: (text) => {
      return /Dropdown Default Value Example/i.test(text)
    },
  })

  await session.waitIdle()

  const initialSnapshot = await session.text()

  expect(initialSnapshot).toMatchInlineSnapshot(`
    "


       Dropdown Default Value Example ───────────────────────────────────────────


       > Search...                                                        Apple ▾

      ›First Item This list has a dropdown
       Second Item The dropdown should default to first item
       Vegetables
       Carrot With another dropdown




       ↵ show selected       ↑↓ navigate  ^p dropdown  ^k actionpowered by termcast
         fruit












    "
  `)
}, 10000)

test('dropdown opens and shows items', async () => {
  await session.text({
    waitFor: (text) => {
      return /Dropdown Default Value Example/i.test(text)
    },
  })

  await session.press(['ctrl', 'p'])

  const dropdownOpenSnapshot = await session.text()
  expect(dropdownOpenSnapshot).toMatchInlineSnapshot(`
    "


       Dropdown Default Value Example ───────────────────────────────────────────

      ╭──────────────────────────────────────────────────────────────────────────╮
      │                                                                          │
      │   Filter by category                                               esc   │
      │                                                                          │
      │   > Select category...                                                   │
      │                                                                          │
      │  ›Apple                                                                  │
      │   Banana                                                                 │
      │   Orange                                                                 │
      │   Grape                                                                  │
      │                                                                          │
      │                                                                          │t
      │   ↵ select   ↑↓ navigate                            powered by termcast  │
      │                                                                          │
      ╰──────────────────────────────────────────────────────────────────────────╯










    "
  `)

  await session.press('down')

  const afterDownSnapshot = await session.text()
  expect(afterDownSnapshot).toMatchInlineSnapshot(`
    "


       Dropdown Default Value Example ───────────────────────────────────────────

      ╭──────────────────────────────────────────────────────────────────────────╮
      │                                                                          │
      │   Filter by category                                               esc   │
      │                                                                          │
      │   > Select category...                                                   │
      │                                                                          │
      │   Apple                                                                  │
      │  ›Banana                                                                 │
      │   Orange                                                                 │
      │   Grape                                                                  │
      │                                                                          │
      │                                                                          │t
      │   ↵ select   ↑↓ navigate                            powered by termcast  │
      │                                                                          │
      ╰──────────────────────────────────────────────────────────────────────────╯










    "
  `)

  await session.press('enter')

  const afterSelectSnapshot = await session.text()
  expect(afterSelectSnapshot).toMatchInlineSnapshot(`
    "


       Dropdown Default Value Example ───────────────────────────────────────────


       > Search...                                                       Banana ▾

      ›First Item This list has a dropdown
       Second Item The dropdown should default to first item
       Vegetables
       Carrot With another dropdown




       ↵ show selected       ↑↓ navigate  ^p dropdown  ^k actionpowered by termcast
         fruit












    "
  `)
}, 10000)

test('clicking dropdown opens it', async () => {
  await session.text({
    waitFor: (text) => {
      return /Dropdown Default Value Example/i.test(text)
    },
  })

  await session.click('Apple', { first: true })

  const afterClickSnapshot = await session.text()
  expect(afterClickSnapshot).toMatchInlineSnapshot(`
    "


       Dropdown Default Value Example ───────────────────────────────────────────

      ╭──────────────────────────────────────────────────────────────────────────╮
      │                                                                          │
      │   Filter by category                                               esc   │
      │                                                                          │
      │   > Select category...                                                   │
      │                                                                          │
      │  ›Apple                                                                  │
      │   Banana                                                                 │
      │   Orange                                                                 │
      │   Grape                                                                  │
      │                                                                          │
      │                                                                          │t
      │   ↵ select   ↑↓ navigate                            powered by termcast  │
      │                                                                          │
      ╰──────────────────────────────────────────────────────────────────────────╯










    "
  `)

  await session.click('Orange', { first: true })

  const afterSelectOrangeSnapshot = await session.text()
  expect(afterSelectOrangeSnapshot).toMatchInlineSnapshot(`
    "


       Dropdown Default Value Example ───────────────────────────────────────────


       > Search...                                                       Orange ▾

      ›First Item This list has a dropdown
       Second Item The dropdown should default to first item
       Vegetables
       Carrot With another dropdown




       ↵ show selected       ↑↓ navigate  ^p dropdown  ^k actionpowered by termcast
         fruit












    "
  `)
}, 10000)
