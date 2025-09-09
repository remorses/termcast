import { renderWithProviders, Detail, Action, ActionPanel } from '@termcast/cli'
import List from '@termcast/cli'
import { useNavigation } from '@termcast/cli/src/internal/navigation'
import dedent from 'dedent'

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

renderWithProviders(<App />)
