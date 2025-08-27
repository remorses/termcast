import { renderWithProviders } from '@termcast/api'
import List from '@termcast/api'

function SimpleListExample() {
    return (
        <List
            navigationTitle="Simple List Example"
            searchBarPlaceholder="Search items..."
            onSelectionChange={(id) => {
                console.log('Selected:', id)
            }}
        >
            <List.Section title="Fruits">
                <List.Item
                    id="apple"
                    title="Apple"
                    subtitle="Red and sweet"
                    keywords={['fruit', 'red']}
                    accessories={[
                        { text: 'Fresh' },
                        { tag: 'Popular' }
                    ]}
                />
                <List.Item
                    id="banana"
                    title="Banana"
                    subtitle="Yellow and nutritious"
                    keywords={['fruit', 'yellow']}
                    accessories={[
                        { text: 'Ripe' }
                    ]}
                />
            </List.Section>
            <List.Section title="Vegetables">
                <List.Item
                    id="carrot"
                    title="Carrot"
                    subtitle="Orange and crunchy"
                    keywords={['vegetable', 'orange']}
                    accessories={[
                        { tag: 'Healthy' }
                    ]}
                />
                <List.Item
                    id="lettuce"
                    title="Lettuce"
                    subtitle="Green and fresh"
                    keywords={['vegetable', 'green', 'salad']}
                />
            </List.Section>
            <List.Item
                id="bread"
                title="Bread"
                subtitle="Freshly baked"
                keywords={['bakery']}
                accessories={[
                    { text: 'Today' },
                    { tag: 'New' }
                ]}
            />
        </List>
    )
}

renderWithProviders(<SimpleListExample />)
