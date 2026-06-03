<div align='center' class='hidden'>
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

When items have multiple accessories (tags, text, dates), they render with variable widths by default, causing columns to misalign across rows. The `accessoryTagsLayout` prop fixes this by assigning each accessory position a fixed character width, turning your list into a table-like layout.

Each number in the array is the display width (in terminal characters) for the Nth accessory in each item's accessories array. All accessory types (tags, text, dates) are left-aligned within their column via `padEnd` (right-padded with spaces). Accessories beyond the array length render with their natural width.

```tsx
import { List, Color } from 'termcast'

function Issues() {
  return (
    // Column widths: service=12, count=4, status=11, time=7
    <List accessoryTagsLayout={[12, 4, 11, 7]}>
      <List.Item
        title="Fix login timeout"
        accessories={[
          { tag: { value: 'api-server', color: Color.Blue } },
          { tag: { value: '15', color: Color.Orange } },
          { tag: { value: 'Open', color: Color.Green } },
          { text: '7h ago' },
        ]}
      />
      <List.Item
        title="Add dark mode support"
        accessories={[
          { tag: { value: 'web-frontend', color: Color.Blue } },
          { tag: { value: '6', color: Color.Orange } },
          { tag: { value: 'In Progress', color: Color.Orange } },
          { text: '22h ago' },
        ]}
      />
      <List.Item
        title="Refactor auth module"
        accessories={[
          { tag: { value: 'api-server', color: Color.Blue } },
          { tag: { value: '2', color: Color.Orange } },
          { tag: '' },  // placeholder, preserves column alignment
          { text: '3d ago' },
        ]}
      />
    </List>
  )
}

// Renders as:
// Fix login timeout       api-server   15   Open         7h ago
// Add dark mode support   web-frontend 6    In Progress  22h ago
// Refactor auth module    api-server   2                 3d ago
```

Set each width to at least the length of the longest value at that position. Use `{ tag: '' }` or `{ text: '' }` as a placeholder when an item is missing an accessory; it renders as empty space so the remaining columns stay aligned.

### Accessory ordering for alignment

When some accessories are only present on a few items, **put them first** in the array. Accessories render left to right, so a tag that only appears on 2 out of 10 items will push everything after it when present and leave a gap when absent. If that tag is last, all the columns before it stay perfectly aligned regardless.

The rule: rarely-present accessories go first (leftmost), always-present accessories go last (rightmost). This way the right edge of your list stays clean and aligned across all rows.

**Every item must define the same number of accessories in the same order.** This applies whether or not `accessoryTagsLayout` is used. If one item has 2 tags and another has 3, columns shift and alignment breaks. Use `{ tag: '' }` for conditionally absent tags, and use a ternary (`condition ? { tag: ... } : { tag: '' }`) instead of conditional `.push()`.

```tsx
// Good: optional "Blocked" tag first, common tags last, always same count
accessories={[
  item.blocked ? { tag: { value: 'Blocked', color: Color.Red } } : { tag: '' },
  { tag: { value: item.status, color: statusColor } },
  { tag: { value: item.priority } },
  { date: item.updatedAt },
]}

// Bad: conditional push changes the number of accessories per item, breaking alignment
const accessories = [{ tag: { value: item.status } }]
if (item.blocked) accessories.push({ tag: { value: 'Blocked' } })
accessories.push({ tag: { value: item.priority } })
```

### Computing column widths dynamically

When accessory values come from dynamic data, hardcoding column widths is fragile. Compute them from the data with a reduce, capping each column to a maximum width so one outlier value does not stretch the entire column.

```tsx
import { List, Color } from 'termcast'

const MAX_COL_WIDTH = 16

// Compute the widest value at each accessory position across all items
const accessoryTagsLayout = issues.reduce<number[]>((widths, issue) => {
  const values = [
    issue.assignee ?? '',
    issue.status,
    issue.priority,
    timeAgo(issue.updatedAt),
  ]
  values.forEach((text, i) => {
    widths[i] = Math.min(MAX_COL_WIDTH, Math.max(widths[i] ?? 0, text.length))
  })
  return widths
}, [])

function Issues() {
  return (
    <List accessoryTagsLayout={accessoryTagsLayout}>
      {issues.map((issue) => (
        <List.Item
          key={issue.id}
          title={issue.title}
          accessories={[
            issue.assignee
              ? { tag: { value: issue.assignee } }
              : { tag: '' },
            { tag: { value: issue.status, color: statusColor(issue.status) } },
            { tag: { value: issue.priority } },
            { text: timeAgo(issue.updatedAt) },
          ]}
        />
      ))}
    </List>
  )
}
```

The `reduce` walks every item once and tracks the longest value per position. `Math.min(MAX_COL_WIDTH, ...)` prevents a single long value from dominating the layout. The optional `assignee` tag is placed first because it is often absent, keeping the status and priority columns aligned on the right.

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

