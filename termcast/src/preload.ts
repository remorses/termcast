import { plugin } from 'bun'
import path from 'node:path'
import { logger } from './logger'

plugin({
    name: 'alias-raycast-to-termcast',
    setup(build) {
        build.onResolve({ filter: /@raycast\/api/ }, () => {
            logger.log('loading @raycast shit')
            return {
                path: path.resolve(__dirname, './index.tsx'),
            }
        })
    },
})