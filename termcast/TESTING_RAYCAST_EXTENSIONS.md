# Testing Raycast Store Extensions with Termcast

This document describes how to test extensions from the Raycast store to verify they work with termcast.

## Overview

The workflow involves:
1. Downloading an extension from the Raycast store
2. Installing its dependencies
3. Running it in dev mode
4. Creating a vitest test file to automate testing

## Step 1: Download the Extension

Use the `termcast download` command to download an extension from the raycast/extensions repository:

```bash
cd termcast
bun run src/cli.tsx download <extension-name> -o extensions
```

This downloads the extension source code into `extensions/<extension-name>/`.

**Example:**
```bash
bun run src/cli.tsx download synonyms -o extensions
```

## Step 2: Install Dependencies

Navigate to the extension directory and install dependencies:

```bash
cd extensions/<extension-name>
bun install
```

## Step 3: Run in Dev Mode

Test the extension manually first to see if it loads:

```bash
cd termcast
bun run src/cli.tsx dev extensions/<extension-name>
```

This will launch the extension and show either:
- A **command list** if the extension has multiple commands
- A **preferences form** if the extension requires configuration
- The **main view** directly if the extension has a single command with no required preferences

## Step 4: Create a Vitest Test File

Create a test file in `src/examples/<extension-name>.vitest.tsx` to automate testing.

### Test File Structure

```tsx
import { test, expect, beforeEach, afterEach, beforeAll } from 'vitest'
import { launchTerminal, Session } from 'tuistory/src'
import { execSync } from 'node:child_process'
import path from 'node:path'

const extensionDir = path.resolve(__dirname, '../../extensions/<extension-name>')

// Install dependencies before running tests
beforeAll(() => {
  execSync('bun install', { cwd: extensionDir, stdio: 'inherit' })
}, 60000)

let session: Session

beforeEach(async () => {
  session = await launchTerminal({
    command: 'bun',
    args: ['src/cli.tsx', 'dev', extensionDir],
    cwd: path.resolve(__dirname, '../..'),
    cols: 80,
    rows: 30,
  })
})

afterEach(() => {
  session?.close()
})

test('extension loads correctly', async () => {
  // Wait for the extension to load
  const initialView = await session.text({
    waitFor: (text) => {
      // Adjust this condition based on what the extension shows
      return /Some Expected Text/i.test(text)
    },
    timeout: 30000,
  })

  expect(initialView).toMatchInlineSnapshot()
}, 60000)

test('extension navigation works', async () => {
  // Wait for initial load
  await session.text({
    waitFor: (text) => /Some Expected Text/i.test(text),
    timeout: 30000,
  })

  // Send key presses to navigate
  await session.press('down')
  
  const afterNavigate = await session.text()
  expect(afterNavigate).toMatchInlineSnapshot()

  // Open actions panel
  await session.press(['ctrl', 'k'])
  
  const actionsOpen = await session.text()
  expect(actionsOpen).toMatchInlineSnapshot()
}, 60000)
```

### Key Testing Patterns

**Waiting for content:**
```tsx
await session.text({
  waitFor: (text) => text.includes('Expected Text'),
  timeout: 30000,
})
```

**Pressing keys:**
```tsx
await session.press('down')        // Arrow down
await session.press('return')      // Enter
await session.press('esc')         // Escape
await session.press('tab')         // Tab
await session.press(['ctrl', 'k']) // Ctrl+K (open actions)
await session.press(['ctrl', 'return']) // Ctrl+Enter (submit form)
```

**Typing text:**
```tsx
await session.type('search query')
```

**Capturing snapshots:**
```tsx
const output = await session.text()
expect(output).toMatchInlineSnapshot()
```

## Step 5: Run the Tests

Run the tests with snapshot update flag:

```bash
bun e2e src/examples/<extension-name>.vitest.tsx -u
```

This will:
1. Run all tests
2. Fill in empty `toMatchInlineSnapshot()` calls with actual output
3. Show pass/fail status

After running, **read the test file** to verify snapshots look correct.

## Common Issues

### Extension Shows Preferences Form

Many extensions require preferences (API keys, settings). The test should verify the preferences form loads correctly. Users will need to configure these manually.

### Extension Requires Network

Extensions that fetch data will timeout or show errors in tests without network access. Test what you can (UI loading, navigation) and document network-dependent features.

### Extension Has Errors

If the extension crashes or shows errors, capture those in snapshots. This documents the current state and helps identify compatibility issues.

## Example: Testing the Synonyms Extension

See `src/examples/synonyms.vitest.tsx` for a complete example that:
1. Verifies the preferences form loads
2. Tests form navigation
3. Captures the initial UI state

```bash
# Download
bun run src/cli.tsx download synonyms -o extensions

# Test
bun e2e src/examples/synonyms.vitest.tsx -u
```

## Directory Structure

```
termcast/
  extensions/           # Downloaded extensions (gitignored)
    synonyms/
    other-extension/
  src/
    examples/
      synonyms.vitest.tsx    # Test file for synonyms
      other.vitest.tsx       # Test file for other extension
```

## Notes

- Extensions in `extensions/` are gitignored - they're downloaded fresh for testing
- The `beforeAll` hook runs `bun install` to ensure dependencies are installed
- Use long timeouts (60000ms) as extensions may take time to build/load
- Empty `toMatchInlineSnapshot()` calls get filled automatically with `-u` flag
