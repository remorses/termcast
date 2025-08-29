import { describe, test, expect } from 'bun:test'
import { fetchExtension } from './extension'

describe('fetchExtension', () => {
    test('fetches a raycast extension metadata', async () => {
        const extension = await fetchExtension({
            author: 'xmorse',
            extension: 'spiceblow-database',
        })
        
        // Check basic structure
        expect(extension.id).toBeTruthy()
        expect(extension.name).toBe('spiceblow-database')
        expect(extension.author.handle).toBe('xmorse')
        
        // Snapshot the command names
        const commandNames = extension.commands.map(c => c.name).sort()
        expect(commandNames).toMatchInlineSnapshot(`
          [
            "search-database",
          ]
        `)
    }, 10000)
})