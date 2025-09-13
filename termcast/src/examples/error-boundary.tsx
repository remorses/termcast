import React, { useState } from 'react'
import {
  List,
  Action,
  ActionPanel,
  Detail,
  showToast,
  Toast,
  renderWithProviders,
} from '@termcast/cli'
import { useNavigation } from '@termcast/cli/src/internal/navigation'

function ThrowErrorComponent(): any {
  throw new Error('This is a test error from ThrowErrorComponent!')
}
ThrowErrorComponent.displayName = 'ThrowErrorComponent'

function AnotherComponent(): any {
  const [shouldError, setShouldError] = useState(false)

  if (shouldError) {
    throw new Error('Error thrown after user action in AnotherComponent!')
  }

  return (
    <Detail
      navigationTitle='Another Component'
      markdown='# Another Component
      
This component can throw an error when you trigger it.

Use the action below to throw an error.'
      actions={
        <ActionPanel>
          <Action
            title='Throw Error Now'
            onAction={() => setShouldError(true)}
          />
        </ActionPanel>
      }
    />
  )
}
AnotherComponent.displayName = 'AnotherComponent'

function DeepComponent({ level }: { level: number }): any {
  const { push } = useNavigation()

  return (
    <Detail
      navigationTitle={`Deep Component Level ${level}`}
      markdown={`# Deep Component Level ${level}
      
This is nested component at level ${level}.

You can navigate deeper or throw an error at this level.`}
      actions={
        <ActionPanel>
          <Action
            title='Go Deeper'
            onAction={() => {
              const Component = () => <DeepComponent level={level + 1} />
              Component.displayName = `DeepComponent-Level-${level + 1}`
              push(<Component />)
            }}
          />
          <Action
            title='Throw Error at This Level'
            onAction={() => {
              throw new Error(`Error thrown at navigation level ${level}!`)
            }}
          />
        </ActionPanel>
      }
    />
  )
}
DeepComponent.displayName = 'DeepComponent'

export default function ErrorBoundaryExample(): any {
  const { push } = useNavigation()
  const [searchText, setSearchText] = useState('')

  return (
    <List
      navigationTitle='Error Boundary Test'
      searchBarPlaceholder='Search actions...'
      onSearchTextChange={setSearchText}
    >
      <List.Section title='Error Actions'>
        <List.Item
          title='Throw Error Immediately'
          subtitle='This will throw an error right away'
          actions={
            <ActionPanel>
              <Action
                title='Throw Error'
                onAction={() => {
                  throw new Error('Immediate error from List.Item action!')
                }}
              />
            </ActionPanel>
          }
        />

        <List.Item
          title='Navigate Then Throw Error'
          subtitle='Push a component that throws error on render'
          actions={
            <ActionPanel>
              <Action
                title='Navigate to Error Component'
                onAction={() => {
                  const Component = () => <ThrowErrorComponent />
                  Component.displayName = 'ErrorBoundaryTest-ThrowError'
                  push(<Component />)
                }}
              />
            </ActionPanel>
          }
        />

        <List.Item
          title='Navigate to Component with Error Action'
          subtitle='Push a component that can throw error on action'
          actions={
            <ActionPanel>
              <Action
                title='Navigate to Component'
                onAction={() => {
                  const Component = () => <AnotherComponent />
                  Component.displayName = 'ErrorBoundaryTest-AnotherComponent'
                  push(<Component />)
                }}
              />
            </ActionPanel>
          }
        />

        <List.Item
          title='Deep Navigation Then Error'
          subtitle='Navigate through multiple levels then throw error'
          actions={
            <ActionPanel>
              <Action
                title='Start Deep Navigation'
                onAction={() => {
                  const Component = () => <DeepComponent level={1} />
                  Component.displayName = 'ErrorBoundaryTest-DeepNavigation'
                  push(<Component />)
                }}
              />
            </ActionPanel>
          }
        />

        <List.Item
          title='Show Toast Then Error'
          subtitle='Show a toast message then throw error'
          actions={
            <ActionPanel>
              <Action
                title='Show Toast and Error'
                onAction={async () => {
                  await showToast({
                    style: Toast.Style.Success,
                    title: 'Toast shown!',
                    message: 'Error will be thrown in 2 seconds...',
                  })
                  setTimeout(() => {
                    throw new Error('Error after toast!')
                  }, 2000)
                }}
              />
            </ActionPanel>
          }
        />

        <List.Item
          title='Async Error'
          subtitle='Throw error in async operation'
          actions={
            <ActionPanel>
              <Action
                title='Trigger Async Error'
                onAction={async () => {
                  await new Promise((resolve) => setTimeout(resolve, 1000))
                  throw new Error('Async operation failed!')
                }}
              />
            </ActionPanel>
          }
        />
      </List.Section>

      <List.Section title='Test Search'>
        <List.Item
          title={`Search Text: "${searchText}"`}
          subtitle='Type in search to test if error boundary preserves search'
          actions={
            <ActionPanel>
              <Action
                title='Error with Search Active'
                onAction={() => {
                  throw new Error(`Error with search text: "${searchText}"`)
                }}
              />
            </ActionPanel>
          }
        />
      </List.Section>
    </List>
  )
}
ErrorBoundaryExample.displayName = 'ErrorBoundaryExample'

renderWithProviders(<ErrorBoundaryExample />)