Use `process.stdout.rows` to size pages to the terminal height so the first page always fills the visible area. Subtract a few rows for List chrome (search bar, footer, borders).

```tsx
import { List } from 'termcast'
import { useCachedPromise } from '@termcast/utils'

// Size pages to the terminal so the first fetch fills the visible area
const PAGE_SIZE = Math.max(10, (process.stdout.rows || 30) - 5)

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

const PAGE_SIZE = Math.max(10, (process.stdout.rows || 30) - 5)

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

## Real-World Patterns

These patterns are drawn from a production termcast extension (a Gmail TUI wrapping an existing CLI tool).

### Gluing a CLI tool with a TUI

Import your existing business logic, wrap it with termcast components.

```
┌─────────────────────────────────────────────┐
│  mail-tui.tsx (termcast UI)                 │
│  - List, Detail, Form, ActionPanel          │
│  - useCachedPromise for data fetching       │
│  - useCachedState for persistent prefs      │
├─────────────────────────────────────────────┤
│  auth.ts / gmail-client.ts (business logic) │
│  - OAuth, API calls, data models            │
│  - Pure TypeScript, no React dependencies   │
└─────────────────────────────────────────────┘
```

The TUI file only handles rendering. All API calls, auth, and data processing live in separate files that work independently of the UI.

### Multi-account dropdown

```tsx
function AccountDropdown({ accounts, value, onChange }: {
  accounts: { email: string }[]
  value: string
  onChange: (value: string) => void
}) {
  return (
    <List.Dropdown tooltip="Account" value={value} onChange={onChange}>
      <List.Dropdown.Item title="All Accounts" value="all" icon={Icon.Globe} />
      <List.Dropdown.Section title="Accounts">
        {accounts.map((a) => (
          <List.Dropdown.Item key={a.email} title={a.email} value={a.email} />
        ))}
      </List.Dropdown.Section>
    </List.Dropdown>
  )
}

// Usage:
<List searchBarAccessory={
  <AccountDropdown accounts={accounts} value={selected} onChange={setSelected} />
}>
```

### Date-based section grouping

```tsx
function dateSection(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today.getTime() - 86400000)

  if (date >= today) return 'Today'
  if (date >= yesterday) return 'Yesterday'
  return 'Older'
}

const sections = useMemo(() => {
  const groups = new Map<string, Item[]>()
  for (const item of items) {
    const section = dateSection(item.date)
    const list = groups.get(section) ?? []
    list.push(item)
    groups.set(section, list)
  }
  return [...groups.entries()].map(([name, items]) => ({ name, items }))
}, [items])

return (
  <List>
    {sections.map((section) => (
      <List.Section key={section.name} title={section.name}>
        {section.items.map((item) => (
          <List.Item key={item.id} title={item.title} />
        ))}
      </List.Section>
    ))}
  </List>
)
```

### Mutations with loading state

```tsx
const [activeMutations, setActiveMutations] = useState(0)
const isMutating = activeMutations > 0

const withMutation = async <T,>(fn: () => Promise<T>): Promise<T> => {
  setActiveMutations((n) => n + 1)
  try { return await fn() }
  finally { setActiveMutations((n) => n - 1) }
}

// Usage in an action:
<Action
  title="Archive"
  onAction={() => withMutation(async () => {
    await archiveItem(item.id)
    await showToast({ style: Toast.Style.Success, title: 'Archived' })
    revalidate()
  })}
/>

<List isLoading={isLoading || isMutating}>
```

### Compose forms via Action.Push

```tsx
<ActionPanel.Section title="Reply & Forward">
  <Action.Push
    title="Reply"
    icon={Icon.Reply}
    shortcut={{ modifiers: ['ctrl'], key: 'r' }}
    target={
      <ComposeForm
        mode={{ type: 'reply', threadId: thread.id }}
        onSent={revalidate}
      />
    }
  />
  <Action.Push
    title="Forward"
    icon={Icon.Forward}
    shortcut={{ modifiers: ['ctrl'], key: 'f' }}
    target={
      <ComposeForm
        mode={{ type: 'forward', threadId: thread.id }}
        onSent={revalidate}
      />
    }
  />
</ActionPanel.Section>
```

### Multi-state dropdown

A single `List.Dropdown` can control multiple independent states by using prefixed values and parsing the prefix in `onChange`. This avoids needing multiple dropdowns (which `List` doesn't support). Use `displayValue` to show a combined label for all states in the dropdown trigger.

```tsx
const displayValue = `${viewLabel} · ${projectSlug} · ${timeLabel}`

<List.Dropdown
  tooltip="Navigation"
  value={`view::${currentView}`}
  displayValue={displayValue}
  onChange={(value) => {
    if (value.startsWith('view::')) setView(value.slice(6))
    else if (value.startsWith('project::')) {
      const [id, slug] = value.slice(9).split('::')
      setProject(id, slug)
    }
    else if (value.startsWith('time::')) setTimeRange(value.slice(6))
  }}
