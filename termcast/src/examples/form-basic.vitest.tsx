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

    const initialSnapshot = await driver.text()
    expect(initialSnapshot).toMatchInlineSnapshot(`
      "

      ┌ Form Component Demo
      This demonstrates all available form input types. Use arrow keys o
      ────────────────────────────────────────
      ◆  Username
      Required field
      ◇  Password
      Must be at least 8 characters
      ◇  Biography
      Tell us about yourself...



      Maximum 500 characters
      ◇  Email Preferences
      ○ Subscribe to newsletter
      Receive weekly updates
      ◇  Country
      ○ Select your country
      Your country of residence
      ◇  Date of Birth
      Format: YYYY-MM-DD
      ────────────────────────────────────────

      Form Navigation
      • ↑↓/Tab: Navigate fields | Space: Toggle checkbox | Enter/Space:

      └


       ↵ submit   ↑↓ navigate   ^k actions"
    `)

    // Type in username field
    await driver.keys.type('johndoe')

    const afterUsernameSnapshot = await driver.text()
    expect(afterUsernameSnapshot).toMatchInlineSnapshot(`
      "

      ┌ Form Component Demo
      This demonstrates all available form input types. Use arrow keys o
      ────────────────────────────────────────
      ◆  Username
      Required field
      ◇  Password
      Must be at least 8 characters
      ◇  Biography
      Tell us about yourself...



      Maximum 500 characters
      ◇  Email Preferences
      ○ Subscribe to newsletter
      Receive weekly updates
      ◇  Country
      ○ Select your country
      Your country of residence
      ◇  Date of Birth
      Format: YYYY-MM-DD
      ────────────────────────────────────────

      Form Navigation
      • ↑↓/Tab: Navigate fields | Space: Toggle checkbox | Enter/Space:

      └


       ↵ submit   ↑↓ navigate   ^k actions"
    `)

    // Tab to password field
    await driver.keys.tab()
    await driver.keys.type('securepass123')

    const afterPasswordSnapshot = await driver.text()
    expect(afterPasswordSnapshot).toMatchInlineSnapshot(`
      "

      ┌ Form Component Demo
      This demonstrates all available form input types. Use arrow keys o
      ────────────────────────────────────────
      ◆  Username
      Required field
      ◇  Password
      Must be at least 8 characters
      ◇  Biography
      Tell us about yourself...



      Maximum 500 characters
      ◇  Email Preferences
      ○ Subscribe to newsletter
      Receive weekly updates
      ◇  Country
      ○ Select your country
      Your country of residence
      ◇  Date of Birth
      Format: YYYY-MM-DD
      ────────────────────────────────────────

      Form Navigation
      • ↑↓/Tab: Navigate fields | Space: Toggle checkbox | Enter/Space:

      └


       ↵ submit   ↑↓ navigate   ^k actions"
    `)

    // Tab to biography field
    await driver.keys.tab()
    await driver.keys.type('I am a software developer')

    const afterBioSnapshot = await driver.text()
    expect(afterBioSnapshot).toMatchInlineSnapshot(`
      "

      ┌ Form Component Demo
      This demonstrates all available form input types. Use arrow keys o
      ────────────────────────────────────────
      ◆  Username
      Required field
      ◇  Password
      Must be at least 8 characters
      ◇  Biography
      I am a software developer



      Maximum 500 characters
      ◇  Email Preferences
      ○ Subscribe to newsletter
      Receive weekly updates
      ◇  Country
      ○ Select your country
      Your country of residence
      ◇  Date of Birth
      Format: YYYY-MM-DD
      ────────────────────────────────────────

      Form Navigation
      • ↑↓/Tab: Navigate fields | Space: Toggle checkbox | Enter/Space:

      └


       ↵ submit   ↑↓ navigate   ^k actions"
    `)

    // Tab to newsletter checkbox and toggle it
    await driver.keys.tab()
    await driver.keys.space()

    const afterCheckboxSnapshot = await driver.text()
    expect(afterCheckboxSnapshot).toMatchInlineSnapshot(`
      "

      ┌ Form Component Demo
      This demonstrates all available form input types. Use arrow keys o
      ────────────────────────────────────────
      ◆  Username
      Required field
      ◇  Password
      Must be at least 8 characters
      ◇  Biography
      I am a software developer



      Maximum 500 characters
      ◇  Email Preferences
      ○ Subscribe to newsletter
      Receive weekly updates
      ◇  Country
      ○ Select your country
      Your country of residence
      ◇  Date of Birth
      Format: YYYY-MM-DD
      ────────────────────────────────────────

      Form Navigation
      • ↑↓/Tab: Navigate fields | Space: Toggle checkbox | Enter/Space:

      └


       ↵ submit   ↑↓ navigate   ^k actions"
    `)

    // Tab to country dropdown and open it
    await driver.keys.tab()
    await driver.keys.space()

    const dropdownOpenSnapshot = await driver.text()
    expect(dropdownOpenSnapshot).toMatchInlineSnapshot(`
      "

      ┌ Form Component Demo
      This demonstrates all available form input types. Use arrow keys o
      ────────────────────────────────────────
      ◇  Username
      Required field
      ◇  Password
      Must be at least 8 characters
      ◇  Biography
      I am a software developer


        Country                                                    esc

        Select your country
        🇺🇸bs United States
        🇨🇦iv Canada
        🇲🇽ou Mexico
        🇬🇧le United Kingdom
        🇫🇷 c France
        🇩🇪at Germany


        ↵ select   ↑↓ navigate

      • ↑↓/Tab: Navigate fields | Space: Toggle checkbox | Enter/Space:

      └


       ↵ submit   ↑↓ navigate   ^k actions"
    `)

    // Select United States
    await driver.keys.enter()

    const afterCountrySelectSnapshot = await driver.text()
    expect(afterCountrySelectSnapshot).toMatchInlineSnapshot(`
      "

      ┌ Form Component Demo
      This demonstrates all available form input types. Use arrow keys o
      ────────────────────────────────────────
      ◇  Username
      Required field
      ◇  Password
      Must be at least 8 characters
      ◇  Biography
      I am a software developer



      Maximum 500 characters
      ◇  Email Preferences
      ● Subscribe to newsletter
      Receive weekly updates
      ◆  Country
      ● United States
      Your country of residence
      ◇  Date of Birth
      Format: YYYY-MM-DD
      ────────────────────────────────────────

      Form Navigation
      • ↑↓/Tab: Navigate fields | Space: Toggle checkbox | Enter/Space:

      └


       ↵ submit   ↑↓ navigate   ^k actions"
    `)

    // Tab to date picker
    await driver.keys.tab()
    await driver.keys.type('1990-05-15')

    const afterDateSnapshot = await driver.text()
    expect(afterDateSnapshot).toMatchInlineSnapshot(`
      "

      ┌ Form Component Demo
      This demonstrates all available form input types. Use arrow keys o
      ────────────────────────────────────────
      ◇  Username
      Required field
      ◇  Password
      Must be at least 8 characters
      ◇  Biography
      I am a software developer



      Maximum 500 characters
      ◇  Email Preferences
      ● Subscribe to newsletter
      Receive weekly updates
      ◆  Country
      ● United States
      Your country of residence
      ◇  Date of Birth
      Format: YYYY-MM-DD
      ────────────────────────────────────────

      Form Navigation
      • ↑↓/Tab: Navigate fields | Space: Toggle checkbox | Enter/Space:

      └


       ↵ submit   ↑↓ navigate   ^k actions"
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

      ┌ Form Component Demo
      This demonstrates all available form input types. Use arrow keys o
      ────────────────────────────────────────
      ◇  Username
      Required field
      ◇  Password
      Must be at least 8 characters
      ◇  Biography
      I am a software developer



      Maximum 500 characters
      ◇  Email Preferences
      ● Subscribe to newsletter
      Receive weekly updates
      ◆  Country
      ● United States
      Your country of residence
      ◇  Date of Birth
      Format: YYYY-MM-DD
      ────────────────────────────────────────

      Form Navigation
      • ↑↓/Tab: Navigate fields | Space: Toggle checkbox | Enter/Space:

      └


       ↵ submit   ↑↓ navigate   ^k actions"
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

      ┌ Form Component Demo
      This demonstrates all available form input types. Use arrow keys o
      ────────────────────────────────────────
      ◆  Username
      Required field
      ◇  Password
      Must be at least 8 characters
      ◇  Biography
      Tell us about yourself...



      Maximum 500 characters
      ◇  Email Preferences
      ○ Subscribe to newsletter
      Receive weekly updates
      ◇  Country
      ○ Select your country
      Your country of residence
      ◇  Date of Birth
      Format: YYYY-MM-DD
      ────────────────────────────────────────

      Form Navigation
      • ↑↓/Tab: Navigate fields | Space: Toggle checkbox | Enter/Space:

      └


       ↵ submit   ↑↓ navigate   ^k actions"
    `)

    // Navigate backwards with Shift+Tab
    await driver.keys.shiftTab()

    const afterBackwardTabSnapshot = await driver.text()
    expect(afterBackwardTabSnapshot).toMatchInlineSnapshot(`
      "

      ┌ Form Component Demo
      This demonstrates all available form input types. Use arrow keys o
      ────────────────────────────────────────
      ◆  Username
      Required field
      ◇  Password
      Must be at least 8 characters
      ◇  Biography
      Tell us about yourself...



      Maximum 500 characters
      ◇  Email Preferences
      ○ Subscribe to newsletter
      Receive weekly updates
      ◇  Country
      ○ Select your country
      Your country of residence
      ◇  Date of Birth
      Format: YYYY-MM-DD
      ────────────────────────────────────────

      Form Navigation
      • ↑↓/Tab: Navigate fields | Space: Toggle checkbox | Enter/Space:

      └


       ↵ submit   ↑↓ navigate   ^k actions"
    `)

    // Go back to username field
    await driver.keys.shiftTab()

    const backToUsernameSnapshot = await driver.text()
    expect(backToUsernameSnapshot).toMatchInlineSnapshot(`
      "

      ┌ Form Component Demo
      This demonstrates all available form input types. Use arrow keys o
      ────────────────────────────────────────
      ◆  Username
      Required field
      ◇  Password
      Must be at least 8 characters
      ◇  Biography
      Tell us about yourself...



      Maximum 500 characters
      ◇  Email Preferences
      ○ Subscribe to newsletter
      Receive weekly updates
      ◇  Country
      ○ Select your country
      Your country of residence
      ◇  Date of Birth
      Format: YYYY-MM-DD
      ────────────────────────────────────────

      Form Navigation
      • ↑↓/Tab: Navigate fields | Space: Toggle checkbox | Enter/Space:

      └


       ↵ submit   ↑↓ navigate   ^k actions"
    `)

    // Clear and type new username
    await driver.keys.ctrlA()
    await driver.keys.type('newuser')

    const afterEditUsernameSnapshot = await driver.text()
    expect(afterEditUsernameSnapshot).toMatchInlineSnapshot(`
      "

      ┌ Form Component Demo
      This demonstrates all available form input types. Use arrow keys o
      ────────────────────────────────────────
      ◆  Username
      Required field
      ◇  Password
      Must be at least 8 characters
      ◇  Biography
      Tell us about yourself...



      Maximum 500 characters
      ◇  Email Preferences
      ○ Subscribe to newsletter
      Receive weekly updates
      ◇  Country
      ○ Select your country
      Your country of residence
      ◇  Date of Birth
      Format: YYYY-MM-DD
      ────────────────────────────────────────

      Form Navigation
      • ↑↓/Tab: Navigate fields | Space: Toggle checkbox | Enter/Space:

      └


       ↵ submit   ↑↓ navigate   ^k actions"
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

    // Open dropdown
    await driver.keys.space()

    const dropdownOpenSnapshot = await driver.text()
    expect(dropdownOpenSnapshot).toMatchInlineSnapshot(`
      "

      ┌ Form Component Demo
      This demonstrates all available form input types. Use arrow keys o
      ────────────────────────────────────────
      ◆  Username
      Required field
      ◇  Password
      Must be at least 8 characters
      ◇  Biography
      Tell us about yourself...



      Maximum 500 characters
      ◇  Email Preferences
      ○ Subscribe to newsletter
      Receive weekly updates
      ◇  Country
      ○ Select your country
      Your country of residence
      ◇  Date of Birth
      Format: YYYY-MM-DD
      ────────────────────────────────────────

      Form Navigation
      • ↑↓/Tab: Navigate fields | Space: Toggle checkbox | Enter/Space:

      └


       ↵ submit   ↑↓ navigate   ^k actions"
    `)

    // Navigate down in dropdown
    await driver.keys.down()

    const afterDownSnapshot = await driver.text()
    expect(afterDownSnapshot).toMatchInlineSnapshot(`
      "

      ┌ Form Component Demo
      This demonstrates all available form input types. Use arrow keys o
      ────────────────────────────────────────
      ◆  Username
      Required field
      ◇  Password
      Must be at least 8 characters
      ◇  Biography
      Tell us about yourself...



      Maximum 500 characters
      ◇  Email Preferences
      ○ Subscribe to newsletter
      Receive weekly updates
      ◇  Country
      ○ Select your country
      Your country of residence
      ◇  Date of Birth
      Format: YYYY-MM-DD
      ────────────────────────────────────────

      Form Navigation
      • ↑↓/Tab: Navigate fields | Space: Toggle checkbox | Enter/Space:

      └


       ↵ submit   ↑↓ navigate   ^k actions"
    `)

    // Navigate to Europe section
    await driver.keys.down()
    await driver.keys.down()
    await driver.keys.down()

    const europeSelectionSnapshot = await driver.text()
    expect(europeSelectionSnapshot).toMatchInlineSnapshot(`
      "

      ┌ Form Component Demo
      This demonstrates all available form input types. Use arrow keys o
      ────────────────────────────────────────
      ◆  Username
      Required field
      ◇  Password
      Must be at least 8 characters
      ◇  Biography
      Tell us about yourself...



      Maximum 500 characters
      ◇  Email Preferences
      ○ Subscribe to newsletter
      Receive weekly updates
      ◇  Country
      ○ Select your country
      Your country of residence
      ◇  Date of Birth
      Format: YYYY-MM-DD
      ────────────────────────────────────────

      Form Navigation
      • ↑↓/Tab: Navigate fields | Space: Toggle checkbox | Enter/Space:

      └


       ↵ submit   ↑↓ navigate   ^k actions"
    `)

    // Select France
    await driver.keys.enter()

    const afterFranceSelectSnapshot = await driver.text()
    expect(afterFranceSelectSnapshot).toMatchInlineSnapshot(`
      "

      ┌ Form Component Demo
      This demonstrates all available form input types. Use arrow keys o
      ────────────────────────────────────────
      ◆  Username
      Required field
      ◇  Password
      Must be at least 8 characters
      ◇  Biography
      Tell us about yourself...



      Maximum 500 characters
      ◇  Email Preferences
      ○ Subscribe to newsletter
      Receive weekly updates
      ◇  Country
      ○ Select your country
      Your country of residence
      ◇  Date of Birth
      Format: YYYY-MM-DD
      ────────────────────────────────────────

      Form Navigation
      • ↑↓/Tab: Navigate fields | Space: Toggle checkbox | Enter/Space:

      └


       ↵ submit   ↑↓ navigate   ^k actions"
    `)
}, 10000)
