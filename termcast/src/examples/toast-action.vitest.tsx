import { test, expect, afterEach, beforeEach } from 'vitest'
import { launchTerminal, Session } from 'tuistory/src'

let session: Session

beforeEach(async () => {
  session = await launchTerminal({
    command: 'bun',
    args: ['src/examples/toast-action.tsx'],
    cols: 70,
    rows: 20,
  })
})

afterEach(() => {
  session?.close()
})

test('pressing enter triggers primary action on toast', async () => {
  // Wait for list to load
  await session.text({
    waitFor: (text) => text.includes('Show Toast with Action'),
  })

  // Press enter to trigger the action and show toast
  await session.press('enter')
  await session.text({
    waitFor: (text) => text.includes('Undo ctrl t'),
  })

  const beforeEnter = await session.text()
  expect(beforeEnter).toMatchInlineSnapshot(`
    "


       Toast Action Test ──────────────────────────────────────────────

       > Search...

      ›Show Toast with Action
       Form with Toast
       Form with Delayed Toast Action
       Other Item




       ✓ File Deleted  document.pdf was moved to trash      Undo ctrl t




    "
  `)

  expect(beforeEnter).toContain('Undo ctrl t')

  // Press Ctrl+T to trigger the primary action
  await session.press(['ctrl', 't'])
  await session.text({
    waitFor: (text) => text.includes('Undone'),
  })

  const afterEnter = await session.text()
  expect(afterEnter).toMatchInlineSnapshot(`
    "


       Toast Action Test ──────────────────────────────────────────────

       > Search...

      ›Show Toast with Action
       Form with Toast
       Form with Delayed Toast Action
       Other Item




       ✓ Undone  File restored




    "
  `)

  expect(afterEnter).toContain('Undone')
}, 30000)

test('pressing escape hides the toast', async () => {
  // Wait for list to load
  await session.text({
    waitFor: (text) => text.includes('Show Toast with Action'),
  })

  // Press enter to show toast
  await session.press('enter')
  await session.text({
    waitFor: (text) => text.includes('Undo ctrl t'),
  })

  const beforeEsc = await session.text()
  expect(beforeEsc).toContain('Undo ctrl t')

  await session.press('escape')
  await new Promise((r) => setTimeout(r, 300))

  const afterEsc = await session.text()
  expect(afterEsc).toMatchInlineSnapshot(`
    "


       Toast Action Test ──────────────────────────────────────────────

       > Search...

      ›Show Toast with Action
       Form with Toast
       Form with Delayed Toast Action
       Other Item




       ↵ show toast   ↑↓ navigate   ^k actions




    "
  `)

  expect(afterEsc).not.toContain('Undo ctrl t')
  // Verify list is still visible (ESC didn't exit the app)
  expect(afterEsc).toContain('Toast Action Test')
}, 30000)

test('form toast: pressing enter triggers primary action (navigation)', async () => {
  // Wait for list to load
  await session.text({
    waitFor: (text) => text.includes('Form with Toast'),
  })

  // Navigate to Form with Toast item
  await session.press('down')
  await new Promise((r) => setTimeout(r, 100))

  // Open form via enter (triggers action)
  await session.press('enter')
  await session.text({
    waitFor: (text) => text.includes('Name') && text.includes('Enter your name'),
  })

  const formView = await session.text()
  expect(formView).toMatchInlineSnapshot(`
    "




      ◆  Name
      │  Enter your name
      │
      └









       ctrl ↵ submit   tab navigate   ^k actions

    "
  `)

  // Type a name
  await session.type('John')
  await new Promise((r) => setTimeout(r, 100))

  // Submit the form via action panel (ctrl+k then enter)
  await session.press(['ctrl', 'k'])
  await session.waitIdle()
  await session.press('enter')
  await session.text({
    waitFor: (text) => text.includes('View Details ctrl t'),
  })

  const toastShown = await session.text()
  expect(toastShown).toMatchInlineSnapshot(`
    "




      ◆  Name
      │  John
      │
      └









       ✓ Form Submitted  Hello, John!               View Details ctrl t

    "
  `)

  // Press Ctrl+T to trigger primary action (navigate to detail view)
  await session.press(['ctrl', 't'])
  await session.text({
    waitFor: (text) => text.includes('Welcome, John!'),
  })

  const detailView = await session.text()
  expect(detailView).toMatchInlineSnapshot(`
    "


       Form Submitted ─────────────────────────────────────────────────

       > Search...

      ›Welcome, John! Form submission successful







       ↑↓ navigate   ^k actions




    "
  `)
}, 30000)

test('form toast: pressing escape closes toast but stays on form', async () => {
  // Wait for list to load
  await session.text({
    waitFor: (text) => text.includes('Form with Toast'),
  })

  // Navigate to Form with Toast item
  await session.press('down')
  await new Promise((r) => setTimeout(r, 100))

  // Open form
  await session.press('enter')
  await session.text({
    waitFor: (text) => text.includes('Name') && text.includes('Enter your name'),
  })

  // Type a name
  await session.type('Jane')
  await new Promise((r) => setTimeout(r, 100))

  // Submit the form via action panel (ctrl+k then enter)
  await session.press(['ctrl', 'k'])
  await session.waitIdle()
  await session.press('enter')
  await session.text({
    waitFor: (text) => text.includes('View Details ctrl t'),
  })

  const toastShown = await session.text()
  expect(toastShown).toContain('View Details ctrl t')

  // Press Escape to close toast
  await session.press('escape')
  await new Promise((r) => setTimeout(r, 300))

  const afterEsc = await session.text()
  expect(afterEsc).toMatchInlineSnapshot(`
    "




      ◆  Name
      │  Jane
      │
      └









       ctrl ↵ submit   tab navigate   ^k actions

    "
  `)

  // Toast should be closed
  expect(afterEsc).not.toContain('View Details ctrl t')
  // Should still be on the form (Name field visible)
  expect(afterEsc).toContain('Name')
}, 30000)

test('delayed toast action: primaryAction set after toast shown works with enter', async () => {
  // Wait for list to load
  await session.text({
    waitFor: (text) => text.includes('Delayed Toast Action'),
  })

  // Navigate to delayed toast action item
  await session.press('down')
  await session.press('down')
  await new Promise((r) => setTimeout(r, 100))

  // Open form
  await session.press('enter')
  await session.text({
    waitFor: (text) => text.includes('Name') && text.includes('Enter your name'),
  })

  // Type a name
  await session.type('Test')
  await new Promise((r) => setTimeout(r, 100))

  // Submit the form
  await session.press(['ctrl', 'k'])
  await session.waitIdle()
  await session.press('enter')

  // Wait for delayed toast to show with primaryAction (set after 500ms delay)
  await session.text({
    waitFor: (text) => text.includes('Open ctrl t'),
    timeout: 3000,
  })

  const toastWithAction = await session.text()
  expect(toastWithAction).toMatchInlineSnapshot(`
    "




      ◆  Name
      │  Test
      │
      └









       ✓ Done  Hello, Test!                                 Open ctrl t

    "
  `)

  // Press Ctrl+T to trigger primary action - this should work even though
  // primaryAction was set AFTER the toast was shown
  await session.press(['ctrl', 't'])
  await session.text({
    waitFor: (text) => text.includes('Opened!'),
  })

  const afterAction = await session.text()
  expect(afterAction).toMatchInlineSnapshot(`
    "




      ◆  Name
      │  Test
      │
      └









       ✓ Opened!  Action triggered successfully

    "
  `)
}, 30000)
