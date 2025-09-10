import { describe, test, expect } from 'bun:test'
import path from 'node:path'
import { buildExtensionCommands } from './build'

describe('buildExtensionCommands', () => {
  test('builds a simple extension with multiple commands', async () => {
    const fixtureDir = path.join(process.cwd(), 'fixtures/simple-extension')
    const result = await buildExtensionCommands({
      extensionPath: fixtureDir,
    })

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
              {
                "bundledPath": "/Users/morse/Documents/GitHub/termcast/termcast/fixtures/simple-extension/.termcast-bundle/oauth.js",
                "description": "",
                "exists": true,
                "filePath": "/Users/morse/Documents/GitHub/termcast/termcast/fixtures/simple-extension/src/oauth.tsx",
                "mode": "view",
                "name": "oauth",
                "subtitle": "auth",
                "title": "Google Oauth",
              },
              {
                "bundledPath": "/Users/morse/Documents/GitHub/termcast/termcast/fixtures/simple-extension/.termcast-bundle/use-promise-demo.js",
                "description": "Shows how to use the usePromise hook from @raycast/utils",
                "exists": true,
                "filePath": "/Users/morse/Documents/GitHub/termcast/termcast/fixtures/simple-extension/src/use-promise-demo.tsx",
                "mode": "view",
                "name": "use-promise-demo",
                "subtitle": "Demonstrates usePromise hook",
                "title": "usePromise Demo",
              },
              {
                "bundledPath": "/Users/morse/Documents/GitHub/termcast/termcast/fixtures/simple-extension/.termcast-bundle/show-state.js",
                "description": "Shows the current application state in JSON format",
                "exists": true,
                "filePath": "/Users/morse/Documents/GitHub/termcast/termcast/fixtures/simple-extension/src/show-state.tsx",
                "mode": "view",
                "name": "show-state",
                "subtitle": "Display current state as JSON",
                "title": "Show State",
              },
            ],
          }
        `)
  })
})
