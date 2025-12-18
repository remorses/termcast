import React from 'react'
import { List } from '@raycast/api'
import { getItems } from 'swift:../swift'

export default function SwiftList() {
  const [items, setItems] = React.useState<Array<{ id: string; title: string; subtitle: string }>>([])
  const [isLoading, setIsLoading] = React.useState(true)

  console.log('rendering')
  React.useEffect(() => {
    async function fetchItems() {
      try {
        const result = await getItems()
        setItems(result)
      } catch (error) {
        console.error('Failed to fetch items from Swift:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchItems()
  }, [])

  return (
    <List navigationTitle="Swift Items" isLoading={isLoading}>
      <List.Section title="Items from Swift">
        {items.map((item) => (
          <List.Item
            key={item.id}
            id={item.id}
            title={item.title}
            subtitle={item.subtitle}
          />
        ))}
      </List.Section>
    </List>
  )
}
