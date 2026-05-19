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
      return /Area.*Price/i.test(text) && text.includes('│')
    },
    timeout: 10000,
  })

  expect(text).toMatchInlineSnapshot(`
    "


       Graph Styles ─────────────────────────────────────────────────────────────

       > Search...

      ›Area - Stock PriceOrange ...lle dots │ 211│                            ⣠ ▲
       Area - ...i Series CPU + M...overlay │    │                        ⢀⣴⣦⣼⣿ █
       Area - Wave Purple + M...sine/cosine │    │                    ⢠⣦⣄⣴⣿⣿⣿⣿⣿ █
       Area - ... Revenu Single ...to range │ 189│                ⢀⣴⣷⣦⣿⣿⣿⣿⣿⣿⣿⣿⣿ █
       Filled ... RevenueSolid b...th chart │    │             ⣠⣀⢠⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿ ▀
       Filled ...een Tem Daily t...re curve │    │           ⣠⣾⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
       Filled ...llow CPUHigh co... on dark │ 167│       ⢀⣴⣿⣶⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
       Filled -...nta Wave Smooth... blocks │    │    ⣰⣤⣰⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
       Striped -...le/Orang Warm a...colors │    │⢀⣴⡄⢰⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
       Striped - Blue/Re High co... stripes │ 145│⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
       Striped ...e Defaultprimar...o prop) │     1      5     10     15     20
       Striped - Green/Yello Natur...spired │
       Striped ...d/MagentaWarm g...nt feel │ ─────────────────────────────────
                                            │
                                            │ Variant: area
       ↵ open detail   ↑↓ navigate   ^k act │                                   ▼

    "
  `)

  expect(text).toMatch(/[\u2800-\u28FF]/)
  expect(text).toContain('Price')
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
      return /›Filled.*Revenue/i.test(text)
    },
    timeout: 5000,
  })

  expect(text).toMatchInlineSnapshot(`
    "


       Graph Styles ─────────────────────────────────────────────────────────────

       > Search...

       Area - Stock PriceOrange ...lle dots │ Revenue Growth                    ▲
       Area - ...i Series CPU + M...overlay │                                   █
       Area - Wave Purple + M...sine/cosine │
       Area - ... Revenu Single ...to range │ Quarterly revenue from $10k** to
      ›Filled ... RevenueSolid b...th chart │ **$75k.
       Filled ...een Tem Daily t...re curve │ Q1: $10k  → Q2: $25k (+150%)
       Filled ...llow CPUHigh co... on dark │ Q2: $25k  → Q3: $50k (+100%)
       Filled -...nta Wave Smooth... blocks │ Q3: $50k  → Q4: $75k (+50%)
       Striped -...le/Orang Warm a...colors │
       Striped - Blue/Re High co... stripes │ 78│                             ▖
       Striped ...e Defaultprimar...o prop) │   │                         ▖▌▖▌▌
       Striped - Green/Yello Natur...spired │   │                     ▖▖▖▌▌▌▌▌▌
       Striped ...d/MagentaWarm g...nt feel │ 54│                   ▖▌▌▌▌▌▌▌▌▌▌
                                            │   │               ▖▖▖▌▌▌▌▌▌▌▌▌▌▌▌
                                            │   │           ▖ ▖▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌
       ↵ open detail   ↑↓ navigate   ^k act │ 31│         ▖▌▌▖▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌ ▼

    "
  `)

  expect(text).toMatch(/[▌▘▖]/)
  expect(text).toContain('›Filled')
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
      return /›Striped.*Warm/i.test(text)
    },
    timeout: 5000,
  })

  expect(text).toMatchInlineSnapshot(`
    "


       Graph Styles ─────────────────────────────────────────────────────────────

       > Search...

       Area - Stock PriceOrange ...lle dots │ 211│                            ▖ ▲
       Area - ...i Series CPU + M...overlay │    │                         ▖▖▌▌ █
       Area - Wave Purple + M...sine/cosine │    │                     ▖▖▖▌▌▌▌▌ █
       Area - ... Revenu Single ...to range │ 189│                ▖▖▌▖▌▌▌▌▌▌▌▌▌
       Filled ... RevenueSolid b...th chart │    │             ▖▖▖▌▌▌▌▌▌▌▌▌▌▌▌▌
       Filled ...een Tem Daily t...re curve │    │           ▖▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌
       Filled ...llow CPUHigh co... on dark │ 167│       ▖▖▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌
       Filled -...nta Wave Smooth... blocks │    │    ▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌
      ›Striped -...le/Orang Warm a...colors │    │▖▌▖▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌
       Striped - Blue/Re High co... stripes │ 145│▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌
       Striped ...e Defaultprimar...o prop) │     1      5     10     15     20
       Striped - Green/Yello Natur...spired │
       Striped ...d/MagentaWarm g...nt feel │ ─────────────────────────────────
                                            │
                                            │ Even cols: Purple
       ↵ open detail   ↑↓ navigate   ^k act │                                   ▼

    "
  `)

  expect(text).toMatch(/[▌▘▖]/)
  expect(text).toContain('›Striped')
}, 30000)

