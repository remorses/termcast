import { describe, test, expect, beforeEach, afterEach } from 'vitest'
import {
  createDeeplink,
  DeeplinkType,
  LaunchType,
  executeSQL,
  runAppleScript,
} from './utils'
import { Database } from 'bun:sqlite'
import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'

describe('createDeeplink', () => {
  test('creates extension deeplink without options', () => {
    const url = createDeeplink({
      command: 'my-command',
    })
    expect(url).toMatchInlineSnapshot(`"raycast://extensions/my-command"`)
  })

  test('creates extension deeplink with all options', () => {
    const url = createDeeplink({
      command: 'my-command',
      launchType: LaunchType.Background,
      arguments: { foo: 'bar', count: 42 },
      fallbackText: 'Fallback text',
      ownerOrAuthorName: 'john-doe',
      extensionName: 'my-extension',
    })
    expect(url).toMatchInlineSnapshot(
      `"raycast://extensions/john-doe/my-extension/my-command?fallbackText=Fallback+text&launchType=background&arguments=%257B%2522foo%2522%253A%2522bar%2522%252C%2522count%2522%253A42%257D"`,
    )
  })

  test('creates extension deeplink with only extension name', () => {
    const url = createDeeplink({
      command: 'my-command',
      extensionName: 'my-extension',
      fallbackText: 'Open extension',
    })
    expect(url).toMatchInlineSnapshot(
      `"raycast://extensions/my-extension/my-command?fallbackText=Open+extension"`,
    )
  })

  test('creates script command deeplink', () => {
    const url = createDeeplink({
      type: DeeplinkType.ScriptCommand,
      command: 'my-script',
      arguments: ['arg1', 'arg2', 'arg3'],
    })
    expect(url).toMatchInlineSnapshot(
      `"raycast://script-commands/my-script?name=my-script&arguments=arg1%09arg2%09arg3"`,
    )
  })

  test('creates script command deeplink without arguments', () => {
    const url = createDeeplink({
      type: DeeplinkType.ScriptCommand,
      command: 'my-script',
    })
    expect(url).toMatchInlineSnapshot(
      `"raycast://script-commands/my-script?name=my-script"`,
    )
  })
})

describe('executeSQL', () => {
  const testDbPath = path.join(os.tmpdir(), 'test-db.sqlite')

  beforeEach(() => {
    // Create a test database
    const db = new Database(testDbPath)
    db.exec(`
      CREATE TABLE users (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        age INTEGER
      )
    `)
    db.exec(`
      INSERT INTO users (name, age) VALUES
      ('Alice', 30),
      ('Bob', 25),
      ('Charlie', 35)
    `)
    db.close()
  })

  afterEach(() => {
    // Clean up test database
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath)
    }
  })

  test('executes SELECT query', async () => {
    const results = await executeSQL(
      testDbPath,
      'SELECT * FROM users ORDER BY age',
    )
    expect(results).toMatchInlineSnapshot(`
      [
        {
          "age": 25,
          "id": 2,
          "name": "Bob",
        },
        {
          "age": 30,
          "id": 1,
          "name": "Alice",
        },
        {
          "age": 35,
          "id": 3,
          "name": "Charlie",
        },
      ]
    `)
  })

  test('executes query with WHERE clause', async () => {
    const results = await executeSQL(
      testDbPath,
      'SELECT name FROM users WHERE age > 30',
    )
    expect(results).toMatchInlineSnapshot(`
      [
        {
          "name": "Charlie",
        },
      ]
    `)
  })

  test('throws error for non-existent database', async () => {
    await expect(
      executeSQL('/non/existent/path.db', 'SELECT 1'),
    ).rejects.toThrow('Database file not found')
  })

  test('throws error for invalid SQL', async () => {
    await expect(executeSQL(testDbPath, 'INVALID SQL QUERY')).rejects.toThrow(
      'SQL execution failed',
    )
  })
})

describe('runAppleScript', () => {
  test('throws error on non-macOS platforms', async () => {
    if (process.platform !== 'darwin') {
      await expect(runAppleScript('return "Hello"')).rejects.toThrow(
        'runAppleScript is only supported on macOS',
      )
    }
  })

  // These tests will only run on macOS
  if (process.platform === 'darwin') {
    test('executes simple AppleScript', async () => {
      const result = await runAppleScript('return "Hello World"')
      expect(result).toBe('Hello World')
    })

    test('executes AppleScript with arguments', async () => {
      const script = `return "Hello " & item 1 of argv & " " & item 2 of argv`
      const result = await runAppleScript(script, ['John', 'Doe'])
      expect(result).toBe('Hello John, Doe')
    })

    test('executes JavaScript for Automation', async () => {
      const result = await runAppleScript('return "Hello from JS"', undefined, {
        language: 'JavaScript',
      })
      expect(result).toBe('Hello from JS')
    })

    test('parses custom output', async () => {
      interface CustomResult {
        message: string
        count: number
      }

      const result = await runAppleScript<CustomResult>(
        'return "{\\"message\\": \\"Test\\", \\"count\\": 42}"',
        undefined,
        {
          humanReadableOutput: false, // Keep the raw quoted output for JSON parsing
          parseOutput: ({ stdout }) => {
            // Remove surrounding quotes from AppleScript output
            const jsonStr =
              stdout.startsWith('"') && stdout.endsWith('"')
                ? stdout.slice(1, -1).replace(/\\"/g, '"')
                : stdout
            return JSON.parse(jsonStr)
          },
        },
      )
      expect(result).toEqual({ message: 'Test', count: 42 })
    })
  }
})
