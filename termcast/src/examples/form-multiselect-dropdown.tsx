import React, { useState } from 'react'
import { renderWithProviders } from '@termcast/cli/src/utils'
import { Form, ActionPanel, Action } from '@termcast/cli'

function FormMultiSelectDropdownExample() {
    const [submitted, setSubmitted] = useState<any>(null)

    const handleSubmit = (data: any) => {
        setSubmitted(data)
    }

    return (
        <Form
            actions={
                <ActionPanel>
                    <Action.SubmitForm
                        title='Submit Form'
                        onSubmit={handleSubmit}
                    />
                </ActionPanel>
            }
        >
            <Form.Description
                title='Multi-Select Dropdown Demo'
                text='Test dropdown with multiple selection capability'
            />

            <Form.Dropdown
                id='tags'
                title='Select Tags'
                placeholder='Choose multiple tags...'
                info='You can select multiple items'
                hasMultipleSelection={true}
                defaultValue={['work', 'urgent']}
            >
                <Form.Dropdown.Item value='work' title='Work' icon='💼' />
                <Form.Dropdown.Item value='personal' title='Personal' icon='🏠' />
                <Form.Dropdown.Item value='urgent' title='Urgent' icon='🚨' />
                <Form.Dropdown.Item value='later' title='Later' icon='⏰' />
                <Form.Dropdown.Item value='done' title='Done' icon='✅' />
                <Form.Dropdown.Item value='canceled' title='Canceled' icon='❌' />
            </Form.Dropdown>

            <Form.Dropdown
                id='singleChoice'
                title='Single Choice'
                placeholder='Choose one option...'
                hasMultipleSelection={false}
            >
                <Form.Dropdown.Item value='option1' title='Option 1' />
                <Form.Dropdown.Item value='option2' title='Option 2' />
                <Form.Dropdown.Item value='option3' title='Option 3' />
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

renderWithProviders(<FormMultiSelectDropdownExample />)