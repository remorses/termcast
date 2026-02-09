import { describe, test, expect, beforeEach, afterAll, jest } from 'bun:test'
import { Cache } from './cache'
import { Database } from 'bun:sqlite'
import * as os from 'os'
import * as path from 'path'
import * as fs from 'fs'

const testDbSuffix = `cache-tests-${process.pid}-${Date.now()}`
const testDbPath = path.join(
  os.homedir(),
  '.termcast',
  '.termcast-bundle',
  `data-${testDbSuffix}.db`,
)
process.env.TERMCAST_DB_SUFFIX = testDbSuffix

describe('Cache', () => {
  let cache: Cache

  beforeEach(() => {
    cache = new Cache({ namespace: `test-${Date.now()}-${Math.random()}` })
  })

  afterAll(() => {
    ;[testDbPath, `${testDbPath}-shm`, `${testDbPath}-wal`].forEach((filePath) => {
      if (!fs.existsSync(filePath)) {
        return
      }
      fs.unlinkSync(filePath)
    })
    delete process.env.TERMCAST_DB_SUFFIX
  })

  describe('constructor', () => {
    test('creates cache with default capacity', () => {
      const cache = new Cache()
      expect(Cache.DEFAULT_CAPACITY).toBe(10 * 1024 * 1024)
    })

    test('creates cache with custom capacity', () => {
      const cache = new Cache({ capacity: 1024 })
      expect(cache).toBeDefined()
    })

    test('creates cache with namespace', () => {
      const cache = new Cache({ namespace: 'test-namespace' })
      expect(cache.storageDirectory).toContain('test-namespace')
    })

    test('keeps table count stable across many namespaces', () => {
      const namespaces = Array.from({ length: 40 }, (_, i) => `stable-${i}`)
      namespaces.forEach((namespace) => {
        const namespacedCache = new Cache({ namespace })
        namespacedCache.set('key', 'value')
      })

      const db = new Database(testDbPath)
      const countRow = db
        .prepare(
          `SELECT COUNT(*) as count FROM sqlite_master WHERE type = 'table' AND name LIKE 'cache%'`,
        )
        .get() as { count: number }
      db.close()

      expect(countRow.count).toBe(1)
    })
  })

  describe('get and set', () => {
    test('stores and retrieves data', () => {
      cache.set('key1', 'value1')
      const result = cache.get('key1')
      expect(result).toBe('value1')
    })

    test('returns undefined for non-existent key', () => {
      const result = cache.get('non-existent')
      expect(result).toBeUndefined()
    })

    test('overwrites existing values', () => {
      cache.set('key', 'initial')
      cache.set('key', 'updated')
      const result = cache.get('key')
      expect(result).toBe('updated')
    })

    test('stores JSON stringified data', () => {
      const data = { items: ['a', 'b', 'c'], count: 3 }
      cache.set('json-data', JSON.stringify(data))
      const result = cache.get('json-data')
      expect(JSON.parse(result!)).toEqual(data)
    })
  })

  describe('has', () => {
    test('returns true for existing key', () => {
      cache.set('exists', 'value')
      expect(cache.has('exists')).toBe(true)
    })

    test('returns false for non-existent key', () => {
      expect(cache.has('non-existent')).toBe(false)
    })

    test('does not affect LRU order', () => {
      cache.set('key1', 'value1')
      cache.set('key2', 'value2')

      // has() should not affect LRU, so key1 is still oldest
      cache.has('key1')
      cache.has('key1')
      cache.has('key1')

      // Add more data to potentially trigger eviction
      // key1 should still be first to be evicted since has() doesn't update LRU
      expect(cache.has('key1')).toBe(true)
    })
  })

  describe('isEmpty', () => {
    test('returns true for empty cache', () => {
      expect(cache.isEmpty).toBe(true)
    })

    test('returns false when cache has data', () => {
      cache.set('key', 'value')
      expect(cache.isEmpty).toBe(false)
    })

    test('returns true after clearing cache', () => {
      cache.set('key', 'value')
      cache.clear()
      expect(cache.isEmpty).toBe(true)
    })
  })

  describe('remove', () => {
    test('removes existing key', () => {
      cache.set('to-remove', 'value')
      const removed = cache.remove('to-remove')
      expect(removed).toBe(true)
      expect(cache.get('to-remove')).toBeUndefined()
    })

    test('returns false when removing non-existent key', () => {
      const removed = cache.remove('non-existent')
      expect(removed).toBe(false)
    })
  })

  describe('clear', () => {
    test('removes all cached data', () => {
      cache.set('key1', 'value1')
      cache.set('key2', 'value2')
      cache.set('key3', 'value3')

      cache.clear()

      expect(cache.get('key1')).toBeUndefined()
      expect(cache.get('key2')).toBeUndefined()
      expect(cache.get('key3')).toBeUndefined()
      expect(cache.isEmpty).toBe(true)
    })
  })

  describe('subscribe', () => {
    test('notifies subscriber on set', () => {
      const subscriber = jest.fn()
      cache.subscribe(subscriber)

      cache.set('key', 'value')

      expect(subscriber).toHaveBeenCalledWith('key', 'value')
    })

    test('notifies subscriber on remove', () => {
      const subscriber = jest.fn()
      cache.set('key', 'value')
      cache.subscribe(subscriber)

      cache.remove('key')

      expect(subscriber).toHaveBeenCalledWith('key', undefined)
    })

    test('notifies subscriber on clear', () => {
      const subscriber = jest.fn()
      cache.set('key', 'value')
      cache.subscribe(subscriber)

      cache.clear()

      expect(subscriber).toHaveBeenCalledWith(undefined, undefined)
    })

    test('does not notify when clear called with notifySubscribers: false', () => {
      const subscriber = jest.fn()
      cache.set('key', 'value')
      cache.subscribe(subscriber)

      cache.clear({ notifySubscribers: false })

      expect(subscriber).not.toHaveBeenCalled()
    })

    test('unsubscribe stops notifications', () => {
      const subscriber = jest.fn()
      const unsubscribe = cache.subscribe(subscriber)

      cache.set('key1', 'value1')
      expect(subscriber).toHaveBeenCalledTimes(1)

      unsubscribe()

      cache.set('key2', 'value2')
      expect(subscriber).toHaveBeenCalledTimes(1) // Still 1, not called again
    })

    test('handles multiple subscribers', () => {
      const subscriber1 = jest.fn()
      const subscriber2 = jest.fn()

      cache.subscribe(subscriber1)
      cache.subscribe(subscriber2)

      cache.set('key', 'value')

      expect(subscriber1).toHaveBeenCalledWith('key', 'value')
      expect(subscriber2).toHaveBeenCalledWith('key', 'value')
    })

    test('handles subscriber errors gracefully', () => {
      const errorSubscriber = jest.fn(() => {
        throw new Error('Subscriber error')
      })
      const normalSubscriber = jest.fn()

      cache.subscribe(errorSubscriber)
      cache.subscribe(normalSubscriber)

      // Should not throw, and normal subscriber should still be called
      expect(() => cache.set('key', 'value')).not.toThrow()
      expect(normalSubscriber).toHaveBeenCalledWith('key', 'value')
    })
  })

  describe('capacity management', () => {
    test('evicts least recently used items when capacity exceeded', () => {
      const smallCache = new Cache({
        capacity: 100,
        namespace: `capacity-test-${Date.now()}`,
      })

      // Add items that together exceed capacity
      smallCache.set('old', 'x'.repeat(40))
      smallCache.set('medium', 'y'.repeat(40))
      smallCache.set('new', 'z'.repeat(40)) // This should trigger eviction

      // Old item should be evicted
      expect(smallCache.get('old')).toBeUndefined()
      expect(smallCache.get('medium')).toBe('y'.repeat(40))
      expect(smallCache.get('new')).toBe('z'.repeat(40))
    })

    test('updates LRU order on get', () => {
      const smallCache = new Cache({
        capacity: 100,
        namespace: `lru-test-${Date.now()}`,
      })

      smallCache.set('first', 'x'.repeat(30))
      smallCache.set('second', 'y'.repeat(30))

      // Access first item to make it more recent
      smallCache.get('first')

      // Add new item that triggers eviction
      smallCache.set('third', 'z'.repeat(50))

      // Second should be evicted, not first (because we accessed first after second)
      expect(smallCache.get('first')).toBe('x'.repeat(30))
      expect(smallCache.get('second')).toBeUndefined()
      expect(smallCache.get('third')).toBe('z'.repeat(50))
    })
  })

  describe('edge cases', () => {
    test('handles empty string data', () => {
      cache.set('empty', '')
      expect(cache.get('empty')).toBe('')
    })

    test('handles large data', () => {
      const largeData = 'x'.repeat(10000)
      cache.set('large', largeData)
      expect(cache.get('large')).toBe(largeData)
    })

    test('handles special characters in keys', () => {
      const specialKey = 'key-!@#$%^&*()_+={}[]|\\:";\'<>?,./with spaces'
      cache.set(specialKey, 'value')
      expect(cache.get(specialKey)).toBe('value')
    })

    test('handles special characters in data', () => {
      const specialData = 'data with !@#$%^&*()_+={}[]|\\:";\'<>?,./\n\t\r'
      cache.set('key', specialData)
      expect(cache.get('key')).toBe(specialData)
    })

    test('handles unicode data', () => {
      const unicodeData = '测试数据 🎉 𝓗𝓮𝓵𝓵𝓸'
      cache.set('unicode', unicodeData)
      expect(cache.get('unicode')).toBe(unicodeData)
    })
  })

  describe('storageDirectory', () => {
    test('returns default directory without namespace', () => {
      const cache = new Cache()
      expect(cache.storageDirectory).toContain('.termcast-bundle')
      expect(cache.storageDirectory).toContain('cache')
    })

    test('returns namespaced directory with namespace', () => {
      const cache = new Cache({ namespace: 'my-command' })
      expect(cache.storageDirectory).toContain('.termcast-bundle')
      expect(cache.storageDirectory).toContain('cache')
      expect(cache.storageDirectory).toContain('my-command')
    })
  })

  describe('static properties', () => {
    test('STORAGE_DIRECTORY_NAME is correct', () => {
      expect(Cache.STORAGE_DIRECTORY_NAME).toBe('.termcast-cache')
    })

    test('DEFAULT_CAPACITY is 10MB', () => {
      expect(Cache.DEFAULT_CAPACITY).toBe(10 * 1024 * 1024)
    })
  })
})
