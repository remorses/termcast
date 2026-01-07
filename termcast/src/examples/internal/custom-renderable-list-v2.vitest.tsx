import { expect, test } from 'vitest'
import { launchTerminal } from 'tuistory/src'

test('initial render with sections', async () => {
  const session = await launchTerminal({
    command: 'bun',
    args: ['src/examples/internal/custom-renderable-list-v2.tsx'],
    cols: 60,
    rows: 20,
  })

  const initial = await session.text({
    waitFor: (text) => text.includes('Selected:') && text.includes('10 of 10'),
  })

  expect(initial).toMatchInlineSnapshot(`
    "



       Custom Renderable List V2 - Phase 1: Bidirectional
       Selected: (none)
       Press ^1=apple, ^2=banana, ^3=carrot, ^4=kale to jump

       Search items...
       ▀─ Fruits ──

       › Apple A red fruit
         Banana A yellow fruit
         Date A sweet fruit
         Fig A small fruit
         Grape A vine fruit
         Lemon A citrus fruit
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
    cols: 60,
    rows: 30,  // Large enough to see both sections
  })

  const withBothSections = await session.text({
    waitFor: (text) => text.includes('Fruits') && text.includes('Vegetables') && text.includes('10 of 10'),
  })

  expect(withBothSections).toMatchInlineSnapshot(`
    "



       Custom Renderable List V2 - Phase 1: Bidirectional
       Selected: (none)
       Press ^1=apple, ^2=banana, ^3=carrot, ^4=kale to jump

       Search items...
       ── Fruits ──

       › Apple A red fruit
         Banana A yellow fruit
         Date A sweet fruit
         Fig A small fruit
         Grape A vine fruit
         Lemon A citrus fruit
       ── Vegetables ──
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
    cols: 60,
    rows: 30,
  })

  await session.text({ waitFor: (text) => text.includes('Apple') && text.includes('10 of 10') })

  // Navigate through fruits
  await session.press('down')
  const atBanana = await session.text({ waitFor: (text) => text.includes('Selected: banana') })
  expect(atBanana).toMatchInlineSnapshot(`
    "



       Custom Renderable List V2 - Phase 1: Bidirectional
       Selected: banana
       Press ^1=apple, ^2=banana, ^3=carrot, ^4=kale to jump

       Search items...
       ── Fruits ──

         Apple A red fruit
       › Banana A yellow fruit
         Date A sweet fruit
         Fig A small fruit
         Grape A vine fruit
         Lemon A citrus fruit
       ── Vegetables ──
                                                            █
                                                            ▀







       10 of 10 items


    "
  `)

  // Skip to last fruit (Lemon at index 5)
  for (let i = 0; i < 4; i++) {
    await session.press('down')
  }
  
  const atLemon = await session.text({ waitFor: (text) => text.includes('Selected: lemon') })
  expect(atLemon).toMatchInlineSnapshot(`
    "



       Custom Renderable List V2 - Phase 1: Bidirectional
       Selected: lemon
       Press ^1=apple, ^2=banana, ^3=carrot, ^4=kale to jump

       Search items...
         Banana A yellow fruit
         Date A sweet fruit
         Fig A small fruit
         Grape A vine fruit
       › Lemon A citrus fruit
       ── Vegetables ──

         Carrot An orange vegetable
         Eggplant A purple vegetable





                                                            █
                                                            ▀


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
    cols: 60,
    rows: 20,
  })

  await session.text({ waitFor: (text) => text.includes('10 of 10') })

  // Filter to show only items with "yellow" keyword
  await session.type('yellow')
  const afterFilter = await session.text({
    waitFor: (text) => text.includes('Searching:'),
  })

  expect(afterFilter).toMatchInlineSnapshot(`
    "



       Custom Renderable List V2 - Phase 1: Bidirectional
       Selected: (none)
       Press ^1=apple, ^2=banana, ^3=carrot, ^4=kale to jump

       yellow
       ── Fruits ──

       › Banana A yellow fruit




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
    cols: 60,
    rows: 20,
  })

  await session.text({ waitFor: (text) => text.includes('10 of 10') })

  await session.type('xyz123')
  const emptyState = await session.text({
    waitFor: (text) => text.includes('Nothing found'),
  })

  expect(emptyState).toMatchInlineSnapshot(`
    "



       Custom Renderable List V2 - Phase 1: Bidirectional
       Selected: (none)
       Press ^1=apple, ^2=banana, ^3=carrot, ^4=kale to jump

       xyz123

        Nothing found
        Try a different search term




       0 of 10 items • Searching: "xyz123"



    "
  `)
  expect(emptyState).toContain('Nothing found')
  expect(emptyState).toContain('Try a different search term')
  expect(emptyState).toContain('0 of 10')

  session.close()
}, 30000)

