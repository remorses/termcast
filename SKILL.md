---
name: termcast
repo: https://github.com/remorses/termcast
description: Build TUIs with a Raycast-like React API using termcast. Implements @raycast/api components (List, Detail, Form, Action) rendered to the terminal via opentui.
---

# termcast

Every time you work with termcast, you MUST fetch the latest README:

```bash
curl -s https://raw.githubusercontent.com/remorses/termcast/main/README.md # NEVER pipe to head/tail, read the full output
```

The README contains all component APIs, data fetching patterns, real-world examples, and porting guides. Read it in full before writing any termcast code.

Also read the opentui docs before editing `.tsx` files:

```bash
curl -s https://raw.githubusercontent.com/sst/opentui/refs/heads/main/packages/react/README.md
```

## Imports

For new code, import from `termcast` and `@termcast/utils`. `@raycast/api` imports still work for porting existing extensions.

```tsx
import { List, Detail, Action, ActionPanel, showToast, Toast, Icon, Color } from 'termcast'
import { useCachedPromise, useCachedState } from '@termcast/utils'
```

## Agent rules

- **Use `logger.log`** instead of `console.log`. Logs go to `app.log` in the extension directory.
- **Never use `setTimeout`** for scheduling React state updates.
- **Never pass functions** to `useEffect` dependencies. Causes infinite loops.
- **Minimize `useState`**. Compute derived state inline when possible.
- **Always use `.tsx` extension** for files with JSX.
- **`useEffect` is discouraged**. Colocate logic in event handlers when possible.
- **Never use `as any`**. Find proper types, import them, or use `@ts-expect-error` with explanation.
- **Shortcuts**: use `ctrl`/`alt` + **letter** keys only (not digits).
- **`showFailureToast(error, { title })`** is the standard way to handle errors in actions.
- **`revalidate()`** after every mutation to refresh data.
- **Never embed icons or checkmarks in `title` text.** Use the `icon` prop on `Action`, `List.Item`, `List.Dropdown.Item`, etc. instead. Do not write `title={isSelected ? "✓ Item" : "Item"}`. Write `title="Item" icon={isSelected ? Icon.CheckCircle : Icon.Circle}`.
- **`useCachedPromise` serializes through JSON.** `Map` objects become plain objects after cache round-tripping. Use plain objects or arrays instead of Maps.
- **Bun resolves modules differently from pnpm.** If your project uses pnpm but the TUI runs under Bun, Bun may pick up a globally installed React instead of the local one. This causes `useSyncExternalStore is not a function` errors. Fix: add `react` as an explicit dependency in the package that imports termcast.
- **Use `Cache` (sync) over `LocalStorage` (async) for zustand persistence.** `Cache` is SQLite-backed and synchronous, so persisted state can be loaded at module scope as the zustand initial value.

## Testing extensions

### Interactive experimentation with tuistory CLI

tuistory is a CLI tool for driving terminal applications from the shell, like Playwright but for TUIs.

**Always run `tuistory --help` first** to see the latest commands and options.

```bash
# Launch the extension in a managed terminal session
tuistory launch "termcast dev" -s my-ext --cols 120 --rows 36

# See current terminal state
tuistory -s my-ext snapshot --trim

# Interact
tuistory -s my-ext type "search query"
tuistory -s my-ext press enter
tuistory -s my-ext press ctrl k        # open action panel
tuistory -s my-ext press tab           # next form field
tuistory -s my-ext press esc           # go back

# Take a screenshot as image
tuistory -s my-ext screenshot -o ./tmp/screenshot.jpg --pixel-ratio 2

# Cleanup
tuistory -s my-ext close
```

### Automated tests with vitest + tuistory JS API

tuistory provides a Playwright-style JS API for writing automated TUI tests. The workflow is **observe-act-observe**: take a snapshot, interact, take another snapshot.

```ts
import { test, expect } from 'vitest'
import { launchTerminal } from 'tuistory'

test('extension shows items and navigates to detail', async () => {
  const session = await launchTerminal({
    command: 'termcast',
    args: ['dev'],
    cols: 120,
    rows: 36,
    cwd: '/path/to/my-extension',
  })

  // Wait for the list to render
  await session.waitForText('Search', { timeout: 10000 })

  // Observe initial state
  const initial = await session.text({ trimEnd: true })
  expect(initial).toMatchInlineSnapshot()

  // Type a search query
  await session.type('project')
  const filtered = await session.text({ trimEnd: true })
  expect(filtered).toMatchInlineSnapshot()

  // Press Enter to trigger primary action
  await session.press('enter')
  await session.waitForText('Detail', { timeout: 5000 })
  const detail = await session.text({ trimEnd: true })
  expect(detail).toMatchInlineSnapshot()

  // Go back
  await session.press('esc')

  session.close()
}, 30000)
```

Always leave `toMatchInlineSnapshot()` empty the first time, run with `-u` to fill them, then read back the test file to verify the captured output is correct.
