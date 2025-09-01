import React, { useState, ReactElement } from 'react'
import { List, renderWithProviders } from '@termcast/cli'
import type { DropdownProps } from '@termcast/cli/src/components/list'

function DrinkDropdown(props: {
    drinkTypes: { id: string; name: string }[]
    onDrinkTypeChange: (value: string) => void
}): any {
    const { drinkTypes, onDrinkTypeChange } = props
    return (
        <List.Dropdown
            tooltip="Select Drink Type"
            storeValue={true}
            filtering={true}
            onChange={(newValue) => {
                onDrinkTypeChange(newValue)
            }}
        >
            <List.Dropdown.Section title="Alcoholic Beverages">
                {drinkTypes.filter(dt => ['beer', 'wine'].includes(dt.id)).map((drinkType) => (
                    <List.Dropdown.Item
                        key={drinkType.id}
                        title={drinkType.name}
                        value={drinkType.id}
                    />
                ))}
            </List.Dropdown.Section>
            <List.Dropdown.Section title="Non-Alcoholic">
                {drinkTypes.filter(dt => ['soda', 'juice'].includes(dt.id)).map((drinkType) => (
                    <List.Dropdown.Item
                        key={drinkType.id}
                        title={drinkType.name}
                        value={drinkType.id}
                    />
                ))}
            </List.Dropdown.Section>
        </List.Dropdown>
    )
}

function ListWithDropdownExample() {
    const [selectedDrinkType, setSelectedDrinkType] = useState('all')
    const drinkTypes = [
        { id: 'beer', name: 'Beer' },
        { id: 'wine', name: 'Wine' },
        { id: 'soda', name: 'Soda' },
        { id: 'juice', name: 'Juice' },
    ]

    const drinks = [
        { id: '1', name: 'Augustiner Helles', type: 'beer' },
        { id: '2', name: 'Camden Hells', type: 'beer' },
        { id: '3', name: 'Leffe Blonde', type: 'beer' },
        { id: '4', name: 'Sierra Nevada IPA', type: 'beer' },
        { id: '5', name: 'Chateau Margaux', type: 'wine' },
        { id: '6', name: 'Pinot Noir', type: 'wine' },
        { id: '7', name: 'Coca Cola', type: 'soda' },
        { id: '8', name: 'Sprite', type: 'soda' },
        { id: '9', name: 'Orange Juice', type: 'juice' },
        { id: '10', name: 'Apple Juice', type: 'juice' },
    ]

    const filteredDrinks = selectedDrinkType === 'all'
        ? drinks
        : drinks.filter(d => d.type === selectedDrinkType)

    return (
        <List
            navigationTitle="Search Beers"
            searchBarPlaceholder="Search your favorite drink"
            searchBarAccessory={
                <DrinkDropdown
                    drinkTypes={drinkTypes}
                    onDrinkTypeChange={setSelectedDrinkType}
                /> as ReactElement<DropdownProps>
            }
        >
            {filteredDrinks.map(drink => (
                <List.Item
                    key={drink.id}
                    title={drink.name}
                    subtitle={drinkTypes.find(dt => dt.id === drink.type)?.name}
                />
            ))}
        </List>
    )
}

// Render the example
renderWithProviders(<ListWithDropdownExample />)
