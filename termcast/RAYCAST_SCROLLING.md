# Scrollbox with Descendants Pattern

How to add scrollbox support to opentui components using the descendants pattern.

## Overview

1. Store element refs in descendant props
2. Track selected index in parent
3. On selection change, scroll to item if out of view

## Implementation

### 1. Add `elementRef` to descendant type

```tsx
interface ItemDescendant {
  title: string
  elementRef?: { y: number; height: number } | null
}

const { DescendantsProvider, useDescendants, useDescendant } =
  createDescendants<ItemDescendant>()
```

### 2. Parent: scrollToItem function

```tsx
const scrollBoxRef = React.useRef<any>(null)

const scrollToItem = (item: { props?: ItemDescendant }) => {
  const scrollBox = scrollBoxRef.current
  const elementRef = item.props?.elementRef
  if (!scrollBox || !elementRef) return

  const contentY = scrollBox.content?.y || 0
  const viewportHeight = scrollBox.viewport?.height || 10
  const currentScrollTop = scrollBox.scrollTop || 0

  const itemTop = elementRef.y - contentY
  const itemBottom = itemTop + elementRef.height

  if (itemTop < currentScrollTop) {
    scrollBox.scrollTo(itemTop)
  } else if (itemBottom > currentScrollTop + viewportHeight) {
    scrollBox.scrollTo(itemBottom - viewportHeight)
  }
}
```

### 3. Parent: call scrollToItem on move

```tsx
const move = (direction: -1 | 1) => {
  const items = Object.values(context.map.current)
    .filter((item) => item.index !== -1)
    .sort((a, b) => a.index - b.index)

  let nextIndex = selectedIndex + direction
  // wrap around
  if (nextIndex < 0) nextIndex = items.length - 1
  if (nextIndex >= items.length) nextIndex = 0

  const nextItem = items[nextIndex]
  if (nextItem) {
    setSelectedIndex(nextIndex)
    scrollToItem(nextItem)
  }
}
```

### 4. Item: capture ref and pass to descendant

```tsx
function Item(props: { title: string; isSelected: boolean }) {
  const elementRef = React.useRef<any>(null)
  
  useDescendant({
    title: props.title,
    elementRef: elementRef.current,
  })

  return (
    <box ref={elementRef}>
      <text>{props.isSelected ? '›' : ' '}{props.title}</text>
    </box>
  )
}
```

## Full Example

See `src/examples/internal/scrollbox-with-descendants.tsx`
