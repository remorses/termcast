/**
 * Cache API — platform-agnostic facade.
 *
 * Re-exports the platform-specific Cache class from #platform/cache
 * (SQLite on Node/Bun, IndexedDB on browser) and provides the shared
 * `withCache` higher-order function on top.
 */

export { Cache } from '#platform/cache'
import { Cache } from '#platform/cache'

function hashString(value: string): string {
  let hash = 0
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0
  }
  return Math.abs(hash).toString(36)
}

interface CacheMetadata {
  timestamp: number
  value: any
}

const functionCacheMap = new Map<string, Cache>()
const functionCacheData = new Map<string, Map<string, CacheMetadata>>()

/**
 * Wraps an async function with caching capabilities.
 *
 * This higher-order function adds automatic caching to any async function. Results are
 * cached both in memory and persistently on disk, with support for cache expiration
 * and validation. Each unique set of arguments creates a separate cache entry.
 *
 * @param fn - The async function to wrap with caching
 * @param options - Caching options
 * @param options.validate - Function to check if cached data is still valid (called before returning cached data)
 * @param options.maxAge - Maximum age in milliseconds before cached data expires (default: Infinity)
 * @returns The wrapped function with an additional `clearCache()` method
 * @template Fn - Type of the async function being wrapped
 *
 * @example
 * ```typescript
 * // Basic caching
 * const fetchUser = async (userId: string) => {
 *   const response = await fetch(`/api/users/${userId}`)
 *   return response.json()
 * }
 * const cachedFetchUser = withCache(fetchUser)
 *
 * // First call fetches from API
 * const user1 = await cachedFetchUser("123") // Makes API call
 * // Subsequent calls return from cache
 * const user2 = await cachedFetchUser("123") // Returns cached data
 *
 * // With expiration (5 minutes)
 * const cachedSearch = withCache(searchAPI, {
 *   maxAge: 5 * 60 * 1000
 * })
 *
 * // With validation
 * const cachedGetConfig = withCache(getConfig, {
 *   validate: (config) => config.version === currentVersion
 * })
 *
 * // Clear cache manually
 * cachedFetchUser.clearCache()
 *
 * // Different arguments are cached separately
 * await cachedFetchUser("123") // Cached
 * await cachedFetchUser("456") // Different cache entry
 * ```
 */
export function withCache<Fn extends (...args: any[]) => Promise<any>>(
  fn: Fn,
  options?: {
    validate?: (data: Awaited<ReturnType<Fn>>) => boolean
    maxAge?: number
  },
): Fn & { clearCache: () => void } {
  const fnKey = fn.toString()
  const maxAge = options?.maxAge || Infinity
  const validate = options?.validate || (() => true)

  if (!functionCacheMap.has(fnKey)) {
    const functionNamespace = `fn-${hashString(fnKey)}`
    functionCacheMap.set(fnKey, new Cache({ namespace: functionNamespace }))
    functionCacheData.set(fnKey, new Map())
  }

  const cache = functionCacheMap.get(fnKey)!
  const cacheData = functionCacheData.get(fnKey)!

  const cachedFn = (async (...args: Parameters<Fn>) => {
    const cacheKey = JSON.stringify(args)

    // Check memory cache first
    const cached = cacheData.get(cacheKey)
    if (cached) {
      const age = Date.now() - cached.timestamp
      if (age < maxAge && validate(cached.value)) {
        return cached.value
      }
    }

    // Check persistent cache
    const persistentCached = cache.get(cacheKey)
    if (persistentCached) {
      try {
        const metadata = JSON.parse(persistentCached) as CacheMetadata
        const age = Date.now() - metadata.timestamp
        if (age < maxAge && validate(metadata.value)) {
          // Update memory cache
          cacheData.set(cacheKey, metadata)
          return metadata.value
        }
      } catch {
        // Invalid cache entry, ignore
      }
    }

    // Call the original function
    const result = await fn(...args)

    // Cache the result
    const metadata: CacheMetadata = {
      timestamp: Date.now(),
      value: result,
    }

    // Update both caches
    cacheData.set(cacheKey, metadata)
    cache.set(cacheKey, JSON.stringify(metadata))

    return result
  }) as any

  cachedFn.clearCache = () => {
    cache.clear()
    cacheData.clear()
  }

  return cachedFn as Fn & { clearCache: () => void }
}
