/**
 * Example demonstrating action shortcuts (ctrl+r to refresh).
 * This tests that pressing ctrl+r directly triggers the Refresh action
 * without needing to open the action panel first.
 */
import React, { useState } from 'react'
import {
  List,
  ActionPanel,
  Action,
  Keyboard,
  renderWithProviders,
} from 'termcast'

function ActionShortcutExample() {
  const [refreshCount, setRefreshCount] = useState(0)

  return (
    <List navigationTitle="Action Shortcut Test">
      <List.Item
        title={`Refresh count: ${refreshCount}`}
        subtitle="Press ctrl+r to refresh (shortcut) or Enter then select Refresh"
        actions={
          <ActionPanel>
            <Action
              title="Refresh"
              shortcut={Keyboard.Shortcut.Common.Refresh}
              onAction={() => {
                setRefreshCount((c) => c + 1)
              }}
            />
            <Action
              title="Reset"
              shortcut={{ modifiers: ['ctrl'], key: 'x' }}
              onAction={() => {
                setRefreshCount(0)
              }}
            />
            <Action
              title="Double"
              shortcut={{ modifiers: ['alt'], key: 'd' }}
              onAction={() => {
                setRefreshCount((c) => c * 2)
              }}
            />
          </ActionPanel>
        }
      />
    </List>
  )
}

await renderWithProviders(<ActionShortcutExample />)
