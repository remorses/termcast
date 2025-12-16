import React from 'react'
import { List } from 'termcast'
import { renderWithProviders } from '../utils'

const ListDetailMetadataExample = () => {
  return (
    <List
      navigationTitle="Metadata Test"
      searchBarPlaceholder="Search..."
      isShowingDetail={true}
    >
      <List.Item
        id="item1"
        title="Item with Metadata"
        detail={
          <List.Item.Detail
            markdown="# Details"
            metadata={
              <List.Item.Detail.Metadata>
                <List.Item.Detail.Metadata.Label title="Name" text="John Doe" />
                <List.Item.Detail.Metadata.Label title="Email" text="john@example.com" />
                <List.Item.Detail.Metadata.Separator />
                <List.Item.Detail.Metadata.Label title="Status" text="Active" />
                <List.Item.Detail.Metadata.Link title="Website" target="https://example.com" text="example.com" />
              </List.Item.Detail.Metadata>
            }
          />
        }
      />
      <List.Item
        id="item2"
        title="Another Item"
        detail={
          <List.Item.Detail
            markdown="# Info"
            metadata={
              <List.Item.Detail.Metadata>
                <List.Item.Detail.Metadata.Label title="Count" text="42" />
                <List.Item.Detail.Metadata.Label title="Price" text="$99.99" />
              </List.Item.Detail.Metadata>
            }
          />
        }
      />
    </List>
  )
}

await renderWithProviders(<ListDetailMetadataExample />)
