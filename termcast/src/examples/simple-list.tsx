import { renderWithProviders, Detail, Action, ActionPanel } from '@termcast/cli'
import List from '@termcast/cli'
import { useNavigation } from '@termcast/cli/src/internal/navigation'
import dedent from 'string-dedent'

function ListExample() {
  const { push } = useNavigation()
  const handleSelectionChange = (id: string | null) => {
    console.log('Selected item:', id)
  }

  return (
    <List onSelectionChange={handleSelectionChange}>
      <List.Item
        title='First Item'
        subtitle='This is a subtitle'
        accessories={[{ text: 'Badge' }]}
        actions={
          <ActionPanel>
            <Action
              title='View Details'
              onAction={() =>
                push(
                  <Detail
                    markdown={dedent`
                  # First Item

                  This is the detail view for the first item.

                  ## Features
                  - Shows markdown content
                  - Can have metadata
                  - Supports actions
                `}
                  />,
                )
              }
            />
          </ActionPanel>
        }
      />

      <List.Item
        title='Second Item'
        subtitle='Another subtitle'
        accessories={[{ text: 'Important' }]}
        actions={
          <ActionPanel>
            <Action
              title='View Details'
              onAction={() =>
                push(
                  <Detail
                    markdown={dedent`
                  # Second Item

                  Another detail view with different content.

                  **Important** information can be shown here.
                `}
                  />,
                )
              }
            />
          </ActionPanel>
        }
      />

      <List.Item
        title='Third Item'
        accessories={[{ text: 'Starred' }, { text: 'Multiple accessories' }]}
        actions={
          <ActionPanel>
            <Action
              title='View Details'
              onAction={() =>
                push(
                  <Detail
                    markdown={dedent`
                  # Third Item

                  This item has multiple accessories and is marked as starred.

                  ⭐ **Starred Item**
                `}
                  />,
                )
              }
            />
          </ActionPanel>
        }
      />

      <List.Item
        title='Fourth Item'
        subtitle='This item is searchable'
        actions={
          <ActionPanel>
            <Action
              title='View Details'
              onAction={() =>
                push(
                  <Detail
                    markdown={dedent`
                  # Fourth Item

                  This item is searchable and can be found easily using the search bar.

                  ## Search Features
                  - Keyword matching
                  - Fuzzy search support
                  - Real-time filtering
                `}
                  />,
                )
              }
            />
          </ActionPanel>
        }
      />

      <List.Item
        title='Simple Item'
        actions={
          <ActionPanel>
            <Action
              title='View Details'
              onAction={() =>
                push(
                  <Detail
                    markdown={dedent`
                  # Simple Item

                  A simple list item with minimal information.

                  Sometimes less is more.
                `}
                  />,
                )
              }
            />
          </ActionPanel>
        }
      />
    </List>
  )
}

renderWithProviders(<ListExample />)
