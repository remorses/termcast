import { expect, test } from 'vitest'
import { launchTerminal } from 'tuistory/src'

test(
  'useDescendantsRerender - compare render counts with and without hook',
  async () => {
    // First test WITHOUT hook (baseline)
    const sessionWithout = await launchTerminal({
      command: 'bun',
      args: [
        'src/examples/internal/descendants-rerender.tsx',
        'parent-without-hook',
      ],
    })

    const withoutHook = await sessionWithout.text({
      waitFor: (text) =>
        text.includes('Parent without hook') && text.includes('Render Counts'),
    })

    expect(withoutHook).toMatchInlineSnapshot(`
      "


      Scenario: parent-without-hook
      Items: 3 | [a] add | [d] delete | [r] reset counts

      Parent without hook - renders: 2
      [0] Apple (without hook, renders: 7)
      [1] Banana (without hook, renders: 8)
      [2] Cherry (without hook, renders: 9)

      ┌──────────────────────────────────────────────────────────────────────────┐
      │                                                                          │
      │ Render Counts:                                                           │
      │   parent: 1                                                              │
      │   parentWithHook: 0                                                      │
      │   independentChild: 0                                                    │
      │   independentChildWithHook: 0                                            │
      │   descendantItem: 3                                                      │
      │   descendantItemWithHook: 0                                              │
      │                                                                          │
      └──────────────────────────────────────────────────────────────────────────┘"
    `)

    sessionWithout.close()

    // Then test WITH hook
    const sessionWith = await launchTerminal({
      command: 'bun',
      args: [
        'src/examples/internal/descendants-rerender.tsx',
        'parent-with-hook',
      ],
    })

    const withHook = await sessionWith.text({
      waitFor: (text) =>
        text.includes('Parent with hook') && text.includes('Render Counts'),
    })

    expect(withHook).toMatchInlineSnapshot(`
      "


      Scenario: parent-with-hook
      Items: 3 | [a] add | [d] delete | [r] reset counts

      Parent with hook - renders: 3
      Item count (from hook): 3
      [0] Apple (without hook, renders: 7)
      [1] Banana (without hook, renders: 8)
      [2] Cherry (without hook, renders: 9)

      ┌──────────────────────────────────────────────────────────────────────────┐
      │                                                                          │
      │ Render Counts:                                                           │
      │   parent: 0                                                              │
      │   parentWithHook: 1                                                      │
      │   independentChild: 0                                                    │
      │   independentChildWithHook: 0                                            │
      │   descendantItem: 3                                                      │
      │   descendantItemWithHook: 0                                              │
      │                                                                          │
      └──────────────────────────────────────────────────────────────────────────┘"
    `)

    sessionWith.close()
  },
  60000,
)

test(
  'useDescendantsRerender - independent child with hook',
  async () => {
    const session = await launchTerminal({
      command: 'bun',
      args: [
        'src/examples/internal/descendants-rerender.tsx',
        'independent-child-with-hook',
      ],
    })

    const text = await session.text({
      // waitFor: (text) =>
      //   text.includes('Independent child with hook')
    })

    expect(text).toMatchInlineSnapshot(`
      "


      Items:i3:|i[a]padde|t[d]ideleteh|h[r] reset counts


      Parent without hook - renders: 2
      Independent child with hook - renders: 3, items: 3
      [0]eApplen(withoutwhook,trenders:r7)ders: 2
      [1] Banana (without hook, renders: 8)
      [2] Cherry (without hook, renders: 9)


      ┌──────────────────────────────────────────────────────────────────────────┐
      │                                                                          │
      │ Reparent:u1ts:                                                           │
      │   parentWithHook: 0                                                      │
      │   independentChild: 1                                                    │
      │   independentChildWithHook: 1                                            │
      │   descendantItem: 3                                                      │
      │   descendantItemWithHook: 0                                              │
      │                                                                          │
      └──────────────────────────────────────────────────────────────────────────┘"
    `)

    session.close()
  },
  30000,
)

test(
  'useDescendantsRerender - descendant item with hook',
  async () => {
    const session = await launchTerminal({
      command: 'bun',
      args: [
        'src/examples/internal/descendants-rerender.tsx',
        'descendant-item-with-hook',
      ],
    })

    const text = await session.text({
      waitFor: (text) =>
        text.includes('with hook') && text.includes('Render Counts'),
    })

    expect(text).toMatchInlineSnapshot(`
      "


      Scenario: descendant-item-with-hook
      Items: 3 | [a] add | [d] delete | [r] reset counts

      Parent without hook - renders: 2
      [0] Apple (with hook, renders: 7, total: 3)
      [1] Banana (with hook, renders: 8, total: 3)
      [2] Cherry (with hook, renders: 9, total: 3)

      ┌──────────────────────────────────────────────────────────────────────────┐
      │                                                                          │
      │ Render Counts:                                                           │
      │   parent: 1                                                              │
      │   parentWithHook: 0                                                      │
      │   independentChild: 0                                                    │
      │   independentChildWithHook: 0                                            │
      │   descendantItem: 0                                                      │
      │   descendantItemWithHook: 3                                              │
      │                                                                          │
      └──────────────────────────────────────────────────────────────────────────┘"
    `)

    session.close()
  },
  30000,
)
