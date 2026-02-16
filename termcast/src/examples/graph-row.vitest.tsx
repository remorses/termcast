import { test, expect, afterEach, beforeEach } from 'vitest'
import { launchTerminal, Session } from 'tuistory/src'

let session: Session

beforeEach(async () => {
  session = await launchTerminal({
    command: 'bun',
    args: ['src/examples/graph-row.tsx'],
    cols: 100,
    rows: 30,
  })
})

afterEach(() => {
  session?.close()
})

test('side detail shows two graphs in a row', async () => {
  const text = await session.text({
    waitFor: (text) => {
      return text.includes('CPU vs Memory') && text.includes('│')
    },
    timeout: 10000,
  })

  expect(text).toMatchInlineSnapshot(`
    "


       Graph Rows ───────────────────────────────────────────────────────────────────────────────────

       > Search...

      ›CPU vs Memory Area + Filled side by side
       Disk I/O Read vs Write operations              │ CPU vs Memory                               ▲
       Revenue vs Expenses Striped comparison         │                                             █
       Weather Station Temperature + Humidity         │ Area chart (left) shows CPU with high       █
       Mixed Variants Area left, Striped right        │ variance.                                   █
       Sparse Data (Zeros) Filled vs Striped with zer │ Filled chart (right) shows memory steadily  █
                                                      │ climbing.                                   █
                                                      │                                             █
                                                      │
                                                      │ 100│            ⡀     100│
                                                      │    │     ⡄     ⣼⣷⡀       │             ▄▄▀▀
                                                      │  67│    ⣸⣿⡄   ⣸⣿⣿⣧     67│        ▄▄▀▀▀▀▀▀▀
                                                      │    │  ⣼⣶⣿⣿⣷⡀ ⢰⣿⣿⣿⣿⣧      │   ▄▄▀▀▀▀▀▀▀▀▀▀▀▀
                                                      │    │ ⢸⣿⣿⣿⣿⣿⣷⣀⣿⣿⣿⣿⣿⣿⣇     │▄▄▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀
                                                      │  33│⣀⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣧  33│▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀
                                                      │    │⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿    │▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀
                                                      │   0│⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿   0│▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀
                                                      │     0h 6h  12h 18h24h     0h 6h  12h 18h24h
                                                      │
                                                      │ ───────────────────────────────────────────
                                                      │
       ↵ open detail   ↑↓ navigate   ^k actions       │ CPU Peak: 90%                               ▼

    "
  `)

  // Both graphs should render (braille for area, block for filled)
  expect(text).toMatch(/[\u2800-\u28FF]/)
  expect(text).toContain('CPU vs Memory')
}, 30000)

test('enter pushes full detail with two graphs', async () => {
  await session.text({
    waitFor: (text) => {
      return text.includes('CPU vs Memory') && text.includes('│')
    },
    timeout: 10000,
  })

  await session.press('return')

  const text = await session.text({
    waitFor: (text) => {
      return text.includes('CPU vs Memory') && text.includes('Area chart')
    },
    timeout: 5000,
  })

  expect(text).toMatchInlineSnapshot(`
    "


                                                                                                     █
                                                                                                     █
      CPU vs Memory                                                                                  ▀

      Area + Filled side by side

      CPU vs Memory

      Area chart (left) shows CPU with high variance.
      Filled chart (right) shows memory steadily climbing.

      100│                                           100│
         │                            ⢀⣠⣴⡄              │                                        ▄
         │            ⣠⣦             ⣠⣿⣿⣿⣿⣦             │                               ▄▄▄▄▄▀▀▀▀▀
         │          ⢠⣾⣿⣿⣷⡄         ⢀⣼⣿⣿⣿⣿⣿⣿⣷⡀           │                     ▄▄▄▄▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀
       67│      ⢀⡀ ⣰⣿⣿⣿⣿⣿⣿⡄       ⢀⣾⣿⣿⣿⣿⣿⣿⣿⣿⣷⡀        67│               ▄▄▄▄▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀
         │     ⢠⣿⣿⣷⣿⣿⣿⣿⣿⣿⣿⣿⡄     ⢀⣾⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡄         │        ▄▄▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀
         │    ⣠⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣦⡀   ⣾⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣄⡀       │  ▄▄▄▄▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀
       33│  ⢀⣴⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣶⣤⣼⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣷⣄   33│▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀
         │⣀⣤⣾⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣷    │▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀
         │⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿    │▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀
         │⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿    │▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀
        0│⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿   0│▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀


      esc go back   ^k actions   ↵ Go Back                                         powered by termcast

    "
  `)

  expect(text).toContain('CPU vs Memory')
  expect(text).toContain('Area chart')
}, 30000)

