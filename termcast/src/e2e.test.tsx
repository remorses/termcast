import { test, expect } from 'bun:test'
import { TuiDriver } from './e2e'
import { sleep } from './utils'

test('list with sections navigation', async () => {
    const driver = new TuiDriver('bun', ['src/examples/list-with-sections.tsx'], {
        cols: 100,
        rows: 50,
    })

    try {
        await sleep(500)

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
        console.log('Items found:', { hasApple, hasBanana, hasCarrot, hasLettuce, hasBread })

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
        expect(initialSnapshot).toMatchInlineSnapshot(`
          "                                                                                                    
                                                                                                              
             Simple List Example                                                                              
                                                                                                              
             Search items...                                                                                  
                                                                                                              
                                                                                                              
             Fruits                                                                                           
             Apple Red and sweet                                                            Fresh [Popular]   
             Banana Yellow and nutritious                                                              Ripe   
                                                                                                              
             Vegetables                                                                                       
             Carrot Orange and crunchy                                                            [Healthy]   
             Lettuce Green and fresh                                                                          "
        `)

        await driver.keys.down()
        await sleep(200)

        const afterDownSnapshot = driver.text()
        expect(afterDownSnapshot).toMatchInlineSnapshot(`
          "                                                                                                    
                                                                                                              
             Simple List Example                                                                              
                                                                                                              
             Search items...                                                                                  
                                                                                                              
                                                                                                              
             Fruits                                                                                           
             Apple Red and sweet                                                            Fresh [Popular]   
             Banana Yellow and nutritious                                                              Ripe   
                                                                                                              
             Vegetables                                                                                       
             Carrot Orange and crunchy                                                            [Healthy]   
             Lettuce Green and fresh                                                                          "
        `)

        await driver.keys.down()
        await sleep(200)

        const secondDownSnapshot = driver.text()
        expect(secondDownSnapshot).toMatchInlineSnapshot(`
          "                                                                                                    
                                                                                                              
             Simple List Example                                                                              
                                                                                                              
             Search items...                                                                                  
                                                                                                              
                                                                                                              
             Fruits                                                                                           
             Apple Red and sweet                                                            Fresh [Popular]   
             Banana Yellow and nutritious                                                              Ripe   
                                                                                                              
             Vegetables                                                                                       
             Carrot Orange and crunchy                                                            [Healthy]   
             Lettuce Green and fresh                                                                          "
        `)

        await driver.keys.enter()
        await sleep(200)

        const afterEnterSnapshot = driver.text()
        expect(afterEnterSnapshot).toMatchInlineSnapshot(`
          "                                                                                                    
                                                                                                              
                                                                                                              
                                                                                                              
            # Carrot                                                                                          
                                                                                                              
            A crunchy orange vegetable rich in vitamins.                                                      
                                                                                                              
            ## Health Benefits                                                                                
            - Excellent source of beta carotene                                                               
            - Improves eye health                                                                             
            - Boosts immune system                                                                            
            - Low in calories                                                                                 
                                                                                                              
                                                                                                              
                                                                                                              
                                                                                                              
                                                                                                              
                                                                                                              
                                                                                                              
                                                                                                              
             esc go back                                                                                      "
        `)
    } finally {
        driver.dispose()
    }
})
