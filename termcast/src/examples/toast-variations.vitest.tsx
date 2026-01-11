import { test, expect, afterEach, beforeEach } from 'vitest'
import { launchTerminal, Session } from 'tuistory/src'

// Normalize terminal output to avoid flaky tests:
// 1. Collapse multiple consecutive blank lines into exactly 2 blank lines
// 2. Trim trailing whitespace
function normalizeOutput(text: string): string {
  return text
    .replace(/\n(\s*\n){2,}/g, '\n\n\n') // Collapse 3+ consecutive newlines to 2 blank lines
    .replace(/\n+\s*$/, '\n') // Trim trailing blank lines
}

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
  // Simple Success - wait for toast to appear after list items (with any number of blank lines)
  const simpleSuccess = await session.text({
    waitFor: (text) => text.includes('›Simple Success') && /Error with Retry[\s\n]+✓ Success/.test(text),
  })
  expect(normalizeOutput(simpleSuccess)).toMatchInlineSnapshot(`
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
  const simpleFailure = await session.text({
    waitFor: (text) => text.includes('›Simple Failure') && /Error with Retry[\s\n]+✗ Error/.test(text),
  })
  expect(normalizeOutput(simpleFailure)).toMatchInlineSnapshot(`
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
  const shortMessage = await session.text({
    waitFor: (text) => text.includes('›With Short Message') && /Error with Retry[\s\n]+✓ Copied/.test(text),
  })
  expect(normalizeOutput(shortMessage)).toMatchInlineSnapshot(`
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
  const longMessage = await session.text({
    waitFor: (text) => text.includes('›With Long Message') && /Error with Retry[\s\n]+✗ Error/.test(text),
  })
  expect(normalizeOutput(longMessage)).toMatchInlineSnapshot(`
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


     ✗ Error  This is a very long error message that should wrap to multiple line
    "
  `)

  // With Super Long Message
  await session.press('down')
  const superLongMessage = await session.text({
    waitFor: (text) =>
      text.includes('›With Super Long Message') && /Error with Retry[\s\n]+✗ Warning/.test(text),
  })
  expect(normalizeOutput(superLongMessage)).toMatchInlineSnapshot(`
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


     ✗ Warning  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do e
    "
  `)

  // With Primary Action
  await session.press('down')
  const primaryAction = await session.text({
    waitFor: (text) =>
      text.includes('›With Primary Action') && /Error with Retry[\s\n]+✓ File Deleted/.test(text),
  })
  expect(normalizeOutput(primaryAction)).toMatchInlineSnapshot(`
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


     ✓ File Deleted  document.pdf was moved to trash                  Undo ctrl t
    "
  `)

  // With Both Actions
  await session.press('down')
  const bothActions = await session.text({
    waitFor: (text) =>
      text.includes('›With Both Actions') && /Error with Retry[\s\n]+✓ Update Available/.test(text),
  })
  expect(normalizeOutput(bothActions)).toMatchInlineSnapshot(`
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


     ✓ Update Available  Version 2.0 is ready to install  Install ctrl t Later ct
    "
  `)

  // Long Title with Actions
  await session.press('down')
  const longTitleActions = await session.text({
    waitFor: (text) =>
      text.includes('›Long Title with Actions') && /Error with Retry[\s\n]+✓ Operation Completed/.test(text),
  })
  expect(normalizeOutput(longTitleActions)).toMatchInlineSnapshot(`
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


     ✓ Operation Completed Successfully  All files have been processed  View Resu
    "
  `)

  // Animated Loading - normalize spinner character since it's animated
  await session.press('down')
  const animatedLoading = await session.text({
    waitFor: (text) =>
      text.includes('›Animated Loading') && /Error with Retry[\s\n]+[⣾⣽⣻⢿⡿⣟⣯⣷] Processing/.test(text),
  })
  // Normalize the spinner character (⣾⣽⣻⢿⡿⣟⣯⣷) to a fixed one for stable snapshot
  const normalizedAnimatedLoading = animatedLoading.replace(/[⣾⣽⣻⢿⡿⣟⣯⣷]/g, '◌')
  expect(normalizeOutput(normalizedAnimatedLoading)).toMatchInlineSnapshot(`
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


     ◌ Processing  Please wait while we process your request...
    "
  `)

  // Error with Retry
  await session.press('down')
  const errorRetry = await session.text({
    waitFor: (text) =>
      text.includes('›Error with Retry') && /Error with Retry[\s\n]+✗ Connection Failed/.test(text),
  })
  expect(normalizeOutput(errorRetry)).toMatchInlineSnapshot(`
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


     ✗ Connection Failed  Unable to connect to the server. Please check your inte
    "
  `)
}, 30000)