test('esc returns from detail to list', async () => {
  await session.text({
    waitFor: (text) => {
      return text.includes('CPU vs Memory') && text.includes('│')
    },
    timeout: 10000,
  })

  await session.press('return')
  await session.text({
    waitFor: (text) => {
      return text.includes('Area chart')
    },
    timeout: 5000,
  })

  await session.press('escape')

  const text = await session.text({
    waitFor: (text) => {
      return text.includes('›CPU vs Memory') && text.includes('Graph Rows')
    },
    timeout: 5000,
  })

  expect(text).toMatchInlineSnapshot(`
    "


       Graph Rows ───────────────────────────────────────────────────────────────────────────────────

       > Search...

      ›CPU vs Memory Area + Filled side by side
       Disk I/O Read vs Write operations              │ CPU vs Memory                               ▲
       Revenue vs Expenses Striped comparison         │                                             █
       Weather Station Temperature + Humidity         │ Area chart (left) shows CPU with high       █
       Mixed Variants Area left, Striped right        │ variance.                                   █
       Sparse Data (Zeros) Filled vs Striped with zer │ Filled chart (right) shows memory steadily  █
                                                      │ climbing.                                   █
                                                      │                                             █
                                                      │
                                                      │ 100│            ⡀     100│
                                                      │    │     ⡄     ⣼⣷⡀       │             ▄▄▀▀
                                                      │  67│    ⣸⣿⡄   ⣸⣿⣿⣧     67│        ▄▄▀▀▀▀▀▀▀
                                                      │    │  ⣼⣶⣿⣿⣷⡀ ⢰⣿⣿⣿⣿⣧      │   ▄▄▀▀▀▀▀▀▀▀▀▀▀▀
                                                      │    │ ⢸⣿⣿⣿⣿⣿⣷⣀⣿⣿⣿⣿⣿⣿⣇     │▄▄▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀
                                                      │  33│⣀⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣧  33│▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀
                                                      │    │⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿    │▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀
                                                      │   0│⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿   0│▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀
                                                      │     0h 6h  12h 18h24h     0h 6h  12h 18h24h
                                                      │
                                                      │ ───────────────────────────────────────────
                                                      │
       ↵ open detail   ↑↓ navigate   ^k actions       │ CPU Peak: 90%                               ▼

    "
  `)

  expect(text).toContain('›CPU vs Memory')
}, 30000)

