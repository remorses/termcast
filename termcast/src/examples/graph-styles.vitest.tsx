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

      ›Area - Stock Price Orange braille do
       Area - Multi Series CPU + Memory ove │                                   ▲
       Area - Waves Purple + Magenta sine/c │ 211│                            ⣠ █
       Area - Blue Revenue Single series, a │    │                        ⢀⣴⣦⣼⣿ █
       Filled - Red Revenue Solid block gro │    │                    ⢠⣦⣄⣴⣿⣿⣿⣿⣿
       Filled - Green Temp Daily temperatur │ 189│                ⢀⣴⣷⣦⣿⣿⣿⣿⣿⣿⣿⣿⣿
       Filled - Yellow CPU High contrast on │    │             ⣠⣀⢠⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
       Filled - Magenta Waves Smooth curve  │    │           ⣠⣾⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
       Striped - Purple/Orange Warm alterna │ 167│       ⢀⣴⣿⣶⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
       Striped - Blue/Red High contrast str │    │    ⣰⣤⣰⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
       Striped - Theme Default primary + ac │    │⢀⣴⡄⢰⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
       Striped - Green/Yellow Nature-inspir │ 145│⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
       Striped - Red/Magenta Warm gradient  │     1      5     10     15     20
                                            │
                                            │ ─────────────────────────────────
       ↵ open detail   ↑↓ navigate   ^k act │                                   ▼

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

       Area - Stock Price Orange braille do
       Area - Multi Series CPU + Memory ove │ Revenue Growth                    ▲
       Area - Waves Purple + Magenta sine/c │                                   █
       Area - Blue Revenue Single series, a │ Quarterly revenue from $10k to
      ›Filled - Red Revenue Solid block gro │ $75k.
       Filled - Green Temp Daily temperatur │
       Filled - Yellow CPU High contrast on │ Q1: $10k  → Q2: $25k (+150%)
       Filled - Magenta Waves Smooth curve  │ Q2: $25k  → Q3: $50k (+100%)
       Striped - Purple/Orange Warm alterna │ Q3: $50k  → Q4: $75k (+50%)
       Striped - Blue/Red High contrast str │
       Striped - Theme Default primary + ac │
       Striped - Green/Yellow Nature-inspir │ 78│                             ▄
       Striped - Red/Magenta Warm gradient  │   │                         ▄▀▄▀▀
                                            │   │                     ▄▄▄▀▀▀▀▀▀
                                            │ 54│                   ▄▀▀▀▀▀▀▀▀▀▀
       ↵ open detail   ↑↓ navigate   ^k act │   │               ▄▄▄▀▀▀▀▀▀▀▀▀▀▀▀ ▼

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

       Area - Stock Price Orange braille do
       Area - Multi Series CPU + Memory ove │                                   ▲
       Area - Waves Purple + Magenta sine/c │ 211│                            ▄ █
       Area - Blue Revenue Single series, a │    │                         ▄▄▀▀ ▀
       Filled - Red Revenue Solid block gro │    │                     ▄▄▄▀▀▀▀▀
       Filled - Green Temp Daily temperatur │ 189│                ▄▄▀▄▀▀▀▀▀▀▀▀▀
       Filled - Yellow CPU High contrast on │    │             ▄▄▄▀▀▀▀▀▀▀▀▀▀▀▀▀
       Filled - Magenta Waves Smooth curve  │    │           ▄▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀
      ›Striped - Purple/Orange Warm alterna │ 167│       ▄▄▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀
       Striped - Blue/Red High contrast str │    │    ▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀
       Striped - Theme Default primary + ac │    │▄▀▄▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀
       Striped - Green/Yellow Nature-inspir │ 145│▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀
       Striped - Red/Magenta Warm gradient  │     1      5     10     15     20
                                            │
                                            │ ─────────────────────────────────
       ↵ open detail   ↑↓ navigate   ^k act │                                   ▼

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

       Area - Stock Price Orange braille do
      ›Area - Multi Series CPU + Memory ove │ System Metrics                    ▲
       Area - Waves Purple + Magenta sine/c │                                   ▀
       Area - Blue Revenue Single series, a │ CPU usage (blue) vs memory usage (
       Filled - Red Revenue Solid block gro │ green) over 24 hours.
       Filled - Green Temp Daily temperatur │
       Filled - Yellow CPU High contrast on │ - Peak CPU at 90% around 15h
       Filled - Magenta Waves Smooth curve  │ - Memory steadily climbing to 86%
       Striped - Purple/Orange Warm alterna │ - CPU has high variance, memory
       Striped - Blue/Red High contrast str │ is monotonic
       Striped - Theme Default primary + ac │
       Striped - Green/Yellow Nature-inspir │
       Striped - Red/Magenta Warm gradient  │
                                            │ 100│
                                            │    │                   ⣠⣶⣧   ⣀⣠⣤⣶
       ↵ open detail   ↑↓ navigate   ^k act │  75│       ⢀⣴⣧       ⢀⣰⣿⣿⣿⣷⣾⣿⣿⣿⣿⣿ ▼

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


      esc go back   ^k actions   ↵ Go Back                     powered by termcast

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

      ›Area - Stock Price Orange braille do
       Area - Multi Series CPU + Memory ove │                                   ▲
       Area - Waves Purple + Magenta sine/c │ 211│                            ⣠ █
       Area - Blue Revenue Single series, a │    │                        ⢀⣴⣦⣼⣿ █
       Filled - Red Revenue Solid block gro │    │                    ⢠⣦⣄⣴⣿⣿⣿⣿⣿
       Filled - Green Temp Daily temperatur │ 189│                ⢀⣴⣷⣦⣿⣿⣿⣿⣿⣿⣿⣿⣿
       Filled - Yellow CPU High contrast on │    │             ⣠⣀⢠⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
       Filled - Magenta Waves Smooth curve  │    │           ⣠⣾⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
       Striped - Purple/Orange Warm alterna │ 167│       ⢀⣴⣿⣶⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
       Striped - Blue/Red High contrast str │    │    ⣰⣤⣰⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
       Striped - Theme Default primary + ac │    │⢀⣴⡄⢰⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
       Striped - Green/Yellow Nature-inspir │ 145│⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
       Striped - Red/Magenta Warm gradient  │     1      5     10     15     20
                                            │
                                            │ ─────────────────────────────────
       ↵ open detail   ↑↓ navigate   ^k act │                                   ▼

    "
  `)

  expect(text).toContain('›Area - Stock')
  expect(text).toContain('Graph Styles')
}, 30000)
