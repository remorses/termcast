import { expect, test } from 'vitest'
import { launchTerminal } from 'tuistory/src'

test('initial render with sections', async () => {
  const session = await launchTerminal({
    command: 'bun',
    args: ['src/examples/internal/custom-renderable-list.tsx'],
    cols: 60,
    rows: 20,
  })

  const initial = await session.text({
    waitFor: (text) => text.includes('Fruits') && text.includes('10 of 10'),
  })

  expect(initial).toMatchInlineSnapshot(`
    "



       Custom Renderable List (using extend)
       Search items...
       ── Fruits ──

       › Apple A red fruit
         Banana A yellow fruit
         Date A sweet fruit
         Fig A small fruit
         Grape A vine fruit                                 ▀




       10 of 10 items


    "
  `)
  expect(initial).toContain('── Fruits ──')
  expect(initial).toContain('› Apple')

  session.close()
}, 30000)

test('sections render with headers', async () => {
  const session = await launchTerminal({
    command: 'bun',
    args: ['src/examples/internal/custom-renderable-list.tsx'],
    cols: 60,
    rows: 28,  // Large enough to see both sections
  })

  const withBothSections = await session.text({
    waitFor: (text) => text.includes('Fruits') && text.includes('Vegetables'),
  })

  expect(withBothSections).toMatchInlineSnapshot(`
    "



       Custom Renderable List (using extend)
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
                                                            █







       10 of 10 items


    "
  `)
  expect(withBothSections).toContain('── Fruits ──')
  expect(withBothSections).toContain('── Vegetables ──')
  // Vegetables items below fold - verify via navigation test instead

  session.close()
}, 30000)

test('navigation across sections', async () => {
  const session = await launchTerminal({
    command: 'bun',
    args: ['src/examples/internal/custom-renderable-list.tsx'],
    cols: 60,
    rows: 28,  // Large enough to see both sections
  })

  await session.text({ waitFor: (text) => text.includes('› Apple') && text.includes('Vegetables') })

  // Navigate through fruits
  await session.press('down')
  const atBanana = await session.text({ waitFor: (text) => text.includes('› Banana') })
  expect(atBanana).toMatchInlineSnapshot(`
    "



       Custom Renderable List (using extend)
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
                                                            █







       10 of 10 items


    "
  `)

  // Skip to last fruit (Lemon at index 5)
  for (let i = 0; i < 4; i++) {
    await session.press('down')
  }
  
  const atLemon = await session.text({ waitFor: (text) => text.includes('› Lemon') })
  expect(atLemon).toMatchInlineSnapshot(`
    "



       Custom Renderable List (using extend)
       Search items...
         Apple A red fruit
         Banana A yellow fruit
         Date A sweet fruit
         Fig A small fruit
         Grape A vine fruit
       › Lemon A citrus fruit
       ── Vegetables ──

         Carrot An orange vegetable
         Eggplant A purple vegetable




                                                            █
                                                            █



       10 of 10 items


    "
  `)
  expect(atLemon).toContain('› Lemon')

  session.close()
}, 30000)

test('filtering works with sections', async () => {
  const session = await launchTerminal({
    command: 'bun',
    args: ['src/examples/internal/custom-renderable-list.tsx'],
    cols: 60,
    rows: 20,
  })

  await session.text({ waitFor: (text) => text.includes('10 of 10') })

  // Filter to show only items with "a" - should show both sections
  await session.type('yellow')
  const afterFilter = await session.text({
    waitFor: (text) => text.includes('Searching:'),
  })

  expect(afterFilter).toMatchInlineSnapshot(`
    "



       Custom Renderable List (using extend)

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
    args: ['src/examples/internal/custom-renderable-list.tsx'],
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



       Custom Renderable List (using extend)

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
    args: ['src/examples/internal/custom-renderable-list.tsx'],
    cols: 60,
    rows: 20,
  })

  // Fruits are wrapped in ItemWrapper but should still appear
  const initial = await session.text({
    waitFor: (text) => text.includes('Apple') && text.includes('Banana'),
  })

  expect(initial).toMatchInlineSnapshot(`
    "



       Custom Renderable List (using extend)
       Search items...
       ── Fruits ──

       › Apple A red fruit
         Banana A yellow fruit
         Date A sweet fruit
         Fig A small fruit
         Grape A vine fruit                                 ▀




       10 of 10 items


    "
  `)
  // All 6 fruits should be found despite being wrapped
  expect(initial).toContain('Apple')
  expect(initial).toContain('Banana')

  session.close()
}, 30000)

test('scrolling keeps selected item in view', async () => {
  const session = await launchTerminal({
    command: 'bun',
    args: ['src/examples/internal/custom-renderable-list.tsx'],
    cols: 60,
    rows: 12,  // Small viewport - only ~4 items visible
  })

  await session.text({ waitFor: (text) => text.includes('› Apple') })

  // Navigate down 8 times - should scroll to show Kale (index 8)
  for (let i = 0; i < 9; i++) {
    await session.press('down')
  }

  const afterScroll = await session.text({
    waitFor: (text) => text.includes('› Kale'),
  })

  // Kale MUST be visible - if scrolling doesn't work, this fails
  expect(afterScroll).toContain('› Kale')
  expect(afterScroll).toMatchInlineSnapshot(`
    "



       Custom Renderable List (using extend)
       Search items...
         Eggplant A purple vegetable
         Jalapeno A spicy pepper
       › Kale A superfood
       10 of 10 items                                       ▄


    "
  `)

  session.close()
}, 30000)

test('wrap around navigation', async () => {
  const session = await launchTerminal({
    command: 'bun',
    args: ['src/examples/internal/custom-renderable-list.tsx'],
    cols: 60,
    rows: 20,
  })

  await session.text({ waitFor: (text) => text.includes('› Apple') })

  // Filter to single item
  await session.type('kale')
  const filtered = await session.text({ waitFor: (text) => text.includes('1 of 10') })
  expect(filtered).toMatchInlineSnapshot(`
    "



       Custom Renderable List (using extend)

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



       Custom Renderable List (using extend)

       kale
       ── Vegetables ──

       › Kale A superfood







       1 of 10 items • Searching: "kale"


    "
  `)

  session.close()
}, 30000)
