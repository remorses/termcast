import React, { ReactElement } from 'react'
import { List, Action, ActionPanel } from 'termcast'
import { renderWithProviders } from 'termcast/src/utils'
import type { DropdownProps } from 'termcast/src/components/list'

function FruitDropdown(props: {
  value?: string
  onChange?: (value: string) => void
}): any {
  return (
    <List.Dropdown
      tooltip='Filter by category'
      placeholder='Select category...'
      onChange={props.onChange}
      value={props.value}
    >
      <List.Dropdown.Item value='apple' title='Apple' />
      <List.Dropdown.Item value='banana' title='Banana' />
      <List.Dropdown.Item value='orange' title='Orange' />
      <List.Dropdown.Item value='grape' title='Grape' />
    </List.Dropdown>
  )
}

function ListDropdownDefaultExample() {
  const [selectedFruit, setSelectedFruit] = React.useState<string>()
  const [selectedVegetable, setSelectedVegetable] = React.useState<string>()

  return (
    <List
      navigationTitle='Dropdown Default Value Example'
      searchBarAccessory={
        (
          <FruitDropdown value={selectedFruit} onChange={setSelectedFruit} />
        ) as ReactElement<DropdownProps>
      }
    >
      <List.Item
        title='First Item'
        subtitle='This list has a dropdown'
        actions={
          <ActionPanel>
            <Action
              title='Show Selected Fruit'
              onAction={() => console.log(`Selected fruit: ${selectedFruit}`)}
            />
          </ActionPanel>
        }
      />
      <List.Item
        title='Second Item'
        subtitle='The dropdown should default to first item'
        actions={
          <ActionPanel>
            <Action
              title='Show Another Dropdown'
              onAction={() => console.log('Another dropdown')}
            />
          </ActionPanel>
        }
      />
      <List.Section title='Vegetables'>
        <List.Item title='Carrot' subtitle='With another dropdown' />
      </List.Section>
    </List>
  )
}

renderWithProviders(<ListDropdownDefaultExample />)
