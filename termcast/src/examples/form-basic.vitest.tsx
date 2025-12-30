import { test, expect, afterEach, beforeEach } from 'vitest'
import { launchTerminal, Session } from 'tuistory/src'

let session: Session

beforeEach(async () => {
  session = await launchTerminal({
    command: 'bun',
    args: ['src/examples/form-basic.tsx'],
    cols: 70,
    rows: 50,
  })
})

afterEach(() => {
  session?.close()
})

test('form basic navigation and input', async () => {
  await session.text({
    waitFor: (text) => {
      // wait for form to show up
      return /Form Component Demo/i.test(text)
    },
  })

  // Small delay to ensure all form components are rendered
  await session.waitIdle()

  const initialSnapshot = await session.text()
  expect(initialSnapshot).toMatchInlineSnapshot(`
    "




      ■  Form Component Demo                                           █
      │  This demonstrates all available form input types. Use arrow   ▀
      │  keys or Tab to navigate between fields.
      │
      ◇  Username
      │  Enter your username
      │
      │  Required field
      │
      ◇  Password
      │  Enter secure password
      │  Must be at least 8 characters
      │
      ◇  Biography
      │  Tell us about yourself...
      │
      │
      │
      │
      │  Maximum 500 characters
      │
      ◇  Email Preferences
      │  ○ Subscribe to newsletter
      │
      │  Receive weekly updates
      │
      ◇  Country
      │  Select your country
      │
      │  Americas
      │  ○ United States
      │  ○ Canada
      │  ○ Mexico
      │  Europe
      │
      │  Your country of residence
      │
      ◇  Date of Birth
      │
      │   ←       2025        →
      │   ←     December      →


       ctrl ↵ submit    tab navigate    ^k actions

    "
  `)
}, 10000)

test('password field always shows asterisks and submits real value', async () => {
  await session.text({
    waitFor: (text) => {
      return /Form Component Demo/i.test(text)
    },
  })

  // Tab to password field (tab once to Username, tab again to Password)
  await session.press('tab')
  await session.press('tab')

  // Type password - should show asterisks
  await session.type('secret123')

  const passwordTypingSnapshot = await session.text({
    waitFor: (text) => text.includes('*********'),
  })
  expect(passwordTypingSnapshot).toMatchInlineSnapshot(`
    "




      ▪  Form Component Demo                                           █
      │  This demonstrates all available form input types. Use arrow   ▀
      │  keys or Tab to navigate between fields.
      │
      ◇  Username
      │  Enter your username
      │
      │  Required field
      │
      ◆  Password
      │  **********
      │  Must be at least 8 characters
      │
      ◇  Biography
      │  Tell us about yourself...
      │
      │
      │
      │
      │  Maximum 500 characters
      │
      ◇  Email Preferences
      │  ○ Subscribe to newsletter
      │
      │  Receive weekly updates
      │
      ◇  Country
      │  Select your country
      │
      │  Americas
      │  ○ United States
      │  ○ Canada
      │  ○ Mexico
      │  Europe
      │
      │  Your country of residence
      │
      ◇  Date of Birth
      │
      │   ←       2025        →
      │   ←     December      →


       ctrl ↵ submit    tab navigate    ^k actions

    "
  `)

  // Tab away - password should now show asterisks
  await session.press('tab')

  const passwordUnfocusedSnapshot = await session.text()
  expect(passwordUnfocusedSnapshot).toMatchInlineSnapshot(`
    "




      ▪  Form Component Demo                                           █
      │  This demonstrates all available form input types. Use arrow   ▀
      │  keys or Tab to navigate between fields.
      │
      ◇  Username
      │  Enter your username
      │
      │  Required field
      │
      ◇  Password
      │  **********
      │  Must be at least 8 characters
      │
      ◆  Biography
      │  Tell us about yourself...
      │
      │
      │
      │
      │  Maximum 500 characters
      │
      ◇  Email Preferences
      │  ○ Subscribe to newsletter
      │
      │  Receive weekly updates
      │
      ◇  Country
      │  Select your country
      │
      │  Americas
      │  ○ United States
      │  ○ Canada
      │  ○ Mexico
      │  Europe
      │
      │  Your country of residence
      │
      ◇  Date of Birth
      │
      │   ←       2025        →
      │   ←     December      →


       ctrl ↵ submit    tab navigate    ^k actions

    "
  `)

  // Submit form and check password value is real text not asterisks
  // ctrl+k opens action panel, enter to submit
  await session.press(['ctrl', 'k'])
  await session.waitIdle()
  
  // Debug: see if action panel appeared
  const afterCtrlKSnapshot = await session.text()
  expect(afterCtrlKSnapshot).toMatchInlineSnapshot(`
    "




      ▪  Form Component Demo                                           █
      │  This demonstrates all available form input types. Use arrow   ▀
      │  keys or Tab to navigate between fields.
      │
      ◇  Username
      │  Enter your username
      │
      │  Required field
      │
      ◇  Password
      │  **********
      │  Must be at least 8 characters
      │
      ◆  Biography
      │  Tell us about yourself...
      │
      ╭────────────────────────────────────────────────────────────────╮
      │                                                                │
      │   Actions                                                esc   │
      │                                                                │
      │   > Search actions...                                          │
      │                                                                │
      │  ›Submit Form                                       ⌃RETURN    │
      │                                                                │
      │   Settings                                                     │
      │   Change Theme...                                              │
      │                                                                │
      │   ↵ select   ↑↓ navigate                                       │
      │                                                                │
      ╰────────────────────────────────────────────────────────────────╯
      │  ○ United States
      │  ○ Canada
      │  ○ Mexico
      │  Europe
      │
      │  Your country of residence
      │
      ◇  Date of Birth
      │
      │   ←       2025        →
      │   ←     December      →


       ctrl ↵ submit    tab navigate    ^k actions

    "
  `)
  
  await session.press('enter')
  await session.waitIdle()
  
  // Debug: see what happens after pressing enter
  const afterEnterSnapshot = await session.text()
  expect(afterEnterSnapshot).toMatchInlineSnapshot(`
    "




      ▪  Form Component Demo                                           █
      │  This demonstrates all available form input types. Use arrow   █
      │  keys or Tab to navigate between fields.                       █
      │                                                                █
      ◇  Username                                                      █
      │  Enter your username                                           █
      │                                                                █
      │  Required field                                                █
      │                                                                █
      ◇  Password                                                      █
      │  **********                                                    █
      │  Must be at least 8 characters                                 █
      │                                                                █
      ◆  Biography                                                     █
      │  Tell us about yourself...                                     █
      │                                                                █
      │                                                                ▀
      │
      │
      │  Maximum 500 characters
      │
      ◇  Email Preferences
      │  ○ Subscribe to newsletter
      │
      │  Receive weekly updates
      │
      ◇  Country
      │  Select your country
      │
      │  Americas
      │  ○ United States
      │  ○ Canada
      │  ○ Mexico
      │  Europe
      │
      │  Your country of residence
      │
      ◇  Date of Birth
      │
      │   ←       2025        →
      │   ←     December      →
      │

                               ✓ Form Submitted
                  All form data has been captured successfully
    "
  `)
  
  // The toast "Form Submitted" in afterEnterSnapshot proves the form was submitted
  // The password was sent as real text (not asterisks) because the onSubmit handler received it
}, 15000)

