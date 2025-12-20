import React from 'react'
import { Form, ActionPanel, Action } from 'termcast'
import { renderWithProviders } from 'termcast'

export function FormScrollExample(): any {
  return (
    <box flexDirection='column' flexGrow={1}>
      <Form
        // isLoading
        // navigationTitle='something'
        actions={
          <ActionPanel>
            <Action.SubmitForm title='Submit' onSubmit={() => {}} />
          </ActionPanel>
        }
      >
        <Form.Description
          title='Form Scroll Test'
          text='Test scrolling behavior when navigating with Tab'
        />

        <Form.TextField id='field1' title='Field 1' placeholder='First field' />

        <Form.TextField
          id='field2'
          title='Field 2'
          placeholder='Second field'
        />

        <Form.TextField id='field3' title='Field 3' placeholder='Third field' />

        <Form.TextField
          id='field4'
          title='Field 4'
          placeholder='Fourth field'
        />

        <Form.TextField id='field5' title='Field 5' placeholder='Fifth field' />

        <Form.TextField id='field6' title='Field 6' placeholder='Sixth field' />

        <Form.TextField
          id='field7'
          title='Field 7'
          placeholder='Seventh field'
        />

        <Form.TextField
          id='field8'
          title='Field 8'
          placeholder='Eighth field'
        />
      </Form>
    </box>
  )
}

await renderWithProviders(<FormScrollExample />)
