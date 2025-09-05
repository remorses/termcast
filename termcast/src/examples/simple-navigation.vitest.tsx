// node-pty does not work in bun, so we use vitest to run this test
import { test, expect, afterEach, beforeEach } from 'vitest'
import { NodeTuiDriver } from '@termcast/cli/src/e2e-node'

let driver: NodeTuiDriver

beforeEach(() => {
    driver = new NodeTuiDriver('bun', ['src/examples/simple-navigation.tsx'], {
        cols: 70,
        rows: 50,
    })
})

afterEach(() => {
    driver?.dispose()
})

test('navigation between main and detail views', async () => {
    await driver.text({
        waitFor: (text) => {
            // wait for main view to show up
            return /Navigation Example/i.test(text)
        },
    })

    const initialSnapshot = await driver.text()
    expect(initialSnapshot).toMatchInlineSnapshot(`
      "

       Navigation Example ─────────────────────────────────────────────
       Main view

       Items
      ›First Item Navigate to first detail
       Second Item Navigate to second detail
       Third Item Navigate to third detail


       ↵ select   ↑↓ navigate   ^k actions"
    `)

    // Navigate to second item
    await driver.keys.down()

    const afterDownSnapshot = await driver.text()
    expect(afterDownSnapshot).toMatchInlineSnapshot(`
      "

       Navigation Example ─────────────────────────────────────────────
       Main view

       Items
       First Item Navigate to first detail
      ›Second Item Navigate to second detail
       Third Item Navigate to third detail


       ↵ select   ↑↓ navigate   ^k actions"
    `)

    // Press Enter to open actions panel
    await driver.keys.enter()

    const actionsOpenSnapshot = await driver.text()
    expect(actionsOpenSnapshot).toMatchInlineSnapshot(`
      "

       Navigation Example ─────────────────────────────────────────────
       Main view

       Items
       First Item Navigate to first detail
      ›Second Item Navigate to second detail
       Third Item Navigate to third detail


       ↵ select   ↑↓ navigate   ^k actions



























                                                                  esc

       Search actions...
       Open Details
       Copy Title


       ↵ select   ↑↓ navigate"
    `)

    // Press Enter again to select "Open Details" action
    await driver.keys.enter()

    const detailViewSnapshot = await driver.text({
        waitFor: (text) => {
            // wait for detail view to show up
            return /Detail: Second Item/i.test(text)
        },
    })
    expect(detailViewSnapshot).toMatchInlineSnapshot(`
      "

       Detail: Second Item ────────────────────────────────────────────
       Detail view - Press ESC to go back

       Details
      ›This is the detail view for Second Item Press Enter to go back or E


       ↵ select   ↑↓ navigate   ^k actions"
    `)

    // Press ESC to go back to main view
    await driver.keys.escape()

    const backToMainSnapshot = await driver.text({
        waitFor: (text) => {
            // wait for main view to show up again
            return /Navigation Example/i.test(text)
        },
    })
    expect(backToMainSnapshot).toMatchInlineSnapshot(`
      "

       Navigation Example ─────────────────────────────────────────────
       Main view

       Items
      ›First Item Navigate to first detail
       Second Item Navigate to second detail
       Third Item Navigate to third detail


       ↵ select   ↑↓ navigate   ^k actions"
    `)

    // Navigate down to third item (we're back at first item after ESC)
    await driver.keys.down()
    await driver.keys.down()

    const thirdItemSnapshot = await driver.text()
    expect(thirdItemSnapshot).toMatchInlineSnapshot(`
      "

       Navigation Example ─────────────────────────────────────────────
       Main view

       Items
       First Item Navigate to first detail
       Second Item Navigate to second detail
      ›Third Item Navigate to third detail


       ↵ select   ↑↓ navigate   ^k actions"
    `)

    // Open action panel for third item
    await driver.keys.enter()

    const thirdActionsSnapshot = await driver.text()
    expect(thirdActionsSnapshot).toMatchInlineSnapshot(`
      "

       Navigation Example ─────────────────────────────────────────────
       Main view

       Items
       First Item Navigate to first detail
       Second Item Navigate to second detail
      ›Third Item Navigate to third detail


       ↵ select   ↑↓ navigate   ^k actions



























                                                                  esc

       Search actions...
       Open Details
       Copy Title


       ↵ select   ↑↓ navigate"
    `)

    // Navigate to detail
    await driver.keys.enter()

    const thirdDetailSnapshot = await driver.text({
        waitFor: (text) => {
            return /Detail: Third Item/i.test(text)
        },
    })
    expect(thirdDetailSnapshot).toMatchInlineSnapshot(`
      "

       Detail: Third Item ─────────────────────────────────────────────
       Detail view - Press ESC to go back

       Details
      ›This is the detail view for Third Item Press Enter to go back or ES


       ↵ select   ↑↓ navigate   ^k actions"
    `)

    // Use Enter to open actions and go back
    await driver.keys.enter()

    const thirdDetailActionsSnapshot = await driver.text()
    expect(thirdDetailActionsSnapshot).toMatchInlineSnapshot(`
      "

       Detail: Third Item ─────────────────────────────────────────────
       Detail view - Press ESC to go back

       Details
      ›This is the detail view for Third Item Press Enter to go back or ES


       ↵ select   ↑↓ navigate   ^k actions





























                                                                  esc

       Search actions...
       Go Back
       Copy Title


       ↵ select   ↑↓ navigate"
    `)

    // Select "Go Back" action
    await driver.keys.enter()

    const backFromThirdSnapshot = await driver.text({
        waitFor: (text) => {
            return /Navigation Example/i.test(text)
        },
    })
    expect(backFromThirdSnapshot).toMatchInlineSnapshot(`
      "

       Navigation Example ─────────────────────────────────────────────
       Main view

       Items
      ›First Item Navigate to first detail
       Second Item Navigate to second detail
       Third Item Navigate to third detail


       ↵ select   ↑↓ navigate   ^k actions"
    `)
}, 15000)

