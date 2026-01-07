import { test, expect, afterEach, beforeEach } from 'vitest'
import { launchTerminal, Session } from 'tuistory/src'

let session: Session

beforeEach(async () => {
  session = await launchTerminal({
    command: 'bun',
    args: ['src/examples/internal/custom-renderable-form.tsx'],
    cols: 70,
    rows: 20,
  })
})

afterEach(() => {
  session?.close()
})

test('initial render shows form with fields', async () => {
  const initialSnapshot = await session.text({
    waitFor: (text) => {
      return /Name/.test(text) && /Email/.test(text) && /Phone/.test(text)
    },
  })

  expect(initialSnapshot).toMatchInlineSnapshot(`
    "



       Custom Form Renderable Example
       Tab to navigate • Dynamic field appears after 2s

       › Name                                                         ▀
         Enter name...

         Email
         Enter email...

         Phone
         Enter phone...

         Field 1
         Enter field 1...
       11 fields registered

    "
  `)
  expect(initialSnapshot).toContain('Name')
  expect(initialSnapshot).toContain('Email')
  expect(initialSnapshot).toContain('Phone')
}, 10000)

test('tab navigation cycles through fields', async () => {
  await session.text({
    waitFor: (text) => {
      return /Name/.test(text) && /Email/.test(text)
    },
  })

  // Small delay to ensure all fields registered
  await new Promise((resolve) => setTimeout(resolve, 200))

  // Press tab to go to next field (Email)
  await session.press('tab')
  const afterFirstTab = await session.text()
  // Verify scrolling/focus change happened
  expect(afterFirstTab).toContain('11 fields')
  expect(afterFirstTab).toMatchInlineSnapshot(`
    "



       Custom Form Renderable Example
       Tab to navigate • Dynamic field appears after 2s

         Name                                                         ▀
         Enter name...

       › Email
         Enter email...

         Phone
         Enter phone...

         Field 1
         Enter field 1...
       11 fields registered

    "
  `)

  // Press tab again to go to Phone
  await session.press('tab')
  const afterSecondTab = await session.text()
  expect(afterSecondTab).toMatchInlineSnapshot(`
    "



       Custom Form Renderable Example
       Tab to navigate • Dynamic field appears after 2s

         Enter name...                                                ▄

         Email
         Enter email...

       › Phone
         Enter phone...

         Field 1
         Enter field 1...

       11 fields registered

    "
  `)

  // Press shift+tab to go back to Email
  await session.press(['shift', 'tab'])
  const afterShiftTab = await session.text()
  expect(afterShiftTab).toMatchInlineSnapshot(`
    "



       Custom Form Renderable Example
       Tab to navigate • Dynamic field appears after 2s

         Name                                                         ▀
         Enter name...

       › Email
         Enter email...

         Phone
         Enter phone...

         Field 1
         Enter field 1...
       11 fields registered

    "
  `)
}, 10000)

test('dynamic field appears after 2s and registers synchronously', async () => {
  await session.text({
    waitFor: (text) => {
      return /Name/.test(text) && /Email/.test(text)
    },
  })

  const beforeDelayed = await session.text()
  // Should not have delayed field yet
  expect(beforeDelayed).not.toContain('Delayed Field')
  expect(beforeDelayed).toContain('11 fields')

  // Wait for delayed field to appear
  // Registration is now SYNC via onLifecyclePass - no need to wait for count separately
  const afterDelayed = await session.text({
    waitFor: (text) => {
      return /Delayed Field/.test(text)
    },
    timeout: 4000,
  })

  expect(afterDelayed).toMatchInlineSnapshot(`
    "



       Custom Form Renderable Example
       Tab to navigate • Dynamic field appears after 2s

       › Name                                                         ▀
         Enter name...

         Email
         Enter email...

         Phone
         Enter phone...

         Delayed Field (added after 2s)
         Dynamic field...
       12 fields registered

    "
  `)
  expect(afterDelayed).toContain('Delayed Field')
  // Field count should be 12 immediately since registration is sync
  expect(afterDelayed).toContain('12 fields registered')
}, 10000)

test('scrolling works when navigating through many fields', async () => {
  await session.text({
    waitFor: (text) => {
      return /Name/.test(text) && /Field 1/.test(text)
    },
  })

  // Small delay to ensure all fields registered
  await new Promise((resolve) => setTimeout(resolve, 200))

  // Navigate through many fields to trigger scrolling
  for (let i = 0; i < 8; i++) {
    await session.press('tab')
  }

  const afterManyTabs = await session.text()
  expect(afterManyTabs).toMatchInlineSnapshot(`
    "



       Custom Form Renderable Example
       Tab to navigate • Dynamic field appears after 2s

         Enter field 4...

         Field 5
         Enter field 5...

       › Field 6
         Enter field 6...

         Field 7
         Enter field 7...                                             ▀

       11 fields registered

    "
  `)
  expect(afterManyTabs).toContain('Field')
}, 15000)

test('typing in focused field works', async () => {
  await session.text({
    waitFor: (text) => {
      return /Name/.test(text) && /Enter name/.test(text)
    },
  })

  // Small delay
  await new Promise((resolve) => setTimeout(resolve, 200))

  // Type in the Name field
  await session.type('John Doe')

  const afterTyping = await session.text()
  expect(afterTyping).toMatchInlineSnapshot(`
    "



       Custom Form Renderable Example
       Tab to navigate • Dynamic field appears after 2s

       › Name                                                         ▀
         John Doe

         Email
         Enter email...

         Phone
         Enter phone...

         Field 1
         Enter field 1...
       11 fields registered

    "
  `)
  expect(afterTyping).toContain('John Doe')
}, 10000)
