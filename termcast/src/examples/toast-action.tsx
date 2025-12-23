import React from 'react'
import {
  List,
  renderWithProviders,
  showToast,
  Toast,
  Form,
  ActionPanel,
  Action,
} from 'termcast'
import { useNavigation } from 'termcast/src/internal/navigation'

function DetailView({ name }: { name: string }): any {
  return (
    <List navigationTitle="Form Submitted">
      <List.Item id="success" title={`Welcome, ${name}!`} subtitle="Form submission successful" />
    </List>
  )
}

function FormWithToast(): any {
  const { push } = useNavigation()

  const handleSubmit = async (values: { name: string }) => {
    await showToast({
      style: Toast.Style.Success,
      title: 'Form Submitted',
      message: `Hello, ${values.name}!`,
      primaryAction: {
        title: 'View Details',
        onAction: async () => {
          push(<DetailView name={values.name} />)
        },
      },
    })
  }

  return (
    <Form
      navigationTitle="Form with Toast"
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Submit" onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.TextField id="name" title="Name" placeholder="Enter your name" />
    </Form>
  )
}

function FormWithDelayedToastAction(): any {
  const handleSubmit = async (values: { name: string }) => {
    // Simulates tuitube pattern: show toast first, then set primaryAction later
    const toast = await showToast({
      style: Toast.Style.Animated,
      title: 'Processing',
      message: 'Please wait...',
    })

    // Simulate async operation completing
    await new Promise((r) => setTimeout(r, 500))

    // Set primaryAction AFTER toast is shown (like tuitube does in on("close") callback)
    toast.style = Toast.Style.Success
    toast.title = 'Done'
    toast.message = `Hello, ${values.name}!`
    toast.primaryAction = {
      title: 'Open',
      onAction: async () => {
        await showToast({
          style: Toast.Style.Success,
          title: 'Opened!',
          message: 'Action triggered successfully',
        })
      },
    }
  }

  return (
    <Form
      navigationTitle="Delayed Toast Action"
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Submit" onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.TextField id="name" title="Name" placeholder="Enter your name" />
    </Form>
  )
}

function ToastActionExample(): any {
  const { push } = useNavigation()

  return (
    <List navigationTitle="Toast Action Test">
      <List.Item
        id="show-toast"
        title="Show Toast with Action"
        actions={
          <ActionPanel>
            <Action
              title="Show Toast"
              onAction={async () => {
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
              }}
            />
          </ActionPanel>
        }
      />
      <List.Item
        id="form-toast"
        title="Form with Toast"
        actions={
          <ActionPanel>
            <Action
              title="Open Form"
              onAction={() => {
                push(<FormWithToast />)
              }}
            />
          </ActionPanel>
        }
      />
      <List.Item
        id="delayed-toast"
        title="Form with Delayed Toast Action"
        actions={
          <ActionPanel>
            <Action
              title="Open Form"
              onAction={() => {
                push(<FormWithDelayedToastAction />)
              }}
            />
          </ActionPanel>
        }
      />
      <List.Item id="other" title="Other Item" />
    </List>
  )
}

await renderWithProviders(<ToastActionExample />)
