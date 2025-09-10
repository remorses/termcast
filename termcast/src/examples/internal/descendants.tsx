// read src/descendants.tsx to understand the core hooks that make this example possible
//
import { useKeyboard } from '@opentui/react'
import { createDescendants } from '@termcast/cli/src/descendants'
import { useIsInFocus } from '@termcast/cli/src/internal/focus-context'
import { createContext, useContext, useState } from 'react'
import { renderWithProviders } from '../../utils'
import { logger } from '@termcast/cli/src/logger'

const { DescendantsProvider, useDescendants, useDescendant } =
  createDescendants<{
    title?: string
  }>()

const itemsPerPage = 4

const FocusContext = createContext<{
  focusedIndex: number
  offset: number
  itemsPerPage: number
  selectedIndexes: Set<number>
}>({
  focusedIndex: 0,
  offset: 0,
  itemsPerPage,
  selectedIndexes: new Set(),
})

// IMPORTANT! Notice that we only use descendantsContext.map.current only inside hooks or event handlers. it MUST not be used in render scope
// instead each item renders its own content, descendantsContext must be used only for event handlers like useKeyboard or onMouseDown, or when user updates a search query to filter the filteredIndexes state
// to do conditional rendering instead add additional state, here we used offset to track the current page offset of displayed items, selectedIndexes, focusedIndex. Other examples could be searchQuery
const Menu = () => {
  const descendantsContext = useDescendants()
  const [focusedIndex, setFocusedIndex] = useState(0)
  const [offset, setOffset] = useState(0)
  const [selectedIndexes, setSelectedIndexes] = useState<Set<number>>(new Set())
  const inFocus = useIsInFocus()

  useKeyboard((evt) => {
    if (!inFocus) return

    const items = Object.values(descendantsContext.map.current).filter(
      (item) => item.index !== -1,
    )
    const itemCount = items.length

    if (itemCount === 0) return

    if (evt.name === 'down') {
      setFocusedIndex((prev) => {
        const nextIndex = (prev + 1) % itemCount

        // Update offset only when the focused item is at the last position and there are more items
        const visibleEnd = offset + itemsPerPage - 1
        if (prev === visibleEnd && nextIndex < itemCount && nextIndex > prev) {
          // Scroll down by one when at the last visible item
          setOffset(offset + 1)
        } else if (nextIndex < prev) {
          // Wrapped to beginning
          setOffset(0)
        }

        return nextIndex
      })
    } else if (evt.name === 'up') {
      setFocusedIndex((prev) => {
        const nextIndex = (prev - 1 + itemCount) % itemCount

        // Update offset if we're going above the visible range
        if (nextIndex < offset) {
          setOffset(Math.max(0, nextIndex))
        } else if (nextIndex >= offset + itemsPerPage) {
          // Wrapped to end
          setOffset(Math.max(0, itemCount - itemsPerPage))
        }

        return nextIndex
      })
    } else if (evt.name === 'space') {
      // Toggle selection of current focused item
      setSelectedIndexes((prev) => {
        const newSet = new Set(prev)
        if (newSet.has(focusedIndex)) {
          newSet.delete(focusedIndex)
        } else {
          newSet.add(focusedIndex)
        }
        return newSet
      })
    } else if (evt.name === 'return') {
      // Log selected titles
      const items = Object.values(descendantsContext.map.current)
        .filter((item) => item.index !== -1)
        .sort((a, b) => a.index - b.index)

      const selectedTitles = Array.from(selectedIndexes)
        .sort((a, b) => a - b)
        .map((index) => items[index]?.props?.title)
        .filter(Boolean)

      logger.log('Selected items:', selectedTitles)
    }
  })

  const allItems = [
    'First Item',
    'Second Item',
    'Third Item',
    'Fourth Item',
    'Fifth Item',
    'Sixth Item',
    'Seventh Item',
    'Eighth Item',
    'Ninth Item',
    'Tenth Item',
    'Eleventh Item',
    'Twelfth Item',
  ]

  return (
    <FocusContext.Provider
      value={{
        focusedIndex,
        offset,
        itemsPerPage: itemsPerPage,
        selectedIndexes,
      }}
    >
      <DescendantsProvider value={descendantsContext}>
        <box>
          {allItems.map((title, index) => (
            <Item key={title} title={title} />
          ))}
        </box>
      </DescendantsProvider>
    </FocusContext.Provider>
  )
}

const Item = ({
  title,
}: {
  title: string
  key?: string
}) => {
  const itemIndex = useDescendant({ title })
  const { focusedIndex, offset, itemsPerPage, selectedIndexes } =
    useContext(FocusContext)

  // Hide items that are outside the visible range
  if (itemIndex < offset || itemIndex >= offset + itemsPerPage) {
    return null
  }

  const isFocused = itemIndex === focusedIndex
  const isSelected = selectedIndexes.has(itemIndex)

  return (
    <text fg={isFocused ? 'blue' : 'white'}>
      {isSelected ? '✓ ' : '▭ '}
      {title}
    </text>
  )
}

renderWithProviders(<Menu />)
