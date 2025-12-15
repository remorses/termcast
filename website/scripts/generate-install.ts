import fs from 'node:fs'
import path from 'node:path'
import { generateInstallScript } from '../src/lib/generate-install-script'

const script = generateInstallScript('remorses/termcast')

const outputPath = path.join(import.meta.dirname, '..', 'public', 'install')
fs.writeFileSync(outputPath, script)
console.log(`Generated install script at ${outputPath}`)