>
  <List.Dropdown.Section title="View">
    <List.Dropdown.Item title="Issues" value="view::issues" />
    <List.Dropdown.Item title="Logs" value="view::logs" />
  </List.Dropdown.Section>
  <List.Dropdown.Section title="Project">
    {projects.map(p => (
      <List.Dropdown.Item key={p.id} title={p.slug} value={`project::${p.id}::${p.slug}`} />
    ))}
  </List.Dropdown.Section>
  <List.Dropdown.Section title="Time Range">
    <List.Dropdown.Item title="Last 24h" value="time::24h" />
    <List.Dropdown.Item title="Last 7d" value="time::7d" />
  </List.Dropdown.Section>
</List.Dropdown>
```

Without `displayValue`, the dropdown trigger shows the title of whichever item matches `value`, which only reflects one state. With `displayValue`, the trigger always shows all three states regardless of which section was last picked.

### Global state with zustand + Cache persistence

For state shared across views that should persist across restarts (selected project, filters, time range), use `zustand/vanilla` with termcast's `Cache`.

`Cache` is **synchronous** (SQLite-backed) so you can read persisted state at module scope and use it as the initial zustand value. No async loading, no loading spinners, no `useEffect`. `LocalStorage` is async and requires the provider context; prefer `Cache` for zustand persistence.

```ts
import { createStore } from 'zustand/vanilla'
import { Cache } from 'termcast'

const cache = new Cache({ namespace: 'my-app' })

// Load persisted state synchronously at module scope
function loadState(): Partial<AppState> {
  const raw = cache.get('state')
  if (!raw) return {}
  try { return JSON.parse(raw) } catch { return {} }
}

const saved = loadState()

const store = createStore<AppState>(() => ({
  view: saved.view ?? 'issues',
  projectId: saved.projectId ?? null,
  timeRange: saved.timeRange ?? '24h',
  service: saved.service ?? null,
}))

// Persist every change synchronously
store.subscribe((state) => {
  cache.set('state', JSON.stringify(state))
})

// React hook
function useStore<T>(selector: (s: AppState) => T): T {
  return useSyncExternalStore(store.subscribe, () => selector(store.getState()))
}
```

This is better than `useCachedState` when state is shared across many components or views, because zustand gives you one store instead of scattered per-key hooks.

## Porting from Raycast

If you're converting an existing Raycast extension:

1. **Change imports**: `@raycast/api` -> `termcast`, `@raycast/utils` -> `@termcast/utils`
2. **Keyboard modifiers**: `cmd` doesn't work in terminals. Replace with `ctrl` or `alt`
3. **Enter key**: named `return` in opentui key events
4. **Images**: no pixel rendering in terminals. Emoji and text fallbacks are used
5. **Everything else** works the same: List, Detail, Form, Action, Toast, Navigation, LocalStorage, Cache, Clipboard, OAuth

The compound component patterns are identical:
- `List.Item`, `List.Section`, `List.Dropdown`, `List.Dropdown.Item`
- `Detail.Metadata`, `Detail.Metadata.Label`, `Detail.Metadata.TagList`
- `Form.TextField`, `Form.Dropdown`, `Form.Dropdown.Item`
- `ActionPanel.Section`

## Differences from Raycast

- Uses **Bun** instead of Node
- Renders in a **terminal** instead of a macOS app
- **Cross-platform**: macOS, Linux, Windows
- Compiles to **standalone executables**
- Can be bundled as a **desktop app** (`.app` on macOS)
- **Superset** of the Raycast API with terminal-native components (charts, tables, heatmaps)
- Best-effort API compatibility, not a drop-in replacement

## Profiling

Profile your TUI with V8 CPU profiling or React component render tracing. Both produce `.cpuprofile` files you can analyze with [profano](https://github.com/remorses/profano). See the full [profiling guide](https://termcast.app/profiling) for CLI, scripted, and tuistory-based workflows.

```bash
# V8 CPU profiling (general performance)
BUN_OPTIONS="--cpu-prof --cpu-prof-dir=./tmp/cpu-profiles" termcast dev ./my-extension

# React component profiling (render timing)
TERMCAST_REACT_PROFILE=1 termcast dev ./my-extension

# Analyze (Ctrl+C to exit first)
bunx profano ./tmp/cpu-profiles/CPU.*.cpuprofile --sort self
bunx profano ./tmp/react-profile-*.cpuprofile --sort self
```

## Install skill for AI agents

```bash
npx -y skills add remorses/termcast
```

This installs [skills](https://skills.sh) for AI coding agents like
Claude Code, Cursor, Windsurf, and others. Skills teach agents the
workflows, patterns, and tools specific to this project.
