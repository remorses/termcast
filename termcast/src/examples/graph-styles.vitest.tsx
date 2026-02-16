import { test, expect, afterEach, beforeEach } from 'vitest'
import { launchTerminal, Session } from 'tuistory/src'

let session: Session

beforeEach(async () => {
  session = await launchTerminal({
    command: 'bun',
    args: ['src/examples/graph-styles.tsx'],
    cols: 80,
    rows: 24,
  })
})

afterEach(() => {
  session?.close()
})

test('area style renders braille characters', async () => {
  const text = await session.text({
    waitFor: (text) => {
      return text.includes('Area - Stock') && text.includes('│')
    },
    timeout: 10000,
  })

  expect(text).toMatchInlineSnapshot(`
    "


       Graph Styles ─────────────────────────────────────────────────────────────

       > Search...

      ›Area - Stock Price Orange braille do │ 211│                             ⣠
       Area - Multi Series CPU + Memory ove │    │                         ⢀⣴⣦⣼⣿
       Area - Waves Purple + Magenta sine/c │    │                     ⣴⣦⣄⣴⣿⣿⣿⣿⣿
       Area - Blue Revenue Single series, a │ 189│                 ⣠⣾⣶⣼⣿⣿⣿⣿⣿⣿⣿⣿⣿
       Filled - Red Revenue Solid block gro │    │             ⢀⣄⡀⣼⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
       Filled - Green Temp Daily temperatur │    │           ⢀⣴⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
       Filled - Yellow CPU High contrast on │ 167│        ⣠⣾⣷⣾⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
       Filled - Magenta Waves Smooth curve  │    │    ⣰⣤⣠⣾⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
       Striped - Purple/Orange Warm alterna │    │⢀⣴⡄⢰⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
       Striped - Blue/Red High contrast str │ 145│⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
       Striped - Theme Default primary + ac │     1      5      10     15     20
       Striped - Green/Yellow Nature-inspir │ ──────────────────────────────────
       Striped - Red/Magenta Warm gradient  │ Variant: area
                                            │ Color:   Orange
                                            │ Points:  20
       ↵ open detail   ↑↓ navigate   ^k act │

    "
  `)

  expect(text).toMatch(/[\u2800-\u28FF]/)
  expect(text).toContain('Stock Price')
}, 30000)

test('filled style renders block characters', async () => {
  await session.text({
    waitFor: (text) => {
      return text.includes('Filled') && text.includes('│')
    },
    timeout: 10000,
  })

  // Navigate to 5th item: "Filled - Red Revenue"
  for (let i = 0; i < 4; i++) {
    await session.press('down')
  }

  const text = await session.text({
    waitFor: (text) => {
      return text.includes('›Filled - Red')
    },
    timeout: 5000,
  })

  expect(text).toMatchInlineSnapshot(`
    "


       Graph Styles ─────────────────────────────────────────────────────────────

       > Search...

       Area - Stock Price Orange braille do │ Revenue Growth                    ▲
       Area - Multi Series CPU + Memory ove │                                   █
       Area - Waves Purple + Magenta sine/c │ Quarterly revenue from $10k to    ▀
       Area - Blue Revenue Single series, a │ $75k.
      ›Filled - Red Revenue Solid block gro │
       Filled - Green Temp Daily temperatur │ Q1: $10k  → Q2: $25k (+150%)
       Filled - Yellow CPU High contrast on │ Q2: $25k  → Q3: $50k (+100%)
       Filled - Magenta Waves Smooth curve  │ Q3: $50k  → Q4: $75k (+50%)
       Striped - Purple/Orange Warm alterna │
       Striped - Blue/Red High contrast str │ 78│                             ▄
       Striped - Theme Default primary + ac │   │                         ▄▀▄▀▀
       Striped - Green/Yellow Nature-inspir │   │                     ▄▄▄▀▀▀▀▀▀
       Striped - Red/Magenta Warm gradient  │ 54│                   ▄▀▀▀▀▀▀▀▀▀▀
                                            │   │               ▄▄▄▀▀▀▀▀▀▀▀▀▀▀▀
                                            │   │           ▄ ▄▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀
       ↵ open detail   ↑↓ navigate   ^k act │ 31│         ▄▀▀▄▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀ ▼

    "
  `)

  expect(text).toMatch(/[▄▀]/)
  expect(text).toContain('›Filled - Red')
}, 30000)