test('navigation with actions panel', async () => {
    await driver.text({
        waitFor: (text) => {
            // wait for main view to show up
            return /Navigation Example/i.test(text)
        },
    })

    // Open actions panel with ctrl+k
    await driver.keys.ctrlK()

    const actionsOpenSnapshot = await driver.text()
    expect(actionsOpenSnapshot).toMatchInlineSnapshot(`
      "

       Navigation Example ─────────────────────────────────────────────
       Main view

       Items
      ›First Item Navigate to first detail
       Second Item Navigate to second detail
       Third Item Navigate to third detail


       ↵ select   ↑↓ navigate   ^k actions



























                                                                  esc

       Search actions...
       Open Details
       Copy Title


       ↵ select   ↑↓ navigate"
    `)

    // Navigate down in actions panel
    await driver.keys.down()

    const secondActionSnapshot = await driver.text()
    expect(secondActionSnapshot).toMatchInlineSnapshot(`
      "

       Navigation Example ─────────────────────────────────────────────
       Main view

       Items
      ›First Item Navigate to first detail
       Second Item Navigate to second detail
       Third Item Navigate to third detail


       ↵ select   ↑↓ navigate   ^k actions



























                                                                  esc

       Search actions...
       Open Details
       Copy Title


       ↵ select   ↑↓ navigate"
    `)

    // Select the Copy Title action
    await driver.keys.enter()

    const afterCopySnapshot = await driver.text()
    expect(afterCopySnapshot).toMatchInlineSnapshot(`
      "

       Navigation Example ─────────────────────────────────────────────
       Main view

       Items
      ›First Item Navigate to first detail
       Second Item Navigate to second detail
       Third Item Navigate to third detail


        ✓ Copied to Clipboard - First Item"
    `)

    // Navigate to second item and open its detail
    await driver.keys.down()
    await driver.keys.enter()

    const secondDetailSnapshot = await driver.text({
        waitFor: (text) => {
            return /Detail: Second Item/i.test(text)
        },
    })
    expect(secondDetailSnapshot).toMatchInlineSnapshot(`
      "

       Navigation Example ─────────────────────────────────────────────
       Main view

       Items
       First Item Navigate to first detail
      ›Second Item Navigate to second detail
       Third Item Navigate to third detail


       ↵ select   ↑↓ navigate   ^k actions



























                                                                  esc

       Search actions...
       Open Details
       Copy Title


       ↵ select   ↑↓ navigate"
    `)

    // Open actions panel in detail view
    await driver.keys.ctrlK()

    const detailActionsSnapshot = await driver.text()
    expect(detailActionsSnapshot).toMatchInlineSnapshot(`
      "

       Navigation Example ─────────────────────────────────────────────
       Main view

       Items
       First Item Navigate to first detail
      ›Second Item Navigate to second detail
       Third Item Navigate to third detail


       ↵ select   ↑↓ navigate   ^k actions



























                                                                  esc

       Search actions...
       Open Details
       Copy Title


       ↵ select   ↑↓ navigate"
    `)

    // Select Go Back action
    await driver.keys.enter()

    const backViaActionSnapshot = await driver.text({
        waitFor: (text) => {
            return /Navigation Example/i.test(text)
        },
    })
    expect(backViaActionSnapshot).toMatchInlineSnapshot(`
      "

       Detail: Second Item ────────────────────────────────────────────
       Detail view - Press ESC to go back

       Details
      ›This is the detail view for Second Item Press Enter to go back or E


       ↵ select   ↑↓ navigate   ^k actions"
    `)
}, 15000)

