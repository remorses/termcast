import { test, expect, afterEach, beforeEach } from 'vitest'
import { launchTerminal, Session } from 'tuistory/src'

let session: Session

beforeEach(async () => {
  session = await launchTerminal({
    command: 'bun',
    args: ['src/examples/list-with-detail.tsx'],
    cols: 80,
    rows: 33,
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
        text.includes('Height: 0.7m')
      )
    },
    timeout: 10000,
  })

  expect(initialSnapshot).toMatchInlineSnapshot(`
    "


       Pokemon List ─────────────────────────────────────────────────────────────

       > Search Pokemon...

      ›bulbasaur #001                       │ bulbasaur                         ▲
       ivysaur #002                         │                                   █
       charmander #004                      │ Illustration
       charmeleon #005                      │
       squirtle #007                        │ Types
       wartortle #008                       │
                                            │ Grass / Poison
                                            │
                                            │ Characteristics
                                            │
                                            │ - Height: 0.7m
                                            │ - Weight: 6.9kg
                                            │
                                            │
                                            │ Abilities
                                            │
                                            │ - Chlorophyll
                                            │ - Overgrow
                                            │
                                            │
                                            │ Types
                                            │
                                            │ Grass
                                            │
       ↵ toggle detail   ↑↓ navigate   ^k a │ ───────────────────────────────── ▼

    "
  `)

  await session.press('down')

  const afterDownSnapshot = await session.text({
    waitFor: (text) => text.includes('ivysaur') && text.includes('Height: 1m'),
  })
  expect(afterDownSnapshot).toMatchInlineSnapshot(`
    "


       Pokemon List ─────────────────────────────────────────────────────────────

       > Search Pokemon...

       bulbasaur #001                       │ ivysaur                           ▲
      ›ivysaur #002                         │                                   █
       charmander #004                      │ Illustration
       charmeleon #005                      │
       squirtle #007                        │ Types
       wartortle #008                       │
                                            │ Grass / Poison
                                            │
                                            │ Characteristics
                                            │
                                            │ - Height: 1m
                                            │ - Weight: 13kg
                                            │
                                            │
                                            │ Abilities
                                            │
                                            │ - Chlorophyll
                                            │ - Overgrow
                                            │
                                            │
                                            │ Types
                                            │
                                            │ Grass
                                            │
       ↵ toggle detail   ↑↓ navigate   ^k a │ ───────────────────────────────── ▼

    "
  `)

  await session.press('down')

  const charmanderSnapshot = await session.text()
  expect(charmanderSnapshot).toMatchInlineSnapshot(`
    "


       Pokemon List ─────────────────────────────────────────────────────────────

       > Search Pokemon...

       bulbasaur #001                       │ charmander                        ▲
       ivysaur #002                         │                                   █
      ›charmander #004                      │ Illustration
       charmeleon #005                      │
       squirtle #007                        │ Types
       wartortle #008                       │
                                            │ Fire
                                            │
                                            │ Characteristics
                                            │
                                            │ - Height: 0.6m
                                            │ - Weight: 8.5kg
                                            │
                                            │
                                            │ Abilities
                                            │
                                            │ - Blaze
                                            │ - Solar Power
                                            │
                                            │
                                            │ Types
                                            │
                                            │ Fire
                                            │
       ↵ toggle detail   ↑↓ navigate   ^k a │ ───────────────────────────────── ▼

    "
  `)

  await session.press(['ctrl', 'k'])

  const actionsSnapshot = await session.text()
  // Keep page content visible behind the actions dialog while preserving dialog layering
  expect(actionsSnapshot).toContain('Actions')
  expect(actionsSnapshot).toContain('charmander #004')
  expect(actionsSnapshot).toMatchInlineSnapshot(`
    "


       Pokemon List ─────────────────────────────────────────────────────────────

       > Search Pokemon...

       bulbasaur #001                       │ charmander                        ▲
       ivysaur #002                         │                                   █
      ›charmander #004                      │ Illustration
      ╭──────────────────────────────────────────────────────────────────────────╮
      │                                                                          │
      │   Actions                                                          esc   │
      │                                                                          │
      │   > Search actions...                                                    │
      │                                                                          │
      │  ›Toggle Detail                                                          │
      │   View on Pokemon.com                                                    │
      │                                                                          │
      │   Settings                                                               │
      │   Change Theme...                                                        │
      │   See Console Logs                                                       │
      │                                                                          │
      │                                                                          │
      │                                                                          │
      │                                                                          │
      │                                                                          │
      │   ↵ select   ↑↓ navigate                                                 │
      │                                                                          │
      ╰──────────────────────────────────────────────────────────────────────────╯
                                            │
       ↵ toggle detail   ↑↓ navigate   ^k a │ ───────────────────────────────── ▼

    "
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

       > Search Pokemon...

       bulbasaur #001                                              Grass / Poison
       ivysaur #002                                                Grass / Poison
      ›charmander #004                                                       Fire
       charmeleon #005                                                       Fire
       squirtle #007                                                        Water
       wartortle #008                                                       Water


       ↵ toggle detail   ↑↓ navigate   ^k actions         powered by termcast.app

















    "
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

       > Search Pokemon...

       bulbasaur #001                       │ charmander                        ▲
       ivysaur #002                         │                                   █
      ›charmander #004                      │ Illustration
       charmeleon #005                      │
       squirtle #007                        │ Types
       wartortle #008                       │
                                            │ Fire
                                            │
                                            │ Characteristics
                                            │
                                            │ - Height: 0.6m
                                            │ - Weight: 8.5kg
                                            │
                                            │
                                            │ Abilities
                                            │
                                            │ - Blaze
                                            │ - Solar Power
                                            │
                                            │
                                            │ Types
                                            │
                                            │ Fire
                                            │
       ↵ toggle detail   ↑↓ navigate   ^k a │ ───────────────────────────────── ▼

    "
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

       > char

      ›charmander #004                      │ charmander                        ▲
       charmeleon #005                      │                                   █
                                            │ Illustration
                                            │
                                            │ Types
                                            │
                                            │ Fire
                                            │
                                            │ Characteristics
                                            │
                                            │ - Height: 0.6m
                                            │ - Weight: 8.5kg
                                            │
                                            │
                                            │ Abilities
                                            │
                                            │ - Blaze
                                            │ - Solar Power
                                            │
                                            │
                                            │ Types
                                            │
                                            │ Fire
                                            │
       ↵ toggle detail   ↑↓ navigate   ^k a │ ───────────────────────────────── ▼

    "
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

       > water

                                            │ wartortle                         ▲
                                            │                                   █
                  No items found            │ Illustration
                                            │
                                            │ Types
                                            │
                                            │ Water
                                            │
                                            │ Characteristics
                                            │
                                            │ - Height: 1m
                                            │ - Weight: 22.5kg
                                            │
                                            │
                                            │ Abilities
                                            │
                                            │ - Torrent
                                            │ - Rain Dish
                                            │
                                            │
                                            │ Types
                                            │
                                            │ Water
                                            │
       ↵ toggle detail   ↑↓ navigate   ^k a │ ───────────────────────────────── ▼

    "
  `)

  await session.press('down')

  const wartortleSnapshot = await session.text()
  expect(wartortleSnapshot).toMatchInlineSnapshot(`
    "


       Pokemon List ─────────────────────────────────────────────────────────────

       > water

                                            │ wartortle                         ▲
                                            │                                   █
                  No items found            │ Illustration
                                            │
                                            │ Types
                                            │
                                            │ Water
                                            │
                                            │ Characteristics
                                            │
                                            │ - Height: 1m
                                            │ - Weight: 22.5kg
                                            │
                                            │
                                            │ Abilities
                                            │
                                            │ - Torrent
                                            │ - Rain Dish
                                            │
                                            │
                                            │ Types
                                            │
                                            │ Water
                                            │
       ↵ toggle detail   ↑↓ navigate   ^k a │ ───────────────────────────────── ▼

    "
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

       > Search Pokemon...

      ›bulbasaur #001                       │ bulbasaur                         ▲
       ivysaur #002                         │                                   █
       charmander #004                      │ Illustration
       charmeleon #005                      │
       squirtle #007                        │ Types
       wartortle #008                       │
                                            │ Grass / Poison
                                            │
                                            │ Characteristics
                                            │
                                            │ - Height: 0.7m
                                            │ - Weight: 6.9kg
                                            │
                                            │
                                            │ Abilities
                                            │
                                            │ - Chlorophyll
                                            │ - Overgrow
                                            │
                                            │
                                            │ Types
                                            │
                                            │ Grass
                                            │
       ↵ toggle detail   ↑↓ navigate   ^k a │ ───────────────────────────────── ▼

    "
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

       > Search Pokemon...

       bulbasaur #001                       │ squirtle                          ▲
       ivysaur #002                         │                                   █
       charmander #004                      │ Illustration
       charmeleon #005                      │
      ›squirtle #007                        │ Types
       wartortle #008                       │
                                            │ Water
                                            │
                                            │ Characteristics
                                            │
                                            │ - Height: 0.5m
                                            │ - Weight: 9kg
                                            │
                                            │
                                            │ Abilities
                                            │
                                            │ - Torrent
                                            │ - Rain Dish
                                            │
                                            │
                                            │ Types
                                            │
                                            │ Water
                                            │
       ↵ toggle detail   ↑↓ navigate   ^k a │ ───────────────────────────────── ▼

    "
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
        text.includes('Brief content') &&
        text.includes('↑↓ navigate')
      )
    },
  })

  // Navigate to second item which has LONG detail - will overflow
  await testSession.press('down')

  const longDetailSnapshot = await testSession.text({
    waitFor: (text) => {
      return (
        text.includes('›Long Detail') &&
        text.includes('extensive') &&
        text.includes('↑↓ navigate')
      )
    },
  })

  testSession.close()

  // Compare list item positions - they should be consistent
  expect(shortDetailSnapshot).toMatchInlineSnapshot(`
    "


       Detail Length Test ───────────────────────────────────────────────────────

       > Search...

      ›Short Detail                         │ Brief content
       Long Detail                          │
       Another Item                         │ This is short.
                                            │
                                            │
                                            │
                                            │
                                            │
       ↑↓ navigate   ^k actions             │









    "
  `)
  expect(longDetailSnapshot).toMatchInlineSnapshot(`
    "


       Detail Length Test ───────────────────────────────────────────────────────

       > Search...

       Short Detail                         │ This item has extensive detail    ▲
      ›Long Detail                          │ content                           ▀
       Another Item                         │
                                            │ Section 1
                                            │
                                            │ This is a very long description
                                            │ that contains multiple paragraphs
                                            │ and sections to test how the
                                            │ layout behaves when the detail
                                            │ panel content overflows.
                                            │
                                            │ Section 2
                                            │
                                            │ More content here to ensure we
                                            │ have enough text to cause
                                            │ vertical overflow in the detail
       ↑↓ navigate   ^k actions             │ panel scrollbox.                  ▼

    "
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
