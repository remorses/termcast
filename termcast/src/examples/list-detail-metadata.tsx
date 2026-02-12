import React from 'react'
import { List, Color } from 'termcast'
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
      <List.Item
        id="item3"
        title="Colored & Tags"
        detail={
          <List.Item.Detail
            markdown={`# Project Status

Overview of the current project state.`}
            metadata={
              <List.Item.Detail.Metadata>
                <List.Item.Detail.Metadata.Label title="Info" />
                <List.Item.Detail.Metadata.Label title="Status" text={{ value: "Active", color: Color.Green }} />
                <List.Item.Detail.Metadata.Label title="Priority" text={{ value: "High", color: Color.Red }} />
                <List.Item.Detail.Metadata.Label title="Type" text={{ value: "Feature", color: Color.Blue }} />
                <List.Item.Detail.Metadata.Separator />
                <List.Item.Detail.Metadata.Label title="Labels" />
                <List.Item.Detail.Metadata.TagList title="Tags">
                  <List.Item.Detail.Metadata.TagList.Item text="bug" color={Color.Red} />
                  <List.Item.Detail.Metadata.TagList.Item text="feature" color={Color.Green} />
                  <List.Item.Detail.Metadata.TagList.Item text="urgent" color={Color.Orange} />
                </List.Item.Detail.Metadata.TagList>
                <List.Item.Detail.Metadata.Separator />
                <List.Item.Detail.Metadata.Link title="Repo" target="https://github.com/example/repo" text="github.com/example" />
              </List.Item.Detail.Metadata>
            }
          />
        }
      />
    </List>
  )
}

await renderWithProviders(<ListDetailMetadataExample />)
