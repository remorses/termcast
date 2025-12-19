import { test, expect, afterEach, beforeEach } from 'vitest'
import { launchTerminal, Session } from 'tuistory/src'

let session: Session

beforeEach(async () => {
  session = await launchTerminal({
    command: 'bun',
    args: ['src/examples/form-tagpicker.tsx'],
    cols: 70,
    rows: 50,
  })
})

afterEach(() => {
  session?.close()
})

test('form tagpicker shows inline options', async () => {
  await session.text({
    waitFor: (text) => {
      return /TagPicker Component Demo/i.test(text)
    },
  })

  await session.waitIdle()

  const initialSnapshot = await session.text()

  expect(initialSnapshot).toMatchInlineSnapshot(`
    "












    ■  TagPicker Component Demo
    │  Test tag picker with multiple selection support
    │
    ◇  Favorite Sport
    │  Choose your favorite sport...
    │
    │  ○ Basketball
    │  ○ Football
    │  ○ Tennis
    │  ○ Baseball
    │  ○ Golf
    │  ○ Swimming
    │  Select your favorite sport from the list
    │
    ◇  Country
    │  Germany
    │
    │  ● Germany
    │  ○ India
    │  ○ Netherlands
    │  ○ Norway
    │  ○ Poland
    └  ○ Russia












     ctrl ↵ submit   tab navigate   ^k actions"
  `)

  await session.press('space')

  const afterSelectBasketballSnapshot = await session.text()
  expect(afterSelectBasketballSnapshot).toMatchInlineSnapshot(`
    "












    ■  TagPicker Component Demo
    │  Test tag picker with multiple selection support
    │
    ◇  Favorite Sport
    │  Choose your favorite sport...
    │
    │  ○ Basketball
    │  ○ Football
    │  ○ Tennis
    │  ○ Baseball
    │  ○ Golf
    │  ○ Swimming
    │  Select your favorite sport from the list
    │
    ◇  Country
    │  Germany
    │
    │  ● Germany
    │  ○ India
    │  ○ Netherlands
    │  ○ Norway
    │  ○ Poland
    └  ○ Russia












     ctrl ↵ submit   tab navigate   ^k actions"
  `)

  await session.press('down')

  const afterDownSnapshot = await session.text()
  expect(afterDownSnapshot).toMatchInlineSnapshot(`
    "












    ■  TagPicker Component Demo
    │  Test tag picker with multiple selection support
    │
    ◇  Favorite Sport
    │  Choose your favorite sport...
    │
    │  ○ Basketball
    │  ○ Football
    │  ○ Tennis
    │  ○ Baseball
    │  ○ Golf
    │  ○ Swimming
    │  Select your favorite sport from the list
    │
    ◇  Country
    │  Germany
    │
    │  ● Germany
    │  ○ India
    │  ○ Netherlands
    │  ○ Norway
    │  ○ Poland
    └  ○ Russia












     ctrl ↵ submit   tab navigate   ^k actions"
  `)

  await session.press('down')
  await session.press('down')
  await session.press('down')
  await session.press('down')

  const afterMultipleDownSnapshot = await session.text()
  expect(afterMultipleDownSnapshot).toMatchInlineSnapshot(`
    "












    ■  TagPicker Component Demo
    │  Test tag picker with multiple selection support
    │
    ◇  Favorite Sport
    │  Choose your favorite sport...
    │
    │  ○ Basketball
    │  ○ Football
    │  ○ Tennis
    │  ○ Baseball
    │  ○ Golf
    │  ○ Swimming
    │  Select your favorite sport from the list
    │
    ◇  Country
    │  Germany
    │
    │  ● Germany
    │  ○ India
    │  ○ Netherlands
    │  ○ Norway
    │  ○ Poland
    └  ○ Russia












     ctrl ↵ submit   tab navigate   ^k actions"
  `)

  await session.press('enter')

  const afterSelectSnapshot = await session.text()
  expect(afterSelectSnapshot).toMatchInlineSnapshot(`
    "












    ■  TagPicker Component Demo
    │  Test tag picker with multiple selection support
    │
    ◇  Favorite Sport
    │  Choose your favorite sport...
    │
    │  ○ Basketball
    │  ○ Football
    │  ○ Tennis
    │  ○ Baseball
    │  ○ Golf
    │  ○ Swimming
    │  Select your favorite sport from the list
    │
    ◇  Country
    │  Germany
    │
    │  ● Germany
    │  ○ India
    │  ○ Netherlands
    │  ○ Norway
    │  ○ Poland
    └  ○ Russia












     ctrl ↵ submit   tab navigate   ^k actions"
  `)
}, 15000)

