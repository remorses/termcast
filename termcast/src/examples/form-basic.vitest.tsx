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


    ▪  Form Component Demo                                           █
    │  This demonstrates all available form input types. Use arrow   █
    │  keys or Tab to navigate between fields.
    │
    ◆  Username
    ┃  Enter your username
    ┃
    ┃  Required field
    ┃
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
    │  ○ United Kingdom
    │  ↑↓ to see more options
    │
    │  Your country of residence
    │
    ◇  Date of Birth
    │
    │   ←       2025        →
    │   ←     December      →
    │


     ctrl ↵ submit   ↑↓ navigate   ^k actions"
  `)
}, 10000)

test('password field always shows asterisks and submits real value', async () => {
  await session.text({
    waitFor: (text) => {
      return /Form Component Demo/i.test(text)
    },
  })

  // Tab to password field
  await session.press('tab')

  // Type password - should show asterisks
  await session.type('secret123')

  const passwordTypingSnapshot = await session.text({
    waitFor: (text) => text.includes('*********'),
  })
  expect(passwordTypingSnapshot).toMatchInlineSnapshot(`
    "


    ▪  Form Component Demo                                           █
    │  This demonstrates all available form input types. Use arrow   █
    │  keys or Tab to navigate between fields.
    │
    ◇  Username
    │  s
    │
    │  Required field
    │
    ◆  Password
    ┃  ***************
    ┃  Must be at least 8 characters
    ┃
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
    │  ○ United Kingdom
    │  ↑↓ to see more options
    │
    │  Your country of residence
    │
    ◇  Date of Birth
    │
    │   ←       2025        →
    │   ←     December      →
    │


     ctrl ↵ submit   ↑↓ navigate   ^k actions"
  `)

  // Tab away - password should now show asterisks
  await session.press('tab')

  const passwordUnfocusedSnapshot = await session.text()
  expect(passwordUnfocusedSnapshot).toMatchInlineSnapshot(`
    "


    ▪  Form Component Demo                                           █
    │  This demonstrates all available form input types. Use arrow   █
    │  keys or Tab to navigate between fields.
    │
    ◇  Username
    │  s
    │
    │  Required field
    │
    ◇  Password
    │  ***************
    │  Must be at least 8 characters
    │
    ◆  Biography
    ┃  Tell us about yourself...
    ┃
    ┃
    ┃
    ┃
    ┃  Maximum 500 characters
    ┃
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
    │  ○ United Kingdom
    │  ↑↓ to see more options
    │
    │  Your country of residence
    │
    ◇  Date of Birth
    │
    │   ←       2025        →
    │   ←     December      →
    │


     ctrl ↵ submit   ↑↓ navigate   ^k actions"
  `)

  // Submit form and check password value is real text not asterisks
  await session.press(['ctrl', 'enter'])
  await session.waitIdle()
  // Scroll down to see submitted data
  await session.scrollDown(10)
  await session.scrollDown(10)
  await session.scrollDown(10)
  await session.scrollDown(10)
  await session.scrollDown(10)
  await session.scrollDown(10)
  await session.scrollDown(10)
  await session.scrollDown(200)

  const submittedSnapshot = await session.text({
    timeout: 3000,
    waitFor: (text) => text.includes('"password"'),
  })
  expect(submittedSnapshot).toMatch(/"password": "s.+"/)
}, 10000)

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


    ▪  Form Component Demo                                           █
    │  This demonstrates all available form input types. Use arrow   █
    │  keys or Tab to navigate between fields.
    │
    ◆  Username
    ┃  Enter your username
    ┃
    ┃  Required field
    ┃
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
    │  ○ United Kingdom
    │  ↑↓ to see more options
    │
    │  Your country of residence
    │
    ◇  Date of Birth
    │
    │   ←       2025        →
    │   ←     December      →
    │


     ctrl ↵ submit   ↑↓ navigate   ^k actions"
  `)

  // Select current date with space - should show "Selected:" text
  await session.press('space')

  const afterSpaceSelectSnapshot = await session.text()
  expect(afterSpaceSelectSnapshot).toMatchInlineSnapshot(`
    "


    ▪  Form Component Demo                                           █
    │  This demonstrates all available form input types. Use arrow   █
    │  keys or Tab to navigate between fields.
    │
    ◇  Username
    │  Enter your username
    │
    │  Required field
    │
    ◆  Password
    ┃  Enter secure password
    ┃  Must be at least 8 characters
    ┃
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
    │  ○ United Kingdom
    │  ↑↓ to see more options
    │
    │  Your country of residence
    │
    ◇  Date of Birth
    │
    │   ←       2025        →
    │   ←     December      →
    │


     ctrl ↵ submit   ↑↓ navigate   ^k actions"
  `)

  // Navigate to a different day and select with enter
  await session.press('right') // move to next day
  await session.press('enter')

  const afterEnterSelectSnapshot = await session.text()
  expect(afterEnterSelectSnapshot).toMatchInlineSnapshot(`
    "


    ▪  Form Component Demo                                           █
    │  This demonstrates all available form input types. Use arrow   █
    │  keys or Tab to navigate between fields.
    │
    ◇  Username
    │  Enter your username
    │
    │  Required field
    │
    ◆  Password
    ┃  *
    ┃  Must be at least 8 characters
    ┃
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
    │  ○ United Kingdom
    │  ↑↓ to see more options
    │
    │  Your country of residence
    │
    ◇  Date of Birth
    │
    │   ←       2025        →
    │   ←     December      →
    │


     ctrl ↵ submit   ↑↓ navigate   ^k actions"
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


    ▪  Form Component Demo                                           █
    │  This demonstrates all available form input types. Use arrow   █
    │  keys or Tab to navigate between fields.
    │
    ◆  Username
    ┃  Enter your username
    ┃
    ┃  Required field
    ┃
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
    │  ○ United Kingdom
    │  ↑↓ to see more options
    │
    │  Your country of residence
    │
    ◇  Date of Birth
    │
    │   ←       2025        →
    │   ←     December      →
    │


     ctrl ↵ submit   ↑↓ navigate   ^k actions"
  `)

  // Navigate down in dropdown
  await session.press('down')

  const afterDownSnapshot = await session.text()
  expect(afterDownSnapshot).toMatchInlineSnapshot(`
    "


    ▪  Form Component Demo                                           █
    │  This demonstrates all available form input types. Use arrow   █
    │  keys or Tab to navigate between fields.
    │
    ◇  Username
    │
    │
    │  Required field
    │
    ◆  Password
    ┃  Enter secure password
    ┃  Must be at least 8 characters
    ┃
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
    │  ○ United Kingdom
    │  ↑↓ to see more options
    │
    │  Your country of residence
    │
    ◇  Date of Birth
    │
    │   ←       2025        →
    │   ←     December      →
    │


     ctrl ↵ submit   ↑↓ navigate   ^k actions"
  `)

  // Navigate to Europe section
  await session.press('down')
  await session.press('down')
  await session.press('down')

  const europeSelectionSnapshot = await session.text()
  expect(europeSelectionSnapshot).toMatchInlineSnapshot(`
    "


    ▪  Form Component Demo                                           █
    │  This demonstrates all available form input types. Use arrow   █
    │  keys or Tab to navigate between fields.
    │
    ◇  Username
    │
    │
    │  Required field
    │
    ◆  Password
    ┃  Enter secure password
    ┃  Must be at least 8 characters
    ┃
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
    │  ○ United Kingdom
    │  ↑↓ to see more options
    │
    │  Your country of residence
    │
    ◇  Date of Birth
    │
    │   ←       2025        →
    │   ←     December      →
    │


     ctrl ↵ submit   ↑↓ navigate   ^k actions"
  `)

  // Select France
  await session.press('enter')

  const afterFranceSelectSnapshot = await session.text()
  expect(afterFranceSelectSnapshot).toMatchInlineSnapshot(`
    "


    ▪  Form Component Demo                                           █
    │  This demonstrates all available form input types. Use arrow   █
    │  keys or Tab to navigate between fields.
    │
    ◇  Username
    │
    │
    │  Required field
    │
    ◆  Password
    ┃  Enter secure password
    ┃  Must be at least 8 characters
    ┃
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
    │  ○ United Kingdom
    │  ↑↓ to see more options
    │
    │  Your country of residence
    │
    ◇  Date of Birth
    │
    │   ←       2025        →
    │   ←     December      →
    │


     ctrl ↵ submit   ↑↓ navigate   ^k actions"
  `)
}, 10000)
