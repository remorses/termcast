# Changelog

## 1.7.0

1. **Hover tooltips on all chart components** — mouse over any data point, bar segment, or candle to see an absolute-positioned tooltip with the x-axis label and value. Supported on Graph, DottedLineGraph, BarGraph, HorizontalBarGraph, BarChart, and CandleChart:

   ```tsx
   // Tooltips work automatically, no extra props needed
   <Graph height={12} xLabels={labels}>
     <Graph.Line data={prices} title="Price" />
   </Graph>
   ```

   New shared module `chart-tooltip.tsx` provides `useChartTooltip()` hook and `ChartTooltip` component. Box-based charts (BarGraph, HorizontalBarGraph, BarChart) use per-element `onMouseMove`. Renderable-based charts (Graph, DottedLineGraph, CandleChart) map cursor coordinates to data indices via `getPlotLayout()`.

2. **X-axis label always shown in tooltips** — single-series charts now show the x-axis position (e.g. "Mon") as the tooltip header. Previously it was only shown for multi-series charts.

3. **Hidden `:vim` hint from List footer** — the `:vim` text no longer appears in the footer bar by default. Users can still type `:` when the search bar is empty to enter command mode.

4. **Fixed tooltip on sparse x-axis labels** — `interpolateXLabel` now correctly interpolates when there are fewer labels than data points (e.g. 3 tick labels for 100 points) instead of using direct array lookup.

5. **Fixed stale tooltip on non-data areas** — moving the cursor from a bar or segment into empty space (gaps between bars, y-axis column, unused remainder) now hides the tooltip instead of keeping the old value.

6. **Fixed Graph tooltip for mixed-length series** — when multiple series have different data lengths, hovering past the end of a shorter series no longer shows fake zero values.

## 1.6.0

1. **Built-in React component profiler** — set `TERMCAST_REACT_PROFILE=1` to capture React 19.2+ reconciler performance entries. On process exit, writes a `.cpuprofile` with proper call trees, source file paths, and component names:

   ```bash
   TERMCAST_REACT_PROFILE=1 termcast dev ./my-extension
   # then analyze:
   bunx profano ./tmp/react-profile-*.cpuprofile --sort self
   ```

2. **Ctrl+F / Ctrl+B full-page vim navigation** — in addition to the existing Ctrl+D/Ctrl+U (half-page), lists now support Ctrl+F (full-page down) and Ctrl+B (full-page up) for fast vertical movement through long lists.

3. **Directory-style command entries** — extensions can now use `src/commandName/index.tsx` directory modules in addition to flat `src/commandName.tsx` files. Previously directory-style entries failed with "No command files found to build".

4. **List accessories always visible with detail panel** — accessories now render alongside the detail panel instead of being hidden. Items truncate naturally via flex to accommodate both.

5. **Auto-hide detail panel on narrow terminals** — new `detailMinWidth` prop (default 80 columns) on `List`. When the terminal is narrower than this threshold, the detail panel hides automatically and the list takes full width.

6. **Mouse scroll triggers pagination** — `onLoadMore` now fires when scrolling down near the bottom of a list, not only on arrow key navigation.

7. **Detail panel grow-only height ratchet** — navigating from a tall detail item to a short one no longer causes the footer to jump up. The detail panel holds its maximum height and only grows, preventing layout shift.

8. **BarGraph solid full-block bars** — bar character changed from `▃` (lower-quarter block) to `█` (full block) for gap-free solid columns. Default bar width reduced to 2 columns with 2-column gaps for better spacing.

9. **Reduced footer layout shifts** — list ScrollBox minimum height increased from 6 to 10 rows, keeping the footer position stable as items load, filter, or change.

## 1.5.0

