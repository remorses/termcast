import React, { useState } from 'react'
import { renderWithProviders } from 'termcast/src/utils'
import { Form, ActionPanel, Action } from 'termcast'

function FormTagPickerExample() {
  const [submitted, setSubmitted] = useState<any>(null)

  const handleSubmit = (data: any) => {
    setSubmitted(data)
  }

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm title='Submit Form' onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.Description
        title='TagPicker Component Demo'
        text='Test tag picker with multiple selection support'
      />

      <Form.TagPicker
        id='sports'
        title='Favorite Sport'
        placeholder='Choose your favorite sport...'
        info='Select your favorite sport from the list'
      >
        <Form.TagPicker.Item value='basketball' title='Basketball' icon='🏀' />
        <Form.TagPicker.Item value='football' title='Football' icon='⚽' />
        <Form.TagPicker.Item value='tennis' title='Tennis' icon='🎾' />
        <Form.TagPicker.Item value='baseball' title='Baseball' icon='⚾' />
        <Form.TagPicker.Item value='golf' title='Golf' icon='⛳' />
        <Form.TagPicker.Item value='swimming' title='Swimming' icon='🏊' />
        <Form.TagPicker.Item value='cycling' title='Cycling' icon='🚴' />
        <Form.TagPicker.Item value='running' title='Running' icon='🏃' />
      </Form.TagPicker>

      <Form.TagPicker
        id='countries'
        title='Country'
        placeholder='Select a country'
        defaultValue={['ger']}
      >
        <Form.TagPicker.Item value='ger' title='Germany' icon='🇩🇪' />
        <Form.TagPicker.Item value='ind' title='India' icon='🇮🇳' />
        <Form.TagPicker.Item value='ned' title='Netherlands' icon='🇳🇱' />
        <Form.TagPicker.Item value='nor' title='Norway' icon='🇳🇴' />
        <Form.TagPicker.Item value='pol' title='Poland' icon='🇵🇱' />
        <Form.TagPicker.Item value='rus' title='Russia' icon='🇷🇺' />
        <Form.TagPicker.Item value='sco' title='Scotland' icon='🏴󠁧󠁢󠁳󠁣󠁴󠁿' />
      </Form.TagPicker>

      {submitted && (
        <Form.Description
          title='Submitted Data'
          text={JSON.stringify(submitted, null, 2)}
        />
      )}
    </Form>
  )
}

renderWithProviders(<FormTagPickerExample />)
