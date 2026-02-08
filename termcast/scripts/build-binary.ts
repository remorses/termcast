// Build the termcast CLI binary using Bun.build() API with plugins
// This is needed because raycast-utils imports @raycast/api, which must be
// redirected to termcast during compilation. The CLI `bun build` command
// doesn't support plugins, so we use the programmatic API instead.

import type { BunPlugin } from 'bun'

const raycastAliasPlugin: BunPlugin = {
  name: 'raycast-to-termcast',
  setup(build) {
    build.onResolve({ filter: /@raycast\/api/ }, () => ({
      path: require.resolve('termcast/src/index'),
    }))

    build.onResolve({ filter: /@raycast\/utils/ }, () => ({
      path: require.resolve('@termcast/utils'),
    }))
  },
}

const result = await Bun.build({
  entrypoints: ['./src/cli.tsx'],
  compile: {
    outfile: 'bin',
  },
  format: 'esm',
  bytecode: true,
  env: 'disable',
  plugins: [raycastAliasPlugin],
  throw: false,
} as Parameters<typeof Bun.build>[0])

if (!result.success) {
  console.error('Build failed:')
  for (const log of result.logs) {
    console.error(log)
  }
  process.exit(1)
}

console.log('Binary built successfully: bin')
