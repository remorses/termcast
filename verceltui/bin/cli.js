#!/usr/bin/env node

// Thin Node-compatible shim that re-spawns with bun.
// npx/npm runs this under Node, which can't handle .tsx files.
// We immediately re-spawn the real CLI entry point with bun.

import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __filename = fileURLToPath(import.meta.url)
const cliPath = path.resolve(path.dirname(__filename), '..', 'src', 'cli.tsx')

const result = spawnSync('bun', [cliPath, ...process.argv.slice(2)], {
  stdio: 'inherit',
  env: process.env,
})

if (result.error) {
  const isWindows = process.platform === 'win32'
  const installCmd = isWindows
    ? 'powershell -c "irm bun.sh/install.ps1 | iex"'
    : 'curl -fsSL https://bun.sh/install | bash'
  console.error(
    'Error: verceltui requires Bun to run.\n\n' +
    'Install Bun:\n' +
    `  ${installCmd}\n\n` +
    'Then run:\n' +
    '  npx verceltui',
  )
  process.exit(1)
}

if (result.signal) {
  process.kill(process.pid, result.signal)
} else {
  process.exit(result.status ?? 1)
}
