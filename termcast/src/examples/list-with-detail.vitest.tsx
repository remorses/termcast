import { test, expect, afterEach, beforeEach } from 'vitest'
import { launchTerminal, Session } from 'tuistory/src'

let session: Session

beforeEach(async () => {
  session = await launchTerminal({
    command: 'bun',
    args: ['src/examples/list-with-detail.tsx'],
    cols: 80,
    rows: 30,
  })
})

afterEach(() => {
  session?.close()
})

test('list with detail view display and navigation', async () => {
  const initialSnapshot = await session.text({
    waitFor: (text) => {
      return (
        /Pokemon List/i.test(text) &&
        text.includes('›bulbasaur') &&
        text.includes('Grass / Poison') &&
        text.includes('Height: 0.7m') &&
        text.includes('↵ select')
      )
    },
  })

  expect(initialSnapshot).toMatchInlineSnapshot(`
    "


     Pokemon List ─────────────────────────────────────────────────────────────

     Search Pokemon...

    ›bulbasaur #001
     ivysaur #002                         │ bulbasaur                         ▲
     charmander #004                      │                                   ▀
     charmeleon #005                      │ Illustration
     squirtle #007                        │
     wartortle #008                       │ Types
                                          │ Grass / Poison
                                          │
                                          │ Characteristics
                                          │ - Height: 0.7m
                                          │ - Weight: 6.9kg
                                          │
                                          │ Abilities
                                          │ - Chlorophyll
                                          │ - Overgrow
                                          │ ─────────────────────────────────
                                          │
                                          │ Types:
                                          │
                                          │ Grass:
                                          │ ─────────────────
     ↵ select  ↑↓ navigate  ^k actions    │                                   ▼"
  `)

  await session.press('down')

  const afterDownSnapshot = await session.text({
    waitFor: (text) => text.includes('ivysaur') && text.includes('Height: 1m'),
  })
  expect(afterDownSnapshot).toMatchInlineSnapshot(`
    "


     Pokemon List ─────────────────────────────────────────────────────────────

     Search Pokemon...

     bulbasaur #001
    ›ivysaur #002                         │ ivysaur                           ▲
     charmander #004                      │                                   ▀
     charmeleon #005                      │ Illustration
     squirtle #007                        │
     wartortle #008                       │ Types
                                          │ Grass / Poison
                                          │
                                          │ Characteristics
                                          │ - Height: 1m
                                          │ - Weight: 13kg
                                          │
                                          │ Abilities
                                          │ - Chlorophyll
                                          │ - Overgrow
                                          │ ─────────────────────────────────
                                          │
                                          │ Types:
                                          │
                                          │ Grass:
                                          │ ─────────────────
     ↵ select  ↑↓ navigate  ^k actions    │                                   ▼"
  `)

  await session.press('down')

  const charmanderSnapshot = await session.text()
  expect(charmanderSnapshot).toMatchInlineSnapshot(`
    "


     Pokemon List ─────────────────────────────────────────────────────────────

     Search Pokemon...

     bulbasaur #001
     ivysaur #002                         │ charmander                        ▲
    ›charmander #004                      │                                   █
     charmeleon #005                      │ Illustration
     squirtle #007                        │
     wartortle #008                       │ Types
                                          │ Fire
                                          │
                                          │ Characteristics
                                          │ - Height: 0.6m
                                          │ - Weight: 8.5kg
                                          │
                                          │ Abilities
                                          │ - Blaze
                                          │ - Solar Power
                                          │ ─────────────────────────────────
                                          │
                                          │ Types:
                                          │
                                          │ Fire:
                                          │ ─────────────────
     ↵ select  ↑↓ navigate  ^k actions    │                                   ▼"
  `)

  await session.press(['ctrl', 'k'])

  const actionsSnapshot = await session.text()
  expect(actionsSnapshot).toMatchInlineSnapshot(`
    "


     Pokemon List ─────────────────────────────────────────────────────────────

     Search Pokemon...

     bulbasaur #001
     ivysaur #002                         │ charmander                        ▲
    ›charmander #004                      │                                   █
     c┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
     s┃                                                                          ┃
     w┃                                                                    esc   ┃
      ┃                                                                          ┃
      ┃   Search actions...                                                      ┃
      ┃                                                                          ┃
      ┃  ›Toggle Detail                                                          ┃
      ┃   View on Pokemon.com                                                    ┃
      ┃                                                                          ┃
      ┃                                                                          ┃
      ┃                                                                          ┃
      ┃                                                                          ┃
      ┃                                                                          ┃
      ┃                                                                          ┃
      ┃                                                                          ┃
      ┃                                                                          ┃
      ┃                                                                          ┃
      ┃   ↵ select   ↑↓ navigate                                                 ┃
     ↵┃                                                                          ┃
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  `)

  await session.press('enter')

  const afterToggleSnapshot = await session.text({
    waitFor: (text) => {
      return text.includes('Grass / Poison') && !text.includes('## Types')
    },
  })
  expect(afterToggleSnapshot).toMatchInlineSnapshot(`
    "


     Pokemon List ─────────────────────────────────────────────────────────────

     Search Pokemon...

     bulbasaur #001                                             Grass / Poison
     ivysaur #002                                               Grass / Poison
    ›charmander #004                                                      Fire
     charmeleon #005                                                      Fire
     squirtle #007                                                       Water
     wartortle #008                                                      Water















     ↵ select  ↑↓ navigate  ^k actions"
  `)

  await session.press(['ctrl', 'k'])
  await session.press('enter')

  const detailOnAgainSnapshot = await session.text({
    waitFor: (text) => {
      return text.includes('charmander') && text.includes('Fire')
    },
  })
  expect(detailOnAgainSnapshot).toMatchInlineSnapshot(`
    "


     Pokemon List ─────────────────────────────────────────────────────────────

     Search Pokemon...

     bulbasaur #001
     ivysaur #002                         │ charmander                        ▲
    ›charmander #004                      │                                   █
     charmeleon #005                      │ Illustration
     squirtle #007                        │
     wartortle #008                       │ Types
                                          │ Fire
                                          │
                                          │ Characteristics
                                          │ - Height: 0.6m
                                          │ - Weight: 8.5kg
                                          │
                                          │ Abilities
                                          │ - Blaze
                                          │ - Solar Power
                                          │ ─────────────────────────────────
                                          │
                                          │ Types:
                                          │
                                          │ Fire:
                                          │ ─────────────────
     ↵ select  ↑↓ navigate  ^k actions    │                                   ▼"
  `)
}, 15000)

