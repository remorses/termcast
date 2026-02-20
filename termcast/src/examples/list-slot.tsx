/**
 * Example: List with logo prop on the title bar, no dropdown.
 * Logo appears on the right edge after the separator line.
 */
import React from 'react'
import { List, ActionPanel, Action, renderWithProviders, Color } from 'termcast'

function ListSlotExample() {
  const items = [
    { id: '1', title: 'Dashboard', subtitle: 'Main overview' },
    { id: '2', title: 'Settings', subtitle: 'Preferences' },
    { id: '3', title: 'Profile', subtitle: 'Account info' },
    { id: '4', title: 'Notifications', subtitle: 'Alerts' },
    { id: '5', title: 'Analytics', subtitle: 'Usage stats' },
  ]

  return (
    <List
      logo={<text fg={Color.Orange}>◆ Acme</text>}
    >
      {items.map((item) => (
        <List.Item
          key={item.id}
          id={item.id}
          title={item.title}
          subtitle={item.subtitle}
          actions={
            <ActionPanel>
              <Action title="Open" onAction={() => {}} />
            </ActionPanel>
          }
        />
      ))}
    </List>
  )
}

renderWithProviders(<ListSlotExample />)
