// Example: List in loading state with no items, showing the loading empty view spinner.

import React from 'react'
import { List } from 'termcast'
import { renderWithProviders } from 'termcast/src/utils'

function ListLoadingEmptyViewExample(): any {
  return <List navigationTitle='Loading Empty View' isLoading />
}

await renderWithProviders(<ListLoadingEmptyViewExample />)
