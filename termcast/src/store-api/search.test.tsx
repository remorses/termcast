import { describe, test, expect } from 'bun:test'
import { searchStoreListings } from './search'

describe('searchStoreListings', () => {
  test('searches for extensions in the store', async () => {
    const results = await searchStoreListings({
      query: 'spiceblow-database',
      perPage: 5,
    })

    // Check we got results
    expect(results.data).toBeDefined()
    expect(results.data.length).toBeGreaterThan(0)

    // Verify the specific extension is found
    const extensionNames = results.data.map((d) => d.name)
    expect(extensionNames).toContain('spiceblow-database')
  }, 10000)

  test.skip('returns results when searching without a query', async () => {
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
            "fhir",
            "gitee",
            "mobius-materials",
            "xpf-converter",
          ]
        `)
  }, 10000)
})
