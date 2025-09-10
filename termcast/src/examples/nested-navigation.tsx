import React from 'react'
import { render } from '@opentui/react'
import List from '@termcast/cli'
import { Action, ActionPanel } from '@termcast/cli'
import { useNavigation } from '@termcast/cli/src/internal/navigation'
import { Providers } from '@termcast/cli/src/internal/providers'

function ThirdLevel({ path }: { path: string[] }): any {
  const { pop } = useNavigation()
  const fullPath = path.join(' > ')

  return (
    <List
      searchBarPlaceholder='Third level - Press ESC to go back'
      navigationTitle={fullPath}
    >
      <List.Section title='Final Level'>
        <List.Item
          id='info'
          title="You've reached the deepest level"
          subtitle={`Path: ${fullPath}`}
          actions={
            <ActionPanel>
              <Action title='← Go Back' onAction={() => pop()} />
              <Action.CopyToClipboard content={fullPath} title='Copy Path' />
            </ActionPanel>
          }
        />
      </List.Section>
    </List>
  )
}

function SecondLevel({ category }: { category: string }): any {
  const { push, pop } = useNavigation()

  const items = ['Item A', 'Item B', 'Item C']

  return (
    <List
      searchBarPlaceholder='Second level - Press ESC to go back'
      navigationTitle={category}
    >
      <List.Section title={`${category} Items`}>
        {items.map((item) => (
          <List.Item
            id={`item-${item}`}
            title={item}
            subtitle={`View details for ${item}`}
            actions={
              <ActionPanel>
                <Action
                  title='View Details'
                  onAction={() => {
                    push(<ThirdLevel path={[category, item]} />, () =>
                      console.log(`Popped from ${item}`),
                    )
                  }}
                />
                <Action title='← Back' onAction={() => pop()} />
              </ActionPanel>
            }
          />
        ))}
      </List.Section>
    </List>
  )
}

function FirstLevel(): any {
  const { push } = useNavigation()

  const categories = [
    { id: 'docs', title: 'Documents', icon: '📄' },
    { id: 'images', title: 'Images', icon: '🖼️' },
    { id: 'videos', title: 'Videos', icon: '🎥' },
    { id: 'music', title: 'Music', icon: '🎵' },
  ]

  return (
    <List
      searchBarPlaceholder='Search categories'
      navigationTitle='Nested Navigation Demo'
    >
      <List.Section title='Categories'>
        {categories.map((cat) => (
          <List.Item
            id={cat.id}
            title={`${cat.icon} ${cat.title}`}
            subtitle={`Browse ${cat.title.toLowerCase()}`}
            actions={
              <ActionPanel>
                <Action
                  title='Open Category'
                  onAction={() => {
                    push(<SecondLevel category={cat.title} />, () =>
                      console.log(`Popped from ${cat.title}`),
                    )
                  }}
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
    <Providers>
      <FirstLevel />
    </Providers>
  )
}

render(<App />)
