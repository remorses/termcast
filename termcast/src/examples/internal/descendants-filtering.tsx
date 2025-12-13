// This example shows how to filter descendants by passing search query via context
// Items conditionally render null when they don't match the search
import { useKeyboard } from '@opentui/react'
import { createDescendants } from 'termcast/src/descendants'
import { createContext, useContext, useState } from 'react'
import { renderWithProviders } from '../../utils'
import { logger } from 'termcast/src/logger'

const { DescendantsProvider, useDescendants, useDescendant } =
  createDescendants<{
    title?: string
    filtered?: boolean
  }>()

const itemsPerPage = 6

const MenuContext = createContext<{
  focusedIndex: number
  offset: number
  itemsPerPage: number
  selectedIds: Set<string>
  searchQuery: string
}>({
  focusedIndex: 0,
  offset: 0,
  itemsPerPage,
  selectedIds: new Set(),
  searchQuery: '',
})

// Menu component with integrated search input
const Menu = ({ children }: { children: React.ReactNode }) => {
  const descendantsContext = useDescendants()
  const [focusedIndex, setFocusedIndex] = useState(0)
  const [offset, setOffset] = useState(0)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [selectedTitles, setSelectedTitles] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')

  useKeyboard((evt) => {
    const items = Object.values(descendantsContext.map.current).filter(
      (item) => item.index !== -1 && item.props?.filtered === true,
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
    } else if (evt.name === 'return') {
      // Toggle selection of current focused item
      const entries = Object.entries(descendantsContext.map.current)
      const sortedEntries = entries
        .filter(
          ([_, item]) => item.index !== -1 && item.props?.filtered === true,
        )
        .sort((a, b) => a[1].index - b[1].index)

      const focusedId = sortedEntries[focusedIndex]?.[0]

      if (focusedId) {
        setSelectedIds((prev) => {
          const newSet = new Set(prev)
          if (newSet.has(focusedId)) {
            newSet.delete(focusedId)
          } else {
            newSet.add(focusedId)
          }

          // Update selected titles state
          const titles = Array.from(newSet)
            .map((id) => descendantsContext.map.current[id]?.props?.title)
            .filter(Boolean) as string[]

          setSelectedTitles(titles)

          return newSet
        })
      }
    } else if (evt.ctrl && evt.name === 'return') {
      // Log selected titles
      logger.log('Selected filtered items:', selectedTitles)
    }
  })

  return (
    <MenuContext.Provider
      value={{
        focusedIndex,
        offset,
        itemsPerPage,
        selectedIds,
        searchQuery,
      }}
    >
      <DescendantsProvider value={descendantsContext}>
        <box flexDirection='column'>
          <box flexDirection='column' borderStyle='single' padding={1}>
            <text marginBottom={1}>Filter Menu</text>
            <textarea
              height={1}
              keyBindings={[
                { name: 'return', action: 'submit' },
                { name: 'linefeed', action: 'submit' },
              ]}
              value={searchQuery}
              onInput={(value) => {
                setSearchQuery(value)
                // Reset focus to first item when search changes
                setFocusedIndex(0)
                setOffset(0)
              }}
              focused
              placeholder='Type to filter items...'
              marginBottom={1}
            />
            <box flexDirection='column'>{children}</box>
          </box>
          {selectedTitles.length > 0 && (
            <box
              flexDirection='column'
              marginTop={1}
              borderStyle='single'
              padding={1}
            >
              <text>Selected items ({selectedTitles.length}):</text>
              {selectedTitles.map((title, index) => (
                <text key={index} fg='green'>
                  • {title}
                </text>
              ))}
            </box>
          )}
        </box>
      </DescendantsProvider>
    </MenuContext.Provider>
  )
}

const Item = ({ title }: { title: string; key?: any }) => {
  const { focusedIndex, offset, itemsPerPage, selectedIds, searchQuery } =
    useContext(MenuContext)

  // Determine if item matches filter
  const isFiltered = title.toLowerCase().includes(searchQuery.toLowerCase())

  // Register with descendants with the filtered state
  const descendant = useDescendant({ title, filtered: isFiltered })

  // Filter items based on search query from context
  if (!isFiltered) {
    return null
  }

  // Hide items that are outside the visible range
  if (descendant.index < offset || descendant.index >= offset + itemsPerPage) {
    return null
  }

  const isFocused = descendant.index === focusedIndex
  const isSelected = selectedIds.has(descendant.descendantId)

  return (
    <text fg={isFocused ? 'blue' : 'white'}>
      {isSelected ? '✓ ' : '▭ '}
      {title}
    </text>
  )
}

const Example = () => {
  const allItems = [
    'Apple Pie',
    'Banana Bread',
    'Chocolate Cake',
    'Apple Tart',
    'Blueberry Muffin',
    'Cherry Pie',
    'Apple Crumble',
    'Date Pudding',
    'Elderberry Jam',
    'Fig Newton',
    'Grape Jelly',
    'Honey Cake',
    'Ice Cream Sandwich',
    'Jelly Donut',
    'Key Lime Pie',
    'Lemon Tart',
  ]

  return (
    <Menu>
      {allItems.map((title) => (
        <Item key={title} title={title} />
      ))}
    </Menu>
  )
}

await renderWithProviders(<Example />)
