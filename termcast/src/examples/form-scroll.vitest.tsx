import { test, expect, afterEach, beforeEach } from 'vitest'
import { launchTerminal, Session } from 'tuistory/src'

let session: Session

beforeEach(async () => {
  session = await launchTerminal({
    command: 'bun',
    args: ['src/examples/form-scroll.tsx'],
    cols: 60,
    rows: 15,
  })
})

afterEach(() => {
  session?.close()
})

test(
  'form scroll - tab navigates and scrolls to focused field',
  async () => {
    await session.text({
      waitFor: (text) => {
        return /Form Scroll Test/i.test(text)
      },
    })

    const initialSnapshot = await session.text()
    expect(initialSnapshot).toMatchInlineSnapshot(`
      "




        ■  Form Scroll Test                                    ▀
        │  Test scrolling behavior when navigating with Tab
        │
        ◇  Field 1
        │  First field
        │


         ctrl ↵ submit   tab navigate   ^k actions

      "
    `)

    await session.press('tab')
    const afterTab1 = await session.text()
    expect(afterTab1).toMatchInlineSnapshot(`
      "




        ▪  Form Scroll Test                                    ▀
        │  Test scrolling behavior when navigating with Tab
        │
        ◆  Field 1
        │  First field
        │


         ctrl ↵ submit   tab navigate   ^k actions

      "
    `)

    await session.press('tab')
    const afterTab2 = await session.text()
    expect(afterTab2).toMatchInlineSnapshot(`
      "




        ◇  Field 1
        │  First field                                         ▀
        │
        ◆  Field 2
        │  Second field
        │


         ctrl ↵ submit   tab navigate   ^k actions

      "
    `)

    await session.press('tab')
    const afterTab3 = await session.text()
    expect(afterTab3).toMatchInlineSnapshot(`
      "




        ◇  Field 2
        │  Second field                                        ▄
        │
        ◆  Field 3
        │  Third field
        │


         ctrl ↵ submit   tab navigate   ^k actions

      "
    `)

    await session.press('tab')
    const afterTab4 = await session.text()
    expect(afterTab4).toMatchInlineSnapshot(`
      "




        ◇  Field 3
        │  Third field
        │                                                      ▄
        ◆  Field 4
        │  Fourth field
        │


         ctrl ↵ submit   tab navigate   ^k actions

      "
    `)

    await session.press('tab')
    const afterTab5 = await session.text()
    expect(afterTab5).toMatchInlineSnapshot(`
      "




        ◇  Field 4
        │  Fourth field
        │
        ◆  Field 5                                             ▀
        │  Fifth field
        │


         ctrl ↵ submit   tab navigate   ^k actions

      "
    `)

    await session.press('tab')
    const afterTab6 = await session.text()
    expect(afterTab6).toMatchInlineSnapshot(`
      "




        ◇  Field 5
        │  Fifth field
        │
        ◆  Field 6                                             ▄
        │  Sixth field
        │


         ctrl ↵ submit   tab navigate   ^k actions

      "
    `)

    await session.press('tab')
    const afterTab7 = await session.text()
    expect(afterTab7).toMatchInlineSnapshot(`
      "




        ◇  Field 6
        │  Sixth field
        │
        ◆  Field 7
        │  Seventh field                                       ▄
        │


         ctrl ↵ submit   tab navigate   ^k actions

      "
    `)

    await session.press(['shift', 'tab'])
    const afterShiftTab1 = await session.text()
    expect(afterShiftTab1).toMatchInlineSnapshot(`
      "




        ◇  Field 5
        │  Fifth field
        │
        ◆  Field 6                                             ▄
        │  Sixth field
        │


         ctrl ↵ submit   tab navigate   ^k actions

      "
    `)

    await session.press(['shift', 'tab'])
    const afterShiftTab2 = await session.text()
    expect(afterShiftTab2).toMatchInlineSnapshot(`
      "




        ◇  Field 4
        │  Fourth field
        │
        ◆  Field 5                                             ▀
        │  Fifth field
        │


         ctrl ↵ submit   tab navigate   ^k actions

      "
    `)
  },
  30000,
)
