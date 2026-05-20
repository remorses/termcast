<div align='center'>
    <br/>
    <br/>
    <h3>termcast</h3>
    <p>Build terminal apps with React and Raycast-like APIs</p>
    <br/>
    <br/>
</div>

Termcast is a framework for building terminal user interfaces (TUIs) using React. It implements the [Raycast extension API](https://developers.raycast.com) for the terminal, so you can port existing Raycast extensions or build new TUIs with a familiar, battle-tested component model.

```sh
pnpm install -g termcast
```

> Requires [Bun](https://bun.sh) as a runtime. Does not work with Node.js.

## Two ways to build TUIs

### 1. Standalone extension

The simplest way. Create a folder with a `package.json` and React components. Termcast handles dev server, compilation, and distribution.

```
my-app/
  package.json      # name, commands, preferences
  src/
    index.tsx        # default export is a React component
```

```tsx
// src/index.tsx
import { List, Action, ActionPanel, showToast, Toast } from 'termcast'

export default function Command() {
  return (
    <List searchBarPlaceholder="Search items...">
      <List.Item
        title="Hello World"
        actions={
          <ActionPanel>
            <Action
              title="Greet"
              onAction={async () => {
                await showToast({ style: Toast.Style.Success, title: 'Hi!' })
              }}
            />
          </ActionPanel>
        }
      />
    </List>
  )
}
```

Run it:

```sh
termcast dev
```

### Raycast import compatibility

If you're porting a Raycast extension, imports from `@raycast/api` and `@raycast/utils` work out of the box. Termcast aliases them at build time, so existing code runs without changes. For new code, import from `termcast` and `@termcast/utils` instead.

### 2. Library inside a CLI

For CLIs that combine regular commands with a TUI mode. Use any CLI framework (like [goke](https://github.com/remorses/goke)) and call `renderWithProviders` when you need a TUI screen.

This is how [zele](https://github.com/remorses/zele) (a Gmail CLI) works: regular commands for sending, searching, and archiving emails, plus a TUI mode for browsing your inbox.

```tsx
// src/cli.ts
import { goke } from 'goke'

const cli = goke('myapp')

cli.command('list', 'List items as text').action(async () => {
  console.log('item 1\nitem 2\nitem 3')
})

cli.command('', 'Browse items in TUI').action(async () => {
  // Termcast requires Bun. When the CLI runs under Node,
  // re-spawn the same script with bun so the TUI works.
  const isBun = typeof (globalThis as { Bun?: unknown }).Bun !== 'undefined'
  if (!isBun) {
    const { spawnSync } = await import('node:child_process')
    const { fileURLToPath } = await import('node:url')
    const __filename = fileURLToPath(import.meta.url)
    const result = spawnSync('bun', [__filename, ...process.argv.slice(2)], {
      stdio: 'inherit',
      env: process.env,
    })
    if (result.error) {
      console.error('The TUI requires Bun. Install: curl -fsSL https://bun.sh/install | bash')
      process.exit(1)
    }
    if (result.signal) { process.kill(process.pid, result.signal); return }
    process.exit(result.status ?? 1)
    return
  }

  const { renderWithProviders } = await import('termcast')
  const { default: BrowseItems } = await import('./browse.js')
  const React = await import('react')
  await renderWithProviders(React.createElement(BrowseItems), {
    extensionName: 'myapp',
  })
})

cli.help()
cli.parse()
```

The Bun respawn is transparent to the user. Regular CLI commands still work under Node; only the TUI command needs Bun. If Bun is not installed, it prints an install hint and exits.

```tsx
// src/browse.tsx
import { List, Detail, Action, ActionPanel, useNavigation } from 'termcast'
import { useCachedPromise } from '@termcast/utils'

export default function BrowseItems() {
  const { data, isLoading } = useCachedPromise(async () => {
    const res = await fetch('https://api.example.com/items')
    return res.json()
  }, [])

  return (
    <List isLoading={isLoading} searchBarPlaceholder="Search...">
      {data?.map((item) => (
        <List.Item key={item.id} title={item.name} subtitle={item.status} />
      ))}
    </List>
  )
}
```

## Quick Start

```sh
termcast new my-extension
cd my-extension
termcast dev
```

`termcast new` scaffolds an extension from a template with a List, Form, actions, and search. `termcast dev` starts the TUI with **hot module reloading**: edit your code and the UI updates instantly without restarting.

## CLI Commands

### `termcast dev [path]`

Run an extension in development mode with HMR. Watches for file changes and rebuilds automatically. This is what you use during development.

```sh
termcast dev              # current directory
termcast dev ./my-app     # specific path
```

### Hot Module Reloading (HMR)

`termcast dev` uses **React Refresh** to update components in-place when you save a file. State is preserved, no full restart. The flow:

1. You save a `.tsx` file
2. `@parcel/watcher` detects the change
3. Bun rebuilds the command with `reactFastRefresh: true`
4. The new module is re-imported with a cache-busting query string
5. React Refresh swaps the component implementations without unmounting

This works automatically for standalone extensions. For **CLIs that use the library approach** (`renderWithProviders`), you need a `commands` array in `package.json` so `termcast dev` knows which files to build:

```json
{
  "name": "my-cli",
  "bin": "./dist/cli.js",
  "commands": [
    {
      "name": "browse",
      "title": "Browse Items",
      "description": "TUI for browsing items",
      "mode": "view"
    }
  ]
}
```

Each command maps to a file by name. Termcast looks for `src/browse.tsx` (or `browse.tsx` at root), which must **default-export a React component**:

```tsx
// src/browse.tsx
import { List } from 'termcast'

export default function BrowseItems() {
  return <List><List.Item title="Hello" /></List>
}
```

Then run `termcast dev` from the project root. It builds and renders the component directly, bypassing your CLI entry point. Your CLI still uses `renderWithProviders` for production; `termcast dev` is just for development with HMR.

If you have multiple commands, `termcast dev` shows a picker. If there's only one, it runs immediately. You can also specify a command by name:

```sh
termcast dev          # picker or auto-run if single command
termcast dev browse   # run the "browse" command directly
```

### `termcast compile [path]`

Compile the extension into a **standalone executable**. The output is a single binary that includes Bun, your code, and all dependencies. No runtime needed on the target machine.

```sh
termcast compile
termcast compile -o ./bin/myapp
```

### `termcast release [path]`

Compile for **all platforms** (macOS arm64/x64, Linux arm64/x64, Windows) and upload the binaries to a GitHub release. After publishing, you get an install script URL:

```sh
termcast release
```

```
Install script:
   curl -sf https://termcast.app/owner/repo/install | bash
```

Share this URL so anyone can install your TUI with one command. See [tuitube](https://github.com/remorses/tuitube) for a real example:

```sh
curl -sf https://termcast.app/r/tuitube | bash
```

### `termcast app build [path]`

Build a **standalone desktop app** (macOS `.app`, Linux, Windows) with a bundled terminal emulator. No terminal needed to run the app.

```sh
termcast app build
termcast app build --name "My App" --icon ./icon.png
termcast app build --release    # upload to GitHub release
```

Options: `--font`, `--font-size`, `--theme`, `--bundle-id`, `--platform`, `--arch`.

### `termcast new [name]`

Scaffold a new extension from the built-in template.

```sh
termcast new my-extension
```

## Core Components

### List

The primary component. Shows a searchable, navigable list of items with optional detail panel, sections, dropdown filters, and pagination.

```tsx
import { List, Action, ActionPanel, Icon, Color } from 'termcast'

function Repos() {
  return (
    <List
      isShowingDetail={true}
      searchBarPlaceholder="Search repos..."
      navigationTitle="My Repos"
    >
      <List.Section title="Active">
        <List.Item
          title="termcast"
          subtitle="TUI framework"
          icon={Icon.Star}
          accessories={[
            { tag: { value: 'TypeScript', color: Color.Blue } },
            { text: '2 days ago' },
          ]}
          detail={
            <List.Item.Detail
              markdown="# termcast\n\nBuild terminal apps with React."
              metadata={
                <List.Item.Detail.Metadata>
                  <List.Item.Detail.Metadata.Label title="Stars" text="420" />
                  <List.Item.Detail.Metadata.Separator />
                  <List.Item.Detail.Metadata.TagList title="Topics">
                    <List.Item.Detail.Metadata.TagList.Item text="react" color={Color.Blue} />
                    <List.Item.Detail.Metadata.TagList.Item text="tui" color={Color.Green} />
                  </List.Item.Detail.Metadata.TagList>
                </List.Item.Detail.Metadata>
              }
            />
          }
          actions={
            <ActionPanel>
              <Action title="Open" onAction={() => {}} />
              <Action.CopyToClipboard title="Copy URL" content="https://github.com/..." />
            </ActionPanel>
          }
        />
      </List.Section>
    </List>
  )
}
```

**List features:** search bar, sections, dropdown filter (`List.Dropdown`), detail panel with markdown + metadata, accessories (tags, text, icons), keyboard navigation, infinite scroll pagination.

### Table-like accessory alignment

When items have multiple tag accessories (status, priority, comment count, etc.), they render with variable widths by default, causing columns to misalign across rows. The `accessoryTagsLayout` prop fixes this by assigning each tag position a fixed character width, turning your list into a table-like layout.

Each number in the array is the display width (in terminal characters) for the Nth tag in the accessories array. Tags are left-padded with spaces using `padEnd`. Non-tag accessories like `text` and `date` are unaffected.

```tsx
import { List, Color } from 'termcast'

function Issues() {
  return (
    // Column widths: comments=11, status=11, priority=2
    <List accessoryTagsLayout={[11, 11, 2]}>
      <List.Item
        title="Fix login timeout"
        accessories={[
          { tag: { value: '3 comments' } },
          { tag: { value: 'Open', color: Color.Green } },
          { tag: { value: 'P1', color: Color.Red } },
          { date: new Date() },
        ]}
      />
      <List.Item
        title="Add dark mode support"
        accessories={[
          { tag: { value: '12 comments' } },
          { tag: { value: 'In Progress', color: Color.Orange } },
          { tag: { value: 'P2', color: Color.Yellow } },
          { date: new Date() },
        ]}
      />
      <List.Item
        title="Refactor auth module"
        accessories={[
          { tag: { value: '7 comments' } },
          { tag: { value: 'Closed', color: Color.Purple } },
          { tag: null },  // placeholder, preserves column alignment
          { date: new Date() },
        ]}
      />
    </List>
  )
}

// Renders as:
// Fix login timeout       3 comments  Open         P1 2h
// Add dark mode support   12 comments In Progress  P2 1d
// Refactor auth module    7 comments  Closed          2w
```

Set each width to at least the length of the longest tag value at that position. Use `{ tag: null }` as a placeholder when an item is missing a tag at a given position; it renders as empty space so the remaining columns stay aligned.

### Detail

Full-screen markdown view with optional metadata sidebar. Use for displaying rich content like documentation, email threads, or reports.

```tsx
import { Detail, Color } from 'termcast'

function ServerStatus() {
  return (
    <Detail
      markdown={`# Server Status\n\nAll systems operational.\n\n| Service | Status |\n|---|---|\n| API | ✓ Running |\n| DB | ✓ Running |`}
      metadata={
        <Detail.Metadata>
          <Detail.Metadata.Label title="Uptime" text="14d 3h" />
          <Detail.Metadata.Label
            title="CPU"
            text={{ value: '42%', color: Color.Orange }}
          />
          <Detail.Metadata.Separator />
          <Detail.Metadata.TagList title="Regions">
            <Detail.Metadata.TagList.Item text="us-east-1" color={Color.Green} />
            <Detail.Metadata.TagList.Item text="eu-west-1" color={Color.Blue} />
          </Detail.Metadata.TagList>
        </Detail.Metadata>
      }
    />
  )
}
```

### Form

Collect user input with text fields, dropdowns, checkboxes, tag pickers, date pickers, and file pickers.

```tsx
import { Form, Action, ActionPanel, showToast, Toast } from 'termcast'

function CreateIssue() {
  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm
            title="Create Issue"
            onSubmit={async (values) => {
              await showToast({ style: Toast.Style.Success, title: `Created: ${values.title}` })
            }}
          />
        </ActionPanel>
      }
    >
      <Form.TextField id="title" title="Title" placeholder="Bug report..." />
      <Form.TextArea id="description" title="Description" />
      <Form.Dropdown id="priority" title="Priority" defaultValue="medium">
        <Form.Dropdown.Item value="low" title="Low" />
        <Form.Dropdown.Item value="medium" title="Medium" />
        <Form.Dropdown.Item value="high" title="High" />
      </Form.Dropdown>
      <Form.Checkbox id="blocking" title="Blocking" label="Blocks release" />
      <Form.DatePicker id="due" title="Due Date" />
    </Form>
  )
}
```

**Form controls:** `TextField`, `TextArea`, `Dropdown`, `Checkbox`, `DatePicker`, `TagPicker`, `FilePicker`, `PasswordField`, `Separator`, `Description`.

### Navigation

Push and pop views onto a stack, like a mobile app.

```tsx
import { List, Detail, Action, ActionPanel, useNavigation } from 'termcast'

function ItemList() {
  const { push } = useNavigation()

  return (
    <List>
      <List.Item
        title="View Details"
        actions={
          <ActionPanel>
            <Action.Push title="Open" target={<ItemDetail />} />
            <Action
              title="Open Programmatically"
              onAction={() => { push(<ItemDetail />) }}
            />
          </ActionPanel>
        }
      />
    </List>
  )
}

function ItemDetail() {
  const { pop } = useNavigation()
  return (
    <Detail
      markdown="# Item Detail"
      actions={
        <ActionPanel>
          <Action title="Go Back" onAction={() => { pop() }} />
        </ActionPanel>
      }
    />
  )
}
```

### Actions

Actions appear in a panel when you press `Ctrl+P`. They support keyboard shortcuts, sections, and built-in types like copy, push, open URL, and submit form.

```tsx
<ActionPanel>
  <ActionPanel.Section title="Primary">
    <Action title="Open" onAction={() => {}} />
    <Action title="Edit" shortcut={{ modifiers: ['ctrl'], key: 'e' }} onAction={() => {}} />
  </ActionPanel.Section>
  <ActionPanel.Section title="Clipboard">
    <Action.CopyToClipboard title="Copy ID" content="abc-123" />
    <Action.Paste title="Paste" content="hello" />
  </ActionPanel.Section>
  <ActionPanel.Section>
    <Action.Push title="View Details" target={<Detail markdown="..." />} />
    <Action.OpenInBrowser title="GitHub" url="https://github.com" />
    <Action.SubmitForm title="Save" onSubmit={handleSubmit} />
  </ActionPanel.Section>
</ActionPanel>
```

### Toast

Non-blocking notifications. Supports animated (loading), success, and failure styles with optional actions.

```tsx
import { showToast, Toast } from 'termcast'

// Simple
await showToast({ style: Toast.Style.Success, title: 'Saved' })

// With loading state
const toast = await showToast({ style: Toast.Style.Animated, title: 'Downloading...', message: '0%' })
// ... update progress
toast.message = '50%'
// ... done
toast.style = Toast.Style.Success
toast.title = 'Downloaded'
```

## Data Fetching

The `@termcast/utils` package provides hooks for async data loading, caching, and form management.

### useCachedPromise

Fetches data with automatic caching, revalidation, and loading state. Supports pagination for infinite scroll lists.

```tsx
import { List } from 'termcast'
import { useCachedPromise } from '@termcast/utils'

function EmailList() {
  const { data, isLoading, revalidate, pagination } = useCachedPromise(
    (query: string) => async ({ cursor }) => {
      const res = await fetchEmails({ query, pageToken: cursor })
      return {
        data: res.emails,
        hasMore: !!res.nextPageToken,
        cursor: res.nextPageToken,
      }
    },
    [''],
    { keepPreviousData: true },
  )

  return (
    <List isLoading={isLoading} pagination={pagination}>
      {data?.map((email) => (
        <List.Item key={email.id} title={email.subject} subtitle={email.from} />
      ))}
    </List>
  )
}
```

### Pagination

termcast's `List` renders **all children** to the terminal. With hundreds of items, React reconciliation and layout computation become the bottleneck. Pagination keeps the rendered item count small by loading data in pages as the user scrolls.

The `List` component triggers `onLoadMore()` automatically when the cursor approaches the last few items. `useCachedPromise` accumulates pages internally so previously loaded items stay visible when scrolling back up.

#### Server-side pagination (fetching pages from an API)

Use the **curried function** form of `useCachedPromise`. The outer function takes reactive dependencies; the inner async function receives `{ page, cursor }` and returns `{ data, hasMore, cursor }`.

```tsx
import { List } from 'termcast'
import { useCachedPromise } from '@termcast/utils'

const PAGE_SIZE = 20

function TracesList() {
  const { data, isLoading, pagination } = useCachedPromise(
    (projectId: string) =>
      async ({ cursor }: { page: number; cursor?: { ts: string; id: string } }) => {
        const result = await fetchTraces({ projectId, cursor, limit: PAGE_SIZE })
        return {
          data: result.traces,
          hasMore: result.hasMore,
          cursor: result.nextCursor, // passed back on next page request
        }
      },
    [projectId],
    { keepPreviousData: true },
  )

  return (
    <List isLoading={isLoading} pagination={pagination}>
      {data?.map((trace) => (
        <List.Item key={trace.id} title={trace.name} subtitle={trace.duration} />
      ))}
    </List>
  )
}
```

`keepPreviousData: true` prevents the list from flickering when dependencies change (e.g. switching a filter). The old data stays visible until the new first page arrives.

The `pagination` object from `useCachedPromise` has `{ pageSize, hasMore, onLoadMore }` and can be passed directly to `<List pagination={pagination}>`.

#### Client-side pagination (virtual pagination for large static lists)

When you already have all the data in memory but the list is too large to render at once (e.g. a span tree with 500+ items), paginate the **rendering** instead of the fetching. This avoids the overhead of hundreds of `List.Item` components going through React reconciliation and yoga layout on every keystroke.

```tsx
import { List } from 'termcast'
import { useCachedPromise } from '@termcast/utils'
import { useState } from 'react'

const PAGE_SIZE = 50

function SpanTree({ traceId }: { traceId: string }) {
  const { data, isLoading } = useCachedPromise(
    async (id: string) => {
      const spans = await fetchAllSpans(id) // fetch everything
      return buildFlatTree(spans)            // compute tree structure
    },
    [traceId],
  )

  const allItems = data ?? []
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const visible = allItems.slice(0, visibleCount)
  const hasMore = visibleCount < allItems.length

  return (
    <List
      isLoading={isLoading}
      pagination={hasMore ? {
        pageSize: PAGE_SIZE,
        hasMore,
        onLoadMore: () => setVisibleCount((c) => Math.min(c + PAGE_SIZE, allItems.length)),
      } : undefined}
    >
      {visible.map((item) => (
        <List.Item key={item.id} title={item.name} />
      ))}
    </List>
  )
}
```

This pattern is useful when:
- The full dataset is needed for computation (tree building, sorting, grouping)
- The bottleneck is rendering, not fetching
- You want instant scroll-back without re-fetching

The `List` triggers `onLoadMore` when the cursor gets close to the end, and `useState` grows the visible window by one page each time.

### useCachedState

Persistent state that survives across restarts. Backed by SQLite.

```tsx
import { useCachedState } from '@termcast/utils'

const [selectedFolder, setSelectedFolder] = useCachedState('activeFolder', 'inbox', {
  cacheNamespace: 'mail',
})
```

### usePromise

Like `useCachedPromise` but without caching. Good for one-shot fetches.

```tsx
import { usePromise } from '@termcast/utils'

const { data: video, isLoading } = usePromise(
  async (url: string) => {
    const result = await fetchVideoMetadata(url)
    return result
  },
  [videoUrl],
  {
    onError(error) {
      showToast({ style: Toast.Style.Failure, title: 'Not found', message: error.message })
    },
  },
)
```

### useForm

Form validation and submission handling.

```tsx
import { useForm } from '@termcast/utils'

const { handleSubmit, itemProps } = useForm({
  onSubmit: async (values) => {
    await saveItem(values)
  },
  validation: {
    url: (value) => {
      if (!value) return 'URL is required'
      if (!isValidUrl(value)) return 'Invalid URL'
    },
  },
})
```

### Error handling

```tsx
import { showFailureToast } from '@termcast/utils'

try {
  await riskyOperation()
} catch (error) {
  await showFailureToast(error, { title: 'Operation failed' })
}
```

## Terminal-only Components

These components go beyond the Raycast API. They render natively in the terminal using braille characters, block elements, and box-drawing characters.

### Graph (line/area charts)

Renders line charts using braille characters. Supports multiple series, Y-axis labels, and area fill.

```tsx
import { Detail, Graph, Color } from 'termcast'

<Detail
  markdown="# Stock Price"
  metadata={
    <Graph height={15} xLabels={['Jan', 'Apr', 'Jul', 'Oct']} yTicks={6} yFormat={(v) => `$${v.toFixed(0)}`}>
      <Graph.Line data={[150, 162, 175, 190, 185, 201]} color={Color.Orange} title="AAPL" />
    </Graph>
  }
/>
```

Variants: `"line"` (default), `"area"` (filled area below the line).

### BarChart (horizontal stacked bars)

Proportional horizontal bar with labeled segments. Good for budgets, disk usage, portfolios.

```tsx
import { BarChart, Color } from 'termcast'

<BarChart height={1}>
  <BarChart.Segment value={4850} label="Spent" />
  <BarChart.Segment value={707} label="Remaining" />
  <BarChart.Segment value={617} label="Savings" color={Color.Green} />
</BarChart>
```

### BarGraph (vertical stacked bars)

Vertical bar chart with `█` fill, gaps between bars, X-axis labels, and a compact legend.

```tsx
import { BarGraph } from 'termcast'

<BarGraph height={15} labels={['Mon', 'Tue', 'Wed', 'Thu', 'Fri']}>
  <BarGraph.Series data={[40, 30, 25, 15, 50]} title="Direct" />
  <BarGraph.Series data={[30, 35, 15, 20, 35]} title="Organic" />
</BarGraph>
```

### HorizontalBarGraph

Like BarGraph but horizontal. Each row is a stacked bar with a label column and right-side legend.

```tsx
import { HorizontalBarGraph } from 'termcast'

<HorizontalBarGraph height={10} labels={['Mon', 'Tue', 'Wed', 'Thu', 'Fri']}>
  <HorizontalBarGraph.Series data={[40, 30, 25, 15, 50]} title="Views" />
  <HorizontalBarGraph.Series data={[20, 25, 10, 10, 25]} title="Clicks" />
</HorizontalBarGraph>
```

### CandleChart (OHLC financial charts)

Candlestick charts for financial data. Green bars are bullish (close >= open), red bars are bearish.

```tsx
import { CandleChart } from 'termcast'

<CandleChart
  data={candles}  // Array<{ open, close, high, low }>
  height={12}
  xLabels={['12d', '8d', '4d', 'Now']}
  yTicks={4}
  yFormat={(v) => `$${v.toFixed(2)}`}
/>
```

### CalendarHeatmap

GitHub-style contribution heatmap. Shows daily activity over months with configurable colors.

```tsx
import { CalendarHeatmap, Color } from 'termcast'

<CalendarHeatmap
  data={dailyData}  // Array<{ date: Date, value: number }>
  color={Color.Green}
/>
```

### Table

Rich tables with markdown formatting in cells (bold, italic, links, code).

```tsx
import { Table } from 'termcast'

<Table
  headers={['Region', 'Latency', 'Status']}
  rows={[
    ['us-east-1', '**12ms**', '`ok`'],
    ['eu-west-1', '*45ms*', '`ok`'],
    ['ap-south-1', '`89ms`', '`warn`'],
  ]}
/>
```

### ProgressBar

Usage-style progress bar with percentage and label.

```tsx
import { ProgressBar } from 'termcast'

<ProgressBar title="Current session" value={37} percentageSuffix="used" label="Resets 9pm" />
```

### Row

Place components side by side. Useful for comparing charts, tables, or any metadata.

```tsx
import { Row, BarGraph } from 'termcast'

<Row>
  <BarGraph height={10} labels={['Mon', 'Tue', 'Wed']}>
    <BarGraph.Series data={[40, 30, 25]} title="Week 1" />
  </BarGraph>
  <BarGraph height={10} labels={['Mon', 'Tue', 'Wed']}>
    <BarGraph.Series data={[50, 40, 35]} title="Week 2" />
  </BarGraph>
</Row>
```

### Markdown

Inline markdown rendering inside metadata panels.

```tsx
import { Markdown } from 'termcast'

<Detail.Metadata>
  <Markdown content="**Status:** All systems operational. See [docs](https://example.com) for details." />
</Detail.Metadata>
```

## Library Usage

Use termcast as a library without the CLI or extension system. Call `renderWithProviders` to mount any React component with all termcast infrastructure (navigation, storage, query cache, theme):

```tsx
import { renderWithProviders, List } from 'termcast'

function MyApp() {
  return <List><List.Item title="Hello" /></List>
}

await renderWithProviders(<MyApp />, {
  extensionName: 'my-app',
})
```

| Option | Default | Description |
|---|---|---|
| `extensionName` | `'termcast-app'` | Derives storage paths and extension metadata |
| `extensionPath` | `~/.termcast/compiled/{extensionName}` | Where LocalStorage and Cache are stored |
| `packageJson` | `{ name, title, description: '', commands: [] }` | Extension metadata for preferences |

## Differences from Raycast

- Uses **Bun** instead of Node
- Renders in a **terminal** instead of a macOS app
- **Cross-platform**: macOS, Linux, Windows
- Compiles to **standalone executables**
- Can be bundled as a **desktop app** (`.app` on macOS)
- **Superset** of the Raycast API with terminal-native components (charts, tables, heatmaps)
- Best-effort API compatibility, not a drop-in replacement
