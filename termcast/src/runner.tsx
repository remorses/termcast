import { plugin } from 'bun'

plugin({
    name: 'alias-raycast-to-termcast',
    setup(build) {
        build.onResolve({ filter: /^@raycast\/api$/ }, () => ({
            path: '@termcast/api',
        }))
    },
})