1. **New `DottedLineGraph` component** — thin dotted line charts for metric dashboards using braille subcells (2×4 per terminal cell) for smooth diagonal movement:

   ```tsx
   import { DottedLineGraph, Color } from 'termcast'

   <DottedLineGraph
     height={12}
     xLabels={['7:28 AM', '7:43 AM', '7:58 AM', '8:13 AM', '8:28 AM']}
     yRange={[0, 100]}
     yFormat={(value) => `${value.toFixed(0)}%`}
   >
     <DottedLineGraph.Series data={cpu} color={Color.Blue} title="CPU" />
     <DottedLineGraph.Series data={memory} color={Color.Purple} title="Memory" />
   </DottedLineGraph>
   ```

2. **New `HorizontalBarGraph` component** — horizontal stacked multi-series bar charts with compact right-side legend:

   ```tsx
   import { HorizontalBarGraph } from 'termcast'

   <HorizontalBarGraph labels={['Mon', 'Tue', 'Wed']}>
     <HorizontalBarGraph.Series data={[40, 30, 25]} title="Direct" />
     <HorizontalBarGraph.Series data={[30, 35, 15]} title="Organic" />
     <HorizontalBarGraph.Series data={[20, 25, 10]} title="Referral" />
   </HorizontalBarGraph>
   ```

   Customize headers with `categoryTitle`, `distributionTitle`, and `legendTitle`. Legend rows sort by highest percentage first.

3. **New `Histogram` component** — horizontal distribution tables with colored dots, labels, counts, percentages, and proportional bars:

   ```tsx
   import { Histogram } from 'termcast'

   <Histogram>
     <Histogram.Item label="TypeScript" value={450} />
     <Histogram.Item label="Python" value={320} />
     <Histogram.Item label="Rust" value={180} />
   </Histogram>
   ```

   Colors are configurable per item or auto-assigned by hashing the label against the theme palette.

4. **New `displayValue` prop on `List.Dropdown`** — override the text shown in the search bar for the active dropdown selection. Useful when the display label doesn't correspond to any item title.

5. **List.Item text truncation** — long titles and subtitles now truncate with ellipsis instead of overflowing or pushing adjacent elements off screen. Works in both single-line and two-line list item layouts.

6. **Graph and DottedLineGraph x-axis label overlap protection** — adjacent labels that would overlap are now automatically hidden. All chart components (Graph, DottedLineGraph, BarGraph, BarChart, HorizontalBarGraph) now handle label density gracefully.

7. **BarGraph layout improvements** — legends default to a compact bottom row (use `legendPosition="right"` for side placement), Y-axis tick labels shown by default, `barWidth` and `barGap` props for dense charts, legend swatches now render before their labels.

8. **Migrated from better-sqlite3 to built-in `node:sqlite`** — eliminates the native addon dependency that required node-gyp compilation at install time. Requires Bun or Node.js v22.5.0+.

9. **Removed legacy extension store** — the `termcast build` and `termcast legacy-raycast-store` commands are removed. Termcast now works exclusively in dev mode or compiled mode.

10. **Fixed extension argument parsing** — compiled extensions and `termcast dev` now start correctly instead of crashing before the command list renders.

11. **Fixed React default import in extension bundles** — extensions using `import React from 'react'` with `React.useState` etc. no longer crash at runtime.

12. **Updated OpenTUI to 0.2.12** — extension templates now use termcast imports instead of `@raycast/api`.

## 1.4.1

1. **`app.log` is now opt-in with `TERMCAST_DEBUG=1`** — termcast no longer deletes or writes `app.log` in the current working directory during normal commands. Enable debug file logging only when needed:

   ```bash
   TERMCAST_DEBUG=1 termcast dev
   ```

2. **Fixed installed package type resolution** — the package import maps now point Node-style type resolution at `dist/`, while TypeScript source builds still remap correctly to `src/`.

3. **Updated OpenTUI to `0.1.102`** — termcast now builds against the latest OpenTUI core/react versions used by this release.

## 1.4.0