test('list detail view search functionality', async () => {
  await session.text({
    waitFor: (text) => {
      return /Pokemon List/i.test(text)
    },
  })

  await session.type('char')

  const searchCharSnapshot = await session.text({
    waitFor: (text) => {
      return /char/i.test(text) && text.includes('charmander')
    },
  })
  expect(searchCharSnapshot).toMatchInlineSnapshot(`
    "


     Pokemon List ─────────────────────────────────────────────────────────────

     char

    ›charmander #004
     charmeleon #005                      │ charmander                        ▲
                                          │                                   █
                                          │ Illustration
                                          │
                                          │ Types
                                          │ Fire
                                          │
                                          │ Characteristics
                                          │ - Height: 0.6m
                                          │ - Weight: 8.5kg
                                          │
                                          │ Abilities
                                          │ - Blaze
                                          │ - Solar Power
                                          │ ─────────────────────────────────
                                          │
                                          │ Types:
                                          │
                                          │ Fire:
                                          │ ─────────────────
     ↵ select  ↑↓ navigate  ^k actions    │                                   ▼"
  `)

  await session.press('backspace')
  await session.press('backspace')
  await session.press('backspace')
  await session.press('backspace')

  await session.type('water')

  const searchWaterSnapshot = await session.text({
    waitFor: (text) => {
      return /water/i.test(text)
    },
  })
  expect(searchWaterSnapshot).toMatchInlineSnapshot(`
    "


    Pokemon List ─────────────────────────────────────────────────────────────

    water


                                         │ wartortle                         ▲
                                         │                                   █
                                         │ Illustration
                                         │
                                         │ Types
                                         │ Water
                                         │
                                         │ Characteristics
                                         │ - Height: 1m
                                         │ - Weight: 22.5kg
                                         │
                                         │ Abilities
                                         │ - Torrent
                                         │ - Rain Dish
                                         │ ─────────────────────────────────
                                         │
                                         │ Types:
                                         │
                                         │ Water:
                                         │ ─────────────────
    ↵ select  ↑↓ navigate  ^k actions    │                                   ▼"
  `)

  await session.press('down')

  const wartortleSnapshot = await session.text()
  expect(wartortleSnapshot).toMatchInlineSnapshot(`
    "


    Pokemon List ─────────────────────────────────────────────────────────────

    water


                                         │ wartortle                         ▲
                                         │                                   █
                                         │ Illustration
                                         │
                                         │ Types
                                         │ Water
                                         │
                                         │ Characteristics
                                         │ - Height: 1m
                                         │ - Weight: 22.5kg
                                         │
                                         │ Abilities
                                         │ - Torrent
                                         │ - Rain Dish
                                         │ ─────────────────────────────────
                                         │
                                         │ Types:
                                         │
                                         │ Water:
                                         │ ─────────────────
    ↵ select  ↑↓ navigate  ^k actions    │                                   ▼"
  `)
}, 10000)

