/**
 * Repro: accessoryTagsLayout misalignment when text accessories have variable
 * width (e.g. "7h ago" vs "22h ago"). The accessories block is right-aligned
 * via space-between, so variable total width shifts the entire block.
 *
 * Fix: accessoryTagsLayout now maps to ALL accessories by position (not just
 * tags), so text/date accessories also get padded to a fixed width.
 */
import { renderWithProviders, Color } from 'termcast'
import List from 'termcast'

function ListAccessoryTextAlignExample() {
  const issues = [
    { id: '1', title: 'TypeError: Cannot read properties of undefined', service: 'api-gateway', count: '15', time: '7h ago' },
    { id: '2', title: 'Error: Hydration failed because rendered HTML did not match', service: 'web-frontend', count: '6', time: '22h ago' },
    { id: '3', title: 'Error: subscription metadata points at unknown org', service: 'api-gateway', count: '2', time: '21h ago' },
    { id: '4', title: 'Error: Minified React error #418', service: 'web-frontend', count: '2', time: '21h ago' },
    { id: '5', title: 'AI_NoOutputGeneratedError: No output', service: 'api-gateway', count: '1', time: '23h ago' },
  ]

  return (
    <List
      navigationTitle="Issues"
      accessoryTagsLayout={[12, 4, 7]}
    >
      {issues.map((issue) => {
        return (
          <List.Item
            key={issue.id}
            title={issue.title}
            accessories={[
              { tag: { value: issue.service, color: Color.Blue } },
              { tag: { value: issue.count, color: Color.Orange } },
              { text: issue.time },
            ]}
          />
        )
      })}
    </List>
  )
}

await renderWithProviders(<ListAccessoryTextAlignExample />)
