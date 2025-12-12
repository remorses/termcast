import { renderWithProviders } from 'termcast'
import List from 'termcast'

function ListScrollboxExample() {
  const items = Array.from({ length: 20 }, (_, i) => ({
    id: `item-${i + 1}`,
    title: `Item ${i + 1}`,
    subtitle: `Description for item ${i + 1}`,
  }))

  return (
    <List
      navigationTitle='Scrollbox Test'
      searchBarPlaceholder='Search items...'
    >
      {items.map((item) => (
        <List.Item
          key={item.id}
          id={item.id}
          title={item.title}
          subtitle={item.subtitle}
        />
      ))}
    </List>
  )
}

await renderWithProviders(<ListScrollboxExample />)
