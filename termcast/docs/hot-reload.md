# Hot Reload (React Refresh)

termcast supports hot module replacement (HMR) during development via React Refresh. When you edit source files, components update in-place without losing navigation state, dialog state, or component state.

## How It Works

### Build Time

During `termcast dev`, source files are transformed using SWC with React Refresh support enabled. This injects registration calls into the bundled output:

```
Source: MyCommand.tsx                    Output: MyCommand.js
┌────────────────────────────┐           ┌────────────────────────────────────┐
│ export default function    │           │ var _c;                            │
│   MyCommand() {            │    ───►   │ export default function MyCommand()│
│   const [count, setCount]  │           │   const [count, setCount] = ...    │
│     = useState(0)          │           │   return <List>...</List>          │
│   return <List>...</List>  │           │ }                                  │
│ }                          │           │ _c = MyCommand;                    │
└────────────────────────────┘           │ $RefreshReg$(_c, "MyCommand");     │
                                         └────────────────────────────────────┘
```

The `$RefreshReg$` call registers the component with React Refresh runtime, associating it with a stable ID based on the source file path.

### Runtime

1. **Startup**: Before any React rendering, the refresh runtime is initialized:
   - `RefreshRuntime.injectIntoGlobalHook(globalThis)` sets up the devtools hook
   - Global `$RefreshReg$` and `$RefreshSig$` functions are defined
   - The opentui reconciler calls `injectIntoDevTools()` to enable refresh support

2. **On File Change**:
   - File watcher detects the change
   - `Bun.build()` rebuilds with the SWC React Refresh transform
   - Modules are re-imported with cache-busting query param (`?v=N`)
   - This triggers fresh `$RefreshReg$` calls with updated component implementations
   - `RefreshRuntime.performReactRefresh()` tells React to swap implementations in-place

## What Gets Preserved

| Preserved | Reset |
|-----------|-------|
| Navigation stack (pushed screens) | Adding/removing hooks |
| Dialog stack (open dialogs) | Reordering hooks |
| Toast state | Changing component type (function ↔ class) |
| `useState` values (if hooks unchanged) | Renaming a component |
| `useRef` values | |
| Form input values | |

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         BUILD TIME                               │
├─────────────────────────────────────────────────────────────────┤
│  Source files  ───►  SWC transform  ───►  Bundled with          │
│  (.tsx/.ts)          (refresh: true)      $RefreshReg$ calls    │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                          RUNTIME                                 │
├─────────────────────────────────────────────────────────────────┤
│  1. RefreshRuntime.injectIntoGlobalHook(globalThis)             │
│  2. reconciler.injectIntoDevTools() [opentui]                   │
│  3. Define $RefreshReg$ / $RefreshSig$ globals                  │
│  4. createRoot().render(<App />)                                │
│                                                                  │
│  ON FILE CHANGE:                                                 │
│  1. Rebuild with SWC transform                                   │
│  2. Re-import modules: import(`${path}?v=${count}`)             │
│  3. RefreshRuntime.performReactRefresh()                        │
└─────────────────────────────────────────────────────────────────┘
```

## Module Cache Busting

Bun caches dynamic imports by full URL including query string:

```ts
await import('./cmd.js?v=1')  // cached as v=1
await import('./cmd.js?v=2')  // fresh import, cached as v=2
```

The `devRebuildCount` is incremented on every file change to ensure fresh imports.

Since each command is bundled into a single file with all dependencies inlined, editing any source file triggers a rebuild of the entire bundle, and the cache-bust query ensures the new code is loaded.

## React Refresh ID Stability

Component IDs are based on source file paths, not bundle URLs:

```js
$RefreshReg$(MyCommand, "/path/to/src/my-command.tsx MyCommand")
```

This means both `?v=1` and `?v=2` register to the same family ID, allowing React Refresh to swap implementations correctly.

## Implementation Details

### SWC Transform

The `reactRefreshPlugin` in `build.tsx` uses SWC's built-in React Refresh support:

```ts
await swc.transform(code, {
  jsc: {
    transform: {
      react: {
        development: true,
        refresh: true,  // Enable React Refresh
        runtime: 'automatic',
      },
    },
  },
})
```

This is ~20x faster than the equivalent Babel transform.

### Refresh Initialization

In `react-refresh-init.tsx`, the runtime is set up before any React rendering:

```ts
import * as RefreshRuntime from 'react-refresh/runtime'

RefreshRuntime.injectIntoGlobalHook(globalThis)

globalThis.$RefreshReg$ = (type, id) => {
  RefreshRuntime.register(type, id)
}

globalThis.$RefreshSig$ = () => {
  return RefreshRuntime.createSignatureFunctionForTransform()
}
```

### Trigger Rebuild

In `dev.tsx`, `triggerRebuild()` handles the hot reload:

1. Rebuilds with `buildExtensionCommands({ hotReload: true })`
2. Re-imports all command modules with cache bust
3. Calls `RefreshRuntime.performReactRefresh()`
4. Updates state without resetting navigation/dialog stacks

## Dependencies

- `@swc/core` - Rust-based transform (fast)
- `react-refresh` - React's official refresh runtime

## Why Not Bun's import.meta.hot?

Bun's HMR API is designed for `Bun.serve()` web servers, not CLI applications. React Refresh is specifically designed for React component hot-swapping with automatic state preservation, making it the right choice for termcast's TUI.
