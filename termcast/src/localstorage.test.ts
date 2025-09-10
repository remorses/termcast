import { describe, test, expect, beforeEach, afterAll } from 'bun:test'
import { LocalStorage } from './localstorage'
import * as os from 'os'
import * as path from 'path'
import * as fs from 'fs'

describe('LocalStorage', () => {
  beforeEach(async () => {
    await LocalStorage.clear()
  })

  afterAll(() => {
    // Optional: Clean up test database after all tests
    // const dbPath = path.join(os.homedir(), '.termcast.db')
    // if (fs.existsSync(dbPath)) {
    //     fs.unlinkSync(dbPath)
    // }
  })

  describe('setItem and getItem', () => {
    test('stores and retrieves string values', async () => {
      await LocalStorage.setItem('test-key', 'test-value')
      const result = await LocalStorage.getItem<string>('test-key')
      expect(result).toBe('test-value')
    })

    test('stores and retrieves number values', async () => {
      await LocalStorage.setItem('number-key', 42)
      const result = await LocalStorage.getItem<number>('number-key')
      expect(result).toBe(42)
      expect(typeof result).toBe('number')
    })

    test('stores and retrieves boolean values', async () => {
      await LocalStorage.setItem('bool-key-true', true)
      await LocalStorage.setItem('bool-key-false', false)

      const resultTrue = await LocalStorage.getItem<boolean>('bool-key-true')
      const resultFalse = await LocalStorage.getItem<boolean>('bool-key-false')

      expect(resultTrue).toBe(true)
      expect(resultFalse).toBe(false)
      expect(typeof resultTrue).toBe('boolean')
      expect(typeof resultFalse).toBe('boolean')
    })

    test('returns undefined for non-existent keys', async () => {
      const result = await LocalStorage.getItem('non-existent')
      expect(result).toBeUndefined()
    })

    test('overwrites existing values', async () => {
      await LocalStorage.setItem('key', 'initial')
      await LocalStorage.setItem('key', 'updated')
      const result = await LocalStorage.getItem('key')
      expect(result).toBe('updated')
    })
  })

  describe('removeItem', () => {
    test('removes stored items', async () => {
      await LocalStorage.setItem('to-remove', 'value')
      let result = await LocalStorage.getItem('to-remove')
      expect(result).toBe('value')

      await LocalStorage.removeItem('to-remove')
      result = await LocalStorage.getItem('to-remove')
      expect(result).toBeUndefined()
    })

    test('does not throw when removing non-existent key', async () => {
      // Should complete without throwing
      await LocalStorage.removeItem('non-existent')
      expect(true).toBe(true) // Test passes if we reach here
    })
  })

  describe('allItems', () => {
    test('returns all stored items', async () => {
      await LocalStorage.setItem('key1', 'value1')
      await LocalStorage.setItem('key2', 42)
      await LocalStorage.setItem('key3', true)

      const items = await LocalStorage.allItems()
      expect(items).toEqual({
        key1: 'value1',
        key2: 42,
        key3: true,
      })
    })

    test('returns empty object when no items stored', async () => {
      const items = await LocalStorage.allItems()
      expect(items).toEqual({})
    })

    test('supports typed interface', async () => {
      interface TestValues {
        todo: string
        priority: number
        completed: boolean
      }

      await LocalStorage.setItem('todo', 'Write tests')
      await LocalStorage.setItem('priority', 1)
      await LocalStorage.setItem('completed', false)

      const items = await LocalStorage.allItems<TestValues>()
      expect(items.todo).toBe('Write tests')
      expect(items.priority).toBe(1)
      expect(items.completed).toBe(false)
    })
  })

  describe('clear', () => {
    test('removes all stored items', async () => {
      await LocalStorage.setItem('key1', 'value1')
      await LocalStorage.setItem('key2', 'value2')
      await LocalStorage.setItem('key3', 'value3')

      let items = await LocalStorage.allItems()
      expect(Object.keys(items).length).toBe(3)

      await LocalStorage.clear()
      items = await LocalStorage.allItems()
      expect(items).toEqual({})
    })
  })

  describe('edge cases', () => {
    test('handles special characters in keys', async () => {
      const specialKey = 'key-with-!@#$%^&*()_+={}[]|\\:";\'<>?,./spaces'
      await LocalStorage.setItem(specialKey, 'special')
      const result = await LocalStorage.getItem(specialKey)
      expect(result).toBe('special')
    })

    test('handles special characters in string values', async () => {
      const specialValue = 'value with !@#$%^&*()_+={}[]|\\:";\'<>?,./\n\t\r'
      await LocalStorage.setItem('key', specialValue)
      const result = await LocalStorage.getItem('key')
      expect(result).toBe(specialValue)
    })

    test('handles large numbers', async () => {
      const largeNumber = Number.MAX_SAFE_INTEGER
      await LocalStorage.setItem('large', largeNumber)
      const result = await LocalStorage.getItem<number>('large')
      expect(result).toBe(largeNumber)
    })

    test('handles negative numbers', async () => {
      await LocalStorage.setItem('negative', -42.5)
      const result = await LocalStorage.getItem<number>('negative')
      expect(result).toBe(-42.5)
    })

    test('handles empty string values', async () => {
      await LocalStorage.setItem('empty', '')
      const result = await LocalStorage.getItem<string>('empty')
      expect(result).toBe('')
    })
  })
})
