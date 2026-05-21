// Example: List with varying detail heights to test the grow-only minHeight
// ratchet on the detail panel. Navigating from a tall detail to a short one
// should NOT cause the footer to jump up (no layout shift).
import React from 'react'
import { List } from 'termcast'
import { renderWithProviders } from '../utils'

// Generate 25 items with alternating short/tall detail content.
// Odd-indexed items have tall detail (many lines), even-indexed have short detail.
const items = Array.from({ length: 25 }, (_, i) => {
  const isTall = i % 2 === 1
  const markdown = isTall
    ? [
        `# Item ${i} (tall)`,
        '',
        ...Array.from({ length: 12 }, (_, j) => `Line ${j + 1} of detail content for item ${i}.`),
      ].join('\n')
    : `# Item ${i} (short)\n\nBrief.`

  return {
    id: `item-${i}`,
    title: `Item ${i}`,
    subtitle: isTall ? 'tall' : 'short',
    markdown,
  }
})

function ListDetailHeightRatchet() {
  return (
    <List
      navigationTitle="Height Ratchet Test"
      searchBarPlaceholder="Search..."
      isShowingDetail={true}
    >
      {items.map((item) => (
        <List.Item
          key={item.id}
          id={item.id}
          title={item.title}
          subtitle={item.subtitle}
          detail={<List.Item.Detail markdown={item.markdown} />}
        />
      ))}
    </List>
  )
}

await renderWithProviders(<ListDetailHeightRatchet />)