test('markdown + metadata detail view in list', async () => {
  await session.text({
    waitFor: (text) => {
      return /Area.*Series/i.test(text) && text.includes('│')
    },
    timeout: 10000,
  })

  // Navigate to 2nd item: "Area - Multi Series" (has markdown)
  await session.press('down')

  const text = await session.text({
    waitFor: (text) => {
      return /›Area.*Series/i.test(text) && text.includes('System Metrics')
    },
    timeout: 5000,
  })

  expect(text).toMatchInlineSnapshot(`
    "


       Graph Styles ─────────────────────────────────────────────────────────────

       > Search...

       Area - Stock PriceOrange ...lle dots │ System Metrics                    ▲
      ›Area - ...i Series CPU + M...overlay │                                   ▀
       Area - Wave Purple + M...sine/cosine │
       Area - ... Revenu Single ...to range │ CPU usage (blue) vs memory usage (
       Filled ... RevenueSolid b...th chart │ green) over 24 hours.
       Filled ...een Tem Daily t...re curve │ - Peak CPU at 90% around 15h
       Filled ...llow CPUHigh co... on dark │ - Memory steadily climbing to 86%
       Filled -...nta Wave Smooth... blocks │ - CPU has high variance, memory
       Striped -...le/Orang Warm a...colors │   is monotonic
       Striped - Blue/Re High co... stripes │
       Striped ...e Defaultprimar...o prop) │ 100│
       Striped - Green/Yello Natur...spired │    │                   ⣠⣶⣧   ⣀⣠⣤⣶
       Striped ...d/MagentaWarm g...nt feel │  75│       ⢀⣴⣧       ⢀⣰⣿⣿⣿⣷⣾⣿⣿⣿⣿⣿
                                            │    │      ⢀⣾⣿⣿⣧⢀⣀⣤⣶⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
                                            │    │   ⢀⣾⣶⣾⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
       ↵ open detail   ↑↓ navigate   ^k act │  50│⣀⣀⣠⣾⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿ ▼

    "
  `)

  expect(text).toContain('System Metrics')
  expect(text).toMatch(/[\u2800-\u28FF]/)
}, 30000)

test('enter pushes full detail view with graph', async () => {
  await session.text({
    waitFor: (text) => {
      return /Area.*Price/i.test(text) && text.includes('│')
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
      return /Area.*Price/i.test(text) && text.includes('│')
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
      return /›Area.*Price/i.test(text) && text.includes('Graph Styles')
    },
    timeout: 5000,
  })

  expect(text).toMatchInlineSnapshot(`
    "


       Graph Styles ─────────────────────────────────────────────────────────────

       > Search...

      ›Area - Stock PriceOrange ...lle dots │ 211│                            ⣠ ▲
       Area - ...i Series CPU + M...overlay │    │                        ⢀⣴⣦⣼⣿ █
       Area - Wave Purple + M...sine/cosine │    │                    ⢠⣦⣄⣴⣿⣿⣿⣿⣿ █
       Area - ... Revenu Single ...to range │ 189│                ⢀⣴⣷⣦⣿⣿⣿⣿⣿⣿⣿⣿⣿ █
       Filled ... RevenueSolid b...th chart │    │             ⣠⣀⢠⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿ ▀
       Filled ...een Tem Daily t...re curve │    │           ⣠⣾⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
       Filled ...llow CPUHigh co... on dark │ 167│       ⢀⣴⣿⣶⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
       Filled -...nta Wave Smooth... blocks │    │    ⣰⣤⣰⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
       Striped -...le/Orang Warm a...colors │    │⢀⣴⡄⢰⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
       Striped - Blue/Re High co... stripes │ 145│⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
       Striped ...e Defaultprimar...o prop) │     1      5     10     15     20
       Striped - Green/Yello Natur...spired │
       Striped ...d/MagentaWarm g...nt feel │ ─────────────────────────────────
                                            │
                                            │ Variant: area
       ↵ open detail   ↑↓ navigate   ^k act │                                   ▼

    "
  `)

  expect(text).toContain('›Area')
  expect(text).toContain('Graph Styles')
}, 30000)