1. **Vim mode for List component** — global keyboard mode with native vim motions, persisted across sessions:

   Keybindings in vim mode:
   - `j` / `k` — up/down navigation
   - `gg` / `G` — jump to first/last item
   - `Ctrl+d` / `Ctrl+u` — half-page jumps
   - `/` — activate live search (focuses textarea, Enter confirms, Esc clears)
   - `:` — command mode (shows matching commands in the footer)

   Command mode works in both raycast and vim modes via `:` from an empty search bar:
   - `:vim` — enable vim mode (shown in the raycast footer for discoverability)
   - `:theme` — open theme picker
   - `:actions` — open action panel (same as `Ctrl+K`)
   - `:filter` — open dropdown filter (same as `Ctrl+P`)
   - `:q` — quit

   The footer adapts per mode:
   - Raycast: `↑↓ navigate ^k actions :vim`
   - Vim: `j/k navigate / search ^k actions`
   - Command mode replaces the footer with `:input matching · commands`

   An **Enable/Disable Vim Mode** toggle is also available under the Settings section of the action panel.

2. **Terminal background syncs with the active theme** — termcast now emits the standard OSC 11 escape sequence on every theme change, so the surrounding terminal background stays in sync with the termcast UI. Works on WezTerm, iTerm2, kitty, and most modern terminals. This replaces the previous WezTerm-config-rewriting approach and avoids WezTerm issue #5451 where color overrides only hot-reloaded non-focused windows.

3. **Default Inconsolata font bundled with termcast** — shipped apps no longer depend on the system having a specific monospace font installed. Termcast falls back to the built-in `fonts/` directory when an extension doesn't provide its own, so `termcast app build` produces self-contained bundles.

4. **Cmd+Backspace deletes to line start in inputs** — `Cmd+Backspace` now deletes from the cursor to the start of the line (same as macOS native inputs). WezTerm forwards the key as a kitty CSI sequence which termcast remaps internally to `Ctrl+U`.

5. **Node.js runtime support via better-sqlite3** — termcast now ships a platform abstraction layer with a `#sqlite` import map that swaps between `bun:sqlite` and `better-sqlite3` depending on the runtime. Extensions using termcast's built-in storage (Cache, LocalStorage, preferences) now work under both Bun and Node.js.

6. **Fixed vim search mode: `Ctrl+K` and `Ctrl+P` work inside `/` search** — both action panel and dropdown filter shortcuts now fall through to their shared handlers while `/` search is active. Vim default-mode keys (`j`/`k`/`gg`/`G`/`^d`/`^u`) are also now checked before registered action shortcuts, so extensions can't hijack core vim motions with unmodified single-letter shortcuts.

## 1.3.54

### Features

1. **CandleChart component** — new trading-style OHLC candlestick chart for terminal UIs:

   Renders one candle per terminal column using block characters with 2× vertical sub-row resolution:
   - Body (open-to-close): `▌` / `▘` / `▖` block chars for precise positioning
   - Wick (high-to-low): `│` thin vertical line extending above/below body
   - Green = bullish (close ≥ open), red = bearish (close < open)

   When data exceeds the plot width, adjacent candles are aggregated into OHLC buckets automatically. Candles are right-aligned so the latest data sits at the right edge.

   ```tsx
   import { CandleChart } from 'termcast'

   <CandleChart
     data={candles}          // { open, high, low, close, timestamp }[]
     bullColor="#26a69a"
     bearColor="#ef5350"
   />
   ```

   Works in `List.Item.Detail` side panels, full-page `Detail` views, and `Row` side-by-side layouts. Can be mixed with `Graph` line overlays and `BarChart` volume bars.

### Fixes

2. **Table `wrapText` column sizing** — wrap-mode tables now size columns by content width instead of equal-width splits. Short columns no longer waste space and long columns get proportionally more room. Per-column widths are computed from header and cell content with min/max guards.

## 1.3.53

### Features

- **app build**: Add Linux platform support to `termcast app build`
  - Produces a self-contained folder bundle cross-compiled from macOS or Linux
  - Uses the WezTerm Ubuntu 20.04 `tar.xz` release for broadest glibc compatibility
  - `--platform linux` flag (x64 only for now)
  - Bundle structure:
    ```
    MyApp/
      MyApp              ← bash launcher
      runtime/
        wezterm-gui      ← WezTerm binary
        myapp            ← compiled extension
        config/
          wezterm.lua
      share/
        applications/myapp.desktop   ← freedesktop .desktop entry
        icons/myapp.png
    ```
  - Includes a freedesktop `.desktop` file for optional app launcher integration

