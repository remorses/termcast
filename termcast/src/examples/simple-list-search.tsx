import { renderWithProviders } from '@termcast/api/src/utils'
import List from '@termcast/api/src/list'

const App: any = () => {
    return (
        <List
            searchBarPlaceholder="Search items..."
            filtering={true}

        >
            <List.Item
                title="First Item"
                subtitle="This is the first item"
                keywords={['first', 'one', 'primary']}
                id="item1"
            />
            <List.Item
                title="Second Item"
                subtitle="This is the second item"
                keywords={['second', 'two', 'secondary']}
                id="item2"
            />
            <List.Item
                title="Third Item"
                subtitle="This is the third item"
                keywords={['third', 'three', 'tertiary']}
                id="item3"
            />
            <List.Item
                title="Apple"
                subtitle="A red fruit"
                keywords={['fruit', 'red', 'healthy']}
                id="apple"
            />
            <List.Item
                title="Banana"
                subtitle="A yellow fruit"
                keywords={['fruit', 'yellow', 'potassium']}
                id="banana"
            />
            <List.Item
                title="Cherry"
                subtitle="A small red fruit"
                keywords={['fruit', 'red', 'small', 'sweet']}
                id="cherry"
            />
        </List>
    )
}

renderWithProviders(<App />)
