# Changelog

## 1.3.46

### Patch Changes

- **metadata**: Dynamic metadata alignment with full-width separators
  - Title column width now computed from longest title among children
  - Separators span full container width using flexGrow
  - Symmetric spacing around separators (1 line above and below)
  - Fixes paddingBottom consistency (0.5 → 1)
  - Applies to both `Detail.Metadata` and `List.Item.Detail.Metadata`
- **list**: Disable wrap-around navigation at boundaries
  - Pressing up at first item stays on first item
  - Pressing down at last item stays on last item
  - Dropdowns still wrap for quick circular navigation
- **deps**: Update opentuah to 0.1.93
- **deps**: Bump workspace dependencies
  - @types/react 19.1.12 → 19.2.14
  - @types/node 25.0.3 → 25.2.3
  - @types/bun 1.3.5 → 1.3.9
  - vite 7.3.0 → 7.3.1
  - vitest 4.0.16 → 4.0.18
  - bun-types 1.3.6 → 1.3.9
  - bun-pty 0.4.6 → 0.4.8
- **testing**: Document node-pty 0.10.1 requirement in AGENTS.md to prevent posix_spawnp errors

## 1.3.45

### Patch Changes

- Update e2e test snapshots for opentuah 0.1.89 compatibility

## 1.3.44

### Patch Changes

- Fix compile: default to a concrete Bun build target (e.g. `bun-linux-x64`) to avoid resolving optional opentuah musl packages during bundling

## 1.3.43

### Patch Changes

- Pin opentuah OpenTUI to 0.1.87 (no caret) to avoid bun.lock resolving 0.1.88, which breaks bun compile on Linux in CI

## 1.3.42

### Patch Changes

- Roll back opentuah OpenTUI to 0.1.87: 0.1.88 breaks bun compile on Linux (missing `@opentuah/core-linux-musl-x64` resolution in CI)

## 1.3.41

### Patch Changes

- Fix CI/compile on Linux: ensure opentuah musl platform packages are present so bun compile can resolve `@opentuah/core-linux-musl-x64`

## 1.3.40

### Patch Changes

- Fix: show a loading spinner in List empty view when `isLoading` is true
- Update opentuah OpenTUI packages to 0.1.88
- Test improvements: silence noisy cache subscriber error log; normalize swift extension snapshots by stripping ANSI

## 1.3.39

### Patch Changes

- Export `Form` and `Image` with merged value/type namespaces from `termcast` so `@raycast/utils` type usages like `Form.Values`, `Form.ItemReference`, and `Image.Asset` resolve correctly
- Keep runtime compatibility for static APIs (`Form.TextField`, `Form.Dropdown`, `Image.Mask`) while improving type namespace support
- Extend list image typing to accept themed image sources (`{ light, dark }`) to match Raycast-style icon objects
- Update `@termcast/utils` to `2.2.6`

## 1.3.38

### Patch Changes

- Update @termcast/utils to 2.2.5 - fix peer dependency resolution by moving termcast alias to dependencies

## 1.3.37

### Patch Changes

- Switch from `<code filetype="markdown">` to native `<markdown>` element for Detail and List.Item.Detail rendering
- Add renderNode link hiding - markdown links now display only the title text (URL hidden)
- Markdown links render with distinct cyan color and underline styling
- OSC 8 terminal hyperlinks for clickable links in supported terminals (Ghostty, kitty, WezTerm, Alacritty, iTerm2)
- Add syntax theme with ~70 tree-sitter scopes for full code block syntax highlighting inside markdown
- Add ASCII/Unicode diagram rendering support (diagram-parser ported from critique)
- Reduce scrollbar thumb contrast for a more subtle appearance
- Update opentuah to 0.1.87 - fixes bun compile for standalone binaries

## 1.3.36

### Patch Changes

- Add top-level `types` field pointing to `./dist/index.d.ts` for broader tooling compatibility
- Add `types` condition to `./src/*` exports so TypeScript resolves `.d.ts` from `dist/` instead of raw `.tsx` sources

## 1.3.35

### Patch Changes

- Add list pagination support: onLoadMore trigger and loading indicator
- Refactor List selection persistence and persist index in navigation stack
- Fix footer items wrapping
- Fix actions dialog layering
- Hide List pane scrollbar
- Externalize extension dependencies in esbuild to fix native module loading
- Initialize zustand state for library usage in renderWithProviders

## 1.3.34

### Patch Changes

- Replace `cac` with `goke` CLI framework (major CLI refactor)
- Fix: Eliminate search selection flash (UI improvement)
- Fix: Stabilize cache schema and guard slow sqlite startup
- Fix: Keep Linux watcher package as optional dependency for CI reliability
- Update `tuistory` submodule
- Docs: Add flash-debugging guide

## 1.3.33

### Patch Changes

- Enable ESM bytecode compilation for extension compile and CLI binary builds
- Speed up list startup by lightening offscreen action registration
- Migrate `ActionPanel` to portal-based overlay rendering
- Pin `node-pty` to 0.10.1 for PTY stability
- OAuth support for extensions
- Form component refactoring

## 1.3.32

### Patch Changes

- Add `@swc/wasm` fallback dependency for platforms without native SWC bindings

## 1.3.31

### Patch Changes

- Fix `bunx termcast` not finding executable by using explicit bin object format
- Add `chmod +x` to prepublishOnly script to ensure CLI is executable
- Pin `bun-pty` to 0.4.2 to fix tsc errors from broken TypeScript sources in 0.4.5
- Add `node-pty` dev dependency for e2e-node.tsx
- Fix TypeScript errors for fetch `.json()` calls returning unknown

## 1.3.30

### Patch Changes

