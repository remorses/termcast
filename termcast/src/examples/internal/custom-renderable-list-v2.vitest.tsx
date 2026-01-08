import { expect, test } from 'vitest'
import { launchTerminal } from 'tuistory/src'

test('initial render with sections', async () => {
  const session = await launchTerminal({
    command: 'bun',
    args: ['src/examples/internal/custom-renderable-list-v2.tsx'],
    cols: 100,
    rows: 20,
  })

  const initial = await session.text({
    waitFor: (text) => text.includes('Details for Apple') && text.includes('10 of 10'),
  })

  expect(initial).toMatchInlineSnapshot(`
    "



       Custom Renderable List V2 - Detail Panel
       Presst^1=apple,)^2=banana, ^3=carrot, ^4=kale to jump

       Search items...                               │
       ── Fruits ──                                      Details for Apple

       › Apple A red fruit                               A red fruit
         Banana A yellow fruit
         Date A sweet fruit                              Keywords: red
         Fig A small fruit
                                                     ▀   ID: apple


       10 of 10 items


    "
  `)
  expect(initial).toContain('Fruits')
  expect(initial).toContain('Apple')

  session.close()
}, 30000)

test('sections render with headers', async () => {
  const session = await launchTerminal({
    command: 'bun',
    args: ['src/examples/internal/custom-renderable-list-v2.tsx'],
    cols: 100,
    rows: 30,  // Large enough to see both sections
  })

  const withBothSections = await session.text({
    waitFor: (text) => text.includes('Fruits') && text.includes('Vegetables') && text.includes('10 of 10'),
  })

  expect(withBothSections).toMatchInlineSnapshot(`
    "



       Custom Renderable List V2 - Detail Panel
       Presst^1=apple,)^2=banana, ^3=carrot, ^4=kale to jump

       Search items...                               │
       ── Fruits ──                                      Details for Apple

       › Apple A red fruit                               A red fruit
         Banana A yellow fruit
         Date A sweet fruit                              Keywords: red
         Fig A small fruit
         Grape A vine fruit                              ID: apple
         Lemon A citrus fruit
       ── Vegetables ──

                                                     █
                                                     █
                                                     █
                                                     █
                                                     █
                                                     ▀



       10 of 10 items


    "
  `)
  expect(withBothSections).toContain('Fruits')
  expect(withBothSections).toContain('Vegetables')

  session.close()
}, 30000)

test('navigation across sections', async () => {
  const session = await launchTerminal({
    command: 'bun',
    args: ['src/examples/internal/custom-renderable-list-v2.tsx'],
    cols: 100,
    rows: 30,
  })

  await session.text({ waitFor: (text) => text.includes('Details for Apple') && text.includes('10 of 10') })

  // Navigate through fruits
  await session.press('down')
  const atBanana = await session.text({ waitFor: (text) => text.includes('Details for Banana') })
  expect(atBanana).toMatchInlineSnapshot(`
    "



       Custom Renderable List V2 - Detail Panel
       Presst^1=apple,a^2=banana, ^3=carrot, ^4=kale to jump

       Search items...                               │
       ── Fruits ──                                      Details for Banana

         Apple A red fruit                               A yellow fruit
       › Banana A yellow fruit
         Date A sweet fruit                              Keywords: yellow
         Fig A small fruit
         Grape A vine fruit                              ID: banana
         Lemon A citrus fruit
       ── Vegetables ──

                                                     █
                                                     █
                                                     █
                                                     █
                                                     █
                                                     ▀



       10 of 10 items


    "
  `)

  // Skip to last fruit (Lemon at index 5)
  for (let i = 0; i < 4; i++) {
    await session.press('down')
  }
  
  const atLemon = await session.text({ waitFor: (text) => text.includes('Details for Lemon') })
  expect(atLemon).toMatchInlineSnapshot(`
    "



       Custom Renderable List V2 - Detail Panel
       Presst^1=apple, ^2=banana, ^3=carrot, ^4=kale to jump

       Search items...                               │
         Apple A red fruit                               Details for Lemon
         Banana A yellow fruit
         Date A sweet fruit                              A citrus fruit
         Fig A small fruit
         Grape A vine fruit                              Keywords: citrus
       › Lemon A citrus fruit
       ── Vegetables ──                                  ID: lemon

         Carrot An orange vegetable
         Eggplant A purple vegetable


                                                     ▄
                                                     █
                                                     █
                                                     █
                                                     █
                                                     █

       10 of 10 items


    "
  `)
  expect(atLemon).toContain('Lemon')

  session.close()
}, 30000)