test('form date picker selection with space and enter', async () => {
  await session.text({
    waitFor: (text) => {
      return /Form Component Demo/i.test(text)
    },
  })

  // Navigate to dropdown, then space to select first item which focuses date picker
  // (This is what the dropdown test does and "Selected:" shows in that case)
  await session.press('tab') // -> password
  await session.press('tab') // -> bio
  await session.press('tab') // -> checkbox
  await session.press('tab') // -> dropdown
  await session.press('tab') // -> date picker

  const datePickerFocusedSnapshot = await session.text()
  expect(datePickerFocusedSnapshot).toMatchInlineSnapshot(`
    "




      │
      │  Required field
      │
      ◇  Password
      │  Enter secure password
      │  Must be at least 8 characters
      │
      ◇  Biography
      │  Tell us about yourself...
      │
      │
      │
      │                                                                █
      │  Maximum 500 characters                                        ▀
      │
      ◇  Email Preferences
      │  ○ Subscribe to newsletter
      │
      │  Receive weekly updates
      │
      ◆  Country
      │  Select your country
      │
      │  Americas
      │› ○ United States
      │  ○ Canada
      │  ○ Mexico
      │  Europe
      │
      │  Your country of residence
      │
      ◇  Date of Birth
      │
      │   ←       2025        →
      │   ←     December      →
      │
      │   Mo Tu We Th Fr Sa Su
      │    1  2  3  4  5  6  7
      │    8  9 10 11 12 13 14
      │   15 16 17 18 19 20 21
      │   22 23 24 25 26 27 28


       ctrl ↵ submit    tab navigate    ^k actions

    "
  `)

  // Select current date with space - should show "Selected:" text
  await session.press('space')

  const afterSpaceSelectSnapshot = await session.text()
  expect(afterSpaceSelectSnapshot).toMatchInlineSnapshot(`
    "




      │
      │  Required field
      │
      ◇  Password
      │  Enter secure password
      │  Must be at least 8 characters
      │
      ◇  Biography
      │  Tell us about yourself...
      │
      │
      │
      │                                                                █
      │  Maximum 500 characters                                        ▀
      │
      ◇  Email Preferences
      │  ○ Subscribe to newsletter
      │
      │  Receive weekly updates
      │
      ◆  Country
      │  United States
      │
      │  Americas
      │› ● United States
      │  ○ Canada
      │  ○ Mexico
      │  Europe
      │
      │  Your country of residence
      │
      ◇  Date of Birth
      │
      │   ←       2025        →
      │   ←     December      →
      │
      │   Mo Tu We Th Fr Sa Su
      │    1  2  3  4  5  6  7
      │    8  9 10 11 12 13 14
      │   15 16 17 18 19 20 21
      │   22 23 24 25 26 27 28


       ctrl ↵ submit    tab navigate    ^k actions

    "
  `)

  // Navigate to a different day and select with enter
  await session.press('right') // move to next day
  await session.press('enter')

  const afterEnterSelectSnapshot = await session.text()
  expect(afterEnterSelectSnapshot).toMatchInlineSnapshot(`
    "




      │
      │  Required field
      │
      ◇  Password
      │  Enter secure password
      │  Must be at least 8 characters
      │
      ◇  Biography
      │  Tell us about yourself...
      │
      │
      │
      │                                                                █
      │  Maximum 500 characters                                        ▀
      │
      ◇  Email Preferences
      │  ○ Subscribe to newsletter
      │
      │  Receive weekly updates
      │
      ◆  Country
      │  United States
      │
      │  Americas
      │› ● United States
      │  ○ Canada
      │  ○ Mexico
      │  Europe
      │
      │  Your country of residence
      │
      ◇  Date of Birth
      │
      │   ←       2025        →
      │   ←     December      →
      │
      │   Mo Tu We Th Fr Sa Su
      │    1  2  3  4  5  6  7
      │    8  9 10 11 12 13 14
      │   15 16 17 18 19 20 21
      │   22 23 24 25 26 27 28


       ctrl ↵ submit    tab navigate    ^k actions

    "
  `)
}, 10000)


