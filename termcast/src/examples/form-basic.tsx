import React, { useState } from 'react'
import { render } from '@opentui/react'
import { Form, ActionPanel, Action } from 'termcast'
import { logger } from 'termcast'
import { showToast, Toast } from 'termcast'
import { renderWithProviders } from 'termcast'

export function FormBasicExample(): any {
  const [submittedData, setSubmittedData] = useState<any>(null)

  const handleSubmit = async (values: any) => {
    logger.log('Form submitted:', values)
    setSubmittedData(values)
    await showToast({
      style: Toast.Style.Success,
      title: 'Form Submitted',
      message: 'All form data has been captured successfully',
    })
  }

  return (
    <box flexDirection='column'>
      <Form
        actions={
          <ActionPanel>
            <Action.SubmitForm title='Submit Form' onSubmit={handleSubmit} />
          </ActionPanel>
        }
      >
        <Form.Description
          title='Form Component Demo'
          text='This demonstrates all available form input types. Use arrow keys or Tab to navigate between fields.'
        />

        <Form.Separator />

        <Form.TextField
          id='username'
          title='Username'
          placeholder='Enter your username'
          defaultValue=''
          info='Required field'
        />

        <Form.PasswordField
          id='password'
          title='Password'
          placeholder='Enter secure password'
          info='Must be at least 8 characters'
        />

        <Form.TextArea
          id='bio'
          title='Biography'
          placeholder='Tell us about yourself...'
          info='Maximum 500 characters'
          defaultValue=''
        />

        <Form.Checkbox
          id='newsletter'
          title='Email Preferences'
          label='Subscribe to newsletter'
          defaultValue={false}
          info='Receive weekly updates'
        />

        <Form.Dropdown
          id='country'
          title='Country'
          placeholder='Select your country'
          info='Your country of residence'
        >
          <Form.Dropdown.Section title='Americas'>
            <Form.Dropdown.Item value='us' title='United States' icon='🇺🇸' />
            <Form.Dropdown.Item value='ca' title='Canada' icon='🇨🇦' />
            <Form.Dropdown.Item value='mx' title='Mexico' icon='🇲🇽' />
          </Form.Dropdown.Section>
          <Form.Dropdown.Section title='Europe'>
            <Form.Dropdown.Item value='gb' title='United Kingdom' icon='🇬🇧' />
            <Form.Dropdown.Item value='fr' title='France' icon='🇫🇷' />
            <Form.Dropdown.Item value='de' title='Germany' icon='🇩🇪' />
          </Form.Dropdown.Section>
        </Form.Dropdown>

        <Form.DatePicker
          id='birthdate'
          title='Date of Birth'
          type={Form.DatePicker.Type.Date}
          info='Format: YYYY-MM-DD'
        />

        <Form.FilePicker
          id='documents'
          title='Upload Documents'
          info='Select one or more documents to attach'
          allowMultipleSelection={true}
          canChooseFiles={true}
          canChooseDirectories={false}
        />

        <Form.Separator />

        <Form.Description
          title='Form Navigation'
          text='• ↑↓/Tab: Navigate fields | Space: Toggle checkbox | Enter/Space: Open dropdown | ^K/⌘↵: Show actions'
        />
      </Form>

      {submittedData && (
        <box flexDirection='column' marginTop={2}>
          <Form.Description
            title='Submitted Data:'
            text={JSON.stringify(submittedData, null, 2)}
          />
        </box>
      )}
    </box>
  )
}

renderWithProviders(<FormBasicExample />)
