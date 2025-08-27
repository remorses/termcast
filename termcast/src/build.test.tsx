import { describe, test, expect } from 'vitest'
import path from 'node:path'
import { buildExtensionCommands } from './build'

describe('buildExtensionCommands', () => {
    test('builds a simple extension with multiple commands', async () => {
        const fixtureDir = path.join(process.cwd(), 'fixtures/simple-extension')
        const result = await buildExtensionCommands({ extensionPath: fixtureDir })
        
        expect(result).toMatchInlineSnapshot(`
          {
            "bundleDir": "/Users/morse/Documents/GitHub/termcast/termcast/fixtures/simple-extension/.termcast-bundle",
            "commands": [
              {
                "bundledPath": "/Users/morse/Documents/GitHub/termcast/termcast/fixtures/simple-extension/.termcast-bundle/list-items.js",
                "description": "Displays a simple list with some items",
                "exists": true,
                "filePath": "/Users/morse/Documents/GitHub/termcast/termcast/fixtures/simple-extension/src/list-items.tsx",
                "mode": "view",
                "name": "list-items",
                "subtitle": "Shows a list of items",
                "title": "List Items",
              },
              {
                "bundledPath": "/Users/morse/Documents/GitHub/termcast/termcast/fixtures/simple-extension/.termcast-bundle/search-items.js",
                "description": "Search and filter through a list of items",
                "exists": true,
                "filePath": "/Users/morse/Documents/GitHub/termcast/termcast/fixtures/simple-extension/src/search-items.tsx",
                "mode": "view",
                "name": "search-items",
                "subtitle": "Search through items",
                "title": "Search Items",
              },
            ],
          }
        `)
    })
})