### Fixes

- **Dialog**: `useDialog()` now accepts an `onClose` callback, called when the dialog is dismissed via ESC or click-outside
- **List dropdown**: Dropdown open state now syncs correctly when dismissed via ESC or click-outside — previously the dropdown could get stuck open after being closed externally

## 1.3.52

### Features

- **List**: Right-click on list items opens the actions dialog (mirrors desktop context-menu UX)
  - Left-click still selects + auto-executes the first action (unchanged)
  - Right-click selects the item and opens the full `ActionPanel`

- **Heatmap**: Cells now use distinct Unicode codepoints so AI agents can read intensity from text alone
  - Level 0 (no activity): space — cell omitted entirely
  - Level 1–2 (low): `◼` U+25FC black medium square
  - Level 3–4 (high): `■` U+25A0 black square
  - Human view is unchanged (same colored grid); only text extraction reveals the tiers

- **Graph**: Filled/striped bar columns use thinner left-half block + quadrant characters
  ```
  ▌ U+258C  left half block       → both sub-rows filled
  ▘ U+2598  quadrant upper-left   → top sub-row only
  ▖ U+2596  quadrant lower-left   → bottom sub-row only
  ```
  Each column now occupies 50% cell-width, giving visible gaps between adjacent bars

### Fixes

- **app build (macOS)**: Built `.app` bundles now show the native macOS title bar with traffic-light semaphore buttons instead of a chromeless window
- **app build**: Cmd shortcuts (`Cmd+C`, `Cmd+K`, `Cmd+Arrow`) now work correctly inside standalone WezTerm apps
  - WezTerm's `SendKey` drops the SUPER modifier; replaced with raw kitty CSI sequences (`\x1b[99;9u` etc.) that encode it directly
  - `matchesShortcut()` now accepts both `evt.super` and `evt.hyper` for the `cmd` modifier, so shortcuts fire in both normal terminals and standalone apps
- **compile**: Resolve the compile plugin entry from `src/` instead of `__dirname` — fixes extension bundling when running from an installed global binary
- **toast**: Clicking anywhere on a toast now dismisses it — inner child boxes (title, message, keys) previously swallowed mouse events without dismissing

## 1.3.51

### Features

- **app build**: Add `termcast app build` command to create standalone macOS `.app` and Windows folder bundles
  - Wraps WezTerm + a compiled termcast extension into a portable desktop app
  - macOS: produces a proper `.app` bundle with multi-size icons (`.icns`) and WezTerm background color sync
  - Windows: bundles `wezterm-gui.exe`, PTY support DLLs, and ANGLE GPU DLLs
  - `--theme` option to bake a theme into the app
  - `--font` option for font customization
  - `--icon` option with fallback to built-in default icon
  - App mode: ESC at root does not exit, process.exit guarded, error boundary with retry
- **mouse**: Full mouse interaction support for list items, form fields, and footer labels
  - Click list items to select, hover to highlight, click to activate
  - Form fields clickable to focus, form dropdowns navigable by click
  - Footer labels and dropdown hints are mouse-clickable
  - `Hoverable` component for custom hover-to-select patterns
  - Click toast to dismiss
- **CalendarHeatmap**: New `CalendarHeatmap` component (renamed from `Heatmap`, alias kept)
  - GitHub-style contribution grid with color intensity encoding
  - Month grouping, day labels, legend support
  - Various color combinations showcase in examples
- **Markdown**: Expose standalone `Markdown` component
  - Themed markdown rendering with custom renderNode hook
  - Link URL stripping, borderless tables, OSC 8 hyperlinks
  - Accepts `BoxProps` for composition with Row, CalendarHeatmap, Graph, etc.
