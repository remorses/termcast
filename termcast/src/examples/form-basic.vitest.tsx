// node-pty does not work in bun, so we use vitest to run this test
import { test, expect, afterEach, beforeEach } from 'vitest'
import { NodeTuiDriver } from '@termcast/cli/src/e2e-node'

let driver: NodeTuiDriver

beforeEach(() => {
  driver = new NodeTuiDriver('bun', ['src/examples/form-basic.tsx'], {
    cols: 70,
    rows: 50,
  })
})

afterEach(() => {
  driver?.dispose()
})

test('form basic navigation and input', async () => {
  await driver.text({
    waitFor: (text) => {
      // wait for form to show up
      return /Form Component Demo/i.test(text)
    },
  })

  // Small delay to ensure all form components are rendered
  await driver.waitIdle()

  const initialSnapshot = await driver.text()
  expect(initialSnapshot).toMatchInlineSnapshot(`
    "

       Form Component Demo
    │  This demonstrates all available form input types. Use arrow key
    │
    ◆  Username
    │  Enter your username
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
    │  ○ United Kingdom
    │  ↑↓ to see more options
    │
    │  Your country of residence
    │
    ◇  Date of Birth
    │
    │   ←       2025        →
    │   ←     September     →
    │
    │   Mo Tu We Th Fr Sa Su
    │    1  2  3  4  5  6  7
    │    8  9 10 11 12 13 14
    │   15 16 17 18 19 20 21
    │   22 23 24 25 26 27 28
    │   29 30"
  `)

  // Type in username field
  await driver.keys.type('johndoe')

  const afterUsernameSnapshot = await driver.text()
  expect(afterUsernameSnapshot).toMatchInlineSnapshot(`
    "

       Form Component Demo
    │  This demonstrates all available form input types. Use arrow key
    │
    ◆  Username
    │  johndoe
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
    │  ○ United Kingdom
    │  ↑↓ to see more options
    │
    │  Your country of residence
    │
    ◇  Date of Birth
    │
    │   ←       2025        →
    │   ←     September     →
    │
    │   Mo Tu We Th Fr Sa Su
    │    1  2  3  4  5  6  7
    │    8  9 10 11 12 13 14
    │   15 16 17 18 19 20 21
    │   22 23 24 25 26 27 28
    │   29 30"
  `)

  // Tab to password field
  await driver.keys.tab()
  await driver.keys.type('securepass123')

  const afterPasswordSnapshot = await driver.text()
  expect(afterPasswordSnapshot).toMatchInlineSnapshot(`
    "

       Form Component Demo
    │  This demonstrates all available form input types. Use arrow key
    │
    ◇  Username
    │  johndoe
    │  Required field
    │
    ◆  Password
    │  securepass123
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
    │   ←     September     →
    │
    │   Mo Tu We Th Fr Sa Su
    │    1  2  3  4  5  6  7
    │    8  9 10 11 12 13 14
    │   15 16 17 18 19 20 21
    │   22 23 24 25 26 27 28
    │   29 30"
  `)

  // Tab to biography field
  await driver.keys.tab()
  await driver.keys.type('I am a software developer')

  const afterBioSnapshot = await driver.text()
  expect(afterBioSnapshot).toMatchInlineSnapshot(`
    "

       Form Component Demo
    │  This demonstrates all available form input types. Use arrow key
    │
    ◇  Username
    │  johndoe
    │  Required field
    │
    ◇  Password
    │  *************
    │  Must be at least 8 characters
    │
    ◆  Biography
    │  I am a software developer
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
    │   ←     September     →
    │
    │   Mo Tu We Th Fr Sa Su
    │    1  2  3  4  5  6  7
    │    8  9 10 11 12 13 14
    │   15 16 17 18 19 20 21
    │   22 23 24 25 26 27 28
    │   29 30"
  `)

  // Tab to newsletter checkbox and toggle it
  await driver.keys.tab()
  await driver.keys.space()

  const afterCheckboxSnapshot = await driver.text()
  expect(afterCheckboxSnapshot).toMatchInlineSnapshot(`
    "

       Form Component Demo
    │  This demonstrates all available form input types. Use arrow key
    │
    ◇  Username
    │  johndoe
    │  Required field
    │
    ◇  Password
    │  *************
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
    │   ←     September     →
    │
    │   Mo Tu We Th Fr Sa Su
    │    1  2  3  4  5  6  7
    │    8  9 10 11 12 13 14
    │   15 16 17 18 19 20 21
    │   22 23 24 25 26 27 28
    │   29 30"
  `)

  // Tab to country dropdown and select United States
  await driver.keys.tab()
  await driver.keys.space()

  const afterSelectUSSnapshot = await driver.text()
  expect(afterSelectUSSnapshot).toMatchInlineSnapshot(`
    "

       Form Component Demo
    │  This demonstrates all available form input types. Use arrow key
    │
    ◇  Username
    │  johndoe
    │  Required field
    │
    ◇  Password
    │  *************
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
    │   ←     September     →
    │
    │   Mo Tu We Th Fr Sa Su
    │    1  2  3  4  5  6  7
    │    8  9 10 11 12 13 14
    │   15 16 17 18 19 20 21
    │   22 23 24 25 26 27 28
    │   29 30"
  `)

  // Select United States
  await driver.keys.enter()

  const afterCountrySelectSnapshot = await driver.text()
  expect(afterCountrySelectSnapshot).toMatchInlineSnapshot(`
    "

       Form Component Demo
    │  This demonstrates all available form input types. Use arrow key
    │
    ◇  Username
    │  johndoe
    │  Required field
    │
    ◇  Password
    │  *************
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
    │   ←     September     →
    │
    │   Mo Tu We Th Fr Sa Su
    │    1  2  3  4  5  6  7
    │    8  9 10 11 12 13 14
    │   15 16 17 18 19 20 21
    │   22 23 24 25 26 27 28
    │   29 30"
  `)

  // Tab to date picker
  await driver.keys.tab()
  await driver.keys.type('1990-05-15')

  const afterDateSnapshot = await driver.text()
  expect(afterDateSnapshot).toMatchInlineSnapshot(`
    "

       Form Component Demo
    │  This demonstrates all available form input types. Use arrow key
    │
    ◇  Username
    │  johndoe
    │  Required field
    │
    ◇  Password
    │  *************
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
    │
    │  Receive weekly updates
    │
    ◇  Country
    │  United States
    │
    │  Americas
    │  ● United States
    │  ○ Canada
    │  ○ Mexico
    │  Europe
    │  ○ United Kingdom
    │  ↑↓ to see more options
    │
    │  Your country of residence
    │
    ◆  Date of Birth
    │
    │   ←       2025        →
    │   ←     September     →
    │
    │   Mo Tu We Th Fr Sa Su
    │    1  2  3  4  5  6  7
    │    8  9 10 11 12 13 14
    │   15 16 17 18 19 20 21
    │   22 23 24 25 26 27 28
    │   29 30"
  `)

  // Submit form with Cmd+Enter
  await driver.keys.cmdEnter()

  const afterSubmitSnapshot = await driver.text({
    waitFor: (text) => {
      // wait for submitted data to show
      return /Submitted Data:/i.test(text)
    },
  })
  expect(afterSubmitSnapshot).toMatchInlineSnapshot(`
    "

       Form Component Demo
    │  This demonstrates all available form input types. Use arrow key
    │
    ◇  Username
    │  johndoe
    │  Required field
    │
    ◇  Password
    │  *************
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
    │
    │  Receive weekly updates
    │
    ◇  Country
    │  United States
    │
    │  Americas
    │  ● United States
    │  ○ Canada
    │  ○ Mexico
    │  Europe
    │  ○ United Kingdom
    │  ↑↓ to see more options
    │
    │  Your country of residence
    │
    ◆  Date of Birth
    │
    │   ←       2025        →
    │   ←     September     →
    │
    │   Mo Tu We Th Fr Sa Su
    │    1  2  3  4  5  6  7
    │    8  9 10 11 12 13 14
    │   15 16 17 18 19 20 21
    │   22 23 24 25 26 27 28
    │   29 30"
  `)
}, 15000)

