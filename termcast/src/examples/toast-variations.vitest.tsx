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

       Search...

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

       Search...

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


       ↵ select    ↑↓ navigate    ^k actions








                                         ✗ Error

    "
  `)

  // With Short Message
  await session.press('down')
  const shortMessage = await session.text()
  expect(shortMessage).toMatchInlineSnapshot(`
    "


       Toast Variations ─────────────────────────────────────────────────────────

       Search...

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


       ↵ select    ↑↓ navigate    ^k actions








                                        ✓ Copied
                                 Text copied to clipboard
    "
  `)

  // With Long Message
  await session.press('down')
  const longMessage = await session.text()
  expect(longMessage).toMatchInlineSnapshot(`
    "


       Toast Variations ─────────────────────────────────────────────────────────

       Search...

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


       ↵ select    ↑↓ navigate    ^k actions






                                         ✗ Error
        This is a very long error message that should wrap to multiple lines when
        displayed in the toast component. It contains detailed information about
        what went wrong during the operation.
    "
  `)

  // With Super Long Message
  await session.press('down')
  const superLongMessage = await session.text()
  expect(superLongMessage).toMatchInlineSnapshot(`
    "


       Toast Variations ─────────────────────────────────────────────────────────

       Search...

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


       ↵ select    ↑↓ navigate    ^k actions




                                        ✗ Warning
       Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod
       tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam,
        quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo
       consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse
       cillum dolore eu fugiat nulla pariatur.
    "
  `)

  // With Primary Action
  await session.press('down')
  const primaryAction = await session.text()
  expect(primaryAction).toMatchInlineSnapshot(`
    "


       Toast Variations ─────────────────────────────────────────────────────────

       Search...

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


       ↵ select    ↑↓ navigate    ^k actions








                                 ✓ File Deleted [Undo ↵]
                              document.pdf was moved to trash
    "
  `)

  // With Both Actions
  await session.press('down')
  const bothActions = await session.text()
  expect(bothActions).toMatchInlineSnapshot(`
    "


       Toast Variations ─────────────────────────────────────────────────────────

       Search...

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


       ↵ select    ↑↓ navigate    ^k actions








                        ✓ Update Available [Install ↵] [Later ⇥]
                              Version 2.0 is ready to install
    "
  `)

  // Long Title with Actions
  await session.press('down')
  const longTitleActions = await session.text()
  expect(longTitleActions).toMatchInlineSnapshot(`
    "


       Toast Variations ─────────────────────────────────────────────────────────

       Search...

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


       ↵ select    ↑↓ navigate    ^k actions








             ✓ Operation Completed Successfully [View Results ↵] [Dismiss ⇥]
                               All files have been processed
    "
  `)

  // Animated Loading
  await session.press('down')
  const animatedLoading = await session.text()
  expect(animatedLoading).toMatchInlineSnapshot(`
    "


       Toast Variations ─────────────────────────────────────────────────────────

       Search...

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


       ↵ select    ↑↓ navigate    ^k actions








                                      ⣽ Processing
                       Please wait while we process your request...
    "
  `)

  // Error with Retry
  await session.press('down')
  const errorRetry = await session.text()
  expect(errorRetry).toMatchInlineSnapshot(`
    "


       Toast Variations ─────────────────────────────────────────────────────────

       Search...

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


       ↵ select    ↑↓ navigate    ^k actions







                              ✗ Connection Failed [Retry ↵]
        Unable to connect to the server. Please check your internet connection and
        try again.
    "
  `)
}, 30000)
