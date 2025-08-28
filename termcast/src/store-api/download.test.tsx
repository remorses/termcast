import { describe, test, expect } from 'vitest'
import { downloadExtension } from './download'

describe('downloadExtension', () => {
    test('downloads a real raycast extension and returns filenames', async () => {
        // Test with a timeout since it needs to download from the API
        const files = await downloadExtension({
            author: 'xmorse',
            extension: 'spiceblow-database',
        })

        const filenames = files.map(f => f.filename).sort()

        // Just check we get some files
        expect(filenames).toMatchInlineSnapshot(`
          [
            "spiceblow-database/assets/extension-icon.png",
            "spiceblow-database/package.json",
            "spiceblow-database/search-database.js",
            "spiceblow-database/search-database.js.map",
          ]
        `)
        expect(filenames.length).toBeGreaterThan(0)
    }, 10000)
})
