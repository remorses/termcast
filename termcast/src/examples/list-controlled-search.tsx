// Example: List with controlled searchText (parent manages search state)
// Used to demonstrate that selection must reset to first visible item
// when search text changes, even in controlled mode.
import React, { useState } from 'react'
import { List, renderWithProviders } from 'termcast'

function ControlledSearchExample() {
  const [searchText, setSearchText] = useState('')

  return (
    <List
      navigationTitle='Controlled Search'
      searchBarPlaceholder='Search items...'
      filtering={true}
      searchText={searchText}
      onSearchTextChange={setSearchText}
    >
      <List.Item id='apple' title='Apple' subtitle='Red fruit' />
      <List.Item id='banana' title='Banana' subtitle='Yellow fruit' />
      <List.Item id='cherry' title='Cherry' subtitle='Small fruit' />
      <List.Item id='grape' title='Grape' subtitle='Purple fruit' />
      <List.Item id='lettuce' title='Lettuce' subtitle='Green veggie' />
      <List.Item id='mango' title='Mango' subtitle='Tropical fruit' />
    </List>
  )
}

await renderWithProviders(<ControlledSearchExample />)
