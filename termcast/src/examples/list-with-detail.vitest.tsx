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

    ›bulbasaur #001                      ▲
     ivysaur #002                        █│ bulbasaur                         ▲
     charmander #004                     █│                                   █
     charmeleon #005                     █│ Illustration
     squirtle #007                       █│
     wartortle #008                      █│ Types
                                         █│ Grass / Poison
                                         █│
                                         █│ Characteristics
                                         █│ - Height: 0.7m
                                         █│ - Weight: 6.9kg
                                         █│
                                         █│ Abilities
                                         █│ - Chlorophyll
                                         █│ - Overgrow
                                         █│ ─────────────────────────────────
                                         █│
                                         █│ Types:
                                         ▼│
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

     bulbasaur #001                      ▲
    ›ivysaur #002                        █│ ivysaur                           ▲
     charmander #004                     █│                                   █
     charmeleon #005                     █│ Illustration
     squirtle #007                       █│
     wartortle #008                      █│ Types
                                         █│ Grass / Poison
                                         █│
                                         █│ Characteristics
                                         █│ - Height: 1m
                                         █│ - Weight: 13kg
                                         █│
                                         █│ Abilities
                                         █│ - Chlorophyll
                                         █│ - Overgrow
                                         █│ ─────────────────────────────────
                                         █│
                                         █│ Types:
                                         ▼│
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

     bulbasaur #001                      ▲
     ivysaur #002                        █│ charmander                        ▲
    ›charmander #004                     █│                                   █
     charmeleon #005                     █│ Illustration
     squirtle #007                       █│
     wartortle #008                      █│ Types
                                         █│ Fire
                                         █│
                                         █│ Characteristics
                                         █│ - Height: 0.6m
                                         █│ - Weight: 8.5kg
                                         █│
                                         █│ Abilities
                                         █│ - Blaze
                                         █│ - Solar Power
                                         █│ ─────────────────────────────────
                                         █│
                                         █│ Types:
                                         ▼│
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

     bulbasaur #001                      ▲
     ivysaur #002                        █│ charmander                        ▲
    ┃                                                                          ┃
    ┃                                                                    esc   ┃
    ┃                                                                          ┃
    ┃   Search actions...                                                      ┃
    ┃                                                                          ┃
    ┃  ›Toggle Detail                                                       █  ┃
    ┃   View on Pokemon.com                                                 █  ┃
    ┃                                                                       █  ┃
    ┃                                                                       █  ┃
    ┃                                                                       █  ┃
    ┃                                                                       █  ┃
    ┃                                                                       █  ┃
    ┃                                                                       █  ┃
    ┃                                                                       █  ┃
    ┃                                                                       █  ┃
    ┃                                                                          ┃
    ┃   ↵ select   ↑↓ navigate                                                 ┃
    ┃                                                                          ┃
                                          │ ─────────────────
     ↵ select  ↑↓ navigate  ^k actions    │                                   ▼"
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

     bulbasaur #001                                            Grass / Poison  ▲
     ivysaur #002                                              Grass / Poison  █
    ›charmander #004                                                     Fire  █
     charmeleon #005                                                     Fire  █
     squirtle #007                                                      Water  █
     wartortle #008                                                     Water  █
                                                                               █
                                                                               █
                                                                               █
                                                                               █
                                                                               █
                                                                               █
                                                                               █
                                                                               █
                                                                               █
                                                                               █
                                                                               █
                                                                               █
                                                                               ▼


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

     bulbasaur #001                      ▲
     ivysaur #002                        █│ charmander                        ▲
    ›charmander #004                     █│                                   █
     charmeleon #005                     █│ Illustration
     squirtle #007                       █│
     wartortle #008                      █│ Types
                                         █│ Fire
                                         █│
                                         █│ Characteristics
                                         █│ - Height: 0.6m
                                         █│ - Weight: 8.5kg
                                         █│
                                         █│ Abilities
                                         █│ - Blaze
                                         █│ - Solar Power
                                         █│ ─────────────────────────────────
                                         █│
                                         █│ Types:
                                         ▼│
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

    charmander #004                     ▲
    charmeleon #005                     █│ bulbasaur                         ▲
                                        █│                                   █
                                        █│ Illustration
                                        █│
                                        █│ Types
                                        █│ Grass / Poison
                                        █│
                                        █│ Characteristics
                                        █│ - Height: 0.7m
                                        █│ - Weight: 6.9kg
                                        █│
                                        █│ Abilities
                                        █│ - Chlorophyll
                                        █│ - Overgrow
                                        █│ ─────────────────────────────────
                                        █│
                                        █│ Types:
                                        ▼│
                                         │ Grass:
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

                                        ▲
                                        █│ bulbasaur                         ▲
                                        █│                                   █
                                        █│ Illustration
                                        █│
                                        █│ Types
                                        █│ Grass / Poison
                                        █│
                                        █│ Characteristics
                                        █│ - Height: 0.7m
                                        █│ - Weight: 6.9kg
                                        █│
                                        █│ Abilities
                                        █│ - Chlorophyll
                                        █│ - Overgrow
                                        █│ ─────────────────────────────────
                                        █│
                                        █│ Types:
                                        ▼│
                                         │ Grass:
                                         │ ─────────────────
    ↵ select  ↑↓ navigate  ^k actions    │                                   ▼"
  `)

  await session.press('down')

  const wartortleSnapshot = await session.text()
  expect(wartortleSnapshot).toMatchInlineSnapshot(`
    "


    Pokemon List ─────────────────────────────────────────────────────────────

    water

                                        ▲
                                        █│ bulbasaur                         ▲
                                        █│                                   █
                                        █│ Illustration
                                        █│
                                        █│ Types
                                        █│ Grass / Poison
                                        █│
                                        █│ Characteristics
                                        █│ - Height: 0.7m
                                        █│ - Weight: 6.9kg
                                        █│
                                        █│ Abilities
                                        █│ - Chlorophyll
                                        █│ - Overgrow
                                        █│ ─────────────────────────────────
                                        █│
                                        █│ Types:
                                        ▼│
                                         │ Grass:
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

    ›bulbasaur #001                      ▲
     ivysaur #002                        █│                                   ▲
     charmander #004                     █│ ───────────────────────────────── █
     charmeleon #005                     █│                                   █
     squirtle #007                       █│ Types:                            █
     wartortle #008                      █│                                   █
                                         █│ Grass:                            ▀
                                         █│ ─────────────────
                                         █│
                                         █│ Poison:
                                         █│ ─────────────────
                                         █│
                                         █│ Characteristics:
                                         █│ Height:        0.7m
                                         █│
                                         █│ ─────────────────
                                         █│ Weight:        6.9kg
                                         █│
                                         ▼│ ─────────────────
                                          │ Abilities:
                                          │
     ↵ select  ↑↓ navigate  ^k actions    │ Chlorophyll:   Main Series        ▼"
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

     bulbasaur #001                      ▲
     ivysaur #002                        █│ squirtle                          ▲
     charmander #004                     █│                                   █
     charmeleon #005                     █│ Illustration
    ›squirtle #007                       █│
     wartortle #008                      █│ Types
                                         █│ Water
                                         █│
                                         █│ Characteristics
                                         █│ - Height: 0.5m
                                         █│ - Weight: 9kg
                                         █│
                                         █│ Abilities
                                         █│ - Torrent
                                         █│ - Rain Dish
                                         █│ ─────────────────────────────────
                                         █│
                                         █│ Types:
                                         ▼│
                                          │ Water:
                                          │ ─────────────────
     ↵ select  ↑↓ navigate  ^k actions    │                                   ▼"
  `)
}, 10000)
