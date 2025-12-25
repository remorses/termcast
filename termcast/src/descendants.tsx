// inspired by https://github.com/pacocoursey/use-descendants
//
import * as React from 'react'
import { TextareaRenderable } from '@opentui/core'

type DescendantMap<T> = { [id: string]: { index: number; props?: T } }

export interface DescendantContextType<T> {
  getIndexForId: (id: string, props?: T) => number
  // IMPORTANT! map is not reactive by default. Use useDescendantsRerender() to opt-in to reactivity.
  // Without that hook, map can only be read in useEffect/useLayoutEffect or event handlers like useKeyboard
  map: React.RefObject<DescendantMap<T>>
  reset: () => void
  // For useSyncExternalStore - opt-in reactivity
  subscribe: (callback: () => void) => () => void
  getSnapshot: () => string
  updateSnapshot: () => void
  // Committed map - stable copy for useDescendantsRerender (map.current is cleared on every render)
  committedMap: DescendantMap<T>
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

    // Update snapshot after all children have registered (runs after children's useLayoutEffect)
    React.useLayoutEffect(() => {
      props.value.updateSnapshot()
    })

    return (
      <DescendantContext.Provider value={props.value}>
        {props.children}
      </DescendantContext.Provider>
    )
  }

  const useDescendants = (): DescendantContextType<T> => {
    const indexCounter = React.useRef<number>(0)
    const map = React.useRef<DescendantMap<T>>({})

    // For useSyncExternalStore - opt-in reactivity
    const listeners = React.useRef(new Set<() => void>())
    const snapshotRef = React.useRef('')
    const prevSnapshotRef = React.useRef('')
    // Committed map - stable copy of map.current updated only when snapshot changes
    // This is what useDescendantsRerender returns, since map.current is cleared on every render
    const committedMapRef = React.useRef<DescendantMap<T>>({})

    const reset = () => {
      // Save previous snapshot before clearing
      prevSnapshotRef.current = snapshotRef.current
      indexCounter.current = 0
      map.current = {}
    }

    const getIndexForId = (id: string, props?: T) => {
      if (!map.current[id]) {
        map.current[id] = {
          index: indexCounter.current++,
        }
      }
      map.current[id].props = props
      return map.current[id].index
    }

    // Must be stable (memoized) for useSyncExternalStore
    const subscribe = React.useCallback((callback: () => void) => {
      listeners.current.add(callback)
      return () => {
        listeners.current.delete(callback)
      }
    }, [])

    // Must be stable for useSyncExternalStore
    const getSnapshot = React.useCallback(() => snapshotRef.current, [])

    // Called by provider after all children have registered
    const updateSnapshot = React.useCallback(() => {
      const newSnapshot = Object.keys(map.current).sort().join(',')
      snapshotRef.current = newSnapshot
      // Always update committed map so useDescendantsRerender returns fresh data
      // (map.current is cleared by reset() on every render)
      committedMapRef.current = { ...map.current }
      // Only notify if there are listeners AND snapshot changed
      if (listeners.current.size > 0 && newSnapshot !== prevSnapshotRef.current) {
        listeners.current.forEach((cb) => {
          cb()
        })
      }
    }, [])

    // Do NOT memoize context value, so that we bypass React.memo on any children
    // We NEED them to re-render, in case stable children were re-ordered
    // (this creates a new object every render, so children reading the context MUST re-render)
    return {
      getIndexForId,
      map,
      reset,
      subscribe,
      getSnapshot,
      updateSnapshot,
      get committedMap() {
        return committedMapRef.current
      },
    }
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

  /**
   * Opt-in to re-renders when the set of descendant IDs changes.
   * Returns the committed map of descendants, readable during render.
   * Only triggers re-render when descendants are added/removed, not on prop changes.
   */
  function useDescendantsRerender(): DescendantMap<T> {
    const context = React.useContext(DescendantContext)
    if (!context) {
      throw new Error(
        'useDescendantsRerender must be used within a DescendantsProvider',
      )
    }

    React.useSyncExternalStore(
      context.subscribe,
      context.getSnapshot,
      context.getSnapshot, // server snapshot
    )

    return context.committedMap
  }

  /**
   * Get the live map ref from context. Only read map.current inside useLayoutEffect,
   * as it is cleared during render by reset() and populated by items' useLayoutEffect.
   */
  function useDescendantsMap(): React.RefObject<DescendantMap<T>> {
    const context = React.useContext(DescendantContext)
    if (!context) {
      throw new Error(
        'useDescendantsMap must be used within a DescendantsProvider',
      )
    }
    return context.map
  }

  return { DescendantsProvider, useDescendants, useDescendant, useDescendantsRerender, useDescendantsMap }
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