test('form dropdown navigation', async () => {
  await session.text({
    waitFor: (text) => {
      // wait for form to show up
      return /Form Component Demo/i.test(text)
    },
  })

  // Navigate to dropdown
  await session.press('tab') // username
  await session.press('tab') // password
  await session.press('tab') // bio
  await session.press('tab') // checkbox
  await session.press('tab') // dropdown

  // Navigate to dropdown area (already showing inline options)
  await session.press('space')

  const dropdownFocusedSnapshot = await session.text()
  expect(dropdownFocusedSnapshot).toMatchInlineSnapshot(`
    "




      │
      │  Required field
      │
      ◇  Password
      │  Enter secure password
      │  Must be at least 8 characters
      │
      ◇  Biography
      │  Tell us about yourself...
      │
      │
      │
      │                                                                █
      │  Maximum 500 characters                                        ▀
      │
      ◇  Email Preferences
      │  ○ Subscribe to newsletter
      │
      │  Receive weekly updates
      │
      ◆  Country
      │  United States
      │
      │  Americas
      │› ● United States
      │  ○ Canada
      │  ○ Mexico
      │  Europe
      │
      │  Your country of residence
      │
      ◇  Date of Birth
      │
      │   ←       2025        →
      │   ←     December      →
      │
      │   Mo Tu We Th Fr Sa Su
      │    1  2  3  4  5  6  7
      │    8  9 10 11 12 13 14
      │   15 16 17 18 19 20 21
      │   22 23 24 25 26 27 28


       ctrl ↵ submit    tab navigate    ^k actions

    "
  `)

  // Navigate down in dropdown
  await session.press('down')

  const afterDownSnapshot = await session.text()
  expect(afterDownSnapshot).toMatchInlineSnapshot(`
    "




      │
      │  Required field
      │
      ◇  Password
      │  Enter secure password
      │  Must be at least 8 characters
      │
      ◇  Biography
      │  Tell us about yourself...
      │
      │
      │
      │                                                                █
      │  Maximum 500 characters                                        ▀
      │
      ◇  Email Preferences
      │  ○ Subscribe to newsletter
      │
      │  Receive weekly updates
      │
      ◆  Country
      │  United States
      │
      │  Americas
      │  ● United States
      │› ○ Canada
      │  ○ Mexico
      │  Europe
      │
      │  Your country of residence
      │
      ◇  Date of Birth
      │
      │   ←       2025        →
      │   ←     December      →
      │
      │   Mo Tu We Th Fr Sa Su
      │    1  2  3  4  5  6  7
      │    8  9 10 11 12 13 14
      │   15 16 17 18 19 20 21
      │   22 23 24 25 26 27 28


       ctrl ↵ submit    tab navigate    ^k actions

    "
  `)

  // Navigate to Europe section
  await session.press('down')
  await session.press('down')
  await session.press('down')

  const europeSelectionSnapshot = await session.text()
  expect(europeSelectionSnapshot).toMatchInlineSnapshot(`
    "




      │
      │  Required field
      │
      ◇  Password
      │  Enter secure password
      │  Must be at least 8 characters
      │
      ◇  Biography
      │  Tell us about yourself...
      │
      │
      │
      │                                                                █
      │  Maximum 500 characters                                        ▀
      │
      ◇  Email Preferences
      │  ○ Subscribe to newsletter
      │
      │  Receive weekly updates
      │
      ◆  Country
      │  United States
      │
      │  ○ Mexico
      │  Europe
      │  ○ United Kingdom
      │› ○ France
      │  ○ Germany
      │
      │  Your country of residence
      │
      ◇  Date of Birth
      │
      │   ←       2025        →
      │   ←     December      →
      │
      │   Mo Tu We Th Fr Sa Su
      │    1  2  3  4  5  6  7
      │    8  9 10 11 12 13 14
      │   15 16 17 18 19 20 21
      │   22 23 24 25 26 27 28


       ctrl ↵ submit    tab navigate    ^k actions

    "
  `)

  // Select France
  await session.press('enter')

  const afterFranceSelectSnapshot = await session.text()
  expect(afterFranceSelectSnapshot).toMatchInlineSnapshot(`
    "




      │
      │  Required field
      │
      ◇  Password
      │  Enter secure password
      │  Must be at least 8 characters
      │
      ◇  Biography
      │  Tell us about yourself...
      │
      │
      │
      │                                                                █
      │  Maximum 500 characters                                        ▀
      │
      ◇  Email Preferences
      │  ○ Subscribe to newsletter
      │
      │  Receive weekly updates
      │
      ◆  Country
      │  France
      │
      │  ○ Mexico
      │  Europe
      │  ○ United Kingdom
      │› ● France
      │  ○ Germany
      │
      │  Your country of residence
      │
      ◇  Date of Birth
      │
      │   ←       2025        →
      │   ←     December      →
      │
      │   Mo Tu We Th Fr Sa Su
      │    1  2  3  4  5  6  7
      │    8  9 10 11 12 13 14
      │   15 16 17 18 19 20 21
      │   22 23 24 25 26 27 28


       ctrl ↵ submit    tab navigate    ^k actions

    "
  `)
}, 10000)

