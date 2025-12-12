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
        text.includes('bulbasaur') &&
        text.includes('#001')
      )
    },
  })

  expect(initialSnapshot).toMatchInlineSnapshot(`
    "


     Pokemon List ─────────────────────────────────────────────────────────────

     Search Pokemon...
    ›bulbasaur #001                       │ # bulbasaur
     ivysaur #002                         │
     charmander #004                      │ ![Illustration](https://assets.
     charmeleon #005                      │ pokemon.com/assets/cms2/img/
     squirtle #007                        │ pokedex/full/001.png)
     wartortle #008                       │
                                          │ ## Types
                                          │ Grass / Poison
     ↵ select   ↑↓ navigate   ^k actions  │
                                          │
                                          │ ───────────────────────────────────
                                          │
                                          │ Types:
                                          │ Grass:
                                          │ ─────────────────
                                          │ ─────────────────
                                          │ Characteristics:
                                          │ Height:        0.7m
                                          │ ─────────────────
                                          │ Weight:        6.9kg
                                          │ Abilities:───────
                                          │ Chlorophyll:   Main Series
                                          │ ─────────────────
                                            Overgrow:      Main Series"
  `)

  await session.press('down')

  const afterDownSnapshot = await session.text()
  expect(afterDownSnapshot).toMatchInlineSnapshot(`
    "


     Pokemon List ─────────────────────────────────────────────────────────────

     Search Pokemon...
     bulbasaur #001                       │ # ivysaur
    ›ivysaur #002                         │
     charmander #004                      │ ![Illustration](https://assets.
     charmeleon #005                      │ pokemon.com/assets/cms2/img/
     squirtle #007                        │ pokedex/full/002.png)
     wartortle #008                       │
                                          │ ## Types
                                          │ Grass / Poison
     ↵ select   ↑↓ navigate   ^k actions  │
                                          │
                                          │ ───────────────────────────────────
                                          │
                                          │ Types:
                                          │ Grass:
                                          │ ─────────────────
                                          │ ─────────────────
                                          │ Characteristics:
                                          │ Height:        1m
                                          │ ─────────────────
                                          │ Weight:        13kg
                                          │ Abilities:───────
                                          │ Chlorophyll:   Main Series
                                          │ ─────────────────
                                            Overgrow:      Main Series"
  `)

  await session.press('down')

  const charmanderSnapshot = await session.text()
  expect(charmanderSnapshot).toMatchInlineSnapshot(`
    "


     Pokemon List ─────────────────────────────────────────────────────────────

     Search Pokemon...
     bulbasaur #001                       │ # charmander
     ivysaur #002                         │
    ›charmander #004                      │ ![Illustration](https://assets.
     charmeleon #005                      │ pokemon.com/assets/cms2/img/
     squirtle #007                        │ pokedex/full/004.png)
     wartortle #008                       │
                                          │ ## Types
                                          │ Fire
     ↵ select   ↑↓ navigate   ^k actions  │
                                          │ ## Characteristics
                                          │ ───────────────────────────────────
                                          │
                                          │ Types:
                                          │ Fire:
                                          │ ─────────────────
                                          │ Characteristics:
                                          │ Height:        0.6m
                                          │ Weight:────────8.5kg
                                          │ ─────────────────
                                          │ Abilities:
                                          │ Blaze:         Main Series
                                          │ ─────────────────
                                          │ Solar Power:   Main Series"
  `)

  await session.press(['ctrl', 'k'])

  const actionsSnapshot = await session.text()
  expect(actionsSnapshot).toMatchInlineSnapshot(`
    "


     Pokemon List ─────────────────────────────────────────────────────────────

     Search Pokemon...
     bulbasaur #001                       │ # charmander
     ivysaur #002                         │
    ┃┃harmander #004                      │ ![Illustration](https://assets.
    ┃                                                                          ┃
    ┃                                                                    esc   ┃
    ┃                                                                          ┃
    ┃   Search actions...                                                      ┃
    ┃  ›Toggle Detail                                                          ┃
    ┃   View on Pokemon.com                                                    ┃
    ┃                                                                          ┃
    ┃                                                                          ┃
    ┃   ↵ select   ↑↓ navigate                                                 ┃
    ┃                                                                          ┃
    ┃┃                                    │ Fire:
                                          │ ─────────────────
                                          │ Characteristics:
                                          │ Height:        0.6m
                                          │ Weight:────────8.5kg
                                          │ ─────────────────
                                          │ Abilities:
                                          │ Blaze:         Main Series
                                          │ ─────────────────
                                          │ Solar Power:   Main Series"
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

     bulbasaur #001                                              Grass / Poison
     ivysaur #002                                                Grass / Poison
    ›charmander #004                                                       Fire
     charmeleon #005                                                       Fire
     squirtle #007                                                        Water
     wartortle #008                                                       Water


     ↵ select   ↑↓ navigate   ^k actions"
  `)

  await session.press(['ctrl', 'k'])
  await session.press('enter')

  const detailOnAgainSnapshot = await session.text({
    waitFor: (text) => {
      return text.includes('## Types')
    },
  })
  expect(detailOnAgainSnapshot).toMatchInlineSnapshot(`
    "


     Pokemon List ─────────────────────────────────────────────────────────────

     Search Pokemon...
     bulbasaur #001                       │ # charmander
     ivysaur #002                         │
    ›charmander #004                      │ ![Illustration](https://assets.
     charmeleon #005                      │ pokemon.com/assets/cms2/img/
     squirtle #007                        │ pokedex/full/004.png)
     wartortle #008                       │
                                          │ ## Types
                                          │ Fire
     ↵ select   ↑↓ navigate   ^k actions  │
                                          │ ## Characteristics
                                          │ ───────────────────────────────────
                                          │
                                          │ Types:
                                          │ Fire:
                                          │ ─────────────────
                                          │ Characteristics:
                                          │ Height:        0.6m
                                          │ Weight:────────8.5kg
                                          │ ─────────────────
                                          │ Abilities:
                                          │ Blaze:         Main Series
                                          │ ─────────────────
                                          │ Solar Power:   Main Series"
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
    charmander #004                      │ # bulbasaur
    charmeleon #005                      │
                                         │ ![Illustration](https://assets.
                                         │ pokemon.com/assets/cms2/img/
    ↵ select   ↑↓ navigate   ^k actions  │ pokedex/full/001.png)
                                         │
                                         │ ## Types
                                         │ Grass / Poison
                                         │
                                         │
                                         │ ───────────────────────────────────
                                         │
                                         │ Types:
                                         │ Grass:
                                         │ ─────────────────
                                         │ ─────────────────
                                         │ Characteristics:
                                         │ Height:        0.7m
                                         │ ─────────────────
                                         │ Weight:        6.9kg
                                         │ Abilities:───────
                                         │ Chlorophyll:   Main Series
                                         │ ─────────────────
                                           Overgrow:      Main Series"
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
                                         │ # bulbasaur
                                         │
    ↵ select   ↑↓ navigate   ^k actions  │ ![Illustration](https://assets.
                                         │ pokemon.com/assets/cms2/img/
                                         │ pokedex/full/001.png)
                                         │
                                         │ ## Types
                                         │ Grass / Poison
                                         │
                                         │
                                         │ ───────────────────────────────────
                                         │
                                         │ Types:
                                         │ Grass:
                                         │ ─────────────────
                                         │ ─────────────────
                                         │ Characteristics:
                                         │ Height:        0.7m
                                         │ ─────────────────
                                         │ Weight:        6.9kg
                                         │ Abilities:───────
                                         │ Chlorophyll:   Main Series
                                         │ ─────────────────
                                           Overgrow:      Main Series"
  `)

  await session.press('down')

  const wartortleSnapshot = await session.text()
  expect(wartortleSnapshot).toMatchInlineSnapshot(`
    "


    Pokemon List ─────────────────────────────────────────────────────────────

    water
                                         │ # bulbasaur
                                         │
    ↵ select   ↑↓ navigate   ^k actions  │ ![Illustration](https://assets.
                                         │ pokemon.com/assets/cms2/img/
                                         │ pokedex/full/001.png)
                                         │
                                         │ ## Types
                                         │ Grass / Poison
                                         │
                                         │
                                         │ ───────────────────────────────────
                                         │
                                         │ Types:
                                         │ Grass:
                                         │ ─────────────────
                                         │ ─────────────────
                                         │ Characteristics:
                                         │ Height:        0.7m
                                         │ ─────────────────
                                         │ Weight:        6.9kg
                                         │ Abilities:───────
                                         │ Chlorophyll:   Main Series
                                         │ ─────────────────
                                           Overgrow:      Main Series"
  `)
}, 10000)

