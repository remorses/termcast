import { renderWithProviders, Detail, Action, ActionPanel } from 'termcast'
import List from 'termcast'
import { useNavigation } from 'termcast/src/internal/navigation'
import dedent from 'string-dedent'

const App: any = () => {
  const { push } = useNavigation()
  return (
    <List searchBarPlaceholder='Search items...' filtering>
      <List.Item
        title='First Item'
        subtitle='This is the first item'
        keywords={['first', 'one', 'primary']}
        id='item1'
        actions={
          <ActionPanel>
            <Action
              title='View Details'
              onAction={() =>
                push(
                  <Detail
                    markdown={dedent`
                                    # First Item

                                    This is the first item in the searchable list.

                                    Keywords: first, one, primary
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
        subtitle='This is the second item'
        keywords={['second', 'two', 'secondary']}
        id='item2'
      />
      {Array.from({ length: 100 }).map((_, i) => (
        <List.Item
          key={`random${i + 1}`}
          title={`Random Item #${i + 1}`}
          subtitle={`This is randomly generated item ${i + 1}`}
          keywords={[
            `random`,
            `${(i + 1) * 7}`,
            `foo${(i % 5) + 1}`,
            `bar${Math.floor(Math.random() * 50)}`,
          ]}
          id={`random-item-${i + 1}`}
          actions={
            i % 3 === 0 ? (
              <ActionPanel>
                <Action
                  title='Show Details'
                  onAction={() =>
                    push(
                      <Detail
                        markdown={dedent`
                                              # Random Item #${i + 1}

                                              This is a dynamically generated random item.

                                              - **Index:** ${i + 1}
                                              - **Random Keyword:** bar${Math.floor(Math.random() * 99)}
                                              - **UUID:** random-item-${i + 1}

                                              ---
                                              _Fun fact: Number ${((i + 1) * 13) % 97} is "randomized"!_
                                          `}
                      />,
                    )
                  }
                />
              </ActionPanel>
            ) : undefined
          }
        />
      ))}
      <List.Item
        title='Third Item'
        subtitle='This is the third item'
        keywords={['third', 'three', 'tertiary']}
        id='item3'
      />
      <List.Item
        title='Apple'
        subtitle='A red fruit'
        keywords={['fruit', 'red', 'healthy']}
        id='apple'
        actions={
          <ActionPanel>
            <Action
              title='View Details'
              onAction={() =>
                push(
                  <Detail
                    markdown={dedent`
                                    # Apple

                                    A delicious red fruit.

                                    ## Health Benefits
                                    - High in fiber
                                    - Rich in antioxidants
                                    - Supports heart health
                                `}
                  />,
                )
              }
            />
          </ActionPanel>
        }
      />
      <List.Item
        title='Banana'
        subtitle='A yellow fruit'
        keywords={['fruit', 'yellow', 'potassium']}
        id='banana'
      />
      <List.Item
        title='Cherry'
        subtitle='A small red fruit'
        keywords={['fruit', 'red', 'small', 'sweet']}
        id='cherry'
      />
    </List>
  )
}

await renderWithProviders(<App />)
