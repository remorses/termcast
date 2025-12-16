import React from 'react'
import { List } from 'termcast'
import { renderWithProviders } from '../utils'

const items = [
  {
    id: 'short',
    title: 'Short Detail',
    markdown: `# Brief content

This is short.`,
  },
  {
    id: 'long',
    title: 'Long Detail',
    markdown: `# This item has extensive detail content

## Section 1
This is a very long description that contains multiple paragraphs and sections to test how the layout behaves when the detail panel content overflows.

## Section 2
More content here to ensure we have enough text to cause vertical overflow in the detail panel scrollbox.

## Section 3
Even more content. We want to make sure the detail panel definitely needs to scroll.

## Section 4
Additional paragraphs to push the content height beyond what fits in the viewport.

## Section 5
The goal is to have the scrollbar appear in the detail panel.

## Section 6
This should be enough content now to cause overflow.

## Section 7
Just a bit more to be safe.

## Section 8
And some final content here.`,
  },
  {
    id: 'another',
    title: 'Another Item',
    markdown: `# Another

Some content.`,
  },
]

const ListWithDetailLongExample = () => {
  return (
    <List
      navigationTitle="Detail Length Test"
      searchBarPlaceholder="Search..."
      isShowingDetail={true}
    >
      {items.map((item) => (
        <List.Item
          key={item.id}
          id={item.id}
          title={item.title}
          detail={<List.Item.Detail markdown={item.markdown} />}
        />
      ))}
    </List>
  )
}

await renderWithProviders(<ListWithDetailLongExample />)
