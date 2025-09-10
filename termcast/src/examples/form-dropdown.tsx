import React, { useState } from 'react'
import { renderWithProviders } from '@termcast/cli/src/utils'
import { Form, ActionPanel, Action } from '@termcast/cli'

function FormDropdownExample() {
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
        title='Dropdown Component Demo'
        text='Test dropdown with sections, multiple selection, and more features'
      />

      <Form.Dropdown
        id='languages'
        title='Programming Languages'
        placeholder='Select languages...'
        info='Choose your preferred programming languages'
        hasMultipleSelection={true}
        defaultValue={['typescript', 'rust']}
      >
        <Form.Dropdown.Section title='Frontend'>
          <Form.Dropdown.Item value='typescript' title='TypeScript' icon='📘' />
          <Form.Dropdown.Item value='javascript' title='JavaScript' icon='📒' />
          <Form.Dropdown.Item value='react' title='React' icon='⚛️' />
          <Form.Dropdown.Item value='vue' title='Vue' icon='💚' />
          <Form.Dropdown.Item value='svelte' title='Svelte' icon='🔥' />
        </Form.Dropdown.Section>

        <Form.Dropdown.Section title='Backend'>
          <Form.Dropdown.Item value='node' title='Node.js' icon='🟢' />
          <Form.Dropdown.Item value='python' title='Python' icon='🐍' />
          <Form.Dropdown.Item value='go' title='Go' icon='🐹' />
          <Form.Dropdown.Item value='rust' title='Rust' icon='🦀' />
          <Form.Dropdown.Item value='java' title='Java' icon='☕' />
        </Form.Dropdown.Section>

        <Form.Dropdown.Section title='Mobile'>
          <Form.Dropdown.Item value='swift' title='Swift' icon='🦉' />
          <Form.Dropdown.Item value='kotlin' title='Kotlin' icon='🟣' />
          <Form.Dropdown.Item value='flutter' title='Flutter' icon='💙' />
          <Form.Dropdown.Item
            value='react-native'
            title='React Native'
            icon='📱'
          />
        </Form.Dropdown.Section>
      </Form.Dropdown>

      <Form.Dropdown
        id='theme'
        title='Editor Theme'
        placeholder='Choose a theme...'
        info='Select your preferred editor color theme'
        defaultValue='dracula'
      >
        <Form.Dropdown.Item value='monokai' title='Monokai' icon='🌑' />
        <Form.Dropdown.Item value='dracula' title='Dracula' icon='🧛' />
        <Form.Dropdown.Item value='one-dark' title='One Dark' icon='🌚' />
        <Form.Dropdown.Item value='nord' title='Nord' icon='❄️' />
        <Form.Dropdown.Item value='github' title='GitHub Light' icon='☀️' />
        <Form.Dropdown.Item
          value='solarized-light'
          title='Solarized Light'
          icon='🌞'
        />
        <Form.Dropdown.Item value='one-light' title='One Light' icon='💡' />
      </Form.Dropdown>

      <Form.Dropdown
        id='priority'
        title='Task Priority'
        placeholder='Select priority level'
      >
        <Form.Dropdown.Item value='critical' title='Critical' icon='🔴' />
        <Form.Dropdown.Item value='high' title='High' icon='🟠' />
        <Form.Dropdown.Item value='medium' title='Medium' icon='🟡' />
        <Form.Dropdown.Item value='low' title='Low' icon='🟢' />
      </Form.Dropdown>

      {submitted && (
        <Form.Description
          title='Submitted Data'
          text={JSON.stringify(submitted, null, 2)}
        />
      )}
    </Form>
  )
}

renderWithProviders(<FormDropdownExample />)
