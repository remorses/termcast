import React from 'react'
import { Form } from './form'
import { ActionPanel, Action } from './actions'
import type { RaycastArgument } from 'termcast/src/package-json'

interface CommandArgumentsProps {
  arguments: RaycastArgument[]
  commandTitle: string
  onSubmit: (values: Record<string, string>) => void
}

export function CommandArguments({
  arguments: args,
  commandTitle,
  onSubmit,
}: CommandArgumentsProps): any {
  const handleSubmit = (values: Record<string, any>) => {
    onSubmit(values as Record<string, string>)
  }

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm title='Run Command' onSubmit={handleSubmit} />
        </ActionPanel>
      }
      navigationTitle={commandTitle}
    >
      <Form.Description
        title={commandTitle}
        text='Enter the arguments to run this command.'
      />

      {args.map((arg) => {
        switch (arg.type) {
          case 'text':
            return (
              <Form.TextField
                key={arg.name}
                id={arg.name}
                title={arg.placeholder}
                placeholder={arg.placeholder}
              />
            )

          case 'password':
            return (
              <Form.PasswordField
                key={arg.name}
                id={arg.name}
                title={arg.placeholder}
                placeholder={arg.placeholder}
              />
            )

          case 'dropdown':
            return (
              <Form.Dropdown
                key={arg.name}
                id={arg.name}
                title={arg.placeholder}
                placeholder={arg.placeholder}
              >
                {arg.data?.map((item) => (
                  <Form.Dropdown.Item
                    key={item.value}
                    value={item.value}
                    title={item.title}
                  />
                ))}
              </Form.Dropdown>
            )

          default:
            return null
        }
      })}
    </Form>
  )
}