test('form tagpicker keyboard navigation', async () => {
  await session.text({
    waitFor: (text) => {
      return /TagPicker Component Demo/i.test(text)
    },
  })

  await session.press('space')

  const afterSelectSnapshot = await session.text()
  expect(afterSelectSnapshot).toMatchInlineSnapshot(`
    "












    ■  TagPicker Component Demo
    │  Test tag picker with multiple selection support
    │
    ◇  Favorite Sport
    │  Choose your favorite sport...
    │
    │  ○ Basketball
    │  ○ Football
    │  ○ Tennis
    │  ○ Baseball
    │  ○ Golf
    │  ○ Swimming
    │  Select your favorite sport from the list
    │
    ◇  Country
    │  Germany
    │
    │  ● Germany
    │  ○ India
    │  ○ Netherlands
    │  ○ Norway
    │  ○ Poland
    └  ○ Russia












     ctrl ↵ submit   tab navigate   ^k actions"
  `)

  await session.press('down')
  await session.press('down')
  await session.press('down')
  await session.press('down')

  const lastVisibleSnapshot = await session.text()
  expect(lastVisibleSnapshot).toMatchInlineSnapshot(`
    "












    ■  TagPicker Component Demo
    │  Test tag picker with multiple selection support
    │
    ◇  Favorite Sport
    │  Choose your favorite sport...
    │
    │  ○ Basketball
    │  ○ Football
    │  ○ Tennis
    │  ○ Baseball
    │  ○ Golf
    │  ○ Swimming
    │  Select your favorite sport from the list
    │
    ◇  Country
    │  Germany
    │
    │  ● Germany
    │  ○ India
    │  ○ Netherlands
    │  ○ Norway
    │  ○ Poland
    └  ○ Russia












     ctrl ↵ submit   tab navigate   ^k actions"
  `)

  await session.press('down')

  const nextPageSnapshot = await session.text()
  expect(nextPageSnapshot).toMatchInlineSnapshot(`
    "












    ■  TagPicker Component Demo
    │  Test tag picker with multiple selection support
    │
    ◇  Favorite Sport
    │  Choose your favorite sport...
    │
    │  ○ Basketball
    │  ○ Football
    │  ○ Tennis
    │  ○ Baseball
    │  ○ Golf
    │  ○ Swimming
    │  Select your favorite sport from the list
    │
    ◇  Country
    │  Germany
    │
    │  ● Germany
    │  ○ India
    │  ○ Netherlands
    │  ○ Norway
    │  ○ Poland
    └  ○ Russia












     ctrl ↵ submit   tab navigate   ^k actions"
  `)

  await session.press('up')

  const backToPreviousPageSnapshot = await session.text()
  expect(backToPreviousPageSnapshot).toMatchInlineSnapshot(`
    "












    ■  TagPicker Component Demo
    │  Test tag picker with multiple selection support
    │
    ◇  Favorite Sport
    │  Choose your favorite sport...
    │
    │  ○ Basketball
    │  ○ Football
    │  ○ Tennis
    │  ○ Baseball
    │  ○ Golf
    │  ○ Swimming
    │  Select your favorite sport from the list
    │
    ◇  Country
    │  Germany
    │
    │  ● Germany
    │  ○ India
    │  ○ Netherlands
    │  ○ Norway
    │  ○ Poland
    └  ○ Russia












     ctrl ↵ submit   tab navigate   ^k actions"
  `)

  await session.press('esc')

  const afterEscapeSnapshot = await session.text()
  expect(afterEscapeSnapshot).toMatchInlineSnapshot(`
    "












    ■  TagPicker Component Demo
    │  Test tag picker with multiple selection support
    │
    ◇  Favorite Sport
    │  Choose your favorite sport...
    │
    │  ○ Basketball
    │  ○ Football
    │  ○ Tennis
    │  ○ Baseball
    │  ○ Golf
    │  ○ Swimming
    │  Select your favorite sport from the list
    │
    ◇  Country
    │  Germany
    │
    │  ● Germany
    │  ○ India
    │  ○ Netherlands
    │  ○ Norway
    │  ○ Poland
    └  ○ Russia












     ctrl ↵ submit   tab navigate   ^k actions"
  `)
}, 15000)

