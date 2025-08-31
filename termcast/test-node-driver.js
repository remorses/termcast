const { NodeTuiDriver } = require('./dist/e2e-node.js')

async function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

async function main() {
    console.log('Creating TuiDriver for list-with-sections example...')
    
    const driver = new NodeTuiDriver(
        'bun',
        ['src/examples/list-with-sections.tsx'],
        {
            cols: 100,
            rows: 50,
        }
    )

    try {
        await sleep(500)
        
        console.log('\n=== Initial Screen ===')
        console.log(driver.text())
        
        // Navigate down
        await driver.keys.down()
        await sleep(200)
        
        console.log('\n=== After pressing down ===')
        console.log(driver.text())
        
        // Navigate down again
        await driver.keys.down()
        await sleep(200)
        
        console.log('\n=== After pressing down again ===')
        console.log(driver.text())
        
        // Press enter
        await driver.keys.enter()
        await sleep(200)
        
        console.log('\n=== After pressing enter ===')
        console.log(driver.text())
        
    } finally {
        driver.dispose()
    }
}

main().catch(console.error)