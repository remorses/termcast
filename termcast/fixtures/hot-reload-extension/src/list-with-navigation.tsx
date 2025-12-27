import { List, Action, ActionPanel, useNavigation, Detail } from '@raycast/api'
import { useState } from 'react'

// This component will be pushed onto the navigation stack
function ItemDetail({ title }: { title: string }) {
  const [counter, setCounter] = useState(0)

  return (
    <Detail
      markdown={`# ${title}\n\nCounter: ${counter}\n\nMarker: NAV_MARKER_VALUE`}
      actions={
        <ActionPanel>
          <Action title="Increment Counter" onAction={() => setCounter((c) => c + 1)} />
        </ActionPanel>
      }
    />
  )
}

export default function ListWithNavigation() {
  const { push } = useNavigation()

  return (
    <List navigationTitle="List With Navigation">
      <List.Item
        title="Item One"
        subtitle="Click to see details"
        actions={
          <ActionPanel>
            <Action
              title="Open Details"
              onAction={() => push(<ItemDetail title="Item One Details" />)}
            />
          </ActionPanel>
        }
      />
      <List.Item
        title="Item Two"
        subtitle="Another item"
        actions={
          <ActionPanel>
            <Action
              title="Open Details"
              onAction={() => push(<ItemDetail title="Item Two Details" />)}
            />
          </ActionPanel>
        }
      />
    </List>
  )
}
