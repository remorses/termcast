import { plugin } from 'bun'
import path from 'node:path'
import { logger } from './logger'

// Path to our forked raycast-utils with termcast OAuth proxy URLs
const RAYCAST_UTILS_PATH = path.resolve(__dirname, '../../raycast-utils/src/index.ts')

plugin({
  name: 'alias-raycast-to-termcast',
  setup(build) {
    // Redirect @raycast/api to termcast
    build.onResolve({ filter: /^@raycast\/api$/ }, () => {
      return {
        path: require.resolve('termcast'),
      }
    })

    // // Redirect @raycast/utils to our fork with termcast OAuth proxy URLs
    // build.onResolve({ filter: /^@raycast\/utils$/ }, () => {
    //   return {
    //     path: RAYCAST_UTILS_PATH,
    //   }
    // })
  },
})