test('form navigation with shift+tab', async () => {
  await driver.text({
    waitFor: (text) => {
      // wait for form to show up
      return /Form Component Demo/i.test(text)
    },
  })

  // Fill some fields first
  await driver.keys.type('testuser')
  await driver.keys.tab()
  await driver.keys.type('password')
  await driver.keys.tab()

  const afterForwardTabSnapshot = await driver.text()
  expect(afterForwardTabSnapshot).toMatchInlineSnapshot(`
    "

       Form Component Demo
    │  This demonstrates all available form input types. Use arrow key
    │
    ◇  Username
    │  testuser
    │  Required field
    │
    ◇  Password
    │  ********
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
    │  ○ United Kingdom
    │  ↑↓ to see more options
    │
    │  Your country of residence
    │
    ◇  Date of Birth
    │
    │   ←       2025        →
    │   ←     September     →
    │
    │   Mo Tu We Th Fr Sa Su
    │    1  2  3  4  5  6  7
    │    8  9 10 11 12 13 14
    │   15 16 17 18 19 20 21
    │   22 23 24 25 26 27 28
    │   29 30"
  `)

  // Navigate backwards with Shift+Tab
  await driver.keys.shiftTab()

  const afterBackwardTabSnapshot = await driver.text()
  expect(afterBackwardTabSnapshot).toMatchInlineSnapshot(`
    "

       Form Component Demo
    │  This demonstrates all available form input types. Use arrow key
    │
    ◇  Username
    │  testuser
    │  Required field
    │
    ◆  Password
    │  password
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
    │   ←     September     →
    │
    │   Mo Tu We Th Fr Sa Su
    │    1  2  3  4  5  6  7
    │    8  9 10 11 12 13 14
    │   15 16 17 18 19 20 21
    │   22 23 24 25 26 27 28
    │   29 30"
  `)

  // Go back to username field
  await driver.keys.shiftTab()

  const backToUsernameSnapshot = await driver.text()
  expect(backToUsernameSnapshot).toMatchInlineSnapshot(`
    "

       Form Component Demo
    │  This demonstrates all available form input types. Use arrow key
    │
    ◆  Username
    │  testuser
    │  Required field
    │
    ◇  Password
    │  ********
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
    │   ←     September     →
    │
    │   Mo Tu We Th Fr Sa Su
    │    1  2  3  4  5  6  7
    │    8  9 10 11 12 13 14
    │   15 16 17 18 19 20 21
    │   22 23 24 25 26 27 28
    │   29 30"
  `)

  // Clear and type new username
  await driver.keys.ctrlA()
  await driver.keys.type('newuser')

  const afterEditUsernameSnapshot = await driver.text()
  expect(afterEditUsernameSnapshot).toMatchInlineSnapshot(`
    "

       Form Component Demo
    │  This demonstrates all available form input types. Use arrow key
    │
    ◆  Username
    │  testusernewuser
    │  Required field
    │
    ◇  Password
    │  ********
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
    │   ←     September     →
    │
    │   Mo Tu We Th Fr Sa Su
    │    1  2  3  4  5  6  7
    │    8  9 10 11 12 13 14
    │   15 16 17 18 19 20 21
    │   22 23 24 25 26 27 28
    │   29 30"
  `)
}, 10000)