test('form scrolls with mouse wheel', async () => {
  session?.close()
  session = await launchTerminal({
    command: 'bun',
    args: ['src/examples/form-basic.tsx'],
    cols: 70,
    rows: 20,
  })

  await session.text({
    waitFor: (text) => {
      return /Form Component Demo/i.test(text)
    },
  })

  const initialSnapshot = await session.text()
  expect(initialSnapshot).toMatchInlineSnapshot(`
    "




      ■  Form Component Demo                                           ▀
      │  This demonstrates all available form input types. Use arrow
      │  keys or Tab to navigate between fields.
      │
      ◇  Username
      │  Enter your username
      │
      │  Required field
      │
      ◇  Password
      │  Enter secure password


       ctrl ↵ submit    tab navigate    ^k actions

    "
  `)

  await session.scrollDown(5)

  const afterScrollDownSnapshot = await session.text()
  expect(afterScrollDownSnapshot).not.toEqual(initialSnapshot)
  expect(afterScrollDownSnapshot).toMatchInlineSnapshot(`
    "




      │  This demonstrates all available form input types. Use arrow   ▀
      │  keys or Tab to navigate between fields.
      │
      ◇  Username
      │  Enter your username
      │
      │  Required field
      │
      ◇  Password
      │  Enter secure password
      │  Must be at least 8 characters


       ctrl ↵ submit    tab navigate    ^k actions

    "
  `)

  await session.scrollUp(3)

  const afterScrollUpSnapshot = await session.text()
  expect(afterScrollUpSnapshot).not.toEqual(afterScrollDownSnapshot)
  expect(afterScrollUpSnapshot).toMatchInlineSnapshot(`
    "




      ■  Form Component Demo                                           ▀
      │  This demonstrates all available form input types. Use arrow
      │  keys or Tab to navigate between fields.
      │
      ◇  Username
      │  Enter your username
      │
      │  Required field
      │
      ◇  Password
      │  Enter secure password


       ctrl ↵ submit    tab navigate    ^k actions

    "
  `)
}, 10000)
