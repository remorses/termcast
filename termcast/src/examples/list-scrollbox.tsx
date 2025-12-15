import { renderWithProviders, Icon, Color } from 'termcast'
import List from 'termcast'

const iconConfigs = [
  { name: 'Circle', color: Color.Red },
  { name: 'Star', color: Color.Yellow },
  { name: 'Heart', color: Color.Magenta },
  { name: 'Bolt', color: Color.Orange },
  { name: 'Bookmark', color: Color.Blue },
  { name: 'Calendar', color: Color.Green },
  { name: 'Clock', color: Color.Purple },
  { name: 'Document', color: Color.SecondaryText },
  { name: 'Folder', color: Color.Blue },
  { name: 'Globe', color: Color.Green },
] as const

function ListScrollboxExample() {
  const items = Array.from({ length: 20 }, (_, i) => {
    const config = iconConfigs[i % iconConfigs.length]
    return {
      id: `item-${i + 1}`,
      title: `Item ${i + 1}`,
      subtitle: `Description for item ${i + 1}`,
      icon: { source: Icon[config.name], tintColor: config.color },
    }
  })

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
          icon={item.icon}
        />
      ))}
    </List>
  )
}

await renderWithProviders(<ListScrollboxExample />)
