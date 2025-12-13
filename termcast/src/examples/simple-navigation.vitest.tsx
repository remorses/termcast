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
      // wait for main view to show up
      return /Navigation Example/i.test(text)
    },
  })

  // Small delay to ensure all items are rendered
  await session.waitIdle()

  const initialSnapshot = await session.text()

  expect(initialSnapshot).toMatchInlineSnapshot(`
    "


     Navigation Example ─────────────────────────────────────────────

     Main view
                                                                     ▲
     Items                                                           █
    ›First Item Navigate to first detail                             █
     Second Item Navigate to second detail                           █
     Third Item Navigate to third detail                             █
                                                                     █
                                                                     █
                                                                     █
                                                                     █
                                                                     █
                                                                     █
                                                                     █
                                                                     █
                                                                     █
                                                                     ▼


     ↵ select   ↑↓ navigate   ^k actions"
  `)

  // Navigate to second item
  await session.press('down')

  const afterDownSnapshot = await session.text()
  expect(afterDownSnapshot).toMatchInlineSnapshot(`
    "


     Navigation Example ─────────────────────────────────────────────

     Main view
                                                                     ▲
     Items                                                           █
     First Item Navigate to first detail                             █
    ›Second Item Navigate to second detail                           █
     Third Item Navigate to third detail                             █
                                                                     █
                                                                     █
                                                                     █
                                                                     █
                                                                     █
                                                                     █
                                                                     █
                                                                     █
                                                                     █
                                                                     ▼


     ↵ select   ↑↓ navigate   ^k actions"
  `)

  // Press Enter to open actions panel
  await session.press('enter')

  const actionsOpenSnapshot = await session.text()
  expect(actionsOpenSnapshot).toMatchInlineSnapshot(`
    "


      Navigation Example ─────────────────────────────────────────────

      Main view
                                                                      ▲
    ┃┃Items                                                           █
    ┃                                                                  ┃
    ┃                                                            esc   ┃
    ┃                                                                  ┃
    ┃   Search actions...                                              ┃
    ┃  ›Open Details                                                █  ┃
    ┃   Copy Title                                                  █  ┃
    ┃                                                               █  ┃
    ┃                                                               █  ┃
    ┃                                                               █  ┃
    ┃                                                               █  ┃
    ┃                                                               █  ┃
    ┃                                                               █  ┃
    ┃                                                               █  ┃
    ┃                                                               █  ┃
    ┃                                                                  ┃
    ┃   ↵ select   ↑↓ navigate                                         ┃
    ┃                                                                  ┃
    ┃┃"
  `)

  // Press Enter again to select "Open Details" action
  await session.press('enter')

  const detailViewSnapshot = await session.text({
    waitFor: (text) => {
      // wait for detail view to show up
      return /Detail: Second Item/i.test(text)
    },
  })
  expect(detailViewSnapshot).toMatchInlineSnapshot(`
    "


     Detail: Second Item ────────────────────────────────────────────

     Detail view - Press ESC to go back
                                                                     ▲
     Details                                                         █
    ›his is the detail view for   Press Enter to go back or ESC to   █
    Second Item                  navigate back                       █
                                                                     █
                                                                     █
                                                                     █
                                                                     █
                                                                     █
                                                                     █
                                                                     █
                                                                     █
                                                                     █
                                                                     █
                                                                     ▼


     ↵ select   ↑↓ navigate   ^k actions"
  `)

  // Press ESC to go back to main view
  await session.press('esc')

  const backToMainSnapshot = await session.text({
    waitFor: (text) => {
      // wait for main view to show up again
      return /Navigation Example/i.test(text)
    },
  })
  expect(backToMainSnapshot).toMatchInlineSnapshot(`
    "


     Navigation Example ─────────────────────────────────────────────

     Main view
                                                                     ▲
     Items                                                           █
    ›First Item Navigate to first detail                             █
     Second Item Navigate to second detail                           █
     Third Item Navigate to third detail                             █
                                                                     █
                                                                     █
                                                                     █
                                                                     █
                                                                     █
                                                                     █
                                                                     █
                                                                     █
                                                                     █
                                                                     ▼


     ↵ select   ↑↓ navigate   ^k actions"
  `)

  // Navigate down to third item (we're back at first item after ESC)
  await session.press('down')
  await session.press('down')

  const thirdItemSnapshot = await session.text()
  expect(thirdItemSnapshot).toMatchInlineSnapshot(`
    "


     Navigation Example ─────────────────────────────────────────────

     Main view
                                                                     ▲
     Items                                                           █
     First Item Navigate to first detail                             █
     Second Item Navigate to second detail                           █
    ›Third Item Navigate to third detail                             █
                                                                     █
                                                                     █
                                                                     █
                                                                     █
                                                                     █
                                                                     █
                                                                     █
                                                                     █
                                                                     █
                                                                     ▼


     ↵ select   ↑↓ navigate   ^k actions"
  `)

  // Open action panel for third item
  await session.press('enter')

  const thirdActionsSnapshot = await session.text()
  expect(thirdActionsSnapshot).toMatchInlineSnapshot(`
    "


      Navigation Example ─────────────────────────────────────────────

      Main view
                                                                      ▲
    ┃┃Items                                                           █
    ┃                                                                  ┃
    ┃                                                            esc   ┃
    ┃                                                                  ┃
    ┃   Search actions...                                              ┃
    ┃  ›Open Details                                                █  ┃
    ┃   Copy Title                                                  █  ┃
    ┃                                                               █  ┃
    ┃                                                               █  ┃
    ┃                                                               █  ┃
    ┃                                                               █  ┃
    ┃                                                               █  ┃
    ┃                                                               █  ┃
    ┃                                                               █  ┃
    ┃                                                               █  ┃
    ┃                                                                  ┃
    ┃   ↵ select   ↑↓ navigate                                         ┃
    ┃                                                                  ┃
    ┃┃"
  `)

  // Navigate to detail
  await session.press('enter')

  const thirdDetailSnapshot = await session.text({
    waitFor: (text) => {
      return /Detail: Third Item/i.test(text)
    },
  })
  expect(thirdDetailSnapshot).toMatchInlineSnapshot(`
    "


     Detail: Third Item ─────────────────────────────────────────────

     Detail view - Press ESC to go back
                                                                     ▲
     Details                                                         █
    ›his is the detail view for   Press Enter to go back or ESC to   █
    Third Item                   navigate back                       █
                                                                     █
                                                                     █
                                                                     █
                                                                     █
                                                                     █
                                                                     █
                                                                     █
                                                                     █
                                                                     █
                                                                     █
                                                                     ▼


     ↵ select   ↑↓ navigate   ^k actions"
  `)

  // Use Enter to open actions and go back
  await session.press('enter')

  const thirdDetailActionsSnapshot = await session.text()
  expect(thirdDetailActionsSnapshot).toMatchInlineSnapshot(`
    "


      Detail: Third Item ─────────────────────────────────────────────

      Detail view - Press ESC to go back
                                                                      ▲
    ┃┃Details                                                         █
    ┃                                                                  ┃
    ┃                                                            esc   ┃
    ┃                                                                  ┃
    ┃   Search actions...                                              ┃
    ┃  ›Go Back                                                     █  ┃
    ┃   Copy Title                                                  █  ┃
    ┃                                                               █  ┃
    ┃                                                               █  ┃
    ┃                                                               █  ┃
    ┃                                                               █  ┃
    ┃                                                               █  ┃
    ┃                                                               █  ┃
    ┃                                                               █  ┃
    ┃                                                               █  ┃
    ┃                                                                  ┃
    ┃   ↵ select   ↑↓ navigate                                         ┃
    ┃                                                                  ┃
    ┃┃"
  `)

  // Select "Go Back" action
  await session.press('enter')

  const backFromThirdSnapshot = await session.text({
    waitFor: (text) => {
      return /Navigation Example/i.test(text)
    },
  })
  expect(backFromThirdSnapshot).toMatchInlineSnapshot(`
    "


     Navigation Example ─────────────────────────────────────────────

     Main view
                                                                     ▲
     Items                                                           █
    ›First Item Navigate to first detail                             █
     Second Item Navigate to second detail                           █
     Third Item Navigate to third detail                             █
                                                                     █
                                                                     █
                                                                     █
                                                                     █
                                                                     █
                                                                     █
                                                                     █
                                                                     █
                                                                     █
                                                                     ▼


     ↵ select   ↑↓ navigate   ^k actions"
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
                                                                      ▲
    ┃┃Items                                                           █
    ┃                                                                  ┃
    ┃                                                            esc   ┃
    ┃                                                                  ┃
    ┃   Search actions...                                              ┃
    ┃  ›Open Details                                                █  ┃
    ┃   Copy Title                                                  █  ┃
    ┃                                                               █  ┃
    ┃                                                               █  ┃
    ┃                                                               █  ┃
    ┃                                                               █  ┃
    ┃                                                               █  ┃
    ┃                                                               █  ┃
    ┃                                                               █  ┃
    ┃                                                               █  ┃
    ┃                                                                  ┃
    ┃   ↵ select   ↑↓ navigate                                         ┃
    ┃                                                                  ┃
    ┃┃"
  `)

  // Navigate down in actions panel
  await session.press('down')

  const secondActionSnapshot = await session.text()
  expect(secondActionSnapshot).toMatchInlineSnapshot(`
    "


      Navigation Example ─────────────────────────────────────────────

      Main view
                                                                      ▲
    ┃┃Items                                                           █
    ┃                                                                  ┃
    ┃                                                            esc   ┃
    ┃                                                                  ┃
    ┃   Search actions...                                              ┃
    ┃   Open Details                                                █  ┃
    ┃  ›Copy Title                                                  █  ┃
    ┃                                                               █  ┃
    ┃                                                               █  ┃
    ┃                                                               █  ┃
    ┃                                                               █  ┃
    ┃                                                               █  ┃
    ┃                                                               █  ┃
    ┃                                                               █  ┃
    ┃                                                               █  ┃
    ┃                                                                  ┃
    ┃   ↵ select   ↑↓ navigate                                         ┃
    ┃                                                                  ┃
    ┃┃"
  `)

  // Select the Copy Title action
  await session.press('enter')

  const afterCopySnapshot = await session.text()
  expect(afterCopySnapshot).toMatchInlineSnapshot(`
    "


     Navigation Example ─────────────────────────────────────────────

     Main view
                                                                     ▲
     Items                                                           █
    ›First Item Navigate to first detail                             █
     Second Item Navigate to second detail                           █
     Third Item Navigate to third detail                             █
                                                                     █
                                                                     █
                                                                     █
                                                                     █
                                                                     █
                                                                     █
                                                                     █
                                                                     █
                                                                     ▼


     ┌─✓─Copied─to─Clipboard─-─First─Item─┐
     └────────────────────────────────────┘"
  `)

  // Navigate to second item and open its detail
  await session.press('down')
  await session.press('enter')
  await session.press('enter')

  const secondDetailSnapshot = await session.text({
    waitFor: (text) => {
      return /Detail: Second Item/i.test(text)
    },
  })
  expect(secondDetailSnapshot).toMatchInlineSnapshot(`
    "


     Detail: Second Item ────────────────────────────────────────────

     Detail view - Press ESC to go back
                                                                     ▲
     Details                                                         █
    ›his is the detail view for   Press Enter to go back or ESC to   █
    Second Item                  navigate back                       █
                                                                     █
                                                                     █
                                                                     █
                                                                     █
                                                                     █
                                                                     █
                                                                     █
                                                                     █
                                                                     █
                                                                     ▼


     ┌─✓─Copied─to─Clipboard─-─First─Item───────────────────────────┐
     └──────────────────────────────────────────────────────────────┘"
  `)

  // Open actions panel in detail view
  await session.press(['ctrl', 'k'])

  const detailActionsSnapshot = await session.text()
  expect(detailActionsSnapshot).toMatchInlineSnapshot(`
    "


      Detail: Second Item ────────────────────────────────────────────

      Detail view - Press ESC to go back
                                                                      ▲
    ┃┃Details                                                         █
    ┃                                                                  ┃
    ┃                                                            esc   ┃
    ┃                                                                  ┃
    ┃   Search actions...                                              ┃
    ┃  ›Go Back                                                     █  ┃
    ┃   Copy Title                                                  █  ┃
    ┃                                                               █  ┃
    ┃                                                               █  ┃
    ┃                                                               █  ┃
    ┃                                                               █  ┃
    ┃                                                               █  ┃
    ┃                                                               █  ┃
    ┃                                                               █  ┃
    ┃                                                               █  ┃
    ┃                                                                  ┃
    ┃   ↵ select   ↑↓ navigate                                         ┃
    ┃                                                                  ┃
    ┃┃"
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
                                                                     ▲
     Items                                                           █
    ›First Item Navigate to first detail                             █
     Second Item Navigate to second detail                           █
     Third Item Navigate to third detail                             █
                                                                     █
                                                                     █
                                                                     █
                                                                     █
                                                                     █
                                                                     █
                                                                     █
                                                                     █
                                                                     ▼


     ┌─✓─Copied─to─Clipboard─-─First─Item───────────────────────────┐
     └──────────────────────────────────────────────────────────────┘"
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
    Second Item Navigate to second detail                           ▲
                                                                    █
                                                                    █
                                                                    █
                                                                    █
                                                                    █
                                                                    █
                                                                    █
                                                                    █
                                                                    █
                                                                    █
                                                                    █
                                                                    █
                                                                    █
                                                                    ▼


    ↵ select   ↑↓ navigate   ^k actions"
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
                                                                     ▲
     Items                                                           █
    ›First Item Navigate to first detail                             █
     Second Item Navigate to second detail                           █
     Third Item Navigate to third detail                             █
                                                                     █
                                                                     █
                                                                     █
                                                                     █
                                                                     █
                                                                     █
                                                                     █
                                                                     █
                                                                     █
                                                                     ▼


     ↵ select   ↑↓ navigate   ^k actions"
  `)

  // Open actions for first item
  await session.press('enter')

  // Navigate to first item detail
  await session.press('enter')

  const firstDetailSnapshot = await session.text({
    waitFor: (text) => {
      return /Detail: First Item/i.test(text)
    },
  })
  expect(firstDetailSnapshot).toMatchInlineSnapshot(`
    "


     Detail: First Item ─────────────────────────────────────────────

     Detail view - Press ESC to go back
                                                                     ▲
     Details                                                         █
    ›his is the detail view for   Press Enter to go back or ESC to   █
    First Item                   navigate back                       █
                                                                     █
                                                                     █
                                                                     █
                                                                     █
                                                                     █
                                                                     █
                                                                     █
                                                                     █
                                                                     █
                                                                     █
                                                                     ▼


     ↵ select   ↑↓ navigate   ^k actions"
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
                                                                    ▲
                                                                    █
                                                                    █
                                                                    █
                                                                    █
                                                                    █
                                                                    █
                                                                    █
                                                                    █
                                                                    █
                                                                    █
                                                                    █
                                                                    █
                                                                    █
                                                                    ▼


    ↵ select   ↑↓ navigate   ^k actions"
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
                                                                     ▲
     Items                                                           █
    ›First Item Navigate to first detail                             █
     Second Item Navigate to second detail                           █
     Third Item Navigate to third detail                             █
                                                                     █
                                                                     █
                                                                     █
                                                                     █
                                                                     █
                                                                     █
                                                                     █
                                                                     █
                                                                     █
                                                                     ▼


     ↵ select   ↑↓ navigate   ^k actions"
  `)
}, 10000)
