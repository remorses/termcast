import React, { useState } from 'react'
import { List, ActionPanel, Action, renderWithProviders } from 'termcast'
import { Toast, ToastContent } from 'termcast/src/apis/toast'

const toastVariations = [
  {
    name: 'Simple Success',
    toast: new Toast({
      title: 'Success',
      style: Toast.Style.Success,
    }),
  },
  {
    name: 'Simple Failure',
    toast: new Toast({
      title: 'Error',
      style: Toast.Style.Failure,
    }),
  },
  {
    name: 'With Short Message',
    toast: new Toast({
      title: 'Copied',
      message: 'Text copied to clipboard',
      style: Toast.Style.Success,
    }),
  },
  {
    name: 'With Long Message',
    toast: new Toast({
      title: 'Error',
      message:
        'This is a very long error message that should wrap to multiple lines when displayed in the toast component. It contains detailed information about what went wrong during the operation.',
      style: Toast.Style.Failure,
    }),
  },
  {
    name: 'With Super Long Message',
    toast: new Toast({
      title: 'Warning',
      message:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.',
      style: Toast.Style.Failure,
    }),
  },
  {
    name: 'With Primary Action',
    toast: new Toast({
      title: 'File Deleted',
      message: 'document.pdf was moved to trash',
      style: Toast.Style.Success,
      primaryAction: {
        title: 'Undo',
        onAction: () => {},
      },
    }),
  },
  {
    name: 'With Both Actions',
    toast: new Toast({
      title: 'Update Available',
      message: 'Version 2.0 is ready to install',
      style: Toast.Style.Success,
      primaryAction: {
        title: 'Install',
        onAction: () => {},
      },
      secondaryAction: {
        title: 'Later',
        onAction: () => {},
      },
    }),
  },
  {
    name: 'Long Title with Actions',
    toast: new Toast({
      title: 'Operation Completed Successfully',
      message: 'All files have been processed',
      style: Toast.Style.Success,
      primaryAction: {
        title: 'View Results',
        onAction: () => {},
      },
      secondaryAction: {
        title: 'Dismiss',
        onAction: () => {},
      },
    }),
  },
  {
    name: 'Animated Loading',
    toast: new Toast({
      title: 'Processing',
      message: 'Please wait while we process your request...',
      style: Toast.Style.Animated,
    }),
  },
  {
    name: 'Error with Retry',
    toast: new Toast({
      title: 'Connection Failed',
      message:
        'Unable to connect to the server. Please check your internet connection and try again.',
      style: Toast.Style.Failure,
      primaryAction: {
        title: 'Retry',
        onAction: () => {},
      },
    }),
  },
]

function ToastVariationsExample(): any {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const selectedToast = toastVariations[selectedIndex]

  return (
    <box flexDirection="column" width="100%" height="100%">
      <List
        navigationTitle="Toast Variations"
        onSelectionChange={(id) => {
          if (id) {
            const index = toastVariations.findIndex((v) => v.name === id)
            if (index !== -1) {
              setSelectedIndex(index)
            }
          }
        }}
      >
        {toastVariations.map((variation) => (
          <List.Item
            key={variation.name}
            id={variation.name}
            title={variation.name}
            actions={
              <ActionPanel>
                <Action title="Select" onAction={() => {}} />
              </ActionPanel>
            }
          />
        ))}
      </List>
      <box position="absolute" bottom={0} left={0} width="100%">
        <ToastContent toast={selectedToast.toast} onHide={() => {}} />
      </box>
    </box>
  )
}

renderWithProviders(<ToastVariationsExample />)