test('form tagpicker with default value', async () => {
  await session.text({
    waitFor: (text) => {
      return /TagPicker Component Demo/i.test(text)
    },
  })

  await session.press('tab')

  const secondTagpickerFocusedSnapshot = await session.text()
  expect(secondTagpickerFocusedSnapshot).toMatchInlineSnapshot(`
    "












    ▪  TagPicker Component Demo
    │  Test tag picker with multiple selection support
    │
    ◆  Favorite Sport
    │  Choose your favorite sport...
    │
    │› ○ Basketball
    │  ○ Football
    │  ○ Tennis
    │  ○ Baseball
    │  ○ Golf
    │  ○ Swimming
    │  Select your favorite sport from the list
    │
    ◇  Country
    │  Germany
    │
    │  ● Germany
    │  ○ India
    │  ○ Netherlands
    │  ○ Norway
    │  ○ Poland
    └  ○ Russia












     ctrl ↵ submit   tab navigate   ^k actions"
  `)

  await session.press('space')

  const afterDeselectGermanySnapshot = await session.text()
  expect(afterDeselectGermanySnapshot).toMatchInlineSnapshot(`
    "












    ▪  TagPicker Component Demo
    │  Test tag picker with multiple selection support
    │
    ◆  Favorite Sport
    │  Basketball
    │
    │› ● Basketball
    │  ○ Football
    │  ○ Tennis
    │  ○ Baseball
    │  ○ Golf
    │  ○ Swimming
    │  Select your favorite sport from the list
    │
    ◇  Country
    │  Germany
    │
    │  ● Germany
    │  ○ India
    │  ○ Netherlands
    │  ○ Norway
    │  ○ Poland
    └  ○ Russia












     ctrl ↵ submit   tab navigate   ^k actions"
  `)

  await session.press('esc')
  await session.press(['alt', 'enter'])

  const afterSubmitSnapshot = await session.text({
    waitFor: (text) => {
      return /Submitted Data/i.test(text)
    },
  })
  expect(afterSubmitSnapshot).toMatchInlineSnapshot(`
    "








    ▪  TagPicker Component Demo
    │  Test tag picker with multiple selection support
    │
    ◆  Favorite Sport
    │  Choose your favorite sport...
    │
    │› ○ Basketball
    │  ○ Football
    │  ○ Tennis
    │  ○ Baseball
    │  ○ Golf
    │  ○ Swimming
    │  Select your favorite sport from the list
    │
    ◇  Country
    │  Germany
    │
    │  ● Germany
    │  ○ India
    │  ○ Netherlands
    │  ○ Norway
    │  ○ Poland
    │  ○ Russia
    ▪  Submitted Data
    │  {
    │    "sports": [],
    │    "countries": [
    │      "ger"
    │    ]
    │  }
    │








     ctrl ↵ submit   tab navigate   ^k actions"
  `)
}, 15000)
