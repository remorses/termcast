// inspired by https://github.com/pacocoursey/use-descendants
//
import * as React from 'react'
import { TextareaRenderable } from '@opentui/core'

type DescendantMap<T> = { [id: string]: { index: number; props?: T } }

export interface DescendantContextType<T> {
  getIndexForId: (id: string, props?: T) => number
  // IMPORTANT! map is not reactive, it cannot be used in render, only in useEffect or useLayoutEffect or other event handlers like useKeyboard
  map: React.RefObject<DescendantMap<T>>
  reset: () => void
}

const randomId = () => Math.random().toString(36).slice(2, 11)

export function createDescendants<T = any>() {
  const DescendantContext = React.createContext<
    DescendantContextType<T> | undefined
  >(undefined)

  function DescendantsProvider(props: {
    value: DescendantContextType<T>
    children: React.ReactNode
  }) {
    // On every re-render of children, reset the count
    props.value.reset()

    return (
      <DescendantContext.Provider value={props.value}>
        {props.children}
      </DescendantContext.Provider>
    )
  }

  const useDescendants = (): DescendantContextType<T> => {
    const indexCounter = React.useRef<number>(0)
    const map = React.useRef<DescendantMap<T>>({})

    const reset = () => {
      indexCounter.current = 0
      map.current = {}
    }

    const getIndexForId = (id: string, props?: T) => {
      if (!map.current[id])
        map.current[id] = {
          index: indexCounter.current++,
        }
      map.current[id].props = props
      return map.current[id].index
    }

    // React.useEffect(() => {
    //   return () => {
    //     reset()
    //   }
    // }, [])

    // Do NOT memoize context value, so that we bypass React.memo on any children
    // We NEED them to re-render, in case stable children were re-ordered
    // (this creates a new object every render, so children reading the context MUST re-render)
    return { getIndexForId, map, reset }
  }

  /**
   * Return index of the current item within its parent's list
   */
  function useDescendant(props?: T) {
    const context = React.useContext(DescendantContext)
    const [descendantId] = React.useState<string>(() => randomId())
    const [index, setIndex] = React.useState<number>(-1)

    React.useLayoutEffect(() => {
      // Do this inside of useLayoutEffect, it's only
      // called for the "real render" in React strict mode
      setIndex(context?.getIndexForId(descendantId, props) ?? -1)
    })

    return { descendantId, index }
  }

  return { DescendantsProvider, useDescendants, useDescendant }
}

// EXAMPLE
const { DescendantsProvider, useDescendants, useDescendant } =
  createDescendants<{
    title?: string
  }>()

const FilteredIndexesContext = React.createContext<number[]>([])

const MenuExample = () => {
  const context = useDescendants()
  const [filteredIndexes, setFilteredIndexes] = React.useState<number[]>([])
  const inputRef = React.useRef<TextareaRenderable>(null)

  const updateFilter = (value: string) => {
    const items = Object.entries(context.map.current)
    const filtered = items
      .filter(([, item]) =>
        item.props?.title?.toLowerCase().includes(value.toLowerCase()),
      )
      .map(([, item]) => item.index)
    setFilteredIndexes(filtered)
  }

  return (
    <DescendantsProvider value={context}>
      <FilteredIndexesContext.Provider value={filteredIndexes}>
        <box>
          <textarea
            ref={inputRef}
            height={1}
            wrapMode='none'
            keyBindings={[
              { name: 'return', action: 'submit' },
              { name: 'linefeed', action: 'submit' },
            ]}
            onContentChange={() => {
              updateFilter(inputRef.current?.plainText || '')
            }}
            placeholder='Search...'
          />
          <Item title='First Item' />
          <Item title='Second Item' />
          <Item title='Third Item' />
        </box>
      </FilteredIndexesContext.Provider>
    </DescendantsProvider>
  )
}

const Item = ({ title }: { title: string }) => {
  const { index } = useDescendant({ title })
  const filteredIndexes = React.useContext(FilteredIndexesContext)

  // If index is not in filteredIndexes, don't render
  if (!filteredIndexes.includes(index)) {
    return null
  }

  return <text>{title}</text>
}
