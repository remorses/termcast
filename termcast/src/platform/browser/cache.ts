/**
 * Browser Cache implementation backed by IndexedDB with in-memory Map for sync reads.
 *
 * On construction, all entries for the namespace are loaded into a Map.
 * Sync reads (get, has, isEmpty) hit the Map.
 * Writes update both the Map and IndexedDB (fire-and-forget).
 * LRU eviction is done in-memory.
 */

import { byteLength } from '#platform/runtime'

const DB_NAME = 'termcast-cache'
const STORE_NAME = 'cache_entries'
const DB_VERSION = 1
const DEFAULT_NAMESPACE = '__default__'

interface CacheEntry {
  namespace: string
  key: string
  data: string
  size: number
  last_accessed_at: number
  updated_at: number
}

// Shared IDB connection — lazily opened, reused across Cache instances
let dbPromise: Promise<IDBDatabase> | null = null

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise

  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, {
          keyPath: ['namespace', 'key'],
        })
        store.createIndex('by_namespace', 'namespace', { unique: false })
        store.createIndex('by_lru', ['namespace', 'last_accessed_at'], {
          unique: false,
        })
      }
    }

    request.onsuccess = () => {
      resolve(request.result)
    }
    request.onerror = () => {
      reject(request.error)
    }
  })

  return dbPromise
}

// Load all entries for a namespace into memory (called once per Cache instance)
async function loadNamespace(namespace: string): Promise<Map<string, CacheEntry>> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const index = store.index('by_namespace')
    const request = index.getAll(namespace)

    request.onsuccess = () => {
      const map = new Map<string, CacheEntry>()
      for (const entry of request.result as CacheEntry[]) {
        map.set(entry.key, entry)
      }
      resolve(map)
    }
    request.onerror = () => {
      reject(request.error)
    }
  })
}

async function idbPut(entry: CacheEntry): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const request = store.put(entry)
    request.onsuccess = () => {
      resolve()
    }
    request.onerror = () => {
      reject(request.error)
    }
  })
}

async function idbDelete(namespace: string, key: string): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const request = store.delete([namespace, key])
    request.onsuccess = () => {
      resolve()
    }
    request.onerror = () => {
      reject(request.error)
    }
  })
}

async function idbClearNamespace(namespace: string): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const index = store.index('by_namespace')
    const request = index.openCursor(namespace)

    request.onsuccess = () => {
      const cursor = request.result
      if (cursor) {
        cursor.delete()
        cursor.continue()
      } else {
        resolve()
      }
    }
    request.onerror = () => {
      reject(request.error)
    }
  })
}

let logicalTimestamp = Date.now()
function nextTimestamp(): number {
  logicalTimestamp += 1
  return logicalTimestamp
}

export class Cache {
  static get STORAGE_DIRECTORY_NAME(): string {
    return 'cache'
  }

  static get DEFAULT_CAPACITY(): number {
    return 10 * 1024 * 1024 // 10 MB
  }

  private entries: Map<string, CacheEntry> = new Map()
  private capacity: number
  private namespace: string
  private subscribers: Cache.Subscriber[] = []
  private currentSize: number = 0
  private initialized: boolean = false

  constructor(options?: Cache.Options) {
    this.capacity = options?.capacity || Cache.DEFAULT_CAPACITY
    this.namespace = options?.namespace || DEFAULT_NAMESPACE

    // Kick off async load — sync reads return undefined until loaded
    this.init()

    // Bind all methods
    this.get = this.get.bind(this)
    this.has = this.has.bind(this)
    this.set = this.set.bind(this)
    this.remove = this.remove.bind(this)
    this.clear = this.clear.bind(this)
    this.subscribe = this.subscribe.bind(this)
  }

  private async init(): Promise<void> {
    try {
      const loaded = await loadNamespace(this.namespace)
      // Merge: keep in-memory writes that happened during async load,
      // preferring the newer entry (by updated_at) on key conflicts.
      for (const [key, inMemoryEntry] of this.entries) {
        const loadedEntry = loaded.get(key)
        if (!loadedEntry || inMemoryEntry.updated_at >= loadedEntry.updated_at) {
          loaded.set(key, inMemoryEntry)
        }
      }
      this.entries = loaded
      this.currentSize = 0
      for (const entry of this.entries.values()) {
        this.currentSize += entry.size
      }
      this.initialized = true
    } catch {
      // IndexedDB might not be available (e.g. incognito with restrictions)
      this.initialized = true
    }
  }

  get storageDirectory(): string {
    return `/termcast/cache/${this.namespace}`
  }

  get(key: string): string | undefined {
    const entry = this.entries.get(key)
    if (!entry) return undefined

    // Update LRU timestamp in-memory and async in IDB
    const now = nextTimestamp()
    entry.last_accessed_at = now
    idbPut(entry).catch(() => {})

    return entry.data
  }

  has(key: string): boolean {
    return this.entries.has(key)
  }

  get isEmpty(): boolean {
    return this.entries.size === 0
  }

  set(key: string, data: string): void {
    const now = nextTimestamp()
    const dataSize = byteLength(data)

    const existing = this.entries.get(key)
    const oldSize = existing?.size || 0
    const newTotalSize = this.currentSize - oldSize + dataSize

    if (newTotalSize > this.capacity) {
      this.maintainCapacity(newTotalSize - this.capacity)
    }

    const entry: CacheEntry = {
      namespace: this.namespace,
      key,
      data,
      size: dataSize,
      last_accessed_at: now,
      updated_at: now,
    }

    this.entries.set(key, entry)
    this.currentSize = this.currentSize - oldSize + dataSize

    // Persist async
    idbPut(entry).catch(() => {})

    this.notifySubscribers(key, data)
  }

  remove(key: string): boolean {
    const entry = this.entries.get(key)
    if (!entry) return false

    this.entries.delete(key)
    this.currentSize -= entry.size

    // Persist async
    idbDelete(this.namespace, key).catch(() => {})

    this.notifySubscribers(key, undefined)
    return true
  }

  clear(options?: { notifySubscribers: boolean }): void {
    this.entries.clear()
    this.currentSize = 0

    // Persist async
    idbClearNamespace(this.namespace).catch(() => {})

    if (options?.notifySubscribers !== false) {
      this.notifySubscribers(undefined, undefined)
    }
  }

  subscribe(subscriber: Cache.Subscriber): Cache.Subscription {
    this.subscribers.push(subscriber)
    return () => {
      const index = this.subscribers.indexOf(subscriber)
      if (index > -1) {
        this.subscribers.splice(index, 1)
      }
    }
  }

  private maintainCapacity(bytesToFree: number): void {
    // Sort by LRU — oldest first
    const sorted = [...this.entries.values()].sort(
      (a, b) => a.last_accessed_at - b.last_accessed_at,
    )

    let freedBytes = 0
    for (const entry of sorted) {
      if (freedBytes >= bytesToFree) break
      this.entries.delete(entry.key)
      freedBytes += entry.size
      // Persist async
      idbDelete(this.namespace, entry.key).catch(() => {})
    }
    this.currentSize -= freedBytes
  }

  private notifySubscribers(
    key: string | undefined,
    data: string | undefined,
  ): void {
    for (const subscriber of this.subscribers) {
      try {
        subscriber(key, data)
      } catch {
        // Ignore subscriber errors in browser
      }
    }
  }
}

export namespace Cache {
  export interface Options {
    namespace?: string
    capacity?: number
  }

  export type Subscriber = (
    key: string | undefined,
    data: string | undefined,
  ) => void
  export type Subscription = () => void
}
