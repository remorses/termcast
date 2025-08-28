import { useKeyboard } from '@opentui/react'
import { createDescendants } from '@termcast/api/src/descendants'
import { useIsInFocus } from '@termcast/api/src/internal/focus-context'
import { createContext, useContext, useState } from 'react'
import { renderWithProviders } from '../../utils'

const { DescendantsProvider, useDescendants, useDescendant } =
    createDescendants<{
        title?: string
    }>()

const FocusContext = createContext<{ focusedIndex: number }>({
    focusedIndex: 0,
})

const Menu = () => {
    const context = useDescendants()
    const [focusedIndex, setFocusedIndex] = useState(0)
    const inFocus = useIsInFocus()

    useKeyboard((evt) => {
        if (!inFocus) return

        const items = Object.values(context.map.current).filter(
            (item) => item.index !== -1,
        )
        const itemCount = items.length

        if (itemCount === 0) return

        if (evt.name === 'down') {
            setFocusedIndex((prev) => (prev + 1) % itemCount)
        } else if (evt.name === 'up') {
            setFocusedIndex((prev) => (prev - 1 + itemCount) % itemCount)
        }
    })

    return (
        <FocusContext.Provider value={{ focusedIndex }}>
            <DescendantsProvider value={context}>
                <box>
                    <Item title='First Item' />
                    <Item title='Second Item' />
                    <Item title='Third Item' />
                </box>
            </DescendantsProvider>
        </FocusContext.Provider>
    )
}

const Item = ({ title }: { title: string }) => {
    const index = useDescendant({ title })
    const { focusedIndex } = useContext(FocusContext)
    const isFocused = index === focusedIndex

    return <text fg={isFocused ? 'blue' : 'white'}>{title}</text>
}

renderWithProviders(<Menu />)
