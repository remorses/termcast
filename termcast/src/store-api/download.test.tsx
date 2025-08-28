import { describe, test, expect } from 'vitest'
import { downloadExtension } from './download'
describe('downloadExtension', () => {
    test('downloads a real raycast extension and returns filenames', async () => {
        // Test with a timeout since it needs to download from the API
        const files = await downloadExtension({
            author: 'xmorse',
            extension: 'spiceblow-database',
        })

        const filenames = files.map((f) => f.filename).sort()

        // Just check we get some files
        expect(filenames).toMatchInlineSnapshot(`
          [
            "assets/extension-icon.png",
            "package.json",
            "search-database.js",
            "search-database.js.map",
          ]
        `)
        expect(filenames.length).toBeGreaterThan(0)

        // Check package.json commands field
        const packageJson = files.find(
            (f) => f.filename === 'spiceblow-database/package.json',
        )
        const packageData = JSON.parse(packageJson?.buffer.toString()!)
        expect(packageData.commands).toMatchInlineSnapshot(`
          [
            {
              "description": "Search and update your PostgreSQL or MySQL database",
              "mode": "view",
              "name": "search-database",
              "title": "Manage Database",
            },
          ]
        `)
    }, 10000)
})
