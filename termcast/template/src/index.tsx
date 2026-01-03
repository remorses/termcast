import { List, Form, Action, ActionPanel, showToast, Toast } from '@raycast/api'
import { useState } from 'react'

interface Item {
  id: string
  title: string
  subtitle: string
  category: string
}

const ITEMS: Item[] = [
  { id: '1', title: 'Project Alpha', subtitle: 'Web application', category: 'Development' },
  { id: '2', title: 'Project Beta', subtitle: 'Mobile app', category: 'Development' },
  { id: '3', title: 'Design System', subtitle: 'UI components', category: 'Design' },
  { id: '4', title: 'API Gateway', subtitle: 'Backend service', category: 'Infrastructure' },
  { id: '5', title: 'Dashboard', subtitle: 'Analytics tool', category: 'Development' },
  { id: '6', title: 'Brand Guidelines', subtitle: 'Style documentation', category: 'Design' },
  { id: '7', title: 'CI/CD Pipeline', subtitle: 'Deployment automation', category: 'Infrastructure' },
  { id: '8', title: 'User Research', subtitle: 'Interview notes', category: 'Research' },
  { id: '9', title: 'Roadmap Q1', subtitle: 'Planning document', category: 'Planning' },
  { id: '10', title: 'Security Audit', subtitle: 'Compliance review', category: 'Infrastructure' },
  { id: '11', title: 'Onboarding Flow', subtitle: 'User experience', category: 'Design' },
  { id: '12', title: 'Performance Tests', subtitle: 'Load testing', category: 'Development' },
  { id: '13', title: 'Feature Flags', subtitle: 'Configuration', category: 'Infrastructure' },
  { id: '14', title: 'Customer Feedback', subtitle: 'Survey results', category: 'Research' },
  { id: '15', title: 'Sprint Backlog', subtitle: 'Task list', category: 'Planning' },
]

export default function Command() {
  const [selectedItem, setSelectedItem] = useState<Item | null>(null)

  if (selectedItem) {
    return <ItemForm item={selectedItem} onBack={() => setSelectedItem(null)} />
  }

  const categories = [...new Set(ITEMS.map((item) => item.category))]

  return (
    <List searchBarPlaceholder="Search items...">
      {categories.map((category) => (
        <List.Section key={category} title={category}>
          {ITEMS.filter((item) => item.category === category).map((item) => (
            <List.Item
              key={item.id}
              title={item.title}
              subtitle={item.subtitle}
              actions={
                <ActionPanel>
                  <Action title="Edit Item" onAction={() => setSelectedItem(item)} />
                  <Action
                    title="Copy Title"
                    onAction={async () => {
                      await showToast({ style: Toast.Style.Success, title: 'Copied!' })
                    }}
                  />
                </ActionPanel>
              }
            />
          ))}
        </List.Section>
      ))}
    </List>
  )
}

function ItemForm({ item, onBack }: { item: Item; onBack: () => void }) {
  const handleSubmit = async (values: { title: string; subtitle: string }) => {
    await showToast({
      style: Toast.Style.Success,
      title: 'Saved',
      message: `Updated ${values.title}`,
    })
    onBack()
  }

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Save" onSubmit={handleSubmit} />
          <Action title="Cancel" onAction={onBack} />
        </ActionPanel>
      }
    >
      <Form.TextField id="title" title="Title" defaultValue={item.title} />
      <Form.TextField id="subtitle" title="Subtitle" defaultValue={item.subtitle} />
      <Form.Dropdown id="category" title="Category" defaultValue={item.category}>
        <Form.Dropdown.Item value="Development" title="Development" />
        <Form.Dropdown.Item value="Design" title="Design" />
        <Form.Dropdown.Item value="Infrastructure" title="Infrastructure" />
        <Form.Dropdown.Item value="Research" title="Research" />
        <Form.Dropdown.Item value="Planning" title="Planning" />
      </Form.Dropdown>
    </Form>
  )
}
