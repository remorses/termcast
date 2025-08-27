import { plugin } from 'bun'
import path from 'node:path'
import { logger } from './logger'

plugin({
    name: 'alias-raycast-to-termcast',
    setup(build) {
        build.onResolve({ filter: /@raycast\/api/ }, () => {
            logger.log('loading @raycast shit')
            return {
                path: require.resolve('@termcast/api'),
            }
        })

        build.onResolve({ filter: /^react\/jsx-runtime$/ }, () => {
            return {
                path: require.resolve('@opentui/react'),
            }
        })

        build.onResolve({ filter: /^react\/jsx-dev-runtime$/ }, () => {
            return {
                path: require.resolve('@opentui/react'),
            }
        })
    },
})
