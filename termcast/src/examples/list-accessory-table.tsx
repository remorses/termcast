/**
 * Example: List with accessoryTagsLayout for column-aligned accessories.
 *
 * Demonstrates table-like alignment where accessories at the same position
 * (or with the same tag key/color) form fixed-width columns across all items.
 * Missing accessories get empty space to preserve alignment.
 *
 * Shows: tag key grouping, color grouping, mixed accessory types, missing tags.
 */
import { renderWithProviders, Color } from 'termcast'
import List from 'termcast'

function ListAccessoryTableExample() {
  const now = new Date()
  const hoursAgo = (h: number) => new Date(now.getTime() - h * 3600_000)
  const daysAgo = (d: number) => new Date(now.getTime() - d * 86400_000)

  // Column widths: [comments 11 "12 comments", status 11 "In Progress", priority 2 "P3"]
  return (
    <List navigationTitle="Accessory Table Layout" accessoryTagsLayout={[11, 11, 2]}>
      <List.Section title="GitHub Issues">
        <List.Item
          id="issue-1"
          title="Fix login timeout on slow networks"
          accessories={[
            { tag: { value: '3 comments', key: 'comments' } },
            { tag: { value: 'Open', color: Color.Green, key: 'status' } },
            { tag: { value: 'P1', color: Color.Red, key: 'priority' } },
            { date: hoursAgo(2) },
          ]}
        />
        <List.Item
          id="issue-2"
          title="Add dark mode support"
          accessories={[
            { tag: { value: '12 comments', key: 'comments' } },
            { tag: { value: 'In Progress', color: Color.Orange, key: 'status' } },
            { tag: { value: 'P2', color: Color.Yellow, key: 'priority' } },
            { date: daysAgo(1) },
          ]}
        />
        <List.Item
          id="issue-3"
          title="Update documentation for v3 API"
          accessories={[
            { tag: { value: '0 comments', key: 'comments' } },
            { tag: { value: 'Open', color: Color.Green, key: 'status' } },
            { tag: { value: 'P3', color: Color.Blue, key: 'priority' } },
            { date: daysAgo(5) },
          ]}
        />
        <List.Item
          id="issue-4"
          title="Refactor auth module"
          accessories={[
            { tag: { value: '7 comments', key: 'comments' } },
            { tag: { value: 'Closed', color: Color.Purple, key: 'status' } },
            { tag: null },
            { date: daysAgo(14) },
          ]}
        />
        <List.Item
          id="issue-5"
          title="Fix memory leak in worker pool"
          accessories={[
            { tag: { value: '1 comment', key: 'comments' } },
            { tag: { value: 'Open', color: Color.Green, key: 'status' } },
            { tag: { value: 'P1', color: Color.Red, key: 'priority' } },
            { date: hoursAgo(6) },
          ]}
        />
      </List.Section>
    </List>
  )
}

await renderWithProviders(<ListAccessoryTableExample />)