test('list detail metadata rendering', async () => {
  const initialSnapshot = await session.text({
    waitFor: (text) => {
      return (
        /Pokemon List/i.test(text) &&
        text.includes('bulbasaur') &&
        text.includes('Types') &&
        text.includes('Height') &&
        text.includes('Abilities') &&
        text.includes('Chlorophyll')
      )
    },
  })

  expect(initialSnapshot).toMatchInlineSnapshot(`
    "


     Pokemon List ─────────────────────────────────────────────────────────────

     Search Pokemon...

    ›bulbasaur #001
     ivysaur #002                         │ bulbasaur                         ▲
     charmander #004                      │                                   ▀
     charmeleon #005                      │ Illustration
     squirtle #007                        │
     wartortle #008                       │ Types
                                          │ Grass / Poison
                                          │
                                          │ Characteristics
                                          │ - Height: 0.7m
                                          │ - Weight: 6.9kg
                                          │
                                          │ Abilities
                                          │ - Chlorophyll
                                          │ - Overgrow
                                          │ ─────────────────────────────────
                                          │
                                          │ Types:
                                          │
                                          │ Grass:
                                          │ ─────────────────
     ↵ select  ↑↓ navigate  ^k actions    │                                   ▼"
  `)

  await session.press('down')
  await session.press('down')
  await session.press('down')
  await session.press('down')

  const squirtleSnapshot = await session.text({
    waitFor: (text) => {
      return text.includes('squirtle') && text.includes('Water')
    },
  })
  expect(squirtleSnapshot).toMatchInlineSnapshot(`
    "


     Pokemon List ─────────────────────────────────────────────────────────────

     Search Pokemon...

     bulbasaur #001
     ivysaur #002                         │ squirtle                          ▲
     charmander #004                      │                                   █
     charmeleon #005                      │ Illustration
    ›squirtle #007                        │
     wartortle #008                       │ Types
                                          │ Water
                                          │
                                          │ Characteristics
                                          │ - Height: 0.5m
                                          │ - Weight: 9kg
                                          │
                                          │ Abilities
                                          │ - Torrent
                                          │ - Rain Dish
                                          │ ─────────────────────────────────
                                          │
                                          │ Types:
                                          │
                                          │ Water:
                                          │ ─────────────────
     ↵ select  ↑↓ navigate  ^k actions    │                                   ▼"
  `)
}, 10000)

test('list with detail layout consistency - short vs long detail content', async () => {
  // Use the long-detail example to test layout shift with very long content
  const testSession = await launchTerminal({
    command: 'bun',
    args: ['src/examples/list-with-detail-long.tsx'],
    cols: 80,
    rows: 25,
  })

  // First item has SHORT detail - should fit without overflow
  const shortDetailSnapshot = await testSession.text({
    waitFor: (text) => {
      return (
        text.includes('›Short Detail') &&
        text.includes('Brief content')
      )
    },
  })

  // Navigate to second item which has LONG detail - will overflow
  await testSession.press('down')

  const longDetailSnapshot = await testSession.text({
    waitFor: (text) => {
      return (
        text.includes('›Long Detail') &&
        text.includes('extensive')
      )
    },
  })

  testSession.close()

  // Compare list item positions - they should be consistent
  expect(shortDetailSnapshot).toMatchInlineSnapshot(`
    "


     Detail Length Test ───────────────────────────────────────────────────────

     Search...

    ›Short Detail
     Long Detail                          │ Brief content
     Another Item                         │
                                          │ This is short.
                                          │
                                          │
                                          │
                                          │
                                          │
                                          │
                                          │
                                          │
                                          │
                                          │
                                          │
                                          │
     ↵ select  ↑↓ navigate  ^k actions    │"
  `)
  expect(longDetailSnapshot).toMatchInlineSnapshot(`
    "


     Detail Length Test ───────────────────────────────────────────────────────

     Search...

     Short Detail
    ›Long Detail                          │ This item has extensive detail    ▲
     Another Item                         │ content                           ▀
                                          │
                                          │ Section 1
                                          │ This is a very long description
                                          │ that contains multiple paragraphs
                                          │ and sections to test how the
                                          │ layout behaves when the detail
                                          │ panel content overflows.
                                          │
                                          │ Section 2
                                          │ More content here to ensure we
                                          │ have enough text to cause
                                          │ vertical overflow in the detail
                                          │ panel scrollbox.
     ↵ select  ↑↓ navigate  ^k actions    │                                   ▼"
  `)

  // Extract the LINE NUMBER (vertical position) of list items to verify no layout shift
  const getListItemLineNumber = (snapshot: string, itemText: string) => {
    const lines = snapshot.split('\n')
    const lineIndex = lines.findIndex((line) => line.includes(itemText))
    return lineIndex
  }

  // Check vertical position - the "Short Detail" item should be at the same line number
  // regardless of whether the detail panel has overflow or not
  const shortLineNum = getListItemLineNumber(shortDetailSnapshot, 'Short Detail')
  const longLineNum = getListItemLineNumber(longDetailSnapshot, 'Short Detail')

  // BUG: The list items shift vertically when detail content overflows
  // When detail doesn't overflow: there's a blank line after navigation title
  // When detail overflows: the blank line disappears, shifting all content up
  expect(shortLineNum).toBe(longLineNum)
}, 20000)
