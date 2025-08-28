// registry.ts
import React, {
  createContext, useContext, useEffect, useLayoutEffect,
  useRef, useId, useSyncExternalStore
} from 'react';

type Entry<T> = { id: string; meta: T };

type Store<T> = {
  getSnapshot: () => Entry<T>[];
  subscribe: (cb: () => void) => () => void;
  set: (id: string, meta: T) => void;
  delete: (id: string) => void;
};

function createStore<T>(): Store<T> {
  const map = new Map<string, T>();
  const listeners = new Set<() => void>();
  const notify = () => { for (const l of listeners) l(); };
  return {
    getSnapshot: () => Array.from(map, ([id, meta]) => ({ id, meta })),
    subscribe: (cb) => (listeners.add(cb), () => listeners.delete(cb)),
    set: (id, meta) => { map.set(id, meta); notify(); },
    delete: (id) => { map.delete(id); notify(); },
  };
}

// SSR-safe layout effect
const useIsoLayoutEffect = useLayoutEffect;

// shallow equality good enough for flat meta; override if needed
function shallowEqual(a: any, b: any) {
  if (Object.is(a, b)) return true;
  if (typeof a !== 'object' || a === null || typeof b !== 'object' || b === null) return false;
  const ka = Object.keys(a), kb = Object.keys(b);
  if (ka.length !== kb.length) return false;
  for (const k of ka) if (!Object.prototype.hasOwnProperty.call(b, k) || !Object.is(a[k], b[k])) return false;
  return true;
}

export function createRegistry<T>() {
  const Ctx = createContext<Store<T> | null>(null);

  function RegistryProvider({ children }: { children: React.ReactNode }) {
    const storeRef = useRef<Store<T> | undefined>(undefined);
    if (!storeRef.current) storeRef.current = createStore<T>(); // stable instance
    return <Ctx.Provider value={storeRef.current}>{children}</Ctx.Provider>;
  }

  function useRegistrySnapshot(): Entry<T>[] {
    const store = useContext(Ctx);
    if (!store) throw new Error('useRegistrySnapshot must be used inside RegistryProvider');
    return useSyncExternalStore(store.subscribe, store.getSnapshot);
  }

  function useRegistration(
    meta: T,
    opts?: { id?: string; isEqual?: (prev: T | undefined, next: T) => boolean }
  ) {
    const store = useContext(Ctx);
    if (!store) throw new Error('useRegistration must be used inside RegistryProvider');
    const id = opts?.id ?? useId();
    const isEqual = opts?.isEqual ?? shallowEqual;
    const last = useRef<T | undefined>(undefined);

    // Run every render, but only notify if the meta actually changed by value.
    useIsoLayoutEffect(() => {
      if (!isEqual(last.current, meta)) {
        store.set(id, meta);
        last.current = meta;
      }
      return () => { store.delete(id); last.current = undefined; };
      // Do NOT depend on `meta` by reference; we always check equality inside.
      // Only re-run when id/store identity changes (which they don't in normal use).
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [store, id]);

    // If meta can change over time, we still need to observe it and conditionally set:
    useIsoLayoutEffect(() => {
      if (!isEqual(last.current, meta)) {
        store.set(id, meta);
        last.current = meta;
      }
    }, [isEqual, meta, store, id]);

    return id;
  }

  return { RegistryProvider, useRegistrySnapshot, useRegistration };
}

export type { Entry };
