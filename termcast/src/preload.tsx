import { plugin } from 'bun'
import path from 'node:path'
import { logger } from './logger'

plugin({
  name: 'alias-raycast-to-termcast',
  setup(build) {
    build.onResolve({ filter: /@raycast\/api/ }, () => {
      return {
        path: require.resolve('termcast'),
      }
    })
    // build.onResolve({ filter: /@raycast\/utils/ }, (args) => {
    //     return {
    //         path: require.resolve('@raycast/utils', {
    //             paths: [args.importer],
    //         }),

    //     }
    // })
    // build.onLoad({ filter: /@raycast\/utils/ }, (args) => {
    //     const filePath = require
    //         .resolve(args.path.replace('file:', ''))
    //         .replace('file:', '')
    //     return {
    //         contents: require('fs').readFileSync(filePath, 'utf8'),

    //         loader: 'js',
    //     }
    // })
  },
})
