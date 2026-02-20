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
        text.includes('All ▾') &&
        text.includes('Augustiner Helles') &&
        text.includes('Apple Juice')
      )
    },
    timeout: 10000,
  })

  expect(initialSnapshot).toMatchInlineSnapshot(`
    "


       Search Beers ──────────────────────────────────────────── ◆ Acme

       > Search...                                                All ▾

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


       ↑↓ navigate   ^p All   ^k actions





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


       Search Beers ──────────────────────────────────────────── ◆ Acme
      ╭────────────────────────────────────────────────────────────────╮
      │                                                                │
      │   Select Drink Type                                      esc   │
      │                                                                │
      │   > Search...                                                  │
      │                                                                │
      │  ›All                                                          │
      │                                                                │
      │   Alcoholic Beverages                                          │
      │   Beer                                                         │
      │   Wine                                                         │
      │                                                                │
      │   Non-Alcoholic                                                │
      │   Soda                                                         │
      │   Juice                                                        │
      │                                                                │
      │                                                                │
      │   ↵ select   ↑↓ navigate                                       │
      │                                                                │
      ╰────────────────────────────────────────────────────────────────╯

    "
  `)

  const afterCtrlPSnapshot = await session.text({
    waitFor: (text) => {
      return /select drink type/i.test(text)
    },
  })
  expect(afterCtrlPSnapshot).toMatchInlineSnapshot(`
    "


       Search Beers ──────────────────────────────────────────── ◆ Acme
      ╭────────────────────────────────────────────────────────────────╮
      │                                                                │
      │   Select Drink Type                                      esc   │
      │                                                                │
      │   > Search...                                                  │
      │                                                                │
      │  ›All                                                          │
      │                                                                │
      │   Alcoholic Beverages                                          │
      │   Beer                                                         │
      │   Wine                                                         │
      │                                                                │
      │   Non-Alcoholic                                                │
      │   Soda                                                         │
      │   Juice                                                        │
      │                                                                │
      │                                                                │
      │   ↵ select   ↑↓ navigate                                       │
      │                                                                │
      ╰────────────────────────────────────────────────────────────────╯

    "
  `)

  await session.press('down')

  const afterDownSnapshot = await session.text()
  expect(afterDownSnapshot).toMatchInlineSnapshot(`
    "


       Search Beers ──────────────────────────────────────────── ◆ Acme
      ╭────────────────────────────────────────────────────────────────╮
      │                                                                │
      │   Select Drink Type                                      esc   │
      │                                                                │
      │   > Search...                                                  │
      │                                                                │
      │   All                                                          │
      │                                                                │
      │   Alcoholic Beverages                                          │
      │  ›Beer                                                         │
      │   Wine                                                         │
      │                                                                │
      │   Non-Alcoholic                                                │
      │   Soda                                                         │
      │   Juice                                                        │
      │                                                                │
      │                                                                │
      │   ↵ select   ↑↓ navigate                                       │
      │                                                                │
      ╰────────────────────────────────────────────────────────────────╯

    "
  `)

  await session.press('down')

  const afterSecondDownSnapshot = await session.text()
  expect(afterSecondDownSnapshot).toMatchInlineSnapshot(`
    "


       Search Beers ──────────────────────────────────────────── ◆ Acme
      ╭────────────────────────────────────────────────────────────────╮
      │                                                                │
      │   Select Drink Type                                      esc   │
      │                                                                │
      │   > Search...                                                  │
      │                                                                │
      │   All                                                          │
      │                                                                │
      │   Alcoholic Beverages                                          │
      │   Beer                                                         │
      │  ›Wine                                                         │
      │                                                                │
      │   Non-Alcoholic                                                │
      │   Soda                                                         │
      │   Juice                                                        │
      │                                                                │
      │                                                                │
      │   ↵ select   ↑↓ navigate                                       │
      │                                                                │
      ╰────────────────────────────────────────────────────────────────╯

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


       Search Beers ──────────────────────────────────────────── ◆ Acme

       > Search...                                               Wine ▾

      ›Chateau Margaux Wine
       Pinot Noir Wine






       ↑↓ navigate   ^p Wine   ^k actions









    "
  `)
}, 10000)

test('small screen: dropdown accessory wastes vertical space', async () => {
  const smallSession = await launchTerminal({
    command: 'bun',
    args: ['src/examples/list-with-dropdown.tsx'],
    cols: 60,
    rows: 15,
  })

  try {
    const snapshot = await smallSession.text({
      waitFor: (text) => {
        return (
          /search beers/i.test(text) &&
          text.includes('All ▾') &&
          text.includes('Augustiner Helles')
        )
      },
      timeout: 10000,
    })

    expect(snapshot).toMatchInlineSnapshot(`
      "


         Search Beers ────────────────────────────────── ◆ Acme

         > Search...                                      All ▾

        ›Augustiner Helles Beer
         Camden Hells Beer
         Leffe Blonde Beer
         Sierra Nevada IPA Beer
         Chateau Margaux Wine
         Pinot Noir Wine


         ↑↓ navigate   ^p All   ^k actions"
    `)
  } finally {
    smallSession.close()
  }
}, 15000)

test('list with dropdown search and filter', async () => {
  await session.text({
    waitFor: (text) => {
      return (
        /search beers/i.test(text) &&
        text.includes('All ▾') &&
        text.includes('Augustiner Helles') &&
        text.includes('Apple Juice')
      )
    },
    timeout: 10000,
  })

  await session.press(['ctrl', 'p'])

  const immediatelyAfterCtrlPSnapshot = await session.text()
  expect(immediatelyAfterCtrlPSnapshot).toMatchInlineSnapshot(`
    "


       Search Beers ──────────────────────────────────────────── ◆ Acme
      ╭────────────────────────────────────────────────────────────────╮
      │                                                                │
      │   Select Drink Type                                      esc   │
      │                                                                │
      │   > Search...                                                  │
      │                                                                │
      │  ›All                                                          │
      │                                                                │
      │   Alcoholic Beverages                                          │
      │   Beer                                                         │
      │   Wine                                                         │
      │                                                                │
      │   Non-Alcoholic                                                │
      │   Soda                                                         │
      │   Juice                                                        │
      │                                                                │
      │                                                                │
      │   ↵ select   ↑↓ navigate                                       │
      │                                                                │
      ╰────────────────────────────────────────────────────────────────╯

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


       Search Beers ──────────────────────────────────────────── ◆ Acme

       > Search...                                                All ▾

      ›Augustiner Helles Beer
      ╭────────────────────────────────────────────────────────────────╮
      │                                                                │
      │   Select Drink Type                                      esc   │
      │                                                                │
      │   > wine                                                       │
      │                                                                │
      │  ›Wine                                                         │
      │                                                                │
      │                                                                │
      │   ↵ select   ↑↓ navigate                                       │
      │                                                                │
      ╰────────────────────────────────────────────────────────────────╯





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


       Search Beers ──────────────────────────────────────────── ◆ Acme

       > Search...                                               Wine ▾

      ›Chateau Margaux Wine
       Pinot Noir Wine






       ↑↓ navigate   ^p Wine   ^k actions









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


       Search Beers ──────────────────────────────────────────── ◆ Acme

       > pinot                                                   Wine ▾

      ›Pinot Noir Wine







       ↑↓ navigate   ^p Wine   ^k actions









    "
  `)
}, 10000)