- **ProgressBar**: Add `barCharacter` and `trackCharacter` props for custom bar fill glyphs
- **List**: Add `logo` prop for custom content on the right edge of the title bar
- **Table**: Make table headers optional

### Fixes

- **form-navigation**: Fix arrow navigation at widget boundaries (dropdown/date picker)
- **date-picker**: Fix arrow key mouse navigation
- **hover-contrast**: Improve hover contrast for interactive rows
- **navigation**: Defer `navigation.pop()` in mouse handler to avoid Yoga WASM crash
- **app-build**: Harden app build against shell injection, icon path issues, scoped names, and release lookup

## 1.3.50

### Fixes

- **deps**: Fix `@termcast/utils` workspace dependency specifier from `workspace:*` to `workspace:^` for proper version resolution on publish
- **submodules**: Update tuistory and raycast-utils submodules to latest

## 1.3.49

### Features

- **BarGraph**: Add vertical stacked bar chart component
  - New `BarGraph` component with vertical stacked bars, x-axis labels, and compact legend
  - Extends BoxProps so callers can pass flexGrow, width, etc.
  - Shared color palette with Graph and BarChart (accent, info, success, warning, error, secondary, primary)
  - Example: bar-graph-weekly with stress tests for many columns/series and side-by-side layouts
- **theme**: Extract getThemePalette into theme.tsx
  - Shared color palette function used by Graph, BarChart, and BarGraph
  - Consistent color ordering across all chart components

### Fixes

- **form-navigation**: Fix dropdown and date picker boundary navigation
  - Dropdown: up on first item or down on last item now moves to adjacent form fields
  - Date picker: boundary callbacks wire to form navigation (up at top focuses previous field, down at bottom focuses next)
  - Stop key propagation when boundary callbacks fire to prevent double-handling
- **tests**: Stabilize e2e color assertions and refresh snapshots
  - Isolate color-sensitive tests from persisted theme state using TERMCAST_DB_SUFFIX
  - Align theme assertions with default nerv palette (#e89500)
  - Update tuistory submodule for sqlite cleanup fix

### Improvements

- **actions**: Rename "See Console Logs" to "Toggle Console Logs" in action panel
- **build**: Add build.tsx for centralized build logic
- **testing**: Add comprehensive e2e coverage for form boundaries and chart rendering

## 1.3.48

### Fixes

- **sqlite**: Add sqlite abstraction layer for swappable SQLite engine
  - Allows switching between bun:sqlite and libsql for cross-runtime compatibility
  - Centralized import in `src/apis/sqlite.ts` for easy engine swapping
- **node-compat**: Replace Bun-specific APIs with Node.js equivalents
  - Replace `Bun.inspect` with `util.inspect` in logger
  - Replace `Bun.spawn` with `child_process.spawn` in Swift runtime
  - Improves compatibility for running on Node.js environments

## 1.3.47

### Features

- **action-shortcuts**: Enable action shortcuts to trigger directly without opening action panel
  - Actions with keyboard shortcuts (e.g., `ctrl+r` for Refresh) now work immediately
  - No need to open action panel first for shortcut-enabled actions
- **list-spacing**: Add `spacingMode` prop with 'default' and 'relaxed' options
  - 'default': Single-line items with title and subtitle on same row
  - 'relaxed': Two-line items with title on first row, subtitle below
  - Better visual hierarchy in relaxed mode with bold titles
- **list-loading**: Show spinner in search prompt when list is loading
  - Visual feedback for async search operations
  - Spinner appears in search box during data fetching

### Fixes

- **dropdown**: Fix edge-triggered pagination and stop wrapping at boundaries
  - Pagination triggers only at viewport edges for smoother navigation
  - No wrap-around when reaching first/last items
- **list**: Paginate only at viewport edges for better UX
- **actions**: Increase actions dialog height to 10 rows, remove destructive red color
- **react**: Prevent duplicate React by not externalizing internal packages
  - Fixes potential React runtime conflicts in bundled extensions

### Dependencies

- Update React to 19.2.4
- Refresh e2e test snapshots for compatibility

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