test('filtering works with sections', async () => {
  const session = await launchTerminal({
    command: 'bun',
    args: ['src/examples/internal/custom-renderable-list-v2.tsx'],
    cols: 100,
    rows: 20,
  })

  await session.text({ waitFor: (text) => text.includes('Details for Apple') && text.includes('10 of 10') })

  // Filter to show only items with "yellow" keyword
  await session.type('yellow')
  const afterFilter = await session.text({
    waitFor: (text) => text.includes('Searching:'),
  })

  expect(afterFilter).toMatchInlineSnapshot(`
    "



       Custom Renderable List V2 - Detail Panel
       Selected: (none)
       Press ^1=apple, ^2=banana, ^3=carrot, ^4=kale to jump

       yellow                                        │
       ── Fruits ──                                      Details for Banana

       › Banana A yellow fruit                           A yellow fruit

                                                         Keywords: yellow

                                                         ID: banana

       1 of 10 items • Searching: "yellow"


    "
  `)
  expect(afterFilter).toContain('› Banana')

  session.close()
}, 30000)

test('custom EmptyView shown when no results', async () => {
  const session = await launchTerminal({
    command: 'bun',
    args: ['src/examples/internal/custom-renderable-list-v2.tsx'],
    cols: 100,
    rows: 20,
  })

  await session.text({ waitFor: (text) => text.includes('Details for Apple') && text.includes('10 of 10') })

  await session.type('xyz123')
  const emptyState = await session.text({
    waitFor: (text) => text.includes('Nothing found'),
  })

  expect(emptyState).toMatchInlineSnapshot(`
    "



       Custom Renderable List V2 - Detail Panel
       Selected: (none)
       Press ^1=apple, ^2=banana, ^3=carrot, ^4=kale to jump

       xyz123                                        │  No detail available

        Nothing found
        Try a different search term





       0 of 10 items • Searching: "xyz123"


    "
  `)
  expect(emptyState).toContain('Nothing found')
  expect(emptyState).toContain('different search')
  expect(emptyState).toContain('0 of 10')

  session.close()
}, 30000)

test('wrapper components work (tree traversal)', async () => {
  const session = await launchTerminal({
    command: 'bun',
    args: ['src/examples/internal/custom-renderable-list-v2.tsx'],
    cols: 100,
    rows: 20,
  })

  // Fruits are wrapped in ItemWrapper but should still appear
  const initial = await session.text({
    waitFor: (text) => text.includes('Apple') && text.includes('Banana') && text.includes('Details for Apple'),
  })

  expect(initial).toMatchInlineSnapshot(`
    "



       Custom Renderable List V2 - Detail Panel
       Presst^1=apple,)^2=banana, ^3=carrot, ^4=kale to jump

       Search items...                               │
       ── Fruits ──                                      Details for Apple

       › Apple A red fruit                               A red fruit
         Banana A yellow fruit
         Date A sweet fruit                              Keywords: red
         Fig A small fruit
                                                     ▀   ID: apple


       10 of 10 items


    "
  `)
  expect(initial).toContain('Apple')
  expect(initial).toContain('Banana')

  session.close()
}, 30000)

