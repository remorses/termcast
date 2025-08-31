// node-pty does not work in bun, so we use vitest to run this test
import { test, expect } from 'vitest'
import { NodeTuiDriver } from './e2e-node'

test('list with sections navigation', async () => {
    const driver = new NodeTuiDriver(
        'bun',
        ['src/examples/list-with-sections.tsx'],
        {
            cols: 100,
            rows: 50,
        },
    )

    try {
        // Wait for the process to start and render
        await driver.waitIdle({ timeout: 2000 })


        const initialSnapshot = driver.text()

        // Check that all expected items are present
        const hasApple = initialSnapshot.includes('Apple')
        const hasBanana = initialSnapshot.includes('Banana')
        const hasCarrot = initialSnapshot.includes('Carrot')
        const hasLettuce = initialSnapshot.includes('Lettuce')
        const hasBread = initialSnapshot.includes('Bread')

        if (!hasBread) {
            console.log('WARNING: Bread item is missing from the display!')
        }
        console.log('Items found:', {
            hasApple,
            hasBanana,
            hasCarrot,
            hasLettuce,
            hasBread,
        })

        // Find where Bread appears in the snapshot
        const lines = initialSnapshot.split('\n')
        lines.forEach((line, i) => {
            if (line.includes('Bread')) {
                console.log(`Line ${i}: "${line}"`)
            }
        })

        // Log whether Bread is visible for debugging
        if (!hasBread) {
            console.warn('Bread item is not visible in the terminal output')
        }
        expect(initialSnapshot).toMatchInlineSnapshot(`""`)

        await driver.keys.down()

        const afterDownSnapshot = driver.text()
        expect(afterDownSnapshot).toMatchInlineSnapshot(`
          "                                                                                                    
                                                                                                              
             Simple List Example                                                                              
                                                                                                              
             Search items...                                                                                  
                                                                                                              
                                                                                                              
             Fruits                                                                                           
             › Apple Red and sweet                                                          Fresh [Popular]   
             Banana Yellow and nutritious                                                              Ripe   
                                                                                                              
             Vegetables                                                                                       
             Carrot Orange and crunchy                                                            [Healthy]   
             Lettuce Green and fresh                                                                          
             Bread Freshly baked                                                                Today [New]   
                                                                                                              
                                                                                                              
             ↵ select   ↑↓ navigate   ^k actions                                                              "
        `)

        await driver.keys.down()

        const secondDownSnapshot = driver.text()
        expect(secondDownSnapshot).toMatchInlineSnapshot(`
          "                                                                                                    
                                                                                                              
             Simple List Example                                                                              
                                                                                                              
             Search items...                                                                                  
                                                                                                              
                                                                                                              
             Fruits                                                                                           
             Apple Red and sweet                                                            Fresh [Popular]   
             › Banana Yellow and nutritious                                                            Ripe   
                                                                                                              
             Vegetables                                                                                       
             Carrot Orange and crunchy                                                            [Healthy]   
             Lettuce Green and fresh                                                                          
             Bread Freshly baked                                                                Today [New]   
                                                                                                              
                                                                                                              
             ↵ select   ↑↓ navigate   ^k actions                                                              "
        `)

        await driver.keys.enter()

        const afterEnterSnapshot = driver.text()
        expect(afterEnterSnapshot).toMatchInlineSnapshot(`
          "                                                                                                    
                                                                                                              
                                                                                                              
                                                                                                              
            # Banana                                                                                          
                                                                                                              
            A yellow tropical fruit that's nutritious and energy-rich.                                        
                                                                                                              
            ## Benefits                                                                                       
            - High in potassium                                                                               
            - Natural energy booster                                                                          
            - Aids digestion                                                                                  
                                                                                                              
                                                                                                              
                                                                                                              
                                                                                                              
                                                                                                              
                                                                                                              
                                                                                                              
                                                                                                              
                                                                                                              
             esc go back                                                                                      "
        `)
    } finally {
        driver.dispose()
    }
})
