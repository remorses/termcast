import { test, expect } from 'bun:test'
import { TuiDriver } from './e2e'

test('list with sections navigation', async () => {
    const driver = new TuiDriver('bun', ['src/examples/list-with-sections.tsx'], {
        cols: 80,
        rows: 24,
    })

    try {
        await new Promise(resolve => setTimeout(resolve, 500))
        
        const initialSnapshot = driver.text()
        expect(initialSnapshot).toMatchInlineSnapshot(`
          "                                                                                
                                                                                          
             Simple List Example                                                          
                                                                                          
             Search items...                                                              
                                                                                          
                                                                                          
             Fruits                                                                       
             Apple Red and sweet                                        Fresh [Popular]   
             Banana Yellow and nutritious                                          Ripe   
                                                                                          
             Vegetables                                                                   
             Carrot Orange and crunchy                                        [Healthy]   
             Lettuce Green and fresh                                                      
             Bread Freshly baked                                            Today 








          "
        `)

        await driver.keys.down()
        await new Promise(resolve => setTimeout(resolve, 200))
        
        const afterDownSnapshot = driver.text()
        expect(afterDownSnapshot).toMatchInlineSnapshot(`
          "                                                                                
                                                                                          
             Simple List Example                                                          
                                                                                          
             Search items...                                                              
                                                                                          
                                                                                          
             Fruits                                                                       
             Apple Red and sweet                                        Fresh [Popular]   
             Banana Yellow and nutritious                                          Ripe   
                                                                                          
             Vegetables                                                                   
             Carrot Orange and crunchy                                        [Healthy]   
             Lettuce Green and fresh                                                      
             Bread Freshly baked                                            Today 








          "
        `)

        await driver.keys.down()
        await new Promise(resolve => setTimeout(resolve, 200))
        
        const secondDownSnapshot = driver.text()
        expect(secondDownSnapshot).toMatchInlineSnapshot(`
          "                                                                                
                                                                                          
             Simple List Example                                                          
                                                                                          
             Search items...                                                              
                                                                                          
                                                                                          
             Fruits                                                                       
             Apple Red and sweet                                        Fresh [Popular]   
             Banana Yellow and nutritious                                          Ripe   
                                                                                          
             Vegetables                                                                   
             Carrot Orange and crunchy                                        [Healthy]   
             Lettuce Green and fresh                                                      
             Bread Freshly baked                                            Today 








          "
        `)

        await driver.keys.enter()
        await new Promise(resolve => setTimeout(resolve, 200))
        
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
                                                                                          
                                                                                       
                                                                                        

                                                
                                                                                        
                                                                                        
                                                                                        
             esc go back                                                                

          "
        `)
    } finally {
        driver.dispose()
    }
})