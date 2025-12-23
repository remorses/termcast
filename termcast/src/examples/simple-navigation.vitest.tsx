import { test, expect, afterEach, beforeEach } from 'vitest'
import { launchTerminal, Session } from 'tuistory/src'

let session: Session

beforeEach(async () => {
  session = await launchTerminal({
    command: 'bun',
    args: ['src/examples/simple-navigation.tsx'],
    cols: 70,
    rows: 25,
  })
})

afterEach(() => {
  session?.close()
})

test('navigation between main and detail views', async () => {
  await session.text({
    waitFor: (text) => {
      // wait for main view with items to show up
      return /Navigation Example/i.test(text) && /First Item/i.test(text)
    },
  })

  // Ensure all items are rendered and registered
  await session.waitIdle()
  await new Promise((resolve) => setTimeout(resolve, 200))

  const initialSnapshot = await session.text()

  expect(initialSnapshot).toMatchInlineSnapshot(`
    "


     Navigation Example ─────────────────────────────────────────────

     Main view

     Items
    ›First Item Navigate to first detail
     Second Item Navigate to second detail
     Third Item Navigate to third detail













     ↵ open details  ↑↓ navigate  ^k actions"
  `)

  // Navigate to second item
  await session.press('down')
  await session.waitIdle()

  const afterDownSnapshot = await session.text()
  expect(afterDownSnapshot).toMatchInlineSnapshot(`
    "


     Navigation Example ─────────────────────────────────────────────

     Main view

     Items
     First Item Navigate to first detail
    ›Second Item Navigate to second detail
     Third Item Navigate to third detail













     ↵ open details  ↑↓ navigate  ^k actions"
  `)

  // Press Enter to open actions panel (auto-executes first action)
  await session.press('enter')
  await session.waitIdle()
  await new Promise((resolve) => setTimeout(resolve, 200))

  const actionsOpenSnapshot = await session.text({
    waitFor: (text) => /Detail: Second Item/i.test(text),
    timeout: 3000,
  })
  expect(actionsOpenSnapshot).toMatchInlineSnapshot(`
    "


     Detail: Second Item ────────────────────────────────────────────

     Detail view - Press ESC to go back

     Details
    ›This is the detail view for Second Item Press Enter to go back















     ↵ go back  ↑↓ navigate  ^k actions"
  `)

  // Press Enter in detail view triggers "Go Back" action, returning to main view
  await session.press('enter')
  await session.waitIdle()
  await new Promise((resolve) => setTimeout(resolve, 200))

  const backToMainSnapshot = await session.text({
    waitFor: (text) => {
      // wait for main view to show up after going back
      return /Main view/i.test(text) && /Second Item/i.test(text)
    },
    timeout: 3000,
  })
  // After "Go Back" action, we should be back on main view
  expect(backToMainSnapshot).toMatchInlineSnapshot(`
    "


     Navigation Example ─────────────────────────────────────────────

     Main view

     Items
    ›First Item Navigate to first detail
     Second Item Navigate to second detail
     Third Item Navigate to third detail













     ↵ open details  ↑↓ navigate  ^k actions"
  `)

  // Navigate down to third item
  await session.press('down')
  await session.press('down')

  const thirdItemSnapshot = await session.text()
  expect(thirdItemSnapshot).toMatchInlineSnapshot(`
    "


     Navigation Example ─────────────────────────────────────────────

     Main view

     Items
     First Item Navigate to first detail
     Second Item Navigate to second detail
    ›Third Item Navigate to third detail













     ↵ open details  ↑↓ navigate  ^k actions"
  `)

  // Open action panel for third item
  await session.press('enter')

  const thirdActionsSnapshot = await session.text()
  expect(thirdActionsSnapshot).toMatchInlineSnapshot(`
    "


     Detail: Third Item ─────────────────────────────────────────────

     Detail view - Press ESC to go back

     Details
    ›This is the detail view for Third Item Press Enter to go back o















     ↵ go back  ↑↓ navigate  ^k actions"
  `)

  // Press enter in detail view triggers "Go Back" action, returning to main view
  await session.press('enter')
  await session.waitIdle()

  const backFromThirdSnapshot = await session.text({
    waitFor: (text) => {
      return /Main view/i.test(text)
    },
    timeout: 3000,
  })
  expect(backFromThirdSnapshot).toMatchInlineSnapshot(`
    "


     Navigation Example ─────────────────────────────────────────────

     Main view

     Items
    ›First Item Navigate to first detail
     Second Item Navigate to second detail
     Third Item Navigate to third detail













     ↵ open details  ↑↓ navigate  ^k actions"
  `)
}, 15000)

test('navigation with actions panel', async () => {
  await session.text({
    waitFor: (text) => {
      // wait for main view to show up
      return /Navigation Example/i.test(text)
    },
  })

  // Open actions panel with ctrl+k
  await session.press(['ctrl', 'k'])

  const actionsOpenSnapshot = await session.text()
  expect(actionsOpenSnapshot).toMatchInlineSnapshot(`
    "


     Navigation Example ─────────────────────────────────────────────

     Main view

     Items
    ›First Item Navigate to first detail
     ┌──────────────────────────────────────────────────────────────────
     │
     │                                                            esc
     │
     │   Search actions...
     │
     │  ›Open Details
     │   Copy Title
     │
     │
     │
     │
     │
     │
     │
     │
     │"
  `)

  // Navigate down in actions panel
  await session.press('down')

  const secondActionSnapshot = await session.text()
  expect(secondActionSnapshot).toMatchInlineSnapshot(`
    "


     Navigation Example ─────────────────────────────────────────────

     Main view

     Items
    ›First Item Navigate to first detail
     ┌──────────────────────────────────────────────────────────────────
     │
     │                                                            esc
     │
     │   Search actions...
     │
     │   Open Details
     │  ›Copy Title
     │
     │
     │
     │
     │
     │
     │
     │
     │"
  `)

  // Select the Copy Title action
  await session.press('enter')

  const afterCopySnapshot = await session.text()
  expect(afterCopySnapshot).toMatchInlineSnapshot(`
    "


     Navigation Example ─────────────────────────────────────────────

     Main view

     Items
    ›First Item Navigate to first detail
     Second Item Navigate to second detail
     Third Item Navigate to third detail











                         ┌───────────────────────┐
                         │ ✓ Copied to Clipboard │
                         │   First Item          │
                         └───────────────────────┘"
  `)

  // Wait for toast to clear, then navigate to second item
  await new Promise((resolve) => setTimeout(resolve, 500))
  
  await session.press('down')
  await session.waitIdle()
  await new Promise((resolve) => setTimeout(resolve, 200))
  
  await session.press('enter')
  await session.waitIdle()
  await new Promise((resolve) => setTimeout(resolve, 200))

  const secondDetailSnapshot = await session.text({
    waitFor: (text) => {
      return /Detail: Second Item/i.test(text)
    },
  })
  expect(secondDetailSnapshot).toMatchInlineSnapshot(`
    "


     Detail: Second Item ────────────────────────────────────────────

     Detail view - Press ESC to go back

     Details
    ›This is the detail view for Second Item Press Enter to go back













                         ┌───────────────────────┐
                         │ ✓ Copied to Clipboard │
                         │   First Item          │
                         └───────────────────────┘"
  `)

  // Open actions panel in detail view
  await session.press(['ctrl', 'k'])

  const detailActionsSnapshot = await session.text()
  expect(detailActionsSnapshot).toMatchInlineSnapshot(`
    "


     Detail: Second Item ────────────────────────────────────────────

     Detail view - Press ESC to go back

     Details
    ›This is the detail view for Second Item Press Enter to go back
     ┌──────────────────────────────────────────────────────────────────
     │
     │                                                            esc
     │
     │   Search actions...
     │
     │  ›Go Back
     │   Copy Title
     │
     │
     │
     │
     │
     │                   ┌───────────────────────┐
     │                   │ ✓ Copied to Clipboard │
     │                   │   First Item          │
     │                   └───────────────────────┘"
  `)

  // Select Go Back action
  await session.press('enter')

  const backViaActionSnapshot = await session.text({
    waitFor: (text) => {
      return /Navigation Example/i.test(text)
    },
  })
  expect(backViaActionSnapshot).toMatchInlineSnapshot(`
    "


     Navigation Example ─────────────────────────────────────────────

     Main view

     Items
    ›First Item Navigate to first detail
     Second Item Navigate to second detail
     Third Item Navigate to third detail











                         ┌───────────────────────┐
                         │ ✓ Copied to Clipboard │
                         │   First Item          │
                         └───────────────────────┘"
  `)
}, 15000)

test('search functionality in main and detail views', async () => {
  await session.text({
    waitFor: (text) => {
      // wait for main view to show up
      return /Main view/i.test(text)
    },
  })

  // Type in search bar
  await session.type('second')

  const searchMainSnapshot = await session.text({
    waitFor: (text) => {
      return /second/i.test(text)
    },
  })
  expect(searchMainSnapshot).toMatchInlineSnapshot(`
    "


    Navigation Example ─────────────────────────────────────────────

    second

    Second Item Navigate to second detail
















    ↵ open details  ↑↓ navigate  ^k actions"
  `)

  // Clear search
  await session.press('backspace')
  await session.press('backspace')
  await session.press('backspace')
  await session.press('backspace')
  await session.press('backspace')
  await session.press('backspace')

  const clearedSearchSnapshot = await session.text()
  expect(clearedSearchSnapshot).toMatchInlineSnapshot(`
    "


     Navigation Example ─────────────────────────────────────────────

     Main view

     Items
    ›First Item Navigate to first detail
     Second Item Navigate to second detail
     Third Item Navigate to third detail













     ↵ open details  ↑↓ navigate  ^k actions"
  `)

  // Open first item detail (auto-executes Open Details action)
  await session.press('enter')
  await session.waitIdle()
  await new Promise((resolve) => setTimeout(resolve, 200))

  const firstDetailSnapshot = await session.text({
    waitFor: (text) => {
      return /Detail: First Item/i.test(text)
    },
    timeout: 3000,
  })
  expect(firstDetailSnapshot).toMatchInlineSnapshot(`
    "


     Detail: First Item ─────────────────────────────────────────────

     Detail view - Press ESC to go back

     Details
    ›This is the detail view for First Item Press Enter to go back o















     ↵ go back  ↑↓ navigate  ^k actions"
  `)

  // Type in detail view search bar
  await session.type('test')

  const searchDetailSnapshot = await session.text({
    waitFor: (text) => {
      return /test/i.test(text)
    },
  })
  expect(searchDetailSnapshot).toMatchInlineSnapshot(`
    "


    Detail: First Item ─────────────────────────────────────────────

    test


















    ↵ go back  ↑↓ navigate  ^k actions"
  `)

  // Press ESC to go back
  await session.press('esc')

  const finalMainSnapshot = await session.text({
    waitFor: (text) => {
      return /Navigation Example/i.test(text)
    },
  })
  expect(finalMainSnapshot).toMatchInlineSnapshot(`
    "


     Navigation Example ─────────────────────────────────────────────

     Main view

     Items
    ›First Item Navigate to first detail
     Second Item Navigate to second detail
     Third Item Navigate to third detail













     ↵ open details  ↑↓ navigate  ^k actions"
  `)
}, 10000)
