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
                    <Action.SubmitForm
                        title='Submit Form'
                        onSubmit={handleSubmit}
                    />
                </ActionPanel>
            }
        >
            <Form.Description
                title='Dropdown Component Demo'
                text='Test dropdown with inline options display'
            />

            <Form.Dropdown
                id='color'
                title='Favorite Color'
                placeholder='Choose a color...'
                info='Select your favorite color from the list'
            >
                <Form.Dropdown.Item value='red' title='Red' icon='🔴' />
                <Form.Dropdown.Item value='blue' title='Blue' icon='🔵' />
                <Form.Dropdown.Item value='green' title='Green' icon='🟢' />
                <Form.Dropdown.Item value='yellow' title='Yellow' icon='🟡' />
                <Form.Dropdown.Item value='purple' title='Purple' icon='🟣' />
                <Form.Dropdown.Item value='orange' title='Orange' icon='🟠' />
                <Form.Dropdown.Item value='black' title='Black' icon='⚫' />
                <Form.Dropdown.Item value='white' title='White' icon='⚪' />
            </Form.Dropdown>

            <Form.Dropdown
                id='country'
                title='Country'
                placeholder='Select your country'
                defaultValue='us'
            >
                <Form.Dropdown.Item
                    value='us'
                    title='United States'
                    icon='🇺🇸'
                />
                <Form.Dropdown.Item value='ca' title='Canada' icon='🇨🇦' />
                <Form.Dropdown.Item value='mx' title='Mexico' icon='🇲🇽' />
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
