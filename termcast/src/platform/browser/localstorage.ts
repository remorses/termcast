/**
 * Browser LocalStorage implementation backed by window.localStorage.
 *
 * Values are stored as JSON objects with type metadata to preserve
 * number/boolean types across serialization, matching the SQLite
 * implementation's behavior.
 */

const PREFIX = 'termcast:'

interface StoredEntry {
  value: string
  type: string
}

export namespace LocalStorage {
  export type Value = string | number | boolean

  export interface Values {
    [key: string]: any
  }

  export async function getItem<T extends Value = Value>(
    key: string,
  ): Promise<T | undefined> {
    return getItemSync<T>(key)
  }

  export function getItemSync<T extends Value = Value>(
    key: string,
  ): T | undefined {
    try {
      const raw = window.localStorage.getItem(PREFIX + key)
      if (raw === null) return undefined

      const entry: StoredEntry = JSON.parse(raw)

      let value: Value
      switch (entry.type) {
        case 'number':
          value = parseFloat(entry.value)
          break
        case 'boolean':
          value = entry.value === 'true'
          break
        default:
          value = entry.value
      }

      return value as T
    } catch {
      return undefined
    }
  }

  export async function setItem(key: string, value: Value): Promise<void> {
    try {
      const entry: StoredEntry = {
        value: String(value),
        type: typeof value,
      }
      window.localStorage.setItem(PREFIX + key, JSON.stringify(entry))
    } catch {
      // localStorage might be full or disabled
    }
  }

  export async function removeItem(key: string): Promise<void> {
    window.localStorage.removeItem(PREFIX + key)
  }

  export async function allItems<T extends Values = Values>(): Promise<T> {
    const result: Values = {}

    for (let i = 0; i < window.localStorage.length; i++) {
      const fullKey = window.localStorage.key(i)
      if (!fullKey?.startsWith(PREFIX)) continue

      const key = fullKey.slice(PREFIX.length)
      const raw = window.localStorage.getItem(fullKey)
      if (raw === null) continue

      try {
        const entry: StoredEntry = JSON.parse(raw)

        let value: Value
        switch (entry.type) {
          case 'number':
            value = parseFloat(entry.value)
            break
          case 'boolean':
            value = entry.value === 'true'
            break
          default:
            value = entry.value
        }

        result[key] = value
      } catch {
        // Skip corrupted entries
      }
    }

    return result as T
  }

  export async function clear(): Promise<void> {
    const keysToRemove: string[] = []
    for (let i = 0; i < window.localStorage.length; i++) {
      const fullKey = window.localStorage.key(i)
      if (fullKey?.startsWith(PREFIX)) {
        keysToRemove.push(fullKey)
      }
    }
    for (const key of keysToRemove) {
      window.localStorage.removeItem(key)
    }
  }
}