- Fix `@parcel/watcher` native module bundling in compiled binaries (following opencode's approach)
- Add lazy watcher loader that uses platform-specific bindings at runtime
- CI now installs platform-specific watcher packages before compile

## 1.3.29

### Patch Changes

- Fix binary naming in release CI: binaries inside archives now include target suffix (e.g., `termcast-darwin-arm64`) to match what the install script expects

## 1.3.28

### Patch Changes

- Set `extensionPath` for compiled extensions to `~/.termcast/compiled/{name}/`
- Validate repo name matches package.json name in release command
- Fix Windows archive naming (use `.zip` not `.exe.zip`)
- Fix `getPreferenceValues()` not working at module scope in compiled extensions
- Fix preferences form not loading for compiled extensions

## 1.3.27

### Patch Changes

- Fix compiled binaries to be fully portable by embedding `packageJson` directly instead of hardcoding `extensionPath`
- `startCompiledExtension` now accepts `packageJson` parameter instead of reading from filesystem
- LocalStorage and Cache now use `~/.termcast/compiled/{extensionName}/` for compiled extensions
- `launchCommand` provides clear error message for compiled extensions (not supported)

## 1.3.26

### Patch Changes

- Add `bin` field to package.json for global CLI installation via `npm i -g termcast`

## 1.3.25

### Patch Changes

- Add `--version` / `-v` flag support to compiled binaries
- Embed VERSION env var during compile using release tag

## 1.3.24

### Patch Changes

- Add `wrapMode='none'` to all textarea elements to prevent text wrapping
- Add animated loading spinner to form input fields when loading
  - Pulsing dot animation with varying size and brightness
  - Shows on focused field when `isLoading` is true
  - New `isLoading` prop on `WithLeftBorder` component

## 1.3.23

### Patch Changes

- Fix file/directory preferences being saved as arrays instead of strings

## 1.3.22

### Patch Changes

- Fix useNavigation not working inside ActionPanel components by restructuring dialog rendering to be inside NavigationContext

## 1.3.21

### Patch Changes

- Use stable node-pty 1.0.0 instead of beta for better CI compatibility

## 1.3.20

### Patch Changes

- Make release path argument optional, defaults to current directory
- Fix race condition in parallel compilation by using unique temp entry files per target

## 1.3.19

### Patch Changes

- Fix release command silently failing when gh errors occur (now properly surfaces auth/remote issues)

## 1.3.13

### Patch Changes

- Implement Action.Style.Destructive: actions with destructive style now render in red

## 1.3.12

### Patch Changes

- Enable keyboard scrolling (up/down arrows) for ScrollBox components in Detail and List detail panel
- Add page up/page down support in Form to scroll the form content
- Make Form.Description focusable when id prop is provided

## 1.3.11

### Patch Changes

- Center Form content horizontally using flexbox layout
- Center Form content vertically using scrollbox contentOptions
- Add maxWidth constraint to Form description and scrollbox for consistent width
- Fix flaky password field test to use regex match instead of exact value

## 1.3.10

### Patch Changes

- export from dist

## 0.3.8

### Patch Changes

- fix auto install

## 0.3.7

### Patch Changes

- fix \_jsx

## 0.3.6

### Patch Changes

- auto update, log unhandled errors

## 0.3.6

### Patch Changes

- Auto-update support: CLI checks for updates on startup and runs the install script
  - Shows toast notification when a new version is available
  - Updates installed in background using existing install script

## 0.3.5

### Patch Changes

- remove problematic dep

## 0.3.4

### Patch Changes

- fix addons?

## 0.3.3

### Patch Changes

- fix binary

## 0.3.2

### Patch Changes

- fix binaries

## 0.3.1

### Patch Changes

- fix import

## 0.3.0

### Minor Changes

-

## 0.2.0

### Minor Changes

- Many improvements

## 0.1.0

### Minor Changes

- improvements

## 0.0.3

### Patch Changes

- use bun sqlite

## 0.0.2

### Patch Changes

- nn

## 0.0.1

### Patch Changes

- Release binaries

## 2025-01-28 14:17

- Replaced `better-sqlite3` with `@farjs/better-sqlite3-wrapper` for cross-runtime compatibility
- Updated database initialization to use `prepare().run()` instead of `exec()` in cache.tsx and localstorage.tsx
- Fixed ActionPanel component by adding proper context providers and removing legacy code

## 2025-08-26 21:00

- Implement Clipboard API from @raycast/api
  - Support for copy/paste/clear/read operations
  - Cross-platform support (macOS, Linux, Windows)
  - Concealed copy option for sensitive data
  - Read clipboard content as text or file
  - **File copy support** - copy files to clipboard on all platforms
  - Detect files in clipboard when reading
  - Reuses existing action-utils for text operations

## 2025-08-26 20:42

- Set up Vitest testing framework with comprehensive test suites
- Switch from sqlite3 to better-sqlite3 for synchronous database operations
- Add 50 unit tests covering Cache and LocalStorage APIs
  - Test edge cases including unicode, special characters, and capacity management
  - Test LRU eviction and subscriber patterns
  - Test type conversions for number and boolean values

## 2025-08-26 17:00

- Implement Cache API from @raycast/api
  - Support for synchronous get/set/remove operations
  - LRU eviction when capacity exceeded
  - Namespace support for command-specific caching
  - Subscriber pattern for cache updates
- Implement LocalStorage API from @raycast/api
  - Async methods for getItem/setItem/removeItem
  - Support for string, number, and boolean values
  - allItems() method to retrieve all stored values
  - clear() method to remove all values
- Both APIs use SQLite for persistent storage in ~/.termcast.db and ~/.termcast-cache.db