test('form dropdown navigation', async () => {
  await driver.text({
    waitFor: (text) => {
      // wait for form to show up
      return /Form Component Demo/i.test(text)
    },
  })

  // Navigate to dropdown
  await driver.keys.tab() // username
  await driver.keys.tab() // password
  await driver.keys.tab() // bio
  await driver.keys.tab() // checkbox
  await driver.keys.tab() // dropdown

  // Navigate to dropdown area (already showing inline options)
  await driver.keys.space()

  const dropdownFocusedSnapshot = await driver.text()
  expect(dropdownFocusedSnapshot).toMatchInlineSnapshot(`
    "

       Form Component Demo
    │  This demonstrates all available form input types. Use arrow key
    │
    ◇  Username
    │  Enter your username
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
    │  ○ United Kingdom
    │  ↑↓ to see more options
    │
    │  Your country of residence
    │
    ◆  Date of Birth
    │
    │   ←       2025        →
    │   ←     September     →
    │
    │   Mo Tu We Th Fr Sa Su
    │    1  2  3  4  5  6  7
    │    8  9 10 11 12 13 14
    │   15 16 17 18 19 20 21
    │   22 23 24 25 26 27 28
    │   29 30"
  `)

  // Navigate down in dropdown
  await driver.keys.down()

  const afterDownSnapshot = await driver.text()
  expect(afterDownSnapshot).toMatchInlineSnapshot(`
    "

       Form Component Demo
    │  This demonstrates all available form input types. Use arrow key
    │
    ◇  Username
    │  Enter your username
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
    │  ○ United Kingdom
    │  ↑↓ to see more options
    │
    │  Your country of residence
    │
    ◆  Date of Birth
    │
    │   ←       2025        →
    │   ←     September     →
    │
    │   Mo Tu We Th Fr Sa Su
    │    1  2  3  4  5  6  7
    │    8  9 10 11 12 13 14
    │   15 16 17 18 19 20 21
    │   22 23 24 25 26 27 28
    │   29 30"
  `)

  // Navigate to Europe section
  await driver.keys.down()
  await driver.keys.down()
  await driver.keys.down()

  const europeSelectionSnapshot = await driver.text()
  expect(europeSelectionSnapshot).toMatchInlineSnapshot(`
    "

       Form Component Demo
    │  This demonstrates all available form input types. Use arrow key
    │
    ◇  Username
    │  Enter your username
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
    │  ○ United Kingdom
    │  ↑↓ to see more options
    │
    │  Your country of residence
    │
    ◆  Date of Birth
    │
    │   ←       2025        →
    │   ←     September     →
    │
    │   Mo Tu We Th Fr Sa Su
    │    1  2  3  4  5  6  7
    │    8  9 10 11 12 13 14
    │   15 16 17 18 19 20 21
    │   22 23 24 25 26 27 28
    │   29 30"
  `)

  // Select France
  await driver.keys.enter()

  const afterFranceSelectSnapshot = await driver.text()
  expect(afterFranceSelectSnapshot).toMatchInlineSnapshot(`
    "

       Form Component Demo
    │  This demonstrates all available form input types. Use arrow key
    │
    ◇  Username
    │  Enter your username
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
    │  ○ United Kingdom
    │  ↑↓ to see more options
    │
    │  Your country of residence
    │
    ◆  Date of Birth
    │
    │   ←       2025        →
    │   ←     September     →
    │
    │   Mo Tu We Th Fr Sa Su
    │    1  2  3  4  5  6  7
    │    8  9 10 11 12 13 14
    │   15 16 17 18 19 20 21
    │   22 23 24 25 26 27 28
    │   29 30"
  `)
}, 10000)