test('sparse data with zeros shows baseline', async () => {
  await session.text({
    waitFor: (text) => {
      return text.includes('Sparse Data')
    },
    timeout: 10000,
  })

  // Navigate to last item: "Sparse Data (Zeros)"
  for (let i = 0; i < 5; i++) {
    await session.press('down')
  }

  const text = await session.text({
    waitFor: (text) => {
      return text.includes('›Sparse Data')
    },
    timeout: 5000,
  })

  expect(text).toMatchInlineSnapshot(`
    "


       Graph Rows ───────────────────────────────────────────────────────────────────────────────────

       > Search...

       CPU vs Memory Area + Filled side by side
       Disk I/O Read vs Write operations              │ Sparse Data                                 ▲
       Revenue vs Expenses Striped comparison         │                                             █
       Weather Station Temperature + Humidity         │ Data with many zero values should show a    █
       Mixed Variants Area left, Striped right        │ thin                                        █
      ›Sparse Data (Zeros) Filled vs Striped with zer │ baseline line so bars are visible even at   █
                                                      │ zero.                                       █
                                                      │                                             █
                                                      │
                                                      │ 100│              ▄   100│              ▄
                                                      │    │      ▄      ▄▀      │      ▄      ▄▀
                                                      │  67│      ▀      ▀▀    67│      ▀      ▀▀
                                                      │    │     ▀▀  ▄▀  ▀▀      │     ▀▀  ▄▀  ▀▀
                                                      │    │     ▀▀  ▀▀  ▀▀▄     │     ▀▀  ▀▀  ▀▀▄
                                                      │  33│   ▄ ▀▀▀ ▀▀▄ ▀▀▀   33│   ▄ ▀▀▀ ▀▀▄ ▀▀▀
                                                      │    │  ▀▀▀▀▀▀▀▀▀▀ ▀▀▀     │  ▀▀▀▀▀▀▀▀▀▀ ▀▀▀
                                                      │   0│▁▀▀▀▀▀▀▀▀▀▀▀▁▀▀▀▁   0│▁▀▀▀▀▀▀▀▀▀▀▀▁▀▀▀▁
                                                      │     0h 6h  12h 18h24h     0h 6h  12h 18h24h
                                                      │
                                                      │ ───────────────────────────────────────────
                                                      │
       ↵ open detail   ↑↓ navigate   ^k actions       │ Zeros: 12 of 20                             ▼

    "
  `)

  expect(text).toContain('›Sparse Data')
}, 30000)

test('navigate to striped pair', async () => {
  await session.text({
    waitFor: (text) => {
      return text.includes('Revenue vs Expenses')
    },
    timeout: 10000,
  })

  // Navigate to 3rd item: "Revenue vs Expenses"
  await session.press('down')
  await session.press('down')

  const text = await session.text({
    waitFor: (text) => {
      return text.includes('›Revenue vs Expenses')
    },
    timeout: 5000,
  })

  expect(text).toMatchInlineSnapshot(`
    "


       Graph Rows ───────────────────────────────────────────────────────────────────────────────────

       > Search...

       CPU vs Memory Area + Filled side by side
       Disk I/O Read vs Write operations              │ Revenue vs Expenses                         ▲
      ›Revenue vs Expenses Striped comparison         │                                             █
       Weather Station Temperature + Humidity         │ Revenue growing faster than expenses.       █
       Mixed Variants Area left, Striped right        │ Profit margin widening over the year.       ▀
       Sparse Data (Zeros) Filled vs Striped with zer │
                                                      │ - Revenue: $10k to $75k
                                                      │ - Expenses: $8k to $45k
                                                      │
                                                      │
                                                      │
                                                      │ 78│                 ▄ 47│                 ▄
                                                      │   │              ▄▀▀▀   │             ▄▄▀▀▀
                                                      │ 54│            ▄▀▀▀▀▀ 33│           ▄▄▀▀▀▀▀
                                                      │   │         ▄▄▀▀▀▀▀▀▀   │         ▄▀▀▀▀▀▀▀▀
                                                      │   │      ▄ ▀▀▀▀▀▀▀▀▀▀   │      ▄▄▀▀▀▀▀▀▀▀▀▀
                                                      │ 31│    ▄▀▀▀▀▀▀▀▀▀▀▀▀▀ 20│    ▄▀▀▀▀▀▀▀▀▀▀▀▀▀
                                                      │   │ ▄ ▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀   │  ▄▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀
                                                      │  7│▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀  6│▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀
                                                      │    Jan  Apr  Jul  Oct    Jan  Apr  Jul  Oct
                                                      │
       ↵ open detail   ↑↓ navigate   ^k actions       │ ─────────────────────────────────────────── ▼

    "
  `)

  expect(text).toContain('›Revenue vs Expenses')
  expect(text).toMatch(/[▄▀]/)
}, 30000)
