import { describe, test, expect } from 'bun:test'
import path from 'node:path'
import { buildExtensionCommands } from './build'

describe('buildExtensionCommands', () => {
  test('builds a simple extension with multiple commands', async () => {
    const fixtureDir = path.join(process.cwd(), 'fixtures/simple-extension')
    const result = await buildExtensionCommands({
      extensionPath: fixtureDir,
      target: 'node',
    })

    // Replace the user-specific base path with a constant placeholder
    const resultString = JSON.stringify(result, null, 2)
    const normalizedString = resultString.replaceAll(
      process.cwd(),
      '/BASE_PATH',
    )

    expect(normalizedString).toMatchInlineSnapshot(`
      "{
        "commands": [
          {
            "name": "list-items",
            "title": "List Items",
            "subtitle": "Shows a list of items",
            "description": "Displays a simple list with some items",
            "mode": "view",
            "filePath": "/BASE_PATH/fixtures/simple-extension/src/list-items.tsx",
            "exists": true,
            "bundledPath": "/BASE_PATH/fixtures/simple-extension/.termcast-bundle/list-items.js"
          },
          {
            "name": "search-items",
            "title": "Search Items",
            "subtitle": "Search through items",
            "description": "Search and filter through a list of items",
            "mode": "view",
            "filePath": "/BASE_PATH/fixtures/simple-extension/src/search-items.tsx",
            "exists": true,
            "bundledPath": "/BASE_PATH/fixtures/simple-extension/.termcast-bundle/search-items.js"
          },
          {
            "name": "oauth",
            "title": "Google Oauth",
            "subtitle": "auth",
            "description": "",
            "mode": "view",
            "filePath": "/BASE_PATH/fixtures/simple-extension/src/oauth.tsx",
            "exists": true,
            "bundledPath": "/BASE_PATH/fixtures/simple-extension/.termcast-bundle/oauth.js"
          },
          {
            "name": "use-promise-demo",
            "title": "usePromise Demo",
            "subtitle": "Demonstrates usePromise hook",
            "description": "Shows how to use the usePromise hook from @raycast/utils",
            "mode": "view",
            "filePath": "/BASE_PATH/fixtures/simple-extension/src/use-promise-demo.tsx",
            "exists": true,
            "bundledPath": "/BASE_PATH/fixtures/simple-extension/.termcast-bundle/use-promise-demo.js"
          },
          {
            "name": "show-state",
            "title": "Show State",
            "subtitle": "Display current state as JSON",
            "description": "Shows the current application state in JSON format",
            "mode": "view",
            "filePath": "/BASE_PATH/fixtures/simple-extension/src/show-state.tsx",
            "exists": true,
            "bundledPath": "/BASE_PATH/fixtures/simple-extension/.termcast-bundle/show-state.js"
          },
          {
            "name": "with-arguments",
            "title": "With Arguments",
            "subtitle": "Command with arguments",
            "description": "Demonstrates command arguments (text, password, dropdown)",
            "mode": "view",
            "arguments": [
              {
                "name": "query",
                "type": "text",
                "placeholder": "Search query",
                "required": true
              },
              {
                "name": "secretKey",
                "type": "password",
                "placeholder": "Secret key"
              },
              {
                "name": "category",
                "type": "dropdown",
                "placeholder": "Category",
                "data": [
                  {
                    "title": "Work",
                    "value": "work"
                  },
                  {
                    "title": "Personal",
                    "value": "personal"
                  },
                  {
                    "title": "Other",
                    "value": "other"
                  }
                ]
              }
            ],
            "filePath": "/BASE_PATH/fixtures/simple-extension/src/with-arguments.tsx",
            "exists": true,
            "bundledPath": "/BASE_PATH/fixtures/simple-extension/.termcast-bundle/with-arguments.js"
          },
          {
            "name": "quick-action",
            "title": "Quick Action",
            "subtitle": "No-view command",
            "description": "Copies current timestamp to clipboard without showing a view",
            "mode": "no-view",
            "filePath": "/BASE_PATH/fixtures/simple-extension/src/quick-action.tsx",
            "exists": true,
            "bundledPath": "/BASE_PATH/fixtures/simple-extension/.termcast-bundle/quick-action.js"
          }
        ],
        "bundleDir": "/BASE_PATH/fixtures/simple-extension/.termcast-bundle"
      }"
    `)
  })
})