test('striped style renders alternating columns', async () => {
  await session.text({
    waitFor: (text) => {
      return text.includes('Striped') && text.includes('│')
    },
    timeout: 10000,
  })

  // Navigate to 9th item: "Striped - Purple/Orange"
  for (let i = 0; i < 8; i++) {
    await session.press('down')
  }

  const text = await session.text({
    waitFor: (text) => {
      return text.includes('›Striped - Purple')
    },
    timeout: 5000,
  })

  expect(text).toMatchInlineSnapshot(`
    "


       Graph Styles ─────────────────────────────────────────────────────────────

       > Search...

       Area - Stock Price Orange braille do │ 211│                             ▄
       Area - Multi Series CPU + Memory ove │    │                          ▄▄▀▀
       Area - Waves Purple + Magenta sine/c │    │                     ▄▄▄▀▀▀▀▀▀
       Area - Blue Revenue Single series, a │ 189│                 ▄▀▀▀▀▀▀▀▀▀▀▀▀
       Filled - Red Revenue Solid block gro │    │              ▄ ▀▀▀▀▀▀▀▀▀▀▀▀▀▀
       Filled - Green Temp Daily temperatur │    │           ▄▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀
       Filled - Yellow CPU High contrast on │ 167│        ▄▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀
       Filled - Magenta Waves Smooth curve  │    │    ▄▀▄▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀
      ›Striped - Purple/Orange Warm alterna │    │ ▄▀▄▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀
       Striped - Blue/Red High contrast str │ 145│▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀
       Striped - Theme Default primary + ac │     1      5      10     15     20
       Striped - Green/Yellow Nature-inspir │ ──────────────────────────────────
       Striped - Red/Magenta Warm gradient  │ Even cols: Purple
                                            │ Odd cols:  Orange
                                            │ ──────────────────────────────────
       ↵ open detail   ↑↓ navigate   ^k act │ Colors:    Purple Orange

    "
  `)

  expect(text).toMatch(/[▄▀]/)
  expect(text).toContain('›Striped - Purple')
}, 30000)

test('markdown + metadata detail view in list', async () => {
  await session.text({
    waitFor: (text) => {
      return text.includes('Area - Multi') && text.includes('│')
    },
    timeout: 10000,
  })

  // Navigate to 2nd item: "Area - Multi Series" (has markdown)
  await session.press('down')

  const text = await session.text({
    waitFor: (text) => {
      return text.includes('›Area - Multi') && text.includes('System Metrics')
    },
    timeout: 5000,
  })

  expect(text).toMatchInlineSnapshot(`
    "


       Graph Styles ─────────────────────────────────────────────────────────────

       > Search...

       Area - Stock Price Orange braille do │ System Metrics                    ▲
      ›Area - Multi Series CPU + Memory ove │                                   █
       Area - Waves Purple + Magenta sine/c │ CPU usage (blue) vs memory usage (
       Area - Blue Revenue Single series, a │ green) over 24 hours.
       Filled - Red Revenue Solid block gro │
       Filled - Green Temp Daily temperatur │ - Peak CPU at 90% around 15h
       Filled - Yellow CPU High contrast on │ - Memory steadily climbing to 86%
       Filled - Magenta Waves Smooth curve  │ - CPU has high variance, memory
       Striped - Purple/Orange Warm alterna │ is monotonic
       Striped - Blue/Red High contrast str │
       Striped - Theme Default primary + ac │
       Striped - Green/Yellow Nature-inspir │ 100│
       Striped - Red/Magenta Warm gradient  │    │                   ⣠⣶⣧   ⣀⣠⣤⣶
                                            │  75│       ⢀⣴⣧       ⢀⣰⣿⣿⣿⣷⣾⣿⣿⣿⣿⣿
                                            │    │      ⢀⣾⣿⣿⣧⢀⣀⣤⣶⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
       ↵ open detail   ↑↓ navigate   ^k act │    │   ⢀⣾⣶⣾⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿ ▼

    "
  `)

  expect(text).toContain('System Metrics')
  expect(text).toMatch(/[\u2800-\u28FF]/)
}, 30000)

test('enter pushes full detail view with graph', async () => {
  await session.text({
    waitFor: (text) => {
      return text.includes('Area - Stock') && text.includes('│')
    },
    timeout: 10000,
  })

  // Press enter to push the full Detail view for first item
  await session.press('return')

  const text = await session.text({
    waitFor: (text) => {
      return text.includes('Area - Stock Price') && text.includes('Orange braille dots')
    },
    timeout: 5000,
  })

  expect(text).toMatchInlineSnapshot(`
    "


                                                                                 █

      Area - Stock Price

      Orange braille dots

      Variant: area
      Data points: 20

      211│                                                                   ⢀
         │                                                                 ⢀⣴⣿
         │                                                         ⢀⣠⣴⣾⣷⣶⣦⣴⣿⣿⣿
         │                                                 ⣠⣄⣀   ⣠⣶⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
      195│                                          ⢀⡀   ⣠⣾⣿⣿⣿⣿⣶⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
         │                                       ⣠⣴⣾⣿⣿⣿⣷⣾⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
         │                                     ⣠⣾⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
      178│                             ⣀⣤⣶⣿⣶⣶⣤⣾⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿


      esc go back   ^k actions   ↵ Go Back                 powered by termcast.app

    "
  `)

  // Full detail view shows markdown title and graph
  expect(text).toContain('Stock Price')
  expect(text).toContain('Orange braille')
  expect(text).toMatch(/[\u2800-\u28FF]/)
}, 30000)

test('esc returns from detail to list', async () => {
  await session.text({
    waitFor: (text) => {
      return text.includes('Area - Stock') && text.includes('│')
    },
    timeout: 10000,
  })

  // Push detail view
  await session.press('return')
  await session.text({
    waitFor: (text) => {
      return text.includes('Orange braille dots')
    },
    timeout: 5000,
  })

  // Go back
  await session.press('escape')

  const text = await session.text({
    waitFor: (text) => {
      return text.includes('›Area - Stock Price') && text.includes('Graph Styles')
    },
    timeout: 5000,
  })

  expect(text).toMatchInlineSnapshot(`
    "


       Graph Styles ─────────────────────────────────────────────────────────────

       > Search...

      ›Area - Stock Price Orange braille do │ 211│                             ⣠
       Area - Multi Series CPU + Memory ove │    │                         ⢀⣴⣦⣼⣿
       Area - Waves Purple + Magenta sine/c │    │                     ⣴⣦⣄⣴⣿⣿⣿⣿⣿
       Area - Blue Revenue Single series, a │ 189│                 ⣠⣾⣶⣼⣿⣿⣿⣿⣿⣿⣿⣿⣿
       Filled - Red Revenue Solid block gro │    │             ⢀⣄⡀⣼⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
       Filled - Green Temp Daily temperatur │    │           ⢀⣴⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
       Filled - Yellow CPU High contrast on │ 167│        ⣠⣾⣷⣾⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
       Filled - Magenta Waves Smooth curve  │    │    ⣰⣤⣠⣾⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
       Striped - Purple/Orange Warm alterna │    │⢀⣴⡄⢰⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
       Striped - Blue/Red High contrast str │ 145│⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
       Striped - Theme Default primary + ac │     1      5      10     15     20
       Striped - Green/Yellow Nature-inspir │ ──────────────────────────────────
       Striped - Red/Magenta Warm gradient  │ Variant: area
                                            │ Color:   Orange
                                            │ Points:  20
       ↵ open detail   ↑↓ navigate   ^k act │

    "
  `)

  expect(text).toContain('›Area - Stock')
  expect(text).toContain('Graph Styles')
}, 30000)
