import React, {
    createContext,
    useContext,
    useRef,
    useEffect,
    useLayoutEffect,
    useId,
    useSyncExternalStore,
} from 'react'

type Entry<T> = { id: string; meta: T }

type Store<T> = {
    getSnapshot: () => Entry<T>[]
    subscribe: (cb: () => void) => () => void
    set: (id: string, meta: T) => void
    delete: (id: string) => void
}

function createStore<T>(): Store<T> {
    const map = new Map<string, T>()
    const listeners = new Set<() => void>()
    const notify = () => {
        for (const l of listeners) l()
    }
    return {
        getSnapshot: () => Array.from(map, ([id, meta]) => ({ id, meta })),
        subscribe: (cb) => (listeners.add(cb), () => listeners.delete(cb)),
        set: (id, meta) => {
            map.set(id, meta)
            notify()
        },
        delete: (id) => {
            map.delete(id)
            notify()
        },
    }
}

export function createRegistry<T>() {
    const Ctx = createContext<Store<T> | null>(null)

    function RegistryProvider({ children }: { children: React.ReactNode }) {
        const storeRef = useRef<Store<T>>(undefined)
        if (!storeRef.current) storeRef.current = createStore<T>()
        return <Ctx.Provider value={storeRef.current}>{children}</Ctx.Provider>
    }

    function useRegistrySnapshot(): Entry<T>[] {
        const store = useContext(Ctx)
        if (!store)
            throw new Error(
                'useRegistrySnapshot must be used inside RegistryProvider',
            )
        return useSyncExternalStore(store.subscribe, store.getSnapshot)
    }

    function useRegistration(meta: T, opts?: { id?: string }) {
        const store = useContext(Ctx)
        if (!store)
            throw new Error(
                'useRegistration must be used inside RegistryProvider',
            )
        const generated = useId()
        const id = opts?.id ?? generated

        // Register on mount/update, unregister on unmount.
        useLayoutEffect(() => {
            store.set(id, meta)
            return () => store.delete(id)
        }, [store, id, meta])

        return id // in case you want to reference it
    }

    return { RegistryProvider, useRegistrySnapshot, useRegistration }
}

export type { Entry }
