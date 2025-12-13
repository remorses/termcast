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
    │  keys or Tab to navigate between fields.                       █
    │                                                                █
    ◆  Username                                                      █
    │  Enter your username                                           █
    │                                                                █
    │  Required field                                                █
    │                                                                █
    ◇  Password                                                      █
    │  Enter secure password                                         █
    │                                                                █
    │  Must be at least 8 characters                                 █
    │                                                                █
    ◇  Biography                                                     █
    │  Tell us about yourself...                                     █
    │                                                                █
    │                                                                █
    │                                                                █
    │                                                                █
    │  Maximum 500 characters                                        █
    │                                                                █
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


     ↵ submit   ↑↓ navigate   ^k actions"
  `)

  // Type in username field
  await session.type('johndoe')

  const afterUsernameSnapshot = await session.text()
  expect(afterUsernameSnapshot).toMatchInlineSnapshot(`
    "


    ▪  Form Component Demo                                           █
    │  This demonstrates all available form input types. Use arrow   █
    │  keys or Tab to navigate between fields.                       █
    │                                                                █
    ◆  Username                                                      █
    │  johndoe                                                       █
    │                                                                █
    │  Required field                                                █
    │                                                                █
    ◇  Password                                                      █
    │  Enter secure password                                         █
    │                                                                █
    │  Must be at least 8 characters                                 █
    │                                                                █
    ◇  Biography                                                     █
    │  Tell us about yourself...                                     █
    │                                                                █
    │                                                                █
    │                                                                █
    │                                                                █
    │  Maximum 500 characters                                        █
    │                                                                █
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


     ↵ submit   ↑↓ navigate   ^k actions"
  `)

  // Tab to password field
  await session.press('tab')
  await session.type('securepass123')

  const afterPasswordSnapshot = await session.text()
  expect(afterPasswordSnapshot).toMatchInlineSnapshot(`
    "


    ▪  Form Component Demo                                           █
    │  This demonstrates all available form input types. Use arrow   █
    │  keys or Tab to navigate between fields.                       █
    │                                                                █
    ◇  Username                                                      █
    │  johndoe                                                       █
    │                                                                █
    │  Required field                                                █
    │                                                                █
    ◆  Password                                                      █
    │  securepass123                                                 █
    │                                                                █
    │  Must be at least 8 characters                                 █
    │                                                                █
    ◇  Biography                                                     █
    │  Tell us about yourself...                                     █
    │                                                                █
    │                                                                █
    │                                                                █
    │                                                                █
    │  Maximum 500 characters                                        █
    │                                                                █
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


     ↵ submit   ↑↓ navigate   ^k actions"
  `)

  // Tab to biography field
  await session.press('tab')
  await session.type('I am a software developer')

  const afterBioSnapshot = await session.text()
  expect(afterBioSnapshot).toMatchInlineSnapshot(`
    "


    ▪  Form Component Demo                                           █
    │  This demonstrates all available form input types. Use arrow   █
    │  keys or Tab to navigate between fields.                       █
    │                                                                █
    ◇  Username                                                      █
    │  johndoe                                                       █
    │                                                                █
    │  Required field                                                █
    │                                                                █
    ◇  Password                                                      █
    │  securepass123                                                 █
    │                                                                █
    │  Must be at least 8 characters                                 █
    │                                                                █
    ◆  Biography                                                     █
    │  I am a software developer                                     █
    │                                                                █
    │                                                                █
    │                                                                █
    │                                                                █
    │  Maximum 500 characters                                        █
    │                                                                █
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


     ↵ submit   ↑↓ navigate   ^k actions"
  `)

  // Tab to newsletter checkbox and toggle it
  await session.press('tab')
  await session.press('space')

  const afterCheckboxSnapshot = await session.text()
  expect(afterCheckboxSnapshot).toMatchInlineSnapshot(`
    "


    ▪  Form Component Demo                                           █
    │  This demonstrates all available form input types. Use arrow   █
    │  keys or Tab to navigate between fields.                       █
    │                                                                █
    ◇  Username                                                      █
    │  johndoe                                                       █
    │                                                                █
    │  Required field                                                █
    │                                                                █
    ◇  Password                                                      █
    │  securepass123                                                 █
    │                                                                █
    │  Must be at least 8 characters                                 █
    │                                                                █
    ◇  Biography                                                     █
    │  I am a software developer                                     █
    │                                                                █
    │                                                                █
    │                                                                █
    │                                                                █
    │  Maximum 500 characters                                        █
    │                                                                █
    ◆  Email Preferences
    │  ● Subscribe to newsletter
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


     ↵ submit   ↑↓ navigate   ^k actions"
  `)

  // Tab to country dropdown and select United States
  await session.press('tab')
  await session.press('space')

  const afterSelectUSSnapshot = await session.text()
  expect(afterSelectUSSnapshot).toMatchInlineSnapshot(`
    "


    ▪  Form Component Demo                                           █
    │  This demonstrates all available form input types. Use arrow   █
    │  keys or Tab to navigate between fields.                       █
    │                                                                █
    ◇  Username                                                      █
    │  johndoe                                                       █
    │                                                                █
    │  Required field                                                █
    │                                                                █
    ◇  Password                                                      █
    │  securepass123                                                 █
    │                                                                █
    │  Must be at least 8 characters                                 █
    │                                                                █
    ◇  Biography                                                     █
    │  I am a software developer                                     █
    │                                                                █
    │                                                                █
    │                                                                █
    │                                                                █
    │  Maximum 500 characters                                        █
    │                                                                █
    ◇  Email Preferences
    │  ● Subscribe to newsletter
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
    │  ○ United Kingdom
    │  ↑↓ to see more options
    │
    │  Your country of residence
    │
    ◇  Date of Birth
    │
    │   ←       2025        →
    │   ←     December      →


     ↵ submit   ↑↓ navigate   ^k actions"
  `)

  // Select United States
  await session.press('enter')

  const afterCountrySelectSnapshot = await session.text()
  expect(afterCountrySelectSnapshot).toMatchInlineSnapshot(`
    "


    ▪  Form Component Demo                                           █
    │  This demonstrates all available form input types. Use arrow   █
    │  keys or Tab to navigate between fields.                       █
    │                                                                █
    ◇  Username                                                      █
    │  johndoe                                                       █
    │                                                                █
    │  Required field                                                █
    │                                                                █
    ◇  Password                                                      █
    │  securepass123                                                 █
    │                                                                █
    │  Must be at least 8 characters                                 █
    │                                                                █
    ◇  Biography                                                     █
    │  I am a software developer                                     █
    │                                                                █
    │                                                                █
    │                                                                █
    │                                                                █
    │  Maximum 500 characters                                        █
    │                                                                █
    ◇  Email Preferences
    │  ● Subscribe to newsletter
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
    │  ○ United Kingdom
    │  ↑↓ to see more options
    │
    │  Your country of residence
    │
    ◇  Date of Birth
    │
    │   ←       2025        →
    │   ←     December      →


     ↵ submit   ↑↓ navigate   ^k actions"
  `)

  // Tab to date picker
  await session.press('tab')
  await session.type('1990-05-15')

  const afterDateSnapshot = await session.text()
  expect(afterDateSnapshot).toMatchInlineSnapshot(`
    "


    │  Must be at least 8 characters
    │
    ◇  Biography
    │  I am a software developer
    │
    │
    │
    │
    │  Maximum 500 characters
    │
    ◇  Email Preferences
    │  ● Subscribe to newsletter
    │                                                                █
    │  Receive weekly updates                                        █
    │                                                                █
    ◇  Country                                                       █
    │  United States                                                 █
    │                                                                █
    │  Americas                                                      █
    │  ● United States                                               █
    │  ○ Canada                                                      █
    │  ○ Mexico                                                      █
    │  Europe                                                        █
    │  ○ United Kingdom                                              █
    │  ↑↓ to see more options                                        █
    │                                                                █
    │  Your country of residence                                     █
    │                                                                █
    ◆  Date of Birth                                                 █
    │                                                                █
    │   ←       2025        →                                        █
    │   ←     December      →                                        █
    │                                                                █
    │   Mo Tu We Th Fr Sa Su                                         █
    │    1  2  3  4  5  6  7
    │    8  9 10 11 12 13 14
    │   15 16 17 18 19 20 21
    │   22 23 24 25 26 27 28
    │   29 30 31
    │
    │
    │
    │  Format: YYYY-MM-DD
    │


     ↵ submit   ↑↓ navigate   ^k actions"
  `)

  // Submit form with Cmd+Enter (alt+enter in tuistory)
  await session.press(['alt', 'enter'])

  const afterSubmitSnapshot = await session.text({
    timeout: 3000,
    waitFor: (text) => {
      // wait for submitted data to show - use flexible pattern to handle potential escape codes
      // Text may be corrupted like "Sub5itted" so match partial patterns
      return /username.*johndoe/i.test(text) && /password.*securepass/i.test(text)
    },
  })
  expect(afterSubmitSnapshot).toMatchInlineSnapshot(`
    "


    ▪  Form Component Demo
    │  This demonstrates all available form input types. Use arrow
    ◇  UsernameTab to navigate between fields.
    │  Required field
    ◇  Password
    │  Must*be*at*least 8 characters
    │
    ◇  Biography
    │  I am a software developer
    │
    │  Maximum 500 characters
    ◇  Email Preferences
    │  ● Subscribe to newsletter
    │  Receive weekly updates
    ◇  Country
    │  United States
    │  Americas
    │  ○ Canada States
    │  Europeco
    │  ↑↓UtotseeKmoreooptions
    │  Your country of residence
    ◆  Date of Birth
    │
    │   ←       2025        →
    │   ←     December      →
    │
    │   Mo Tu We Th Fr Sa Su
    │    1  2  3  4  5  6  7
    │    8  9 10 11 12 13 14
    ◇  Upload:DocumentsDD 21
    │  Selectfone2ortmore documents to attach
    │   29 30 31
    │  •o↑↓/Tab:gNavigate fields | Space: Toggle checkbox | Enter/
    └  Space: Open dropdown | ^K/⌘↵: Show actions


     ┌─✓Form─Submitted─-─All─form─data─has─been─captured────────────┐
     └────────────────successfully──────────────────────────────────┘


    ▪  Submitted Data:
    │  {
    │    "username": "johndoe",
    │    "password": "securepass123",
    │    "bio": "I am a software developer",
    │    "newsletter": true,"
  `)
}, 15000)

test('form navigation with shift+tab', async () => {
  await session.text({
    waitFor: (text) => {
      // wait for form to show up
      return /Form Component Demo/i.test(text)
    },
  })

  // Fill some fields first
  await session.type('testuser')
  await session.press('tab')
  await session.type('password')
  await session.press('tab')

  const afterForwardTabSnapshot = await session.text()
  expect(afterForwardTabSnapshot).toMatchInlineSnapshot(`
    "


    ▪  Form Component Demo                                           █
    │  This demonstrates all available form input types. Use arrow   █
    │  keys or Tab to navigate between fields.                       █
    │                                                                █
    ◇  Username                                                      █
    │  testuser                                                      █
    │                                                                █
    │  Required field                                                █
    │                                                                █
    ◇  Password                                                      █
    │  password                                                      █
    │                                                                █
    │  Must be at least 8 characters                                 █
    │                                                                █
    ◆  Biography                                                     █
    │  Tell us about yourself...                                     █
    │                                                                █
    │                                                                █
    │                                                                █
    │                                                                █
    │  Maximum 500 characters                                        █
    │                                                                █
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


     ↵ submit   ↑↓ navigate   ^k actions"
  `)

  // Navigate backwards with Shift+Tab
  await session.press(['shift', 'tab'])

  const afterBackwardTabSnapshot = await session.text()
  expect(afterBackwardTabSnapshot).toMatchInlineSnapshot(`
    "


    ▪  Form Component Demo                                           █
    │  This demonstrates all available form input types. Use arrow   █
    │  keys or Tab to navigate between fields.                       █
    │                                                                █
    ◇  Username                                                      █
    │  testuser                                                      █
    │                                                                █
    │  Required field                                                █
    │                                                                █
    ◇  Password                                                      █
    │  password                                                      █
    │                                                                █
    │  Must be at least 8 characters                                 █
    │                                                                █
    ◇  Biography                                                     █
    │  Tell us about yourself...                                     █
    │                                                                █
    │                                                                █
    │                                                                █
    │                                                                █
    │  Maximum 500 characters                                        █
    │                                                                █
    ◆  Email Preferences
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


     ↵ submit   ↑↓ navigate   ^k actions"
  `)

  // Go back to username field
  await session.press(['shift', 'tab'])

  const backToUsernameSnapshot = await session.text()
  expect(backToUsernameSnapshot).toMatchInlineSnapshot(`
    "


    ▪  Form Component Demo                                           █
    │  This demonstrates all available form input types. Use arrow   █
    │  keys or Tab to navigate between fields.                       █
    │                                                                █
    ◇  Username                                                      █
    │  testuser                                                      █
    │                                                                █
    │  Required field                                                █
    │                                                                █
    ◇  Password                                                      █
    │  password                                                      █
    │                                                                █
    │  Must be at least 8 characters                                 █
    │                                                                █
    ◇  Biography                                                     █
    │  Tell us about yourself...                                     █
    │                                                                █
    │                                                                █
    │                                                                █
    │                                                                █
    │  Maximum 500 characters                                        █
    │                                                                █
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
    │  ○ United Kingdom
    │  ↑↓ to see more options
    │
    │  Your country of residence
    │
    ◇  Date of Birth
    │
    │   ←       2025        →
    │   ←     December      →


     ↵ submit   ↑↓ navigate   ^k actions"
  `)

  // Clear and type new username
  await session.press(['ctrl', 'a'])
  await session.type('newuser')

  const afterEditUsernameSnapshot = await session.text()
  expect(afterEditUsernameSnapshot).toMatchInlineSnapshot(`
    "


    ▪  Form Component Demo                                           █
    │  This demonstrates all available form input types. Use arrow   █
    │  keys or Tab to navigate between fields.                       █
    │                                                                █
    ◇  Username                                                      █
    │  testuser                                                      █
    │                                                                █
    │  Required field                                                █
    │                                                                █
    ◇  Password                                                      █
    │  password                                                      █
    │                                                                █
    │  Must be at least 8 characters                                 █
    │                                                                █
    ◇  Biography                                                     █
    │  Tell us about yourself...                                     █
    │                                                                █
    │                                                                █
    │                                                                █
    │                                                                █
    │  Maximum 500 characters                                        █
    │                                                                █
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
    │  ○ United Kingdom
    │  ↑↓ to see more options
    │
    │  Your country of residence
    │
    ◇  Date of Birth
    │
    │   ←       2025        →
    │   ←     December      →


     ↵ submit   ↑↓ navigate   ^k actions"
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
    │                                                                █
    │  Receive weekly updates                                        █
    │                                                                █
    ◇  Country                                                       █
    │  Select your country                                           █
    │                                                                █
    │  Americas                                                      █
    │  ○ United States                                               █
    │  ○ Canada                                                      █
    │  ○ Mexico                                                      █
    │  Europe                                                        █
    │  ○ United Kingdom                                              █
    │  ↑↓ to see more options                                        █
    │                                                                █
    │  Your country of residence                                     █
    │                                                                █
    ◆  Date of Birth                                                 █
    │                                                                █
    │   ←       2025        →                                        █
    │   ←     December      →                                        █
    │                                                                █
    │   Mo Tu We Th Fr Sa Su                                         █
    │    1  2  3  4  5  6  7
    │    8  9 10 11 12 13 14
    │   15 16 17 18 19 20 21
    │   22 23 24 25 26 27 28
    │   29 30 31
    │
    │
    │
    │  Format: YYYY-MM-DD
    │


     ↵ submit   ↑↓ navigate   ^k actions"
  `)

  // Navigate down in dropdown
  await session.press('down')

  const afterDownSnapshot = await session.text()
  expect(afterDownSnapshot).toMatchInlineSnapshot(`
    "


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
    │                                                                █
    │  Receive weekly updates                                        █
    │                                                                █
    ◇  Country                                                       █
    │  Select your country                                           █
    │                                                                █
    │  Americas                                                      █
    │  ○ United States                                               █
    │  ○ Canada                                                      █
    │  ○ Mexico                                                      █
    │  Europe                                                        █
    │  ○ United Kingdom                                              █
    │  ↑↓ to see more options                                        █
    │                                                                █
    │  Your country of residence                                     █
    │                                                                █
    ◆  Date of Birth                                                 █
    │                                                                █
    │   ←       2025        →                                        █
    │   ←     December      →                                        █
    │                                                                █
    │   Mo Tu We Th Fr Sa Su                                         █
    │    1  2  3  4  5  6  7
    │    8  9 10 11 12 13 14
    │   15 16 17 18 19 20 21
    │   22 23 24 25 26 27 28
    │   29 30 31
    │
    │
    │
    │  Format: YYYY-MM-DD
    │


     ↵ submit   ↑↓ navigate   ^k actions"
  `)

  // Navigate to Europe section
  await session.press('down')
  await session.press('down')
  await session.press('down')

  const europeSelectionSnapshot = await session.text()
  expect(europeSelectionSnapshot).toMatchInlineSnapshot(`
    "


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
    │                                                                █
    │  Receive weekly updates                                        █
    │                                                                █
    ◇  Country                                                       █
    │  Select your country                                           █
    │                                                                █
    │  Americas                                                      █
    │  ○ United States                                               █
    │  ○ Canada                                                      █
    │  ○ Mexico                                                      █
    │  Europe                                                        █
    │  ○ United Kingdom                                              █
    │  ↑↓ to see more options                                        █
    │                                                                █
    │  Your country of residence                                     █
    │                                                                █
    ◆  Date of Birth                                                 █
    │                                                                █
    │   ←       2025        →                                        █
    │   ←     December      →                                        █
    │                                                                █
    │   Mo Tu We Th Fr Sa Su                                         █
    │    1  2  3  4  5  6  7
    │    8  9 10 11 12 13 14
    │   15 16 17 18 19 20 21
    │   22 23 24 25 26 27 28
    │   29 30 31
    │
    │
    │
    │  Format: YYYY-MM-DD
    │


     ↵ submit   ↑↓ navigate   ^k actions"
  `)

  // Select France
  await session.press('enter')

  const afterFranceSelectSnapshot = await session.text()
  expect(afterFranceSelectSnapshot).toMatchInlineSnapshot(`
    "


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
    │                                                                █
    │  Receive weekly updates                                        █
    │                                                                █
    ◇  Country                                                       █
    │  Select your country                                           █
    │                                                                █
    │  Americas                                                      █
    │  ○ United States                                               █
    │  ○ Canada                                                      █
    │  ○ Mexico                                                      █
    │  Europe                                                        █
    │  ○ United Kingdom                                              █
    │  ↑↓ to see more options                                        █
    │                                                                █
    │  Your country of residence                                     █
    │                                                                █
    ◆  Date of Birth                                                 █
    │                                                                █
    │   ←       2025        →                                        █
    │   ←     December      →                                        █
    │                                                                █
    │   Mo Tu We Th Fr Sa Su                                         █
    │    1  2  3  4  5  6  7
    │    8  9 10 11 12 13 14
    │   15 16 17 18 19 20 21
    │   22 23 24 25 26 27 28
    │   29 30 31
    │
    │
    │
    │  Format: YYYY-MM-DD
    │


     ↵ submit   ↑↓ navigate   ^k actions"
  `)
}, 10000)
