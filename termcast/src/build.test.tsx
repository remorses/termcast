import { describe, test, expect } from 'bun:test'
import fs from 'node:fs'
import path from 'node:path'
import * as react from 'react'
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
            "checkedPaths": [
              "/BASE_PATH/fixtures/simple-extension/list-items.tsx",
              "/BASE_PATH/fixtures/simple-extension/list-items.ts",
              "/BASE_PATH/fixtures/simple-extension/list-items.jsx",
              "/BASE_PATH/fixtures/simple-extension/list-items.js",
              "/BASE_PATH/fixtures/simple-extension/src/list-items.tsx",
              "/BASE_PATH/fixtures/simple-extension/src/list-items.ts",
              "/BASE_PATH/fixtures/simple-extension/src/list-items.jsx",
              "/BASE_PATH/fixtures/simple-extension/src/list-items.js",
              "/BASE_PATH/fixtures/simple-extension/list-items/index.tsx",
              "/BASE_PATH/fixtures/simple-extension/list-items/index.ts",
              "/BASE_PATH/fixtures/simple-extension/list-items/index.jsx",
              "/BASE_PATH/fixtures/simple-extension/list-items/index.js",
              "/BASE_PATH/fixtures/simple-extension/src/list-items/index.tsx",
              "/BASE_PATH/fixtures/simple-extension/src/list-items/index.ts",
              "/BASE_PATH/fixtures/simple-extension/src/list-items/index.jsx",
              "/BASE_PATH/fixtures/simple-extension/src/list-items/index.js"
            ],
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
            "checkedPaths": [
              "/BASE_PATH/fixtures/simple-extension/search-items.tsx",
              "/BASE_PATH/fixtures/simple-extension/search-items.ts",
              "/BASE_PATH/fixtures/simple-extension/search-items.jsx",
              "/BASE_PATH/fixtures/simple-extension/search-items.js",
              "/BASE_PATH/fixtures/simple-extension/src/search-items.tsx",
              "/BASE_PATH/fixtures/simple-extension/src/search-items.ts",
              "/BASE_PATH/fixtures/simple-extension/src/search-items.jsx",
              "/BASE_PATH/fixtures/simple-extension/src/search-items.js",
              "/BASE_PATH/fixtures/simple-extension/search-items/index.tsx",
              "/BASE_PATH/fixtures/simple-extension/search-items/index.ts",
              "/BASE_PATH/fixtures/simple-extension/search-items/index.jsx",
              "/BASE_PATH/fixtures/simple-extension/search-items/index.js",
              "/BASE_PATH/fixtures/simple-extension/src/search-items/index.tsx",
              "/BASE_PATH/fixtures/simple-extension/src/search-items/index.ts",
              "/BASE_PATH/fixtures/simple-extension/src/search-items/index.jsx",
              "/BASE_PATH/fixtures/simple-extension/src/search-items/index.js"
            ],
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
            "checkedPaths": [
              "/BASE_PATH/fixtures/simple-extension/oauth.tsx",
              "/BASE_PATH/fixtures/simple-extension/oauth.ts",
              "/BASE_PATH/fixtures/simple-extension/oauth.jsx",
              "/BASE_PATH/fixtures/simple-extension/oauth.js",
              "/BASE_PATH/fixtures/simple-extension/src/oauth.tsx",
              "/BASE_PATH/fixtures/simple-extension/src/oauth.ts",
              "/BASE_PATH/fixtures/simple-extension/src/oauth.jsx",
              "/BASE_PATH/fixtures/simple-extension/src/oauth.js",
              "/BASE_PATH/fixtures/simple-extension/oauth/index.tsx",
              "/BASE_PATH/fixtures/simple-extension/oauth/index.ts",
              "/BASE_PATH/fixtures/simple-extension/oauth/index.jsx",
              "/BASE_PATH/fixtures/simple-extension/oauth/index.js",
              "/BASE_PATH/fixtures/simple-extension/src/oauth/index.tsx",
              "/BASE_PATH/fixtures/simple-extension/src/oauth/index.ts",
              "/BASE_PATH/fixtures/simple-extension/src/oauth/index.jsx",
              "/BASE_PATH/fixtures/simple-extension/src/oauth/index.js"
            ],
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
            "checkedPaths": [
              "/BASE_PATH/fixtures/simple-extension/use-promise-demo.tsx",
              "/BASE_PATH/fixtures/simple-extension/use-promise-demo.ts",
              "/BASE_PATH/fixtures/simple-extension/use-promise-demo.jsx",
              "/BASE_PATH/fixtures/simple-extension/use-promise-demo.js",
              "/BASE_PATH/fixtures/simple-extension/src/use-promise-demo.tsx",
              "/BASE_PATH/fixtures/simple-extension/src/use-promise-demo.ts",
              "/BASE_PATH/fixtures/simple-extension/src/use-promise-demo.jsx",
              "/BASE_PATH/fixtures/simple-extension/src/use-promise-demo.js",
              "/BASE_PATH/fixtures/simple-extension/use-promise-demo/index.tsx",
              "/BASE_PATH/fixtures/simple-extension/use-promise-demo/index.ts",
              "/BASE_PATH/fixtures/simple-extension/use-promise-demo/index.jsx",
              "/BASE_PATH/fixtures/simple-extension/use-promise-demo/index.js",
              "/BASE_PATH/fixtures/simple-extension/src/use-promise-demo/index.tsx",
              "/BASE_PATH/fixtures/simple-extension/src/use-promise-demo/index.ts",
              "/BASE_PATH/fixtures/simple-extension/src/use-promise-demo/index.jsx",
              "/BASE_PATH/fixtures/simple-extension/src/use-promise-demo/index.js"
            ],
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
            "checkedPaths": [
              "/BASE_PATH/fixtures/simple-extension/show-state.tsx",
              "/BASE_PATH/fixtures/simple-extension/show-state.ts",
              "/BASE_PATH/fixtures/simple-extension/show-state.jsx",
              "/BASE_PATH/fixtures/simple-extension/show-state.js",
              "/BASE_PATH/fixtures/simple-extension/src/show-state.tsx",
              "/BASE_PATH/fixtures/simple-extension/src/show-state.ts",
              "/BASE_PATH/fixtures/simple-extension/src/show-state.jsx",
              "/BASE_PATH/fixtures/simple-extension/src/show-state.js",
              "/BASE_PATH/fixtures/simple-extension/show-state/index.tsx",
              "/BASE_PATH/fixtures/simple-extension/show-state/index.ts",
              "/BASE_PATH/fixtures/simple-extension/show-state/index.jsx",
              "/BASE_PATH/fixtures/simple-extension/show-state/index.js",
              "/BASE_PATH/fixtures/simple-extension/src/show-state/index.tsx",
              "/BASE_PATH/fixtures/simple-extension/src/show-state/index.ts",
              "/BASE_PATH/fixtures/simple-extension/src/show-state/index.jsx",
              "/BASE_PATH/fixtures/simple-extension/src/show-state/index.js"
            ],
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
            "checkedPaths": [
              "/BASE_PATH/fixtures/simple-extension/with-arguments.tsx",
              "/BASE_PATH/fixtures/simple-extension/with-arguments.ts",
              "/BASE_PATH/fixtures/simple-extension/with-arguments.jsx",
              "/BASE_PATH/fixtures/simple-extension/with-arguments.js",
              "/BASE_PATH/fixtures/simple-extension/src/with-arguments.tsx",
              "/BASE_PATH/fixtures/simple-extension/src/with-arguments.ts",
              "/BASE_PATH/fixtures/simple-extension/src/with-arguments.jsx",
              "/BASE_PATH/fixtures/simple-extension/src/with-arguments.js",
              "/BASE_PATH/fixtures/simple-extension/with-arguments/index.tsx",
              "/BASE_PATH/fixtures/simple-extension/with-arguments/index.ts",
              "/BASE_PATH/fixtures/simple-extension/with-arguments/index.jsx",
              "/BASE_PATH/fixtures/simple-extension/with-arguments/index.js",
              "/BASE_PATH/fixtures/simple-extension/src/with-arguments/index.tsx",
              "/BASE_PATH/fixtures/simple-extension/src/with-arguments/index.ts",
              "/BASE_PATH/fixtures/simple-extension/src/with-arguments/index.jsx",
              "/BASE_PATH/fixtures/simple-extension/src/with-arguments/index.js"
            ],
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
            "checkedPaths": [
              "/BASE_PATH/fixtures/simple-extension/quick-action.tsx",
              "/BASE_PATH/fixtures/simple-extension/quick-action.ts",
              "/BASE_PATH/fixtures/simple-extension/quick-action.jsx",
              "/BASE_PATH/fixtures/simple-extension/quick-action.js",
              "/BASE_PATH/fixtures/simple-extension/src/quick-action.tsx",
              "/BASE_PATH/fixtures/simple-extension/src/quick-action.ts",
              "/BASE_PATH/fixtures/simple-extension/src/quick-action.jsx",
              "/BASE_PATH/fixtures/simple-extension/src/quick-action.js",
              "/BASE_PATH/fixtures/simple-extension/quick-action/index.tsx",
              "/BASE_PATH/fixtures/simple-extension/quick-action/index.ts",
              "/BASE_PATH/fixtures/simple-extension/quick-action/index.jsx",
              "/BASE_PATH/fixtures/simple-extension/quick-action/index.js",
              "/BASE_PATH/fixtures/simple-extension/src/quick-action/index.tsx",
              "/BASE_PATH/fixtures/simple-extension/src/quick-action/index.ts",
              "/BASE_PATH/fixtures/simple-extension/src/quick-action/index.jsx",
              "/BASE_PATH/fixtures/simple-extension/src/quick-action/index.js"
            ],
            "bundledPath": "/BASE_PATH/fixtures/simple-extension/.termcast-bundle/quick-action.js"
          },
          {
            "name": "throw-error",
            "title": "Throw Error",
            "subtitle": "Test error handling",
            "description": "Command that throws an error at root scope",
            "mode": "view",
            "filePath": "/BASE_PATH/fixtures/simple-extension/src/throw-error.tsx",
            "exists": true,
            "checkedPaths": [
              "/BASE_PATH/fixtures/simple-extension/throw-error.tsx",
              "/BASE_PATH/fixtures/simple-extension/throw-error.ts",
              "/BASE_PATH/fixtures/simple-extension/throw-error.jsx",
              "/BASE_PATH/fixtures/simple-extension/throw-error.js",
              "/BASE_PATH/fixtures/simple-extension/src/throw-error.tsx",
              "/BASE_PATH/fixtures/simple-extension/src/throw-error.ts",
              "/BASE_PATH/fixtures/simple-extension/src/throw-error.jsx",
              "/BASE_PATH/fixtures/simple-extension/src/throw-error.js",
              "/BASE_PATH/fixtures/simple-extension/throw-error/index.tsx",
              "/BASE_PATH/fixtures/simple-extension/throw-error/index.ts",
              "/BASE_PATH/fixtures/simple-extension/throw-error/index.jsx",
              "/BASE_PATH/fixtures/simple-extension/throw-error/index.js",
              "/BASE_PATH/fixtures/simple-extension/src/throw-error/index.tsx",
              "/BASE_PATH/fixtures/simple-extension/src/throw-error/index.ts",
              "/BASE_PATH/fixtures/simple-extension/src/throw-error/index.jsx",
              "/BASE_PATH/fixtures/simple-extension/src/throw-error/index.js"
            ],
            "bundledPath": "/BASE_PATH/fixtures/simple-extension/.termcast-bundle/throw-error.js"
          }
        ],
        "bundleDir": "/BASE_PATH/fixtures/simple-extension/.termcast-bundle"
      }"
    `)
  })

  // Regression: Bun turns pure-ESM react shims into empty __commonJS bodies, so
  // @termcast/utils hooks crash with `import_react.useRef is not a function`.
  // The virtual react module must assign the whole object to module.exports.
  test('react virtual module exposes hooks through CJS __toESM interop', async () => {
    const fixtureDir = path.join(process.cwd(), 'fixtures/simple-extension')
    const result = await buildExtensionCommands({
      extensionPath: fixtureDir,
      format: 'esm',
      target: 'bun',
      hotReload: true,
    })

    const bundledPath = result.commands.find((command) => {
      return command.name === 'use-promise-demo'
    })?.bundledPath
    if (!bundledPath) {
      throw new Error('use-promise-demo bundle was not generated')
    }

    const code = fs.readFileSync(bundledPath, 'utf-8')
    const shimMatch = code.match(
      /\/\/ globals:react\nvar require_react = __commonJS\(([\s\S]*?)\n\}\);/,
    )
    if (!shimMatch) {
      throw new Error('generated bundle did not contain the React virtual module')
    }

    const shimSource = shimMatch[0]
    expect(shimSource).toContain('module.exports = globalThis.react')
    // Bare local vars with no exports assignment is the broken Bun ESM interop shape
    expect(shimSource).not.toMatch(/var useRef\s*=\s*globalThis\.react\.useRef/)

    // Same helpers Bun emits for CJS↔ESM interop. Evaluating the real shim body
    // fails if it only declares locals and never assigns module.exports.
    const create = Object.create
    const getProtoOf = Object.getPrototypeOf
    const defProp = Object.defineProperty
    const getOwnPropNames = Object.getOwnPropertyNames
    const hasOwnProp = Object.prototype.hasOwnProperty
    function accessProp(this: object, key: string) {
      return (this as Record<string, unknown>)[key]
    }
    const toESM = (mod: object | null, isNodeMode?: number) => {
      const target = mod != null ? create(getProtoOf(mod)) : {}
      const to =
        isNodeMode || !mod || !(mod as { __esModule?: boolean }).__esModule
          ? defProp(target, 'default', { value: mod, enumerable: true })
          : target
      if (mod) {
        for (const key of getOwnPropNames(mod)) {
          if (!hasOwnProp.call(to, key)) {
            defProp(to, key, {
              get: accessProp.bind(mod, key),
              enumerable: true,
            })
          }
        }
      }
      return to as Record<string, unknown>
    }
    const commonJS = (
      cb: (exports: object, module?: { exports: object }) => void,
    ) => {
      let mod: { exports: object } | undefined
      return () => {
        if (!mod) {
          mod = { exports: {} }
          cb(mod.exports, mod)
        }
        return mod.exports
      }
    }

    const previousReact = (globalThis as { react?: typeof react }).react
    ;(globalThis as { react: typeof react }).react = react
    try {
      const requireReact = new Function(
        '__commonJS',
        `${shimSource}\nreturn require_react;`,
      )(commonJS) as () => object
      const importReact = toESM(requireReact(), 1)

      expect(typeof importReact.useRef).toBe('function')
      expect(typeof importReact.useState).toBe('function')
      expect(typeof importReact.useEffect).toBe('function')
      expect(typeof (importReact.default as typeof react | undefined)?.useRef).toBe(
        'function',
      )
    } finally {
      if (previousReact === undefined) {
        delete (globalThis as { react?: typeof react }).react
      } else {
        ;(globalThis as { react: typeof react }).react = previousReact
      }
    }
  })
})
