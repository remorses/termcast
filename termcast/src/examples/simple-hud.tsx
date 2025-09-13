import React from 'react'
import { List, Action, ActionPanel } from '@termcast/cli'
import { showHUD } from '@termcast/cli'
import { renderWithProviders } from '@termcast/cli'

function SimpleHUD(): any {
  return (
    <List>
      <List.Item
        title='Copy to Clipboard'
        subtitle='Copies text and shows HUD'
        actions={
          <ActionPanel>
            <Action
              title='Copy'
              onAction={async () => {
                // In a real scenario, you'd copy to clipboard here
                await showHUD('Copied to clipboard!')
              }}
            />
          </ActionPanel>
        }
      />

      <List.Item
        title='Delete Item'
        subtitle='Deletes item and shows HUD'
        actions={
          <ActionPanel>
            <Action
              title='Delete'
              onAction={async () => {
                // In a real scenario, you'd delete the item here
                await showHUD('Item deleted')
              }}
            />
          </ActionPanel>
        }
      />

      <List.Item
        title='Save Settings'
        subtitle='Saves settings and shows HUD'
        actions={
          <ActionPanel>
            <Action
              title='Save'
              onAction={async () => {
                // In a real scenario, you'd save settings here
                await showHUD('Settings saved')
              }}
            />
          </ActionPanel>
        }
      />
    </List>
  )
}

renderWithProviders(<SimpleHUD />)
