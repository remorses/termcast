import { test, expect, afterEach, beforeEach } from 'vitest'
import { NodeTuiDriver } from '@termcast/cli/src/e2e-node'

let driver: NodeTuiDriver

beforeEach(() => {
    driver = new NodeTuiDriver('bun', ['src/examples/store.tsx'], {
        cols: 80,
        rows: 30,
    })
})

afterEach(() => {
    driver?.dispose()
})

test('Store extension - searching for spiceblow', async () => {
    // Wait for store interface to load
    const initialOutput = await driver.text({
        waitFor: (text) => {
            // Wait until we see the store title
            return text.includes('Store - Install Extensions')
        },
        timeout: 15000,
    })

    // Verify the store interface loads
    expect(initialOutput).toContain('Store - Install Extensions')

    // Store the initial snapshot
    expect(initialOutput).toMatchInlineSnapshot(`
      "

      Store - Install Extensions ───────────────────────────────────────────────
      Search extensions...


      ↵ select   ↑↓ navigate   ^k actions"
    `)

    // Type "spiceblow" in the search bar
    await driver.keys.type('spiceblow')

    // Wait a bit for the search to trigger
    await driver.waitIdle({ timeout: 5000 })

    // Get the output after typing
    const afterSearchOutput = await driver.text()

    // Store the snapshot after searching for spiceblow
    expect(afterSearchOutput).toMatchInlineSnapshot(`
      "

       Store - Install Extensions ───────────────────────────────────────────────
       spiceblow
      ›Raycast Wallpaper Get and set Raycast official 2acommands.12,938 downloads
       Raycast Icons Browse, copy and modify Raycast ico1scommand 4,272 downloads
       Raycast Port This allows you to use Raycast featur3scommandsR491 downloads
       Raycast MonkeyType Theme Explorer This "Raycast Mon1ecommandh540"downloadsn p
       Raycast Arcade Play simple and fun ASCII games i6 commands 6,039 downloads
       Raycast Notification This extension makes it easy1tcommanda1,308tdownloads
       Raycast Explorer Explore snippets, prompts, and5ccommandse23,807 downloads
       Raycast Focus Stats View Raycast's Focus session s3acommands 122 downloads
       Apple Intelligence Use Apple Intelligence from13hcommandst21,953 downloads
       Surge Switch outbound mode, change proxy tunnel 4ncommands 1,195 downloads
       Google Gemini Use the Google Gemini from the c16fcommandsa34,031 downloads
       Google PaLM Use the Google PaLM 2 API in Raycast.10 commands 740 downloads
       iA Writer Create or search notes with Raycast     3 commands 486 downloads
       Zoxide Raycast integration with the zoxide command2lcommands 347 downloads
       Motion Preview Preview Lottie and Rive Animations i1 command 125 downloads
       Translate.ge Raycast plugin for translating georgia1 commando101 downloads
       Search Lightning Nodes A Raycast extension for searc1icommandt53ndownloads
       Wemo Control your Wemo devices from Raycast         1 command 43 downloads
       System Monitor Show information and usage relat2dcommands 74,596 downloads
       Ollama AI Perform Local Inference with Ollama 21 commands 26,466 downloads
       Timezone Converter Converts any time to any time1ocommand 13,560 downloads
       Google Bard Perform Actions with Google Bard  11 commands 11,585 downloads
       SVGO Optimize SVG vector graphics files.        3 commands 2,246 downloads
       Airtable List your Airtable bases and follow deep1lcommand 1,679 downloads
       Datadog Access Datadog resources                5 commands 1,094 downloads"
    `)
}, 30000)
