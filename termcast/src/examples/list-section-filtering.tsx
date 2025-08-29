import { List } from '@termcast/api'
import { renderWithProviders as renderExample } from '../utils'

function ListSectionFilteringExample() {
    return (
        <List searchBarPlaceholder="Search items...">
            <List.Section title="Fruits">
                <List.Item title="Apple" subtitle="Red fruit" />
                <List.Item title="Banana" subtitle="Yellow fruit" />
                <List.Item title="Orange" subtitle="Orange fruit" />
            </List.Section>
            <List.Section title="Vegetables">
                <List.Item title="Carrot" subtitle="Orange vegetable" />
                <List.Item title="Broccoli" subtitle="Green vegetable" />
                <List.Item title="Spinach" subtitle="Leafy green" />
            </List.Section>
            <List.Section title="Dairy">
                <List.Item title="Milk" subtitle="White beverage" />
                <List.Item title="Cheese" subtitle="Yellow dairy product" />
                <List.Item title="Yogurt" subtitle="Creamy snack" />
            </List.Section>
        </List>
    )
}

renderExample(<ListSectionFilteringExample />)