test('scrolling keeps selected item in view', async () => {
  const session = await launchTerminal({
    command: 'bun',
    args: ['src/examples/internal/custom-renderable-list-v2.tsx'],
    cols: 100,
    rows: 20,
  })

  await session.text({ waitFor: (text) => text.includes('Details for Apple') && text.includes('10 of 10') })

  // Navigate down 9 times - should scroll to show Kale
  for (let i = 0; i < 9; i++) {
    await session.press('down')
  }

  const afterScroll = await session.text({
    waitFor: (text) => text.includes('Details for Kale'),
  })

  // Verify selection updated and Kale should be visible after scrolling
  expect(afterScroll).toContain('Details for Kale')
  expect(afterScroll).toMatchInlineSnapshot(`
    "



       Custom Renderable List V2 - Detail Panel
       Presst^1=apple, ^2=banana, ^3=carrot, ^4=kale to jump

       Search items...                               │
       ── Vegetables ──                                  Details for Kale

         Carrot An orange vegetable                      A superfood
         Eggplant A purple vegetable
         Jalapeno A spicy pepper                         Keywords: healthy
       › Kale A superfood
                                                         ID: kale


       10 of 10 items                                ▄


    "
  `)

  session.close()
}, 30000)

test('wrap around navigation', async () => {
  const session = await launchTerminal({
    command: 'bun',
    args: ['src/examples/internal/custom-renderable-list-v2.tsx'],
    cols: 100,
    rows: 20,
  })

  await session.text({ waitFor: (text) => text.includes('› Apple') && text.includes('Details for Apple') })

  // Filter to single item
  await session.type('kale')
  const filtered = await session.text({ waitFor: (text) => text.includes('1 of 10') })
  expect(filtered).toMatchInlineSnapshot(`
    "



       Custom Renderable List V2 - Detail Panel
       Selected: (none)
       Press ^1=apple, ^2=banana, ^3=carrot, ^4=kale to jump

       kale                                          │
       ── Vegetables ──                                  Details for Kale

       › Kale A superfood                                A superfood

                                                         Keywords: healthy

                                                         ID: kale

       1 of 10 items • Searching: "kale"


    "
  `)
  expect(filtered).toContain('› Kale')

  // Down should stay on Kale (wrap)
  await session.press('down')
  const afterDown = await session.text({ waitFor: (text) => text.includes('› Kale') })
  expect(afterDown).toMatchInlineSnapshot(`
    "



       Custom Renderable List V2 - Detail Panel
       Selected: kale
       Press ^1=apple, ^2=banana, ^3=carrot, ^4=kale to jump

       kale                                          │
       ── Vegetables ──                                  Details for Kale

       › Kale A superfood                                A superfood

                                                         Keywords: healthy

                                                         ID: kale

       1 of 10 items • Searching: "kale"


    "
  `)

  session.close()
}, 30000)

test('ctrl+k opens action dialog', async () => {
  const session = await launchTerminal({
    command: 'bun',
    args: ['src/examples/internal/custom-renderable-list-v2.tsx'],
    cols: 100,
    rows: 20,
  })

  await session.text({ waitFor: (text) => text.includes('› Apple') && text.includes('Details for Apple') })

  // Open dialog with ctrl+k
  await session.press(['ctrl', 'k'])
  const withDialog = await session.text({
    waitFor: (text) => text.includes('Actions for:'),
  })

  expect(withDialog).toMatchInlineSnapshot(`
    "



       Custom Renderable List V2 - Detail Panel
       Presst^╭──────────────────────────────────────────────────────────────────────────╮
              │                                                                          │
       Search │                                                                          │
       ── Frui│ Actions for: Apple                                                       │
              │                                                                          │
       › Apple│ Press ESC to close                                                       │
         Banan│                                                                          │
         Date ╰──────────────────────────────────────────────────────────────────────────╯
         Fig A small fruit
                                                     ▀   ID: apple


       10 of 10 items


    "
  `)
  expect(withDialog).toContain('Actions for: Apple')
  expect(withDialog).toContain('Press ESC to close')

  session.close()
}, 30000)

