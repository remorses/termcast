import React, { useEffect } from 'react'
import { List, ActionPanel, Action, renderWithProviders } from 'termcast'
import { Toast, showToast } from 'termcast/src/apis/toast'

interface ToastVariation {
  name: string
  options: Toast.Options
}

const toastVariations: ToastVariation[] = [
  {
    name: 'Simple Success',
    options: {
      title: 'Success',
      style: Toast.Style.Success,
    },
  },
  {
    name: 'Simple Failure',
    options: {
      title: 'Error',
      style: Toast.Style.Failure,
    },
  },
  {
    name: 'With Short Message',
    options: {
      title: 'Copied',
      message: 'Text copied to clipboard',
      style: Toast.Style.Success,
    },
  },
  {
    name: 'With Long Message',
    options: {
      title: 'Error',
      message:
        'This is a very long error message that should wrap to multiple lines when displayed in the toast component.',
      style: Toast.Style.Failure,
    },
  },
  {
    name: 'With Super Long Message',
    options: {
      title: 'Warning',
      message:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
      style: Toast.Style.Failure,
    },
  },
  {
    name: 'With Primary Action',
    options: {
      title: 'File Deleted',
      message: 'document.pdf was moved to trash',
      style: Toast.Style.Success,
      primaryAction: {
        title: 'Undo',
        onAction: () => {},
      },
    },
  },
  {
    name: 'With Both Actions',
    options: {
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
    },
  },
  {
    name: 'Long Title with Actions',
    options: {
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
    },
  },
  {
    name: 'Animated Loading',
    options: {
      title: 'Processing',
      message: 'Please wait while we process your request...',
      style: Toast.Style.Animated,
    },
  },
  {
    name: 'Error with Retry',
    options: {
      title: 'Connection Failed',
      message: 'Unable to connect to the server. Please check your internet connection.',
      style: Toast.Style.Failure,
      primaryAction: {
        title: 'Retry',
        onAction: () => {},
      },
    },
  },
]

function ToastVariationsExample(): any {
  // Show first toast on mount
  useEffect(() => {
    showToast(toastVariations[0].options)
  }, [])

  return (
    <List
      navigationTitle="Toast Variations"
      onSelectionChange={(id) => {
        if (id) {
          const variation = toastVariations.find((v) => v.name === id)
          if (variation) {
            showToast(variation.options)
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
  )
}

renderWithProviders(<ToastVariationsExample />)
