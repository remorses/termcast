#!/usr/bin/env node

// verceltui CLI entry point.
// Uses goke for command parsing. The default command launches the TUI.
// When running under Node, re-spawns with bun since opentui requires Bun FFI.
// Token can be set via --token flag, VERCEL_TOKEN env var, or interactive prompt.

import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { goke, isAgent } from 'goke'
import { z } from 'zod'
import React from 'react'

const cli = goke('verceltui')

cli
  .command('', 'Browse Vercel deployments in the terminal')
  .option('--token [token]', z.string().optional().describe('Vercel access token (or set VERCEL_TOKEN)'))
  .action(async (options) => {
  // Re-spawn under bun if running under Node (opentui requires Bun FFI)
  const isBun = typeof (globalThis as { Bun?: unknown }).Bun !== 'undefined'
  if (!isBun) {
    const { spawnSync } = await import('node:child_process')
    const __filename = fileURLToPath(import.meta.url)
    const result = spawnSync('bun', [__filename, ...process.argv.slice(2)], {
      stdio: 'inherit',
      env: process.env,
    })
    if (result.error) {
      const { colors } = await import('goke')
      const installCmd = process.platform === 'win32'
        ? 'powershell -c "irm bun.sh/install.ps1 | iex"'
        : 'curl -fsSL https://bun.sh/install | bash'
      console.error(
        colors.red('Error: ') +
          'The TUI requires Bun to run.\n\n' +
          'Install Bun:\n' +
          `  ${colors.cyan(installCmd)}\n\n` +
          'Then run:\n' +
          `  ${colors.cyan('verceltui')}`,
      )
      process.exit(1)
    }
    if (result.signal) {
      process.kill(process.pid, result.signal)
      return
    }
    process.exit(result.status ?? 1)
    return
  }

  // Resolve token: flag > env var > interactive prompt
  let token = options.token || process.env.VERCEL_TOKEN

  if (!token) {
    if (isAgent || !process.stdin.isTTY) {
      console.error('Missing token. Usage: verceltui --token <token>')
      console.error('Or set VERCEL_TOKEN environment variable.')
      console.error('Create one at: https://vercel.com/account/tokens')
      process.exit(1)
    }

    const clack = await import('@clack/prompts')
    clack.intro('verceltui')
    const input = await clack.password({
      message: 'Enter your Vercel access token',
    })
    if (clack.isCancel(input) || !input) {
      clack.cancel('No token provided')
      process.exit(0)
    }
    token = input
  }

  // Store token as extension preference so getPreferenceValues() can read it
  const { LocalStorage } = await import('termcast/src/apis/localstorage')
  await LocalStorage.setItem(
    'preferences.verceltui',
    JSON.stringify({ accessToken: token }),
  )

  // Launch the TUI
  const { renderWithProviders } = await import('termcast/src/utils')
  const { default: SearchDeployments } = await import('./search-deployments.js')
  await renderWithProviders(React.createElement(SearchDeployments), {
    extensionName: 'verceltui',
  })
})

cli.help()
cli.completions()
const require = createRequire(import.meta.url)
const { version } = require('../package.json')
cli.version(version)

void cli.parse()
