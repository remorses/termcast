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
        title="Short Values"
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
        title="Long Values"
        detail={
          <List.Item.Detail
            markdown="# Info with Long Values"
            metadata={
              <List.Item.Detail.Metadata>
                <List.Item.Detail.Metadata.Label title="Description" text="This is a very long description that would be truncated if shown inline" />
                <List.Item.Detail.Metadata.Label title="Path" text="/Users/username/Documents/Projects/my-project/src/components" />
                <List.Item.Detail.Metadata.Separator />
                <List.Item.Detail.Metadata.Label title="Short" text="OK" />
                <List.Item.Detail.Metadata.Link title="URL" target="https://example.com/very/long/path/that/exceeds/limit" text="example.com/very/long/path" />
              </List.Item.Detail.Metadata>
            }
          />
        }
      />
    </List>
  )
}

await renderWithProviders(<ListDetailMetadataExample />)
