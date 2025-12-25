import { test, expect, afterEach, beforeEach } from 'vitest'
import { launchTerminal, Session } from 'tuistory/src'

let session: Session

beforeEach(async () => {
  session = await launchTerminal({
    command: 'bun',
    args: ['src/examples/list-with-dropdown.tsx'],
    cols: 70,
    rows: 25,
  })
})

afterEach(() => {
  session?.close()
})

test('list with dropdown navigation', async () => {
  const initialSnapshot = await session.text({
    waitFor: (text) => {
      return (
        /search beers/i.test(text) &&
        text.includes('Beer ▾') &&
        text.includes('Augustiner Helles') &&
        text.includes('Apple Juice')
      )
    },
  })

  expect(initialSnapshot).toMatchInlineSnapshot(`
    "


       Search Beers ───────────────────────────────────────────────────


       Search...                                                 Beer ▾

      ›Augustiner Helles Beer
       Camden Hells Beer
       Leffe Blonde Beer
       Sierra Nevada IPA Beer
       Chateau Margaux Wine
       Pinot Noir Wine
       Coca Cola Soda
       Sprite Soda
       Orange Juice Juice
       Apple Juice Juice


       ↑↓ navigate    ^k actions




    "
  `)

  await session.press(['ctrl', 'p'])

  const immediatelyAfterCtrlPSnapshot = await session.text({
    waitFor: (text) => {
      return /select drink type/i.test(text)
    },
  })
  expect(immediatelyAfterCtrlPSnapshot).toMatchInlineSnapshot(`
    "




         ┌─────────────────────────────────────────────────────────────┐
         │   Select Drink Type                                  esc    │
         │                                                             │
         │   Search...                                                 │
         │                                                             │
         │                                                             │
         │   Alcoholic Beverages                                       │
         │  ›Beer                                                      │
         │   Wine                                                      │
         │                                                             │
         │   Non-Alcoholic                                             │
         │   Soda                                                      │
         │   Juice                                                     │
         │                                                             │
         │                                                             │
         │   ↵ select   ↑↓ navigate                                    │
         └─────────────────────────────────────────────────────────────┘



    "
  `)

  const afterCtrlPSnapshot = await session.text({
    waitFor: (text) => {
      return /select drink type/i.test(text)
    },
  })
  expect(afterCtrlPSnapshot).toMatchInlineSnapshot(`
    "




         ┌─────────────────────────────────────────────────────────────┐
         │   Select Drink Type                                  esc    │
         │                                                             │
         │   Search...                                                 │
         │                                                             │
         │                                                             │
         │   Alcoholic Beverages                                       │
         │  ›Beer                                                      │
         │   Wine                                                      │
         │                                                             │
         │   Non-Alcoholic                                             │
         │   Soda                                                      │
         │   Juice                                                     │
         │                                                             │
         │                                                             │
         │   ↵ select   ↑↓ navigate                                    │
         └─────────────────────────────────────────────────────────────┘



    "
  `)

  await session.press('down')

  const afterDownSnapshot = await session.text()
  expect(afterDownSnapshot).toMatchInlineSnapshot(`
    "




         ┌─────────────────────────────────────────────────────────────┐
         │   Select Drink Type                                  esc    │
         │                                                             │
         │   Search...                                                 │
         │                                                             │
         │                                                             │
         │   Alcoholic Beverages                                       │
         │   Beer                                                      │
         │  ›Wine                                                      │
         │                                                             │
         │   Non-Alcoholic                                             │
         │   Soda                                                      │
         │   Juice                                                     │
         │                                                             │
         │                                                             │
         │   ↵ select   ↑↓ navigate                                    │
         └─────────────────────────────────────────────────────────────┘



    "
  `)

  await session.press('down')

  const afterSecondDownSnapshot = await session.text()
  expect(afterSecondDownSnapshot).toMatchInlineSnapshot(`
    "




         ┌─────────────────────────────────────────────────────────────┐
         │   Select Drink Type                                  esc    │
         │                                                             │
         │   Search...                                                 │
         │                                                             │
         │                                                             │
         │   Alcoholic Beverages                                       │
         │   Beer                                                      │
         │   Wine                                                      │
         │                                                             │
         │   Non-Alcoholic                                             │
         │  ›Soda                                                      │
         │   Juice                                                     │
         │                                                             │
         │                                                             │
         │   ↵ select   ↑↓ navigate                                    │
         └─────────────────────────────────────────────────────────────┘



    "
  `)

  await session.press('enter')

  const afterSelectSnapshot = await session.text({
    waitFor: (text) => {
      return !text.includes('Select Drink Type')
    },
  })
  expect(afterSelectSnapshot).toMatchInlineSnapshot(`
    "


       Search Beers ───────────────────────────────────────────────────


       Search...                                                 Soda ▾

      ›Coca Cola Soda
       Sprite Soda


       ↑↓ navigate    ^k actions












    "
  `)
}, 10000)

test('list with dropdown search and filter', async () => {
  await session.text({
    waitFor: (text) => {
      return (
        /search beers/i.test(text) &&
        text.includes('Beer ▾') &&
        text.includes('Augustiner Helles') &&
        text.includes('Apple Juice')
      )
    },
  })

  await session.press(['ctrl', 'p'])

  const immediatelyAfterCtrlPSnapshot = await session.text()
  expect(immediatelyAfterCtrlPSnapshot).toMatchInlineSnapshot(`
    "




         ┌─────────────────────────────────────────────────────────────┐
         │   Select Drink Type                                  esc    │
         │                                                             │
         │   Search...                                                 │
         │                                                             │
         │                                                             │
         │   Alcoholic Beverages                                       │
         │  ›Beer                                                      │
         │   Wine                                                      │
         │                                                             │
         │   Non-Alcoholic                                             │
         │   Soda                                                      │
         │   Juice                                                     │
         │                                                             │
         │                                                             │
         │   ↵ select   ↑↓ navigate                                    │
         └─────────────────────────────────────────────────────────────┘



    "
  `)

  await session.text({
    waitFor: (text) => {
      return /select drink type/i.test(text)
    },
  })

  await session.type('wine')

  const afterSearchWineSnapshot = await session.text({
    waitFor: (text) => {
      return /wine/i.test(text)
    },
  })
  expect(afterSearchWineSnapshot).toMatchInlineSnapshot(`
    "




         ┌─────────────────────────────────────────────────────────────┐
         │   Select Drink Type                                  esc    │
         │                                                             │
         │   wine                                                      │
         │                                                             │
         │  ›Wine                                                      │
         │                                                             │
         │                                                             │
         │   ↵ select   ↑↓ navigate                                    │
         └─────────────────────────────────────────────────────────────┘










    "
  `)

  await session.press('enter')

  const afterSelectWineSnapshot = await session.text({
    waitFor: (text) => {
      return !text.includes('Select Drink Type')
    },
  })
  expect(afterSelectWineSnapshot).toMatchInlineSnapshot(`
    "


       Search Beers ───────────────────────────────────────────────────


       Search...                                                 Wine ▾

      ›Chateau Margaux Wine
       Pinot Noir Wine


       ↑↓ navigate    ^k actions












    "
  `)

  await session.type('pinot')

  const afterSearchPinotSnapshot = await session.text({
    waitFor: (text) => {
      return /pinot/i.test(text)
    },
  })
  expect(afterSearchPinotSnapshot).toMatchInlineSnapshot(`
    "


       Search Beers ───────────────────────────────────────────────────


       pinot                                                     Wine ▾

      ›Pinot Noir Wine


       ↑↓ navigate    ^k actions













    "
  `)
}, 10000)
