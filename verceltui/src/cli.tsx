#!/usr/bin/env bun

// verceltui CLI entry point. Always runs under bun (bin/cli.js shim handles Node re-spawn).
// Token can be set via --token flag, VERCEL_TOKEN env var, or interactive prompt.

import { createRequire } from 'node:module'
import { goke, isAgent } from 'goke'
import { z } from 'zod'
import React from 'react'

const cli = goke('verceltui')

cli
  .command('', 'Browse Vercel deployments in the terminal')
  .option(
    '--token [token]',
    z.string().optional().describe('Vercel access token (or set VERCEL_TOKEN)'),
  )
  .action(async (options) => {
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
      const { colors } = await import('goke')

      console.log()
      console.log(colors.bold('  ▲ verceltui'))
      console.log()
      console.log(`  Browse your Vercel deployments from the terminal.`)
      console.log(`  A personal access token is needed to call the Vercel API.`)
      console.log()
      console.log(
        `  Create one at ${colors.cyan('https://vercel.com/account/tokens')}`,
      )
      console.log(
        `  No special scopes required; the default read access is enough.`,
      )
      console.log()
      console.log(
        `  You can also pass it via ${colors.bold('--token')} or ${colors.bold('VERCEL_TOKEN')} env var.`,
      )
      console.log()

      const input = await clack.password({
        message: 'Paste your token',
      })
      if (clack.isCancel(input) || !input) {
        clack.cancel('No token provided')
        process.exit(0)
      }
      token = input
    }

    // Initialize Termcast storage before the renderer starts.
    const { initializeExtension } = await import('termcast')
    initializeExtension({ extensionName: 'verceltui' })

    // Store token as extension preference so getPreferenceValues() can read it
    const { LocalStorage } = await import('termcast/src/apis/localstorage')
    await LocalStorage.setItem(
      'preferences.verceltui',
      JSON.stringify({ accessToken: token }),
    )

    // Launch the TUI
    const { renderWithProviders } = await import('termcast/src/utils')
    const { default: SearchDeployments } = await import('./search-deployments')
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
