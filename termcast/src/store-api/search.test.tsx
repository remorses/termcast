import { describe, test, expect } from 'bun:test'
import { searchStoreListings } from './search'

describe('searchStoreListings', () => {
  test('searches for extensions in the store', async () => {
    const results = await searchStoreListings({
      query: 'database',
      perPage: 5,
    })

    // Check we got results
    expect(results.data).toBeDefined()
    expect(results.data.length).toBeGreaterThan(0)
    expect(results.data.length).toBeLessThanOrEqual(5)

    // Snapshot the extension names
    const extensionNames = results.data.map((d) => d.name).sort()
    expect(extensionNames).toMatchInlineSnapshot(`
          [
            "discogs",
            "notion",
            "spiceblow-database",
            "tmdb",
            "turso",
          ]
        `)
  }, 10000)

  test('returns results when searching without a query', async () => {
    const results = await searchStoreListings({
      query: '',
      perPage: 5,
    })

    expect(results.data).toBeDefined()
    expect(results.data.length).toBeGreaterThan(0)
    expect(results.data.length).toBeLessThanOrEqual(5)

    const extensionNames = results.data.map((d) => d.name).sort()
    expect(extensionNames).toMatchInlineSnapshot(`
          [
            "baidu-ocr",
            "flypy",
            "markdown-image-to-html",
            "mobius-materials",
            "render",
          ]
        `)
  }, 10000)
})