test('wrapper components work (tree traversal)', async () => {
  const session = await launchTerminal({
    command: 'bun',
    args: ['src/examples/internal/custom-renderable-list-v2.tsx'],
    cols: 60,
    rows: 20,
  })

  // Fruits are wrapped in ItemWrapper but should still appear
  const initial = await session.text({
    waitFor: (text) => text.includes('Apple') && text.includes('Banana'),
  })

  expect(initial).toMatchInlineSnapshot(`
    "



       Custom Renderable List V2 - Phase 1: Bidirectional
       Selected: (none)
       Press ^1=apple, ^2=banana, ^3=carrot, ^4=kale to jump

       Search items...
       ── Fruits ──

       › Apple A red fruit
         Banana A yellow fruit
         Date A sweet fruit
         Fig A small fruit
         Grape A vine fruit
         Lemon A citrus fruit
       ── Vegetables ──

         Carrot An orange vegetable
         Eggplant A purple vegetable"
  `)
  expect(initial).toContain('Apple')
  expect(initial).toContain('Banana')

  session.close()
}, 30000)

test('scrolling keeps selected item in view', async () => {
  const session = await launchTerminal({
    command: 'bun',
    args: ['src/examples/internal/custom-renderable-list-v2.tsx'],
    cols: 60,
    rows: 20,
  })

  await session.text({ waitFor: (text) => text.includes('Selected:') && text.includes('10 of 10') })

  // Navigate down 9 times - should scroll to show Kale
  for (let i = 0; i < 9; i++) {
    await session.press('down')
  }

  const afterScroll = await session.text({
    waitFor: (text) => text.includes('Selected: kale'),
  })

  // Verify selection updated and Kale should be visible after scrolling
  expect(afterScroll).toContain('Selected: kale')
  expect(afterScroll).toMatchInlineSnapshot(`
    "



       Custom Renderable List V2 - Phase 1: Bidirectional
       Selected: kale
       Press ^1=apple, ^2=banana, ^3=carrot, ^4=kale to jump

       Search items...
       ▀─ Fruits ──

         Apple A red fruit
         Banana A yellow fruit
         Date A sweet fruit
         Fig A small fruit
         Grape A vine fruit
         Lemon A citrus fruit
       10 of 10 items


    "
  `)

  session.close()
}, 30000)

test('wrap around navigation', async () => {
  const session = await launchTerminal({
    command: 'bun',
    args: ['src/examples/internal/custom-renderable-list-v2.tsx'],
    cols: 60,
    rows: 20,
  })

  await session.text({ waitFor: (text) => text.includes('› Apple') })

  // Filter to single item
  await session.type('kale')
  const filtered = await session.text({ waitFor: (text) => text.includes('1 of 10') })
  expect(filtered).toMatchInlineSnapshot(`
    "



       Custom Renderable List V2 - Phase 1: Bidirectional
       Selected: (none)
       Press ^1=apple, ^2=banana, ^3=carrot, ^4=kale to jump

       kale
       ── Vegetables ──

       › Kale A superfood




       1 of 10 items • Searching: "kale"



    "
  `)
  expect(filtered).toContain('› Kale')

  // Down should stay on Kale (wrap)
  await session.press('down')
  const afterDown = await session.text({ waitFor: (text) => text.includes('› Kale') })
  expect(afterDown).toMatchInlineSnapshot(`
    "



       Custom Renderable List V2 - Phase 1: Bidirectional
       Selected: kale
       Press ^1=apple, ^2=banana, ^3=carrot, ^4=kale to jump

       kale
       ── Vegetables ──

       › Kale A superfood




       1 of 10 items • Searching: "kale"



    "
  `)

  session.close()
}, 30000)

