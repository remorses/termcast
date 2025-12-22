import React from 'react'
import { createRoot } from '@opentui/react'
import { createCliRenderer } from '@opentui/core'
import List from 'termcast'
import { Action, ActionPanel } from 'termcast'
import { useNavigation } from 'termcast/src/internal/navigation'
import { TermcastProvider } from 'termcast/src/internal/providers'

function GoBackAction(): any {
  const { pop } = useNavigation()
  return <Action title='Go Back' onAction={() => pop()} />
}

function DetailView({ title }: { title: string }): any {
  return (
    <List
      searchBarPlaceholder='Detail view - Press ESC to go back'
      navigationTitle={`Detail: ${title}`}
    >
      <List.Section title='Details'>
        <List.Item
          id='back'
          title={`This is the detail view for ${title}`}
          subtitle='Press Enter to go back or ESC to navigate back'
          actions={
            <ActionPanel>
              <GoBackAction />
              <Action.CopyToClipboard content={title} title='Copy Title' />
            </ActionPanel>
          }
        />
      </List.Section>
    </List>
  )
}

function OpenDetailsAction({ title }: { title: string }): any {
  const { push } = useNavigation()
  return (
    <Action
      title='Open Details'
      onAction={() => push(<DetailView title={title} />)}
    />
  )
}

function MainView(): any {
  const items = [
    {
      id: 'first',
      title: 'First Item',
      subtitle: 'Navigate to first detail',
    },
    {
      id: 'second',
      title: 'Second Item',
      subtitle: 'Navigate to second detail',
    },
    {
      id: 'third',
      title: 'Third Item',
      subtitle: 'Navigate to third detail',
    },
  ]

  return (
    <List searchBarPlaceholder='Main view' navigationTitle='Navigation Example'>
      <List.Section title='Items'>
        {items.map((item) => (
          <List.Item
            id={item.id}
            title={item.title}
            subtitle={item.subtitle}
            actions={
              <ActionPanel>
                <OpenDetailsAction title={item.title} />
                <Action.CopyToClipboard
                  content={item.title}
                  title='Copy Title'
                />
              </ActionPanel>
            }
          />
        ))}
      </List.Section>
    </List>
  )
}

function App(): any {
  return (
    <TermcastProvider>
      <MainView />
    </TermcastProvider>
  )
}

const renderer = await createCliRenderer({
  onDestroy: () => {
    process.exit(0)
  },
})
createRoot(renderer).render(<App />)
