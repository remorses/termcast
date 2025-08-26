import { renderWithProviders } from '@termcast/api/src/utils'
import { Dropdown } from '@termcast/api/src/dropdown'
import { logger } from '@termcast/api/src/logger'
import { useState } from 'react'

const App: any = () => {
    const [selectedValue, setSelectedValue] = useState<string>('one')

    const handleChange = (newValue: string) => {
        logger.log('Dropdown value changed to:', newValue)
        setSelectedValue(newValue)
    }

    return (
        <Dropdown
            tooltip="Select Drink Type"
            onChange={handleChange}
            value={selectedValue}
            placeholder="Search drinks..."
            storeValue={true}
        >
            <Dropdown.Section title="Alcoholic Beverages">
                <Dropdown.Item
                    value="beer"
                    title="Beer"
                    icon="🍺"
                    keywords={['lager', 'ale', 'stout']}
                    label="⌃B"
                />
                <Dropdown.Item
                    value="wine"
                    title="Wine"
                    icon="🍷"
                    keywords={['red', 'white', 'rose']}
                    label="⌃W"
                />
                <Dropdown.Item
                    value="whiskey"
                    title="Whiskey"
                    icon="🥃"
                    keywords={['scotch', 'bourbon', 'rye']}
                    label="⌘W"
                />
            </Dropdown.Section>

            <Dropdown.Section title="Non-Alcoholic">
                <Dropdown.Item
                    value="coffee"
                    title="Coffee"
                    icon="☕"
                    keywords={['espresso', 'latte', 'cappuccino']}
                    label="⌃C"
                />
                <Dropdown.Item
                    value="tea"
                    title="Tea"
                    icon="🍵"
                    keywords={['green', 'black', 'herbal']}
                    label="⌃T"
                />
                <Dropdown.Item
                    value="juice"
                    title="Juice"
                    icon="🧃"
                    keywords={['orange', 'apple', 'grape']}
                />
                <Dropdown.Item
                    value="water"
                    title="Water"
                    icon="💧"
                    keywords={['sparkling', 'still', 'mineral']}
                />
            </Dropdown.Section>

            <Dropdown.Section title="Soft Drinks">
                <Dropdown.Item
                    value="cola"
                    title="Cola"
                    icon="🥤"
                    keywords={['coke', 'pepsi', 'soda']}
                    label="⌃O"
                />
                <Dropdown.Item
                    value="lemonade"
                    title="Lemonade"
                    icon="🍋"
                    keywords={['lemon', 'citrus', 'sweet']}
                />
            </Dropdown.Section>
        </Dropdown>
    )
}

renderWithProviders(<App />)
