import React from 'react'
import { List, renderWithProviders, showToast, Toast } from 'termcast'

function ToastActionExample(): any {
  return (
    <List
      navigationTitle="Toast Action Test"
      onSelectionChange={async (id) => {
        if (id === 'show-toast') {
          await showToast({
            style: Toast.Style.Success,
            title: 'File Deleted',
            message: 'document.pdf was moved to trash',
            primaryAction: {
              title: 'Undo',
              onAction: async () => {
                await showToast({
                  style: Toast.Style.Success,
                  title: 'Undone',
                  message: 'File restored',
                })
              },
            },
          })
        }
      }}
    >
      <List.Item id="show-toast" title="Show Toast with Action" />
      <List.Item id="other" title="Other Item" />
    </List>
  )
}

await renderWithProviders(<ToastActionExample />)
