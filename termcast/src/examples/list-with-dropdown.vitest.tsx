// node-pty does not work in bun, so we use vitest to run this test
import { test, expect, afterEach, beforeEach } from 'vitest'
import { NodeTuiDriver } from '@termcast/cli/src/e2e-node'

let driver: NodeTuiDriver

beforeEach(() => {
  driver = new NodeTuiDriver('bun', ['src/examples/list-with-dropdown.tsx'], {
    cols: 70,
    rows: 50,
  })
})

afterEach(() => {
  driver?.dispose()
})

test('list with dropdown navigation', async () => {
  await driver.text({
    waitFor: (text) => {
      // wait for list to show up
      return /search beers/i.test(text)
    },
  })

  const initialSnapshot = await driver.text()
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


     ↵ select   ↑↓ navigate   ^k actions"
  `)

  // Press ctrl+p to open dropdown
  await driver.keys.ctrlP()

  // Capture snapshot immediately after pressing ctrl+p
  const immediatelyAfterCtrlPSnapshot = await driver.text()
  expect(immediatelyAfterCtrlPSnapshot).toMatchInlineSnapshot(`
      "


      Select Drink Type                                          esc

      Search...

      Alcoholic Beverages
      Beer
      Wine

      Non-Alcoholic
      Soda
      Juice


      ↵ select   ↑↓ navigate



      ↵ select   ↑↓ navigate   ^k actions"
    `)

  const afterCtrlPSnapshot = await driver.text({
    waitFor: (text) => {
      // wait for dropdown to show up
      return /select drink type/i.test(text)
    },
  })
  expect(afterCtrlPSnapshot).toMatchInlineSnapshot(`
      "


      Select Drink Type                                          esc

      Search...

      Alcoholic Beverages
      Beer
      Wine

      Non-Alcoholic
      Soda
      Juice


      ↵ select   ↑↓ navigate



      ↵ select   ↑↓ navigate   ^k actions"
    `)

  // Navigate down in dropdown
  await driver.keys.down()

  const afterDownSnapshot = await driver.text()
  expect(afterDownSnapshot).toMatchInlineSnapshot(`
      "


      Select Drink Type                                          esc

      Search...

      Alcoholic Beverages
      Beer
      Wine

      Non-Alcoholic
      Soda
      Juice


      ↵ select   ↑↓ navigate



      ↵ select   ↑↓ navigate   ^k actions"
    `)

  // Navigate down again
  await driver.keys.down()

  const afterSecondDownSnapshot = await driver.text()
  expect(afterSecondDownSnapshot).toMatchInlineSnapshot(`
      "


      Select Drink Type                                          esc

      Search...

      Alcoholic Beverages
      Beer
      Wine

      Non-Alcoholic
      Soda
      Juice


      ↵ select   ↑↓ navigate



      ↵ select   ↑↓ navigate   ^k actions"
    `)

  // Select the current item
  await driver.keys.enter()

  const afterSelectSnapshot = await driver.text({
    waitFor: (text) => {
      // wait for dropdown to close and list to update
      return !text.includes('Select Drink Type')
    },
  })
  expect(afterSelectSnapshot).toMatchInlineSnapshot(`
      "

       Search Beers ───────────────────────────────────────────────────


       Search...                                                 Soda ▾


      ›Coca Cola Soda
       Sprite Soda


       ↵ select   ↑↓ navigate   ^k actions"
    `)
}, 10000)

test('list with dropdown search and filter', async () => {
  await driver.text({
    waitFor: (text) => {
      // wait for list to show up
      return /search beers/i.test(text)
    },
  })

  // Open dropdown
  await driver.keys.ctrlP()

  // Capture snapshot immediately after pressing ctrl+p
  const immediatelyAfterCtrlPSnapshot = await driver.text()
  expect(immediatelyAfterCtrlPSnapshot).toMatchInlineSnapshot(`
      "


      Select Drink Type                                          esc

      Search...

      Alcoholic Beverages
      Beer
      Wine

      Non-Alcoholic
      Soda
      Juice


      ↵ select   ↑↓ navigate



      ↵ select   ↑↓ navigate   ^k actions"
    `)

  await driver.text({
    waitFor: (text) => {
      return /select drink type/i.test(text)
    },
  })

  // Type to search in dropdown
  await driver.keys.type('wine')

  const afterSearchWineSnapshot = await driver.text({
    waitFor: (text) => {
      return /wine/i.test(text)
    },
  })
  expect(afterSearchWineSnapshot).toMatchInlineSnapshot(`
      "


      Select Drink Type                                          esc

      wine
      Wine


      ↵ select   ↑↓ navigate

      Sierra Nevada IPA Beer
      Chateau Margaux Wine
      Pinot Noir Wine
      Coca Cola Soda
      Sprite Soda
      Orange Juice Juice
      Apple Juice Juice


      ↵ select   ↑↓ navigate   ^k actions"
    `)

  // Select Wine
  await driver.keys.enter()

  const afterSelectWineSnapshot = await driver.text({
    waitFor: (text) => {
      // wait for dropdown to close
      return !text.includes('Select Drink Type')
    },
  })
  expect(afterSelectWineSnapshot).toMatchInlineSnapshot(`
    "

     Search Beers ───────────────────────────────────────────────────


     Search...                                                 Beer ▾


    ›Augustiner Helles Beer
     Camden Hells Beer
     Leffe Blonde Beer
     Sierra Nevada IPA Beer


     ↵ select   ↑↓ navigate   ^k actions"
  `)

  // Clear search in main list and type to search
  await driver.keys.type('pinot')

  const afterSearchPinotSnapshot = await driver.text({
    waitFor: (text) => {
      return /pinot/i.test(text)
    },
  })
  expect(afterSearchPinotSnapshot).toMatchInlineSnapshot(`
    "

    Search Beers ───────────────────────────────────────────────────


    pinot                                                     Beer ▾




    ↵ select   ↑↓ navigate   ^k actions"
  `)
}, 10000)
