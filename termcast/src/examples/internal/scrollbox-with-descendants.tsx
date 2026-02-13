import * as React from 'react'
import { useKeyboard, flushSync } from '@opentui/react'
import { createDescendants } from 'termcast/src/descendants'
import { renderWithProviders } from 'termcast/src/utils'

interface ItemDescendant {
  title: string
  elementRef?: { y: number; height: number } | null
}

const { DescendantsProvider, useDescendants, useDescendant } =
  createDescendants<ItemDescendant>()

function ScrollboxWithDescendants() {
  const context = useDescendants()
  const [selectedIndex, setSelectedIndex] = React.useState(0)
  const scrollBoxRef = React.useRef<any>(null)

  const scrollToItemIfNeeded = ({
    item,
    direction,
  }: {
    item: { props?: ItemDescendant }
    direction: -1 | 1
  }) => {
    const scrollBox = scrollBoxRef.current
    const elementRef = item.props?.elementRef
    if (!scrollBox || !elementRef) return

    const contentY = scrollBox.content?.y || 0
    const scrollTop = scrollBox.scrollTop || 0
    const viewportHeight = scrollBox.viewport?.height || 10

    const itemTop = elementRef.y - contentY
    const itemHeight = elementRef.height || 1
    const itemBottom = itemTop + itemHeight

    const viewportTop = scrollTop
    const viewportBottom = scrollTop + viewportHeight

    if (direction === 1) {
      if (itemBottom > viewportBottom) {
        scrollBox.scrollTo(Math.max(0, itemTop))
      }
      return
    }

    if (itemTop < viewportTop) {
      const targetScrollTop = itemBottom - viewportHeight
      scrollBox.scrollTo(Math.max(0, targetScrollTop))
    }
  }

  const move = (direction: -1 | 1) => {
    const items = Object.values(context.map.current)
      .filter((item) => item.index !== -1)
      .sort((a, b) => a.index - b.index)

    if (items.length === 0) return

    let nextIndex = selectedIndex + direction
    if (nextIndex < 0) return
    if (nextIndex >= items.length) return

    const nextItem = items[nextIndex]
    if (nextItem) {
      flushSync(() => {
        setSelectedIndex(nextIndex)
      })
      scrollToItemIfNeeded({ item: nextItem, direction })
    }
  }

  useKeyboard((evt) => {
    if (evt.name === 'up') move(-1)
    if (evt.name === 'down') move(1)
  })

  const items = Array.from({ length: 20 }, (_, i) => `Item ${i + 1}`)

  return (
    <DescendantsProvider value={context}>
      <box style={{ flexDirection: 'column', height: 10 }}>
        <scrollbox ref={scrollBoxRef} focused={true} flexGrow={1} flexShrink={1}>
          {items.map((title, i) => (
            <Item key={i} title={title} isSelected={selectedIndex === i} />
          ))}
        </scrollbox>
        <text>↑↓ to navigate</text>
      </box>
    </DescendantsProvider>
  )
}

function Item(props: { title: string; isSelected: boolean }) {
  const elementRef = React.useRef<any>(null)
  const { index } = useDescendant({
    title: props.title,
    elementRef: elementRef.current,
  })

  return (
    <box ref={elementRef}>
      <text>
        {props.isSelected ? '›' : ' '}
        {props.title}
      </text>
    </box>
  )
}

await renderWithProviders(<ScrollboxWithDescendants />)
