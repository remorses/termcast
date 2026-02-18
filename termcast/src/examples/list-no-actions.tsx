/**
 * Example: List with items that have no actions prop.
 * Tests that ctrl+k still opens the built-in action panel (Change Theme, etc.)
 * even when no extension-provided actions exist.
 */
import React from 'react'
import { List, renderWithProviders } from 'termcast'

function ListNoActionsExample() {
  return (
    <List navigationTitle="No Actions Test">
      <List.Item title="Item without actions" subtitle="Press ctrl+k" />
      <List.Item title="Another item" subtitle="Also no actions" />
    </List>
  )
}

await renderWithProviders(<ListNoActionsExample />)
