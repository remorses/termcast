import { test, expect, afterEach, beforeEach } from 'vitest'
import { launchTerminal, Session } from 'tuistory/src'

let session: Session

beforeEach(async () => {
  session = await launchTerminal({
    command: 'bun',
    args: ['src/examples/toast-variations.tsx'],
    cols: 80,
    rows: 30,
  })
})

afterEach(() => {
  session?.close()
})

test('toast variations display correctly', async () => {
  // Simple Success
  const simpleSuccess = await session.text({
    waitFor: (text) => text.includes('Simple Success') && text.includes('Success'),
  })
  expect(simpleSuccess).toMatchInlineSnapshot(`
    "


       Toast Variations ─────────────────────────────────────────────────────────

       > Search...

      ›Simple Success
       Simple Failure
       With Short Message
       With Long Message
       With Super Long Message
       With Primary Action
       With Both Actions
       Long Title with Actions
       Animated Loading
       Error with Retry


       ✓ Success










    "
  `)

  // Simple Failure
  await session.press('down')
  const simpleFailure = await session.text()
  expect(simpleFailure).toMatchInlineSnapshot(`
    "


       Toast Variations ─────────────────────────────────────────────────────────

       > Search...

       Simple Success
      ›Simple Failure
       With Short Message
       With Long Message
       With Super Long Message
       With Primary Action
       With Both Actions
       Long Title with Actions
       Animated Loading
       Error with Retry


       ✗ Error










    "
  `)

  // With Short Message
  await session.press('down')
  const shortMessage = await session.text()
  expect(shortMessage).toMatchInlineSnapshot(`
    "


       Toast Variations ─────────────────────────────────────────────────────────

       > Search...

       Simple Success
       Simple Failure
      ›With Short Message
       With Long Message
       With Super Long Message
       With Primary Action
       With Both Actions
       Long Title with Actions
       Animated Loading
       Error with Retry


       ✓ Copied  Text copied to clipboard










    "
  `)

  // With Long Message
  await session.press('down')
  const longMessage = await session.text()
  expect(longMessage).toMatchInlineSnapshot(`
    "


       Toast Variations ─────────────────────────────────────────────────────────

       > Search...

       Simple Success
       Simple Failure
       With Short Message
      ›With Long Message
       With Super Long Message
       With Primary Action
       With Both Actions
       Long Title with Actions
       Animated Loading
       Error with Retry


       ✗ Error  This is a very long error message that should wrap to multiple










    "
  `)

  // With Super Long Message
  await session.press('down')
  const superLongMessage = await session.text()
  expect(superLongMessage).toMatchInlineSnapshot(`
    "


       Toast Variations ─────────────────────────────────────────────────────────

       > Search...

       Simple Success
       Simple Failure
       With Short Message
       With Long Message
      ›With Super Long Message
       With Primary Action
       With Both Actions
       Long Title with Actions
       Animated Loading
       Error with Retry


       ✗ Warning  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed










    "
  `)

  // With Primary Action
  await session.press('down')
  const primaryAction = await session.text()
  expect(primaryAction).toMatchInlineSnapshot(`
    "


       Toast Variations ─────────────────────────────────────────────────────────

       > Search...

       Simple Success
       Simple Failure
       With Short Message
       With Long Message
       With Super Long Message
      ›With Primary Action
       With Both Actions
       Long Title with Actions
       Animated Loading
       Error with Retry


       ✓ File Deleted  document.pdf was moved to trash                Undo ctrl t










    "
  `)

  // With Both Actions
  await session.press('down')
  const bothActions = await session.text()
  expect(bothActions).toMatchInlineSnapshot(`
    "


       Toast Variations ─────────────────────────────────────────────────────────

       > Search...

       Simple Success
       Simple Failure
       With Short Message
       With Long Message
       With Super Long Message
       With Primary Action
      ›With Both Actions
       Long Title with Actions
       Animated Loading
       Error with Retry


       ✓ Update Available  Version 2.0 is ready to i  Install ctrl t Later ctrl g










    "
  `)

  // Long Title with Actions
  await session.press('down')
  const longTitleActions = await session.text()
  expect(longTitleActions).toMatchInlineSnapshot(`
    "


       Toast Variations ─────────────────────────────────────────────────────────

       > Search...

       Simple Success
       Simple Failure
       With Short Message
       With Long Message
       With Super Long Message
       With Primary Action
       With Both Actions
      ›Long Title with Actions
       Animated Loading
       Error with Retry


       ✓ Operation Completed Successfully  Al  View Results ctrl t Dismiss ctrl g










    "
  `)

  // Animated Loading
  await session.press('down')
  const animatedLoading = await session.text()
  expect(animatedLoading).toMatchInlineSnapshot(`
    "


       Toast Variations ─────────────────────────────────────────────────────────

       > Search...

       Simple Success
       Simple Failure
       With Short Message
       With Long Message
       With Super Long Message
       With Primary Action
       With Both Actions
       Long Title with Actions
      ›Animated Loading
       Error with Retry


       ⣽ Processing  Please wait while we process your request...










    "
  `)

  // Error with Retry
  await session.press('down')
  const errorRetry = await session.text()
  expect(errorRetry).toMatchInlineSnapshot(`
    "


       Toast Variations ─────────────────────────────────────────────────────────

       > Search...

       Simple Success
       Simple Failure
       With Short Message
       With Long Message
       With Super Long Message
       With Primary Action
       With Both Actions
       Long Title with Actions
       Animated Loading
      ›Error with Retry


       ✗ Connection Failed  Unable to connect to the server. Please  Retry ctrl t










    "
  `)
}, 30000)
