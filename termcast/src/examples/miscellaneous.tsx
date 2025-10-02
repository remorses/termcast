import React, { useState } from 'react'
import { List } from 'termcast'
import { Action, ActionPanel } from 'termcast'

import { Clipboard } from 'termcast'
import { logger } from 'termcast'
import { Form } from 'termcast'
import { useNavigation } from 'termcast/src/internal/navigation'
import { environment } from 'termcast'
import {
  renderWithProviders,
  getApplications,
  getDefaultApplication,
  getFrontmostApplication,
  showInFinder,
  trash,
  open,
  captureException,
  getPreferenceValues,
  openExtensionPreferences,
  openCommandPreferences,
  closeMainWindow,
  PopToRootType,
} from 'termcast'
import { confirmAlert, Alert } from 'termcast'
import { showToast, Toast, showHUD } from 'termcast'
import { Detail } from 'termcast'
import dedent from 'string-dedent'

function DetailExample(): any {
  return (
    <Detail
      markdown={dedent`
        # Simple Detail View

        This is a basic **Detail** component showing markdown content.

        - Item 1
        - Item 2
        - Item 3
      `}
    />
  )
}

function FormExample(): any {
  const handleFormSubmit = async (values: any) => {
    await showToast({
      style: Toast.Style.Success,
      title: 'Form Submitted',
      message: `Name: ${values.name || 'Not provided'}`,
    })
  }

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm title='Submit' onSubmit={handleFormSubmit} />
        </ActionPanel>
      }
    >
      <Form.TextField
        id='name'
        title='Your Name'
        placeholder='Enter your name'
        info='This is just a demo form'
      />
    </Form>
  )
}

