// node-pty does not work in bun, so we use vitest to run this test
import { test, expect, afterEach, beforeEach } from 'vitest'
import { NodeTuiDriver } from '@termcast/cli/src/e2e-node'

let driver: NodeTuiDriver

beforeEach(() => {
  driver = new NodeTuiDriver('bun', ['src/examples/list-with-detail.tsx'], {
    cols: 80,
    rows: 30,
  })
})

afterEach(() => {
  driver?.dispose()
})

test('list with detail view display and navigation', async () => {
  const initialSnapshot = await driver.text({
    waitFor: (text) => {
      // wait for list to show up with detail view
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

    ›bulbasaur #001                      │ # bulbasaur
     ivysaur #002                        │
     charmander #004                     │ ![Illustration](https://assets.pokemon.
     charmeleon #005                     │
     squirtle #007                       │ ## Types
     wartortle #008                      │ Grass / Poison
                                         │
                                         │ ## Characteristics
     ↵ select   ↑↓ navigate   ^k actions │ - Height: 0.7m
                                         │ - Weight: 6.9kg
                                         │
                                         │ ## Abilities
                                         │ - Chlorophyll
                                         │ - Overgrow
                                         │ ───────────────────────────────────────
                                         │
                                         │ Types:
                                         │
                                         │ Grass:
                                         │ ─────────────────
                                         │
                                         │ Poison:
                                         │ ─────────────────
                                         │"
  `)

  // Navigate down to next pokemon
  await driver.keys.down()

  const afterDownSnapshot = await driver.text()
  expect(afterDownSnapshot).toMatchInlineSnapshot(`
    "

     Pokemon List ─────────────────────────────────────────────────────────────

     Search Pokemon...

     bulbasaur #001                      │ # ivysaur
    ›ivysaur #002                        │
     charmander #004                     │ ![Illustration](https://assets.pokemon.
     charmeleon #005                     │
     squirtle #007                       │ ## Types
     wartortle #008                      │ Grass / Poison
                                         │
                                         │ ## Characteristics
     ↵ select   ↑↓ navigate   ^k actions │ - Height: 1m
                                         │ - Weight: 13kg
                                         │
                                         │ ## Abilities
                                         │ - Chlorophyll
                                         │ - Overgrow
                                         │ ───────────────────────────────────────
                                         │
                                         │ Types:
                                         │
                                         │ Grass:
                                         │ ─────────────────
                                         │
                                         │ Poison:
                                         │ ─────────────────
                                         │"
  `)

  // Navigate down to charmander
  await driver.keys.down()

  const charmanderSnapshot = await driver.text()
  expect(charmanderSnapshot).toMatchInlineSnapshot(`
    "

     Pokemon List ─────────────────────────────────────────────────────────────

     Search Pokemon...

     bulbasaur #001                      │ # charmander
     ivysaur #002                        │
    ›charmander #004                     │ ![Illustration](https://assets.pokemon.
     charmeleon #005                     │
     squirtle #007                       │ ## Types
     wartortle #008                      │ Fire
                                         │
                                         │ ## Characteristics
     ↵ select   ↑↓ navigate   ^k actions │ - Height: 0.6m
                                         │ - Weight: 8.5kg
                                         │
                                         │ ## Abilities
                                         │ - Blaze
                                         │ - Solar Power
                                         │ ───────────────────────────────────────
                                         │
                                         │ Types:
                                         │
                                         │ Fire:
                                         │ ─────────────────
                                         │
                                         │ Characteristics:
                                         │ Height:        0.6m
                                         │"
  `)

  // Open actions
  await driver.keys.ctrlK()

  const actionsSnapshot = await driver.text()
  expect(actionsSnapshot).toMatchInlineSnapshot(`
    "

    Pokemon List ─────────────────────────────────────────────────────────────

    Search Pokemon...

    bulbasaur #001                      │ # charmander

                                                                         esc   n.

      Search actions...
     ›Toggle Detail
      View on Pokemon.com


      ↵ select   ↑↓ navigate

                                        │ ## Abilities
                                        │ - Blaze
                                        │ - Solar Power
                                        │ ───────────────────────────────────────
                                        │
                                        │ Types:
                                        │
                                        │ Fire:
                                        │ ─────────────────
                                        │
                                        │ Characteristics:
                                        │ Height:        0.6m
                                        │"
  `)

  // Select "Toggle Detail" action
  await driver.keys.enter()

  const afterToggleSnapshot = await driver.text({
    waitFor: (text) => {
      // Wait for accessories to appear (detail view is hidden)
      return text.includes('Grass / Poison') || text.includes('Fire')
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

  // Open actions again and toggle detail back on
  await driver.keys.ctrlK()
  await driver.keys.enter()

  const detailOnAgainSnapshot = await driver.text({
    waitFor: (text) => {
      // Wait for detail view to reappear
      return !text.includes('Grass / Poison') && !text.includes('Fire')
    },
  })
  expect(detailOnAgainSnapshot).toMatchInlineSnapshot(`
    "

     Pokemon List ─────────────────────────────────────────────────────────────

     Search Pokemon...

     bulbasaur #001                       │ # charmander
     ivysaur #002                         │
    ›charmander #004                      │ ![Illustration](https://assets.poke
     charmeleon #005                      │
     squirtle #007                        │ ## Types
     wartortle #008                       │ Fire
                                          │
                                          │ ## Characteristics
     ↵ select   ↑↓ navigate   ^k actions  │ - Height: 0.6m
                                          │ - Weight: 8.5kg
                                          │
                                          │ ## Abilities
                                          │ - Blaze
                                          │ - Solar Power
                                          │ ───────────────────────────────────
                                          │
                                          │ Types:
                                          │
                                          │ Fire:
                                          │ ─────────────────
                                          │
                                          │ Characteristics:
                                          │ Height:        0.6m
                                          │"
  `)
}, 15000)

test('list detail view search functionality', async () => {
  await driver.text({
    waitFor: (text) => {
      // wait for list to show up
      return /Pokemon List/i.test(text)
    },
  })

  // Search for "char"
  await driver.keys.type('char')

  const searchCharSnapshot = await driver.text({
    waitFor: (text) => {
      return /char/i.test(text) && text.includes('charmander')
    },
  })
  expect(searchCharSnapshot).toMatchInlineSnapshot(`
    "

    Pokemon List ─────────────────────────────────────────────────────────────

    char

    charmander #004                     │ # bulbasaur
    charmeleon #005                     │
                                        │ ![Illustration](https://assets.pokemon.
                                        │
    ↵ select   ↑↓ navigate   ^k actions │ ## Types
                                        │ Grass / Poison
                                        │
                                        │ ## Characteristics
                                        │ - Height: 0.7m
                                        │ - Weight: 6.9kg
                                        │
                                        │ ## Abilities
                                        │ - Chlorophyll
                                        │ - Overgrow
                                        │ ───────────────────────────────────────
                                        │
                                        │ Types:
                                        │
                                        │ Grass:
                                        │ ─────────────────
                                        │
                                        │ Poison:
                                        │ ─────────────────
                                        │"
  `)

  // Clear search
  await driver.keys.backspace()
  await driver.keys.backspace()
  await driver.keys.backspace()
  await driver.keys.backspace()

  // Search for "water"
  await driver.keys.type('water')

  const searchWaterSnapshot = await driver.text({
    waitFor: (text) => {
      return /water/i.test(text) && text.includes('squirtle')
    },
  })
  expect(searchWaterSnapshot).toMatchInlineSnapshot(`
    "

    Pokemon List ─────────────────────────────────────────────────────────────

    water

                                        │ # bulbasaur
                                        │
    ↵ select   ↑↓ navigate   ^k actions │ ![Illustration](https://assets.pokemon.
                                        │
                                        │ ## Types
                                        │ Grass / Poison
                                        │
                                        │ ## Characteristics
                                        │ - Height: 0.7m
                                        │ - Weight: 6.9kg
                                        │
                                        │ ## Abilities
                                        │ - Chlorophyll
                                        │ - Overgrow
                                        │ ───────────────────────────────────────
                                        │
                                        │ Types:
                                        │
                                        │ Grass:
                                        │ ─────────────────
                                        │
                                        │ Poison:
                                        │ ─────────────────
                                        │"
  `)

  // Navigate down to wartortle
  await driver.keys.down()

  const wartortleSnapshot = await driver.text()
  expect(wartortleSnapshot).toMatchInlineSnapshot(`
    "

    Pokemon List ─────────────────────────────────────────────────────────────

    water

                                        │ # bulbasaur
                                        │
    ↵ select   ↑↓ navigate   ^k actions │ ![Illustration](https://assets.pokemon.
                                        │
                                        │ ## Types
                                        │ Grass / Poison
                                        │
                                        │ ## Characteristics
                                        │ - Height: 0.7m
                                        │ - Weight: 6.9kg
                                        │
                                        │ ## Abilities
                                        │ - Chlorophyll
                                        │ - Overgrow
                                        │ ───────────────────────────────────────
                                        │
                                        │ Types:
                                        │
                                        │ Grass:
                                        │ ─────────────────
                                        │
                                        │ Poison:
                                        │ ─────────────────
                                        │"
  `)
}, 10000)

test('list detail metadata rendering', async () => {
  const initialSnapshot = await driver.text({
    waitFor: (text) => {
      // wait for list with metadata to show up
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

    ›bulbasaur #001                      │ # bulbasaur
     ivysaur #002                        │
     charmander #004                     │ ![Illustration](https://assets.pokemon.
     charmeleon #005                     │
     squirtle #007                       │ ## Types
     wartortle #008                      │ Grass / Poison
                                         │
                                         │ ## Characteristics
     ↵ select   ↑↓ navigate   ^k actions │ - Height: 0.7m
                                         │ - Weight: 6.9kg
                                         │
                                         │ ## Abilities
                                         │ - Chlorophyll
                                         │ - Overgrow
                                         │ ───────────────────────────────────────
                                         │
                                         │ Types:
                                         │
                                         │ Grass:
                                         │ ─────────────────
                                         │
                                         │ Poison:
                                         │ ─────────────────
                                         │"
  `)

  // Navigate to a different pokemon
  await driver.keys.down()
  await driver.keys.down()
  await driver.keys.down()
  await driver.keys.down()

  const squirtleSnapshot = await driver.text({
    waitFor: (text) => {
      return text.includes('squirtle') && text.includes('Water')
    },
  })
  expect(squirtleSnapshot).toMatchInlineSnapshot(`
    "

     Pokemon List ─────────────────────────────────────────────────────────────

     Search Pokemon...

     bulbasaur #001                      │ # squirtle
     ivysaur #002                        │
     charmander #004                     │ ![Illustration](https://assets.pokemon.
     charmeleon #005                     │
    ›squirtle #007                       │ ## Types
     wartortle #008                      │ Water
                                         │
                                         │ ## Characteristics
     ↵ select   ↑↓ navigate   ^k actions │ - Height: 0.5m
                                         │ - Weight: 9kg
                                         │
                                         │ ## Abilities
                                         │ - Torrent
                                         │ - Rain Dish
                                         │ ───────────────────────────────────────
                                         │
                                         │ Types:
                                         │
                                         │ Water:
                                         │ ─────────────────
                                         │
                                         │ Characteristics:
                                         │ Height:        0.5m
                                         │"
  `)
}, 10000)