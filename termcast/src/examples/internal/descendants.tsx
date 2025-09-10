import { useKeyboard } from '@opentui/react'
import { createDescendants } from '@termcast/cli/src/descendants'
import { useIsInFocus } from '@termcast/cli/src/internal/focus-context'
import { createContext, useContext, useState } from 'react'
import { renderWithProviders } from '../../utils'

const { DescendantsProvider, useDescendants, useDescendant } =
  createDescendants<{
    title?: string
  }>()

const itemsPerPage = 4

const FocusContext = createContext<{
  focusedIndex: number
  offset: number
  itemsPerPage: number
}>({
  focusedIndex: 0,
  offset: 0,
  itemsPerPage,
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

const Menu = () => {
  const context = useDescendants()
  const [focusedIndex, setFocusedIndex] = useState(0)
  const [offset, setOffset] = useState(0)
  const inFocus = useIsInFocus()

  useKeyboard((evt) => {
    if (!inFocus) return

    const items = Object.values(context.map.current).filter(
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
    }
  })

  return (
    <FocusContext.Provider
      value={{ focusedIndex, offset, itemsPerPage: itemsPerPage }}
    >
      <DescendantsProvider value={context}>
        <box>
          {allItems.map((title, index) => (
            <Item key={title} title={title} itemIndex={index} />
          ))}
        </box>
      </DescendantsProvider>
    </FocusContext.Provider>
  )
}

const Item = ({
  title,
  itemIndex,
  key,
}: {
  title: string
  itemIndex: number
  key?: string
}) => {
  const index = useDescendant({ title })
  const { focusedIndex, offset, itemsPerPage } = useContext(FocusContext)

  // Hide items that are outside the visible range
  if (itemIndex < offset || itemIndex >= offset + itemsPerPage) {
    return null
  }

  const isFocused = itemIndex === focusedIndex

  return <text fg={isFocused ? 'blue' : 'white'}>{title}</text>
}

renderWithProviders(<Menu />)
