import * as React from 'react'

type DescendantMap<T> = { [id: string]: { index: number; props?: T } }

interface DescendantContextType<T> {
    get: (id: string, props?: T) => number
    // IMPORTANT! map is not reactive, it cannot be used in render, only in useEffect or other event handlers like useKeyboard
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

        const get = (id: string, props?: T) => {
            const hidden = props ? (props as any).hidden : false
            if (!map.current[id])
                map.current[id] = {
                    index: hidden ? -1 : indexCounter.current++,
                }
            map.current[id].props = props
            return map.current[id].index
        }

        // Do NOT memoize context value, so that we bypass React.memo on any children
        // We NEED them to re-render, in case stable children were re-ordered
        // (this creates a new object every render, so children reading the context MUST re-render)
        return { get, map, reset }
    }

    /**
     * Return index of the current item within its parent's list
     */
    function useDescendant(props?: T): number {
        const context = React.useContext(DescendantContext)
        const descendantId = React.useRef<string>(randomId())
        const [index, setIndex] = React.useState<number>(-1)

        React.useLayoutEffect(() => {
            // Do this inside of useLayoutEffect, it's only
            // called for the "real render" in React strict mode
            setIndex(context?.get(descendantId.current, props) ?? -1)
        })

        return index
    }

    return { DescendantsProvider, useDescendants, useDescendant }
}

const { DescendantsProvider: Descendants, useDescendants, useDescendant } = createDescendants<{
    title?: string
}>()

const Menu = () => {
    const context = useDescendants()

    const items = Object.values(context.map.current)

    return (
        <Descendants value={context}>
            <Item title='First Item' />
            <Item title='Second Item' />
            {items.map((x) => {
                return <box>{x.props?.title}</box>
            })}
        </Descendants>
    )
}

const Item = ({ title }: { title: string }) => {
    const index = useDescendant({ title })

    return null
}