test('ctrl+k dialog closes with escape', async () => {
  const session = await launchTerminal({
    command: 'bun',
    args: ['src/examples/internal/custom-renderable-list-v2.tsx'],
    cols: 100,
    rows: 20,
  })

  await session.text({ waitFor: (text) => text.includes('› Apple') && text.includes('Details for Apple') })

  // Open dialog
  await session.press(['ctrl', 'k'])
  await session.text({ waitFor: (text) => text.includes('Actions for:') })

  // Close with escape
  await session.press(['escape'])
  const afterClose = await session.text({
    waitFor: (text) => !text.includes('Actions for:') && text.includes('› Apple'),
  })

  expect(afterClose).toMatchInlineSnapshot(`
    "



       Custom Renderable List V2 - Detail Panel
       Presst^1=apple,)^2=banana, ^3=carrot, ^4=kale to jump

       Search items...                               │
       ── Fruits ──                                      Details for Apple

       › Apple A red fruit                               A red fruit
         Banana A yellow fruit
         Date A sweet fruit                              Keywords: red
         Fig A small fruit
                                                     ▀   ID: apple


       10 of 10 items


    "
  `)
  expect(afterClose).not.toContain('Actions for:')
  expect(afterClose).toContain('› Apple')

  session.close()
}, 30000)

test('ctrl+k shows selected item in dialog', async () => {
  const session = await launchTerminal({
    command: 'bun',
    args: ['src/examples/internal/custom-renderable-list-v2.tsx'],
    cols: 100,
    rows: 20,
  })

  await session.text({ waitFor: (text) => text.includes('› Apple') && text.includes('Details for Apple') })

  // Navigate to Banana
  await session.press('down')
  await session.text({ waitFor: (text) => text.includes('› Banana') && text.includes('Details for Banana') })

  // Open dialog - should show Banana
  await session.press(['ctrl', 'k'])
  const withDialog = await session.text({
    waitFor: (text) => text.includes('Actions for: Banana'),
  })

  expect(withDialog).toMatchInlineSnapshot(`
    "



       Custom Renderable List V2 - Detail Panel
       Presst^╭──────────────────────────────────────────────────────────────────────────╮
              │                                                                          │
       Search │                                                                          │
       ── Frui│ Actions for: Banana                                                      │
              │                                                                          │
         Apple│ Press ESC to close                                                       │
       › Banan│                                                                          │
         Date ╰──────────────────────────────────────────────────────────────────────────╯
         Fig A small fruit
                                                     ▀   ID: banana


       10 of 10 items


    "
  `)
  expect(withDialog).toContain('Actions for: Banana')

  session.close()
}, 30000)

test('defaultSearchQuery filters on initial render', async () => {
  const session = await launchTerminal({
    command: 'bun',
    args: ['src/examples/internal/custom-renderable-list-v2-default-search.tsx'],
    cols: 60,
    rows: 15,
  })

  const initial = await session.text({
    waitFor: (text) => text.includes('Banana') && text.includes('1 of 3'),
  })

  expect(initial).toMatchInlineSnapshot(`
    "



       Default Search Test

       banana
         Banana Yellow fruit




       1 of 3 items • Searching: "banana"


    "
  `)
  expect(initial).toContain('Banana')
  expect(initial).toContain('banana') // search query visible
  expect(initial).not.toContain('Apple') // filtered out

  session.close()
}, 30000)

// ─────────────────────────────────────────────────────────────────────────────
// Phase 1: Bidirectional Selection Tests
// ─────────────────────────────────────────────────────────────────────────────

test('phase 1: selection id updates on navigation', async () => {
  const session = await launchTerminal({
    command: 'bun',
    args: ['src/examples/internal/custom-renderable-list-v2.tsx'],
    cols: 100,
    rows: 22,
  })

  // Initial state should show (none) - first item is selected but callback not yet fired
  const initial = await session.text({
    waitFor: (text) => text.includes('Selected:') && text.includes('Details for Apple'),
  })
  expect(initial).toContain('Selected:')

  // Navigate down to banana - this should update the selectedItemId
  await session.press('down')
  const afterDown = await session.text({
    waitFor: (text) => text.includes('Selected: banana') && text.includes('Details for Banana'),
  })
  expect(afterDown).toContain('Selected: banana')

  // Navigate down to date
  await session.press('down')
  const afterSecondDown = await session.text({
    waitFor: (text) => text.includes('Selected: date') && text.includes('Details for Date'),
  })
  expect(afterSecondDown).toContain('Selected: date')

  session.close()
}, 30000)