test('search functionality in main and detail views', async () => {
    await driver.text({
        waitFor: (text) => {
            // wait for main view to show up
            return /Main view/i.test(text)
        },
    })

    // Type in search bar
    await driver.keys.type('second')

    const searchMainSnapshot = await driver.text({
        waitFor: (text) => {
            return /second/i.test(text)
        },
    })
    expect(searchMainSnapshot).toMatchInlineSnapshot(`
      "

       Navigation Example ─────────────────────────────────────────────
       second
      ›Second Item Navigate to second detail


       ↵ select   ↑↓ navigate   ^k actions"
    `)

    // Clear search
    await driver.keys.backspace()
    await driver.keys.backspace()
    await driver.keys.backspace()
    await driver.keys.backspace()
    await driver.keys.backspace()
    await driver.keys.backspace()

    const clearedSearchSnapshot = await driver.text()
    expect(clearedSearchSnapshot).toMatchInlineSnapshot(`
      "

       Navigation Example ─────────────────────────────────────────────
       Main view

       Items
      ›First Item Navigate to first detail
       Second Item Navigate to second detail
       Third Item Navigate to third detail


       ↵ select   ↑↓ navigate   ^k actions"
    `)

    // Open actions for first item
    await driver.keys.enter()

    // Navigate to first item detail
    await driver.keys.enter()

    const firstDetailSnapshot = await driver.text({
        waitFor: (text) => {
            return /Detail: First Item/i.test(text)
        },
    })
    expect(firstDetailSnapshot).toMatchInlineSnapshot(`
      "

       Detail: First Item ─────────────────────────────────────────────
       Detail view - Press ESC to go back

       Details
      ›This is the detail view for First Item Press Enter to go back or ES


       ↵ select   ↑↓ navigate   ^k actions"
    `)

    // Type in detail view search bar
    await driver.keys.type('test')

    const searchDetailSnapshot = await driver.text({
        waitFor: (text) => {
            return /test/i.test(text)
        },
    })
    expect(searchDetailSnapshot).toMatchInlineSnapshot(`
      "

      Detail: First Item ─────────────────────────────────────────────
      test


      ↵ select   ↑↓ navigate   ^k actions"
    `)

    // Press ESC to go back
    await driver.keys.escape()

    const finalMainSnapshot = await driver.text({
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


       ↵ select   ↑↓ navigate   ^k actions"
    `)
}, 10000)