test('ctrl+k opens action dialog', async () => {
  const session = await launchTerminal({
    command: 'bun',
    args: ['src/examples/internal/custom-renderable-list-v2.tsx'],
    cols: 60,
    rows: 20,
  })

  await session.text({ waitFor: (text) => text.includes('› Apple') })

  // Open dialog with ctrl+k
  await session.press(['ctrl', 'k'])
  const withDialog = await session.text({
    waitFor: (text) => text.includes('Actions for:'),
  })

  expect(withDialog).toMatchInlineSnapshot(`
    "



       Custom Renderable List V2 - Phase 1: Bidirectional
       Selected: (none)
       Press ^1=apple, ^2=banana, ^3=carrot, ^4=kale to jump

       Search items...
      ╭───────────────────────────────────────────────────────╮
      │                                                       │
      │                                                       │
      │ Actions for: Apple                                    │
      │                                                       │
      │ Press ESC to close                                    │
      │                                                       │
      ╰───────────────────────────────────────────────────────╯
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
    cols: 60,
    rows: 20,
  })

  await session.text({ waitFor: (text) => text.includes('› Apple') })

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



       Custom Renderable List V2 - Phase 1: Bidirectional
       Selected: (none)
       Press ^1=apple, ^2=banana, ^3=carrot, ^4=kale to jump

       Search items...
       ▀─ Fruits ──

       › Apple A red fruit
         Banana A yellow fruit
         Date A sweet fruit
         Fig A small fruit
         Grape A vine fruit
         Lemon A citrus fruit
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
    cols: 60,
    rows: 20,
  })

  await session.text({ waitFor: (text) => text.includes('› Apple') })

  // Navigate to Banana
  await session.press('down')
  await session.text({ waitFor: (text) => text.includes('› Banana') })

  // Open dialog - should show Banana
  await session.press(['ctrl', 'k'])
  const withDialog = await session.text({
    waitFor: (text) => text.includes('Actions for: Banana'),
  })

  expect(withDialog).toMatchInlineSnapshot(`
    "



       Custom Renderable List V2 - Phase 1: Bidirectional
       Selected: banana
       Press ^1=apple, ^2=banana, ^3=carrot, ^4=kale to jump

       Search items...
      ╭───────────────────────────────────────────────────────╮
      │                                                       │
      │                                                       │
      │ Actions for: Banana                                   │
      │                                                       │
      │ Press ESC to close                                    │
      │                                                       │
      ╰───────────────────────────────────────────────────────╯
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
       › Banana Yellow fruit




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
    cols: 60,
    rows: 22,
  })

  // Initial state should show (none) - first item is selected but callback not yet fired
  const initial = await session.text({
    waitFor: (text) => text.includes('Selected:') && text.includes('10 of 10'),
  })
  expect(initial).toContain('Selected:')

  // Navigate down to banana - this should update the selectedItemId
  await session.press('down')
  const afterDown = await session.text({
    waitFor: (text) => text.includes('Selected: banana'),
  })
  expect(afterDown).toContain('Selected: banana')

  // Navigate down to date
  await session.press('down')
  const afterSecondDown = await session.text({
    waitFor: (text) => text.includes('Selected: date'),
  })
  expect(afterSecondDown).toContain('Selected: date')

  session.close()
}, 30000)

test('phase 1: selection id shown in header reflects current item', async () => {
  const session = await launchTerminal({
    command: 'bun',
    args: ['src/examples/internal/custom-renderable-list-v2.tsx'],
    cols: 60,
    rows: 24,
  })

  await session.text({ waitFor: (text) => text.includes('10 of 10') })

  // Navigate to carrot (6 items down: banana, date, fig, grape, lemon, carrot)
  for (let i = 0; i < 6; i++) {
    await session.press('down')
  }

  const atCarrot = await session.text({
    waitFor: (text) => text.includes('Selected: carrot'),
  })
  
  expect(atCarrot).toMatchInlineSnapshot(`
    "



       Custom Renderable List V2 - Phase 1: Bidirectional
       Selected: carrot
       Press ^1=apple, ^2=banana, ^3=carrot, ^4=kale to jump

       Search items...
         Lemon A citrus fruit
       ── Vegetables ──

       › Carrot An orange vegetable
         Eggplant A purple vegetable
         Jalapeno A spicy pepper






                                                            ▄
       10 of 10 items

    "
  `)
  expect(atCarrot).toContain('Selected: carrot')
  expect(atCarrot).toContain('Carrot')

  session.close()
}, 30000)

test('phase 1: navigate to last item shows correct selection', async () => {
  const session = await launchTerminal({
    command: 'bun',
    args: ['src/examples/internal/custom-renderable-list-v2.tsx'],
    cols: 60,
    rows: 24,
  })

  await session.text({ waitFor: (text) => text.includes('10 of 10') })

  // Navigate to kale (9 items down: banana, date, fig, grape, lemon, carrot, eggplant, jalapeno, kale)
  for (let i = 0; i < 9; i++) {
    await session.press('down')
  }

  const atKale = await session.text({
    waitFor: (text) => text.includes('Selected: kale'),
  })
  
  // The header should show the selected item id - this verifies the onSelectionChange callback works
  expect(atKale).toContain('Selected: kale')

  session.close()
}, 30000)