test('list detail metadata rendering', async () => {
  const initialSnapshot = await session.text({
    waitFor: (text) => {
      return (
        /Pokemon List/i.test(text) &&
        text.includes('bulbasaur') &&
        text.includes('Types') &&
        text.includes('Height')
      )
    },
  })

  expect(initialSnapshot).toMatchInlineSnapshot(`
    "


     Pokemon List ─────────────────────────────────────────────────────────────

     Search Pokemon...
    ›bulbasaur #001                       │ # bulbasaur
     ivysaur #002                         │
     charmander #004                      │ ![Illustration](https://assets.
     charmeleon #005                      │ pokemon.com/assets/cms2/img/
     squirtle #007                        │ pokedex/full/001.png)
     wartortle #008                       │
                                          │ ## Types
                                          │ Grass / Poison
     ↵ select   ↑↓ navigate   ^k actions  │
                                          │
                                          │ ───────────────────────────────────
                                          │
                                          │ Types:
                                          │ Grass:
                                          │ ─────────────────
                                          │ ─────────────────
                                          │ Characteristics:
                                          │ Height:        0.7m
                                          │ ─────────────────
                                          │ Weight:        6.9kg
                                          │ Abilities:───────
                                          │ Chlorophyll:   Main Series
                                          │ ─────────────────
                                            Overgrow:      Main Series"
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
     bulbasaur #001                       │ # squirtle
     ivysaur #002                         │
     charmander #004                      │ ![Illustration](https://assets.
     charmeleon #005                      │ pokemon.com/assets/cms2/img/
    ›squirtle #007                        │ pokedex/full/007.png)
     wartortle #008                       │
                                          │ ## Types
                                          │ Water
     ↵ select   ↑↓ navigate   ^k actions  │
                                          │ ## Characteristics
                                          │ ───────────────────────────────────
                                          │
                                          │ Types:
                                          │ Water:
                                          │ ─────────────────
                                          │ Characteristics:
                                          │ Height:        0.5m
                                          │ Weight:────────9kg
                                          │ ─────────────────
                                          │ Abilities:
                                          │ Torrent:       Main Series
                                          │ ─────────────────
                                          │ Rain Dish:     Main Series"
  `)
}, 10000)
