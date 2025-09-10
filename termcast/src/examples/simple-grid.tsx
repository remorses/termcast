import { Grid, Action, ActionPanel } from '@termcast/cli'
import { useState } from 'react'
import { renderWithProviders } from '../utils'

const GridExample = () => {
  const [searchText, setSearchText] = useState('')

  const items = [
    { id: '1', title: 'Apple', content: '🍎', keywords: ['fruit', 'red'] },
    { id: '2', title: 'Banana', content: '🍌', keywords: ['fruit', 'yellow'] },
    { id: '3', title: 'Cherry', content: '🍒', keywords: ['fruit', 'red'] },
    { id: '4', title: 'Dog', content: '🐕', keywords: ['animal', 'pet'] },
    { id: '5', title: 'Cat', content: '🐱', keywords: ['animal', 'pet'] },
    { id: '6', title: 'Rabbit', content: '🐰', keywords: ['animal', 'pet'] },
    { id: '7', title: 'House', content: '🏠', keywords: ['building', 'home'] },
    {
      id: '8',
      title: 'Car',
      content: '🚗',
      keywords: ['vehicle', 'transport'],
    },
    { id: '9', title: 'Rocket', content: '🚀', keywords: ['vehicle', 'space'] },
    {
      id: '10',
      title: 'Star',
      content: '⭐',
      keywords: ['space', 'celestial'],
    },
    {
      id: '11',
      title: 'Moon',
      content: '🌙',
      keywords: ['space', 'celestial'],
    },
    { id: '12', title: 'Sun', content: '☀️', keywords: ['space', 'celestial'] },
  ]

  return (
    <Grid
      navigationTitle='Simple Grid Example'
      searchBarPlaceholder='Search items...'
      searchText={searchText}
      onSearchTextChange={setSearchText}
      columns={5}
      aspectRatio='1'
    >
      <Grid.Section title='Fruits' columns={3}>
        {items.slice(0, 3).map((item) => (
          <Grid.Item
            key={item.id}
            id={item.id}
            title={item.title}
            content={item.content}
            keywords={item.keywords}
            actions={
              <ActionPanel>
                <ActionPanel.Section>
                  <Action
                    title='Show Details'
                    onAction={() => {
                      console.log(`Selected: ${item.title}`)
                    }}
                  />
                  <Action
                    title='Copy Emoji'
                    shortcut={{ key: 'c', modifiers: ['cmd'] }}
                    onAction={() => {
                      console.log(`Copy: ${item.content}`)
                    }}
                  />
                </ActionPanel.Section>
              </ActionPanel>
            }
          />
        ))}
      </Grid.Section>

      <Grid.Section title='Animals' columns={4}>
        {items.slice(3, 6).map((item) => (
          <Grid.Item
            key={item.id}
            id={item.id}
            title={item.title}
            content={item.content}
            keywords={item.keywords}
            actions={
              <ActionPanel>
                <ActionPanel.Section>
                  <Action
                    title='Show Details'
                    onAction={() => {
                      console.log(`Selected: ${item.title}`)
                    }}
                  />
                  <Action
                    title='Copy Emoji'
                    shortcut={{ key: 'c', modifiers: ['cmd'] }}
                    onAction={() => {
                      console.log(`Copy: ${item.content}`)
                    }}
                  />
                </ActionPanel.Section>
              </ActionPanel>
            }
          />
        ))}
      </Grid.Section>

      <Grid.Section title='Others'>
        {items.slice(6).map((item) => (
          <Grid.Item
            key={item.id}
            id={item.id}
            title={item.title}
            content={item.content}
            keywords={item.keywords}
            actions={
              <ActionPanel>
                <ActionPanel.Section>
                  <Action
                    title='Show Details'
                    onAction={() => {
                      console.log(`Selected: ${item.title}`)
                    }}
                  />
                  <Action
                    title='Copy Emoji'
                    shortcut={{ key: 'c', modifiers: ['cmd'] }}
                    onAction={() => {
                      console.log(`Copy: ${item.content}`)
                    }}
                  />
                </ActionPanel.Section>
              </ActionPanel>
            }
          />
        ))}
      </Grid.Section>

      <Grid.EmptyView
        icon='📭'
        title='No Items Found'
        description='Try adjusting your search query'
      />
    </Grid>
  )
}

renderWithProviders(<GridExample />)
