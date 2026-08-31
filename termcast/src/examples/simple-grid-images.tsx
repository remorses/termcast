/**
 * Example: Grid with raster image content (data URI and emoji fallback).
 * Uses a tiny PNG so e2e does not need network access.
 */

import { Grid, Action, ActionPanel, Color } from 'termcast'
import { renderWithProviders } from '../utils'

const PIXEL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='

function SimpleGridImages(): any {
  return (
    <Grid
      navigationTitle='Grid Images'
      searchBarPlaceholder='Search...'
      columns={3}
      aspectRatio='1'
    >
      <Grid.Item
        id='raster'
        title='Raster'
        content={PIXEL}
        actions={
          <ActionPanel>
            <Action title='Select' onAction={() => {}} />
          </ActionPanel>
        }
      />
      <Grid.Item
        id='emoji'
        title='Emoji'
        content='🍎'
        actions={
          <ActionPanel>
            <Action title='Select' onAction={() => {}} />
          </ActionPanel>
        }
      />
      <Grid.Item
        id='color'
        title='Color'
        content={{ color: Color.Blue }}
        actions={
          <ActionPanel>
            <Action title='Select' onAction={() => {}} />
          </ActionPanel>
        }
      />
    </Grid>
  )
}

await renderWithProviders(<SimpleGridImages />)