test('phase 1: selection id shown in header reflects current item', async () => {
  const session = await launchTerminal({
    command: 'bun',
    args: ['src/examples/internal/custom-renderable-list-v2.tsx'],
    cols: 100,
    rows: 24,
  })

  await session.text({ waitFor: (text) => text.includes('Details for Apple') && text.includes('10 of 10') })

  // Navigate to carrot (6 items down: banana, date, fig, grape, lemon, carrot)
  for (let i = 0; i < 6; i++) {
    await session.press('down')
  }

  const atCarrot = await session.text({
    waitFor: (text) => text.includes('Details for Carrot') && text.includes('› Carrot'),
  })
  
  expect(atCarrot).toMatchInlineSnapshot(`
    "



       Custom Renderable List V2 - Detail Panel
       Presst^1=apple,t^2=banana, ^3=carrot, ^4=kale to jump

       Search items...                               │
         Lemon A citrus fruit                            Details for Carrot
       ── Vegetables ──
                                                         An orange vegetable
       › Carrot An orange vegetable
         Eggplant A purple vegetable                     Keywords: orange
         Jalapeno A spicy pepper
         Kale A superfood                                ID: carrot






       10 of 10 items                                ▄


    "
  `)
  expect(atCarrot).toContain('Details for Carrot')
  expect(atCarrot).toContain('› Carrot')

  session.close()
}, 30000)

test('phase 1: navigate to last item shows correct selection', async () => {
  const session = await launchTerminal({
    command: 'bun',
    args: ['src/examples/internal/custom-renderable-list-v2.tsx'],
    cols: 100,
    rows: 24,
  })

  await session.text({ waitFor: (text) => text.includes('Details for Apple') && text.includes('10 of 10') })

  // Navigate to kale (9 items down: banana, date, fig, grape, lemon, carrot, eggplant, jalapeno, kale)
  for (let i = 0; i < 9; i++) {
    await session.press('down')
  }

  const atKale = await session.text({
    waitFor: (text) => text.includes('Details for Kale') && text.includes('› Kale'),
  })
  
  // The detail panel should show the selected item - this verifies selection and detail sync
  expect(atKale).toContain('Details for Kale')
  expect(atKale).toContain('› Kale')

  session.close()
}, 30000)

// ─────────────────────────────────────────────────────────────────────────────
// Phase 2: Detail Panel Tests
// ─────────────────────────────────────────────────────────────────────────────

test('phase 2: detail panel shows when isShowingDetail is true', async () => {
  const session = await launchTerminal({
    command: 'bun',
    args: ['src/examples/internal/custom-renderable-list-v2.tsx'],
    cols: 100,
    rows: 20,
  })

  const initial = await session.text({
    waitFor: (text) => text.includes('Details for') && text.includes('10 of 10'),
  })

  // Should show detail panel for first item (Apple)
  expect(initial).toMatchInlineSnapshot(`
    "



       Custom Renderable List V2 - Detail Panel
       Presst^1=apple,)^2=banana, ^3=carrot, ^4=kale to jump

       Search items...                               │
       ── Fruits ──                                      Details for Apple

       › Apple A red fruit                               A red fruit
         Banana A yellow fruit
         Date A sweet fruit                              Keywords: red
         Fig A small fruit
                                                     ▀   ID: apple


       10 of 10 items


    "
  `)
  expect(initial).toContain('Details for Apple')
  expect(initial).toContain('A red fruit')

  session.close()
}, 30000)

