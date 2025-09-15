#!/usr/bin/env bun
import { renderWithProviders } from '@termcast/cli'
import { Detail, Action, ActionPanel } from '@termcast/cli'

function TestErrorBoundary(): any {
  return (
    <Detail
      navigationTitle='Test Error Boundary'
      markdown='# Error Boundary Test
      
Click the action below to trigger an error and see the improved error display.'
      actions={
        <ActionPanel>
          <Action
            title='Trigger Error'
            onAction={() => {
              throw new Error('This is a test error to showcase the improved ErrorBoundary design!')
            }}
          />
        </ActionPanel>
      }
    />
  )
}

renderWithProviders(<TestErrorBoundary />)