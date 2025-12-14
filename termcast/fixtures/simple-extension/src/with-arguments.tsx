import { List, ActionPanel, Action, Icon, LaunchProps } from '@raycast/api'

interface Arguments {
  query: string
  secretKey: string
  category: string
}

export default function WithArguments(props: LaunchProps<{ arguments: Arguments }>) {
  const { query, secretKey, category } = props.arguments || {}

  const items = [
    { id: '1', title: 'Search Query', value: query || '(empty)' },
    { id: '2', title: 'Secret Key', value: secretKey ? '***' : '(empty)' },
    { id: '3', title: 'Category', value: category || '(empty)' },
  ]

  return (
    <List navigationTitle='Command Arguments Demo'>
      <List.Section title='Received Arguments'>
        {items.map((item) => (
          <List.Item
            key={item.id}
            id={item.id}
            title={item.title}
            subtitle={item.value}
            icon={Icon.Text}
            actions={
              <ActionPanel>
                <Action.CopyToClipboard
                  title='Copy Value'
                  content={item.value}
                />
              </ActionPanel>
            }
          />
        ))}
      </List.Section>
    </List>
  )
}