test('phase 2: detail content changes when navigating', async () => {
  const session = await launchTerminal({
    command: 'bun',
    args: ['src/examples/internal/custom-renderable-list-v2.tsx'],
    cols: 100,
    rows: 20,
  })

  await session.text({
    waitFor: (text) => text.includes('Details for Apple'),
  })

  // Navigate down to Banana
  await session.press('down')
  const atBanana = await session.text({
    waitFor: (text) => text.includes('Details for Banana'),
  })

  expect(atBanana).toMatchInlineSnapshot(`
    "



       Custom Renderable List V2 - Detail Panel
       Presst^1=apple,a^2=banana, ^3=carrot, ^4=kale to jump

       Search items...                               │
       ── Fruits ──                                      Details for Banana

         Apple A red fruit                               A yellow fruit
       › Banana A yellow fruit
         Date A sweet fruit                              Keywords: yellow
         Fig A small fruit
                                                     ▀   ID: banana


       10 of 10 items


    "
  `)
  expect(atBanana).toContain('Details for Banana')
  expect(atBanana).toContain('A yellow fruit')

  session.close()
}, 30000)

test('phase 2: detail shows item keywords and id', async () => {
  const session = await launchTerminal({
    command: 'bun',
    args: ['src/examples/internal/custom-renderable-list-v2.tsx'],
    cols: 100,
    rows: 20,
  })

  const initial = await session.text({
    waitFor: (text) => text.includes('Details for Apple'),
  })

  // Should show keywords and ID in detail panel
  expect(initial).toMatchInlineSnapshot(`
    "



       Custom Renderable List V2 - Detail Panel
       Presst^1=apple,)^2=banana, ^3=carrot, ^4=kale to jump

       Search items...                               │
       ── Fruits ──                                      Details for Apple

       › Apple A red fruit                               A red fruit
         Banana A yellow fruit
         Date A sweet fruit                              Keywords: red
         Fig A small fruit
                                                     ▀   ID: apple


       10 of 10 items


    "
  `)
  expect(initial).toContain('Keywords: red')
  expect(initial).toContain('ID: apple')

  session.close()
}, 30000)

test('phase 2: detail panel layout shows list and detail side by side', async () => {
  const session = await launchTerminal({
    command: 'bun',
    args: ['src/examples/internal/custom-renderable-list-v2.tsx'],
    cols: 100,
    rows: 24,
  })

  const initial = await session.text({
    waitFor: (text) => text.includes('Details for') && text.includes('› Apple'),
  })

  // Should have both list items and detail panel visible
  // The │ separator should be visible between panels
  expect(initial).toMatchInlineSnapshot(`
    "



       Custom Renderable List V2 - Detail Panel
       Presst^1=apple,)^2=banana, ^3=carrot, ^4=kale to jump

       Search items...                               │
       ── Fruits ──                                      Details for Apple

       › Apple A red fruit                               A red fruit
         Banana A yellow fruit
         Date A sweet fruit                              Keywords: red
         Fig A small fruit
         Grape A vine fruit                              ID: apple
                                                     ▀





       10 of 10 items


    "
  `)
  expect(initial).toContain('› Apple')
  expect(initial).toContain('Details for Apple')
  expect(initial).toContain('│')

  session.close()
}, 30000)

test('phase 2: navigating to vegetable shows correct detail', async () => {
  const session = await launchTerminal({
    command: 'bun',
    args: ['src/examples/internal/custom-renderable-list-v2.tsx'],
    cols: 100,
    rows: 24,
  })

  await session.text({ waitFor: (text) => text.includes('Details for Apple') && text.includes('10 of 10') })

  // Navigate to Carrot (6 items down)
  for (let i = 0; i < 6; i++) {
    await session.press('down')
  }

  const atCarrot = await session.text({
    waitFor: (text) => text.includes('Details for Carrot'),
  })

  expect(atCarrot).toMatchInlineSnapshot(`
    "



       Custom Renderable List V2 - Detail Panel
       Presst^1=apple,t^2=banana, ^3=carrot, ^4=kale to jump

       Search items...                               │
         Lemon A citrus fruit                            Details for Carrot
       ── Vegetables ──
                                                         An orange vegetable
       › Carrot An orange vegetable
         Eggplant A purple vegetable                     Keywords: orange
         Jalapeno A spicy pepper
         Kale A superfood                                ID: carrot






       10 of 10 items                                ▄


    "
  `)
  expect(atCarrot).toContain('Details for Carrot')
  expect(atCarrot).toContain('An orange vegetable')
  expect(atCarrot).toContain('Keywords: orange')

  session.close()
}, 30000)