function MiscellaneousExample(): any {
  const [animatedToast, setAnimatedToast] = useState<Toast | null>(null)
  const { push } = useNavigation()

  const handleShowSuccessToast = async () => {
    await showToast({
      style: Toast.Style.Success,
      title: 'Operation completed',
      message: 'Your files have been uploaded',
    })
  }

  const handleShowErrorToast = async () => {
    await showToast({
      style: Toast.Style.Failure,
      title: 'Operation failed',
      message: 'Failed to upload files',
    })
  }

  const handleShowAnimatedToast = async () => {
    const toast = await showToast({
      style: Toast.Style.Animated,
      title: 'Processing...',
      message: 'Please wait while we process your request',
    })
    setAnimatedToast(toast)

    setTimeout(() => {
      toast.style = Toast.Style.Success
      toast.title = 'Processing complete'
      toast.message = 'Your request has been processed successfully'
      setAnimatedToast(null)
    }, 3000)
  }

  const handleShowToastWithActions = async () => {
    await showToast({
      style: Toast.Style.Success,
      title: 'File uploaded',
      message: 'document.pdf',
      primaryAction: {
        title: 'Open',
        onAction: (toast) => {
          toast.hide()
        },
      },
      secondaryAction: {
        title: 'Copy Path',
        onAction: (toast) => {
          toast.hide()
        },
      },
    })
  }

  const handleCompleteAnimatedToast = () => {
    if (animatedToast) {
      animatedToast.style = Toast.Style.Success
      animatedToast.title = 'Task completed'
      animatedToast.message = 'All operations finished successfully'
      setAnimatedToast(null)
    }
  }

  const handleFailAnimatedToast = () => {
    if (animatedToast) {
      animatedToast.style = Toast.Style.Failure
      animatedToast.title = 'Task failed'
      animatedToast.message = 'An error occurred during processing'
      setAnimatedToast(null)
    }
  }

  const handleShowAlert = async () => {
    const confirmed = await confirmAlert({
      title: 'Delete Item?',
      message: 'This action cannot be undone.',
      primaryAction: {
        title: 'Delete',
        style: Alert.ActionStyle.Destructive,
        onAction: () => {},
      },
      dismissAction: {
        title: 'Cancel',
        style: Alert.ActionStyle.Cancel,
      },
    })

    if (confirmed) {
      await showToast({
        style: Toast.Style.Success,
        title: 'Item deleted',
      })
    }
  }

  const handleShowRememberAlert = async () => {
    const confirmed = await confirmAlert({
      title: 'Enable notifications?',
      message: "We'll send you important updates about your account.",
      primaryAction: {
        title: 'Enable',
        style: Alert.ActionStyle.Default,
      },
      dismissAction: {
        title: 'Not now',
        style: Alert.ActionStyle.Cancel,
      },
      rememberUserChoice: true,
    })

    if (confirmed) {
      await showToast({
        style: Toast.Style.Success,
        title: 'Notifications enabled',
      })
    }
  }

  return (
    <List>
      <List.Section title='Toast Examples'>
        <List.Item
          title='Show Success Toast'
          subtitle='Display a success message'
          actions={
            <ActionPanel>
              <Action title='Show Toast' onAction={handleShowSuccessToast} />
            </ActionPanel>
          }
        />

        <List.Item
          title='Show Error Toast'
          subtitle='Display an error message'
          actions={
            <ActionPanel>
              <Action title='Show Toast' onAction={handleShowErrorToast} />
            </ActionPanel>
          }
        />

        <List.Item
          title='Show Animated Toast'
          subtitle='Display a loading toast that can be updated'
          actions={
            <ActionPanel>
              <Action title='Show Toast' onAction={handleShowAnimatedToast} />
              {animatedToast && (
                <>
                  <Action
                    title='Complete Task'
                    onAction={handleCompleteAnimatedToast}
                  />
                  <Action
                    title='Fail Task'
                    onAction={handleFailAnimatedToast}
                  />
                </>
              )}
            </ActionPanel>
          }
        />

        <List.Item
          title='Show Toast with Actions'
          subtitle='Display a toast with interactive buttons'
          actions={
            <ActionPanel>
              <Action
                title='Show Toast'
                onAction={handleShowToastWithActions}
              />
            </ActionPanel>
          }
        />

        <List.Item
          title='Show HUD'
          subtitle='Display a compact HUD message'
          actions={
            <ActionPanel>
              <Action
                title='Show HUD'
                onAction={async () => {
                  await showHUD('Operation completed successfully!')
                }}
              />
            </ActionPanel>
          }
        />
      </List.Section>

      <List.Section title='Alert Examples'>
        <List.Item
          title='Show Confirm Alert'
          subtitle='Display a confirmation dialog'
          actions={
            <ActionPanel>
              <Action title='Show Alert' onAction={handleShowAlert} />
            </ActionPanel>
          }
        />

        <List.Item
          title='Show Alert with Remember Choice'
          subtitle="Alert that remembers user's decision"
          actions={
            <ActionPanel>
              <Action title='Show Alert' onAction={handleShowRememberAlert} />
            </ActionPanel>
          }
        />
      </List.Section>

      <List.Section title='Clipboard Examples'>
        <List.Item
          title='Copy Text to Clipboard'
          subtitle='Copy a sample text to clipboard'
          actions={
            <ActionPanel>
              <Action
                title='Copy Text'
                onAction={async () => {
                  await Clipboard.copy('Hello from Termcast!')
                  await showToast({
                    style: Toast.Style.Success,
                    title: 'Copied to clipboard',
                    message: 'Hello from Termcast!',
                  })
                }}
              />
            </ActionPanel>
          }
        />

        <List.Item
          title='Copy Concealed Text'
          subtitle='Copy sensitive data without showing in history'
          actions={
            <ActionPanel>
              <Action
                title='Copy Secret'
                onAction={async () => {
                  await Clipboard.copy('SecretPassword123', {
                    concealed: true,
                  })
                  await showToast({
                    style: Toast.Style.Success,
                    title: 'Copied securely',
                    message: 'Password copied (concealed)',
                  })
                }}
              />
            </ActionPanel>
          }
        />

        <List.Item
          title='Read from Clipboard'
          subtitle='Read the current clipboard content'
          actions={
            <ActionPanel>
              <Action
                title='Read Clipboard'
                onAction={async () => {
                  const text = await Clipboard.readText()
                  await showToast({
                    style: Toast.Style.Success,
                    title: 'Clipboard content',
                    message: text || '(empty)',
                  })
                }}
              />
            </ActionPanel>
          }
        />

        <List.Item
          title='Clear Clipboard'
          subtitle='Clear the clipboard content'
          actions={
            <ActionPanel>
              <Action
                title='Clear'
                onAction={async () => {
                  await Clipboard.clear()
                  await showToast({
                    style: Toast.Style.Success,
                    title: 'Clipboard cleared',
                  })
                }}
              />
            </ActionPanel>
          }
        />

        <List.Item
          title='Paste Text'
          subtitle='Paste text to the frontmost application'
          actions={
            <ActionPanel>
              <Action
                title='Paste'
                onAction={async () => {
                  await Clipboard.paste('Pasted from Termcast!')
                  await showToast({
                    style: Toast.Style.Success,
                    title: 'Text pasted',
                  })
                }}
              />
            </ActionPanel>
          }
        />

        <List.Item
          title='Copy File to Clipboard'
          subtitle='Copy a file (package.json) to clipboard'
          actions={
            <ActionPanel>
              <Action
                title='Copy File'
                onAction={async () => {
                  try {
                    await Clipboard.copy({
                      file: 'package.json',
                    })
                    await showToast({
                      style: Toast.Style.Success,
                      title: 'File copied',
                      message: 'package.json',
                    })
                  } catch (error) {
                    await showToast({
                      style: Toast.Style.Failure,
                      title: 'Failed to copy file',
                      message: String(error),
                    })
                  }
                }}
              />
            </ActionPanel>
          }
        />

        <List.Item
          title='Read Full Clipboard'
          subtitle='Read text and file from clipboard'
          actions={
            <ActionPanel>
              <Action
                title='Read All'
                onAction={async () => {
                  const { text, file } = await Clipboard.read()
                  await showToast({
                    style: Toast.Style.Success,
                    title: 'Clipboard content',
                    message: file
                      ? `File: ${file}`
                      : `Text: ${text?.slice(0, 50) || '(empty)'}`,
                  })
                }}
              />
            </ActionPanel>
          }
        />
      </List.Section>

      <List.Section title='Form Examples'>
        <List.Item
          title='Show Simple Form'
          subtitle='Display a form with text field'
          actions={
            <ActionPanel>
              <Action
                title='Open Form'
                onAction={() => push(<FormExample />)}
              />
            </ActionPanel>
          }
        />

        <List.Item
          title='Show Detail View'
          subtitle='Display a markdown detail view'
          actions={
            <ActionPanel>
              <Action
                title='Open Detail'
                onAction={() => push(<DetailExample />)}
              />
            </ActionPanel>
          }
        />
      </List.Section>

      <List.Section title='Environment'>
        <List.Item
          title='Show Environment Info'
          subtitle={`Theme: ${environment.appearance}, Dev mode: ${environment.isDevelopment}`}
          actions={
            <ActionPanel>
              <Action
                title='Show Info'
                onAction={async () => {
                  await showToast({
                    style: Toast.Style.Success,
                    title: 'Environment',
                    message: `Extension: ${environment.extensionName}, Raycast: ${environment.raycastVersion}`,
                  })
                }}
              />
            </ActionPanel>
          }
        />
      </List.Section>

      <List.Section title='Preferences'>
        <List.Item
          title='Get Preference Values'
          subtitle='Access preference values for the current command'
          actions={
            <ActionPanel>
              <Action
                title='Get Preferences'
                onAction={async () => {
                  const preferences = getPreferenceValues()
                  await showToast({
                    style: Toast.Style.Success,
                    title: 'Preferences',
                    message:
                      Object.keys(preferences).length > 0
                        ? JSON.stringify(preferences)
                        : 'No preferences configured',
                  })
                }}
              />
            </ActionPanel>
          }
        />

        <List.Item
          title='Open Extension Preferences'
          subtitle='Open preferences for the current extension'
          actions={
            <ActionPanel>
              <Action
                title='Open Preferences'
                onAction={async () => {
                  try {
                    await openExtensionPreferences()
                  } catch (error) {
                    await showToast({
                      style: Toast.Style.Failure,
                      title: 'Error',
                      message: String(error),
                    })
                  }
                }}
              />
            </ActionPanel>
          }
        />

        <List.Item
          title='Open Command Preferences'
          subtitle='Open preferences for the current command'
          actions={
            <ActionPanel>
              <Action
                title='Open Preferences'
                onAction={async () => {
                  try {
                    await openCommandPreferences()
                  } catch (error) {
                    await showToast({
                      style: Toast.Style.Failure,
                      title: 'Error',
                      message: String(error),
                    })
                  }
                }}
              />
            </ActionPanel>
          }
        />
      </List.Section>

      <List.Section title='System Utilities'>
        <List.Item
          title='Get All Applications'
          subtitle='List all installed applications'
          actions={
            <ActionPanel>
              <Action
                title='Get Apps'
                onAction={async () => {
                  const apps = await getApplications()
                  await showToast({
                    style: Toast.Style.Success,
                    title: 'Applications found',
                    message: `${apps.length} apps: ${apps.map((a) => a.name).join(', ')}`,
                  })
                }}
              />
            </ActionPanel>
          }
        />

        <List.Item
          title='Get Default Application'
          subtitle='Get default app for a file'
          actions={
            <ActionPanel>
              <Action
                title='Get Default'
                onAction={async () => {
                  const app = await getDefaultApplication('/Users/test.txt')
                  await showToast({
                    style: Toast.Style.Success,
                    title: 'Default app',
                    message: app.name,
                  })
                }}
              />
            </ActionPanel>
          }
        />

        <List.Item
          title='Get Frontmost Application'
          subtitle='Get currently active app'
          actions={
            <ActionPanel>
              <Action
                title='Get Frontmost'
                onAction={async () => {
                  const app = await getFrontmostApplication()
                  await showToast({
                    style: Toast.Style.Success,
                    title: 'Frontmost app',
                    message: app.name,
                  })
                }}
              />
            </ActionPanel>
          }
        />

        <List.Item
          title='Show in Finder'
          subtitle='Reveal a file in Finder'
          actions={
            <ActionPanel>
              <Action
                title='Show File'
                onAction={async () => {
                  await showInFinder('package.json')
                  await showToast({
                    style: Toast.Style.Success,
                    title: 'Opened in Finder',
                  })
                }}
              />
            </ActionPanel>
          }
        />

        <List.Item
          title='Show in Finder (Action Component)'
          subtitle='Use Action.ShowInFinder to reveal package.json'
          actions={
            <ActionPanel>
              <Action.ShowInFinder
                path='package.json'
                title='Reveal in Finder'
                icon='📁'
                shortcut={{
                  modifiers: ['cmd', 'shift'],
                  key: 'r',
                }}
                onShow={(path) => {
                  logger.log(`Showing ${path} in Finder`)
                }}
              />
            </ActionPanel>
          }
        />

        <List.Item
          title='Move to Trash'
          subtitle='Move a file to trash'
          actions={
            <ActionPanel>
              <Action
                title='Trash File'
                onAction={async () => {
                  await trash('/tmp/test.txt')
                  await showToast({
                    style: Toast.Style.Success,
                    title: 'Moved to trash',
                  })
                }}
              />
            </ActionPanel>
          }
        />

        <List.Item
          title='Open File or URL'
          subtitle='Open with default or specific app'
          actions={
            <ActionPanel>
              <Action
                title='Open URL'
                onAction={async () => {
                  await open('https://raycast.com')
                  await showToast({
                    style: Toast.Style.Success,
                    title: 'Opening URL',
                  })
                }}
              />
            </ActionPanel>
          }
        />

        <List.Item
          title='Capture Exception'
          subtitle='Test error reporting'
          actions={
            <ActionPanel>
              <Action
                title='Throw Error'
                onAction={() => {
                  try {
                    throw new Error('Test exception')
                  } catch (e) {
                    captureException(e)
                    showToast({
                      style: Toast.Style.Failure,
                      title: 'Exception captured',
                    })
                  }
                }}
              />
            </ActionPanel>
          }
        />
      </List.Section>

      <List.Section title='Window Management'>
        <List.Item
          title='Close Main Window'
          subtitle='Close window and switch to previous app'
          actions={
            <ActionPanel>
              <Action
                title='Close Window'
                onAction={async () => {
                  await closeMainWindow()
                }}
              />
            </ActionPanel>
          }
        />

        <List.Item
          title='Close Window with Clear Search'
          subtitle='Close and clear root search'
          actions={
            <ActionPanel>
              <Action
                title='Close & Clear'
                onAction={async () => {
                  await closeMainWindow({
                    clearRootSearch: true,
                  })
                }}
              />
            </ActionPanel>
          }
        />

        <List.Item
          title='Close Window (Suspended)'
          subtitle='Close without popping to root'
          actions={
            <ActionPanel>
              <Action
                title='Close Suspended'
                onAction={async () => {
                  await closeMainWindow({
                    popToRootType: PopToRootType.Suspended,
                  })
                }}
              />
            </ActionPanel>
          }
        />
      </List.Section>
    </List>
  )
}

renderWithProviders(<MiscellaneousExample />)
