#!/usr/bin/env bun

import fs from 'node:fs'
import path from 'node:path'
import { execSync, spawn } from 'node:child_process'
import { cac } from 'cac'
import * as watcher from '@parcel/watcher'
import { buildExtensionCommands } from './build'
import { logger } from './logger'
import { installExtension } from './utils'
import { searchStoreListings } from './store-api/search'
import './globals'
import { startDevMode, triggerRebuild } from './extensions/dev'
import { compileExtension } from './compile'
import { releaseExtension } from './release'
import { runHomeCommand } from './extensions/home'
import { showToast, Toast } from './apis/toast'
import packageJson from '../package.json'

const cli = cac('termcast')

// Auto-update check
async function checkForUpdates() {
  try {
    const currentVersion = packageJson.version

    // Fetch latest release info from GitHub
    const response = await fetch(
      'https://api.github.com/repos/remorses/termcast/releases/latest',
    )
    if (!response.ok) {
      return
    }

    const latestRelease = await response.json()
    const latestVersion =
      latestRelease.tag_name?.replace('termcast@', '') ||
      latestRelease.tag_name?.replace('v', '')

    // Compare versions
    if (latestVersion && latestVersion !== currentVersion) {
      // Run the install script in background
      const updateProcess = spawn('bash', ['-c', 'curl -sf https://termcast.app/install | bash'], {
        detached: true,
        stdio: 'ignore',
      })

      updateProcess.on('exit', async (code) => {
        if (code === 0) {
          // Show toast notification only on successful completion
          await showToast({
            title: 'Update available',
            message: `Restart to use the new version ${latestVersion}`,
            style: Toast.Style.Success,
          })
        }
      })

      // updateProcess.unref()
    }
  } catch (error) {
    // Silently fail - don't interrupt the user's workflow
    logger.log('Failed to check for updates:', error)
  }
}

// Check for updates when CLI starts
checkForUpdates()

cli
  .command('dev [path]', 'Run the extension in the current working directory')
  .action(async (rawExtensionPath, options) => {
    try {
      // Check if the provided arg looks like a path (contains / or . or is existing dir)
      const looksLikePath = rawExtensionPath && (
        rawExtensionPath.includes('/') ||
        rawExtensionPath.startsWith('.') ||
        fs.existsSync(rawExtensionPath)
      )
      const extensionPath = path.resolve(looksLikePath ? rawExtensionPath : process.cwd())
      let isBuilding = false

      // Start dev mode with initial render
      // Skip args up to and including "dev" subcommand, plus path if it looks like one
      const devIndex = process.argv.findIndex((arg) => arg === 'dev')
      const skipArgv = devIndex - 1 + (looksLikePath ? 1 : 0)
      await startDevMode({ extensionPath, skipArgv })

      logger.log(`dev mode started`)
      // Only watch if running in a TTY (interactive terminal)
      if (!process.stdout.isTTY) {
        console.log('Not running in interactive terminal, watching disabled')
        return
      }

      console.log('\nWatching for file changes...')

      // Watch entire extension directory using @parcel/watcher
      const ignoredPatterns = [
        '**/node_modules/**',
        '**/.termcast-bundle/**',
        '**/.git/**',
        '**/.build/**',  // Swift build output
        '**/*.log',
        '**/dist/**',
        '**/build/**',
      ]

      const rebuild = async (filePath: string) => {
        if (isBuilding) {
          logger.log('Build already in progress, skipping...')
          return
        }

        isBuilding = true
        logger.log('File changed, rebuilding...')
        logger.log(filePath)
        try {
          await triggerRebuild({ extensionPath })
          logger.log('Rebuild complete')
        } catch (error: any) {
          logger.error('Failed to trigger rebuild:', error.message)
        } finally {
          isBuilding = false
        }
      }

      const subscription = await watcher.subscribe(
        extensionPath,
        (err, events) => {
          if (err) {
            logger.error('Watcher error:', err)
            return
          }
          // Trigger rebuild for any event (create, update, delete)
          if (events.length > 0) {
            rebuild(events[0].path)
          }
        },
        { ignore: ignoredPatterns }
      )

      // Clean up watcher on exit signals
      const cleanup = async () => {
        await subscription.unsubscribe()
        process.exit(0)
      }
      process.on('SIGINT', cleanup)
      process.on('SIGTERM', cleanup)
    } catch (e: any) {
      console.error('Failed to start dev mode:', e?.message || e)
      logger.error(e)
      process.exit(1)
    }
  })

cli
  .command('build [path]', 'Build and install the extension to user store')
  .action(async (extensionPath, options) => {
    extensionPath = path.resolve(extensionPath || process.cwd())

    console.log('Building extension...')
    try {
      const buildResult = await buildExtensionCommands({
        extensionPath,
        format: 'esm',
        target: 'bun',
      })
      console.log(`Successfully built ${buildResult.commands.length} commands`)

      for (const cmd of buildResult.commands) {
        if (cmd.bundledPath) {
          console.log(`  ✓ ${cmd.name}`)
        }
      }

      const packageJsonPath = path.join(extensionPath, 'package.json')
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))
      const extensionName = packageJson.name || path.basename(extensionPath)
      installExtension({
        extensionName,
        extensionSourcePath: extensionPath,
      })
      console.log(`\nExtension installed to store as '${extensionName}'`)
    } catch (error: any) {
      console.error('Build failed:', error.message)
      process.exit(1)
    }
  })

cli
  .command('compile [path]', 'Compile the extension to a standalone executable')
  .option('-o, --outfile <path>', 'Output file path for the executable')
  .option('--minify', 'Minify the output')
  .action(async (extensionPath, options) => {
    extensionPath = path.resolve(extensionPath || process.cwd())

    console.log('Compiling extension to executable...')
    try {
      const result = await compileExtension({
        extensionPath,
        outfile: options.outfile,
        minify: options.minify,
      })

      console.log(`\nExecutable created: ${result.outfile}`)
      console.log(`Run it with: ${result.outfile}`)
    } catch (error: any) {
      console.error('Compile failed:', error.message)
      process.exit(1)
    }
  })

cli
  .command('release [path]', 'Build and publish extension to GitHub releases')
  .option('--single', 'Only compile for the current platform')
  .action(async (extensionPath: string, options: { single?: boolean }) => {
    extensionPath = path.resolve(extensionPath || process.cwd())

    console.log('Building and releasing extension...')
    try {
      const result = await releaseExtension({
        extensionPath,
        single: options.single,
      })

      console.log(`\nRelease complete: ${result.tag}`)
      console.log(`Uploaded ${result.uploadedFiles.length} binaries`)
    } catch (error: any) {
      console.error('Release failed:', error.message)
      process.exit(1)
    }
  })

cli
  .command('pr <prNumber>', 'Download extension from a GitHub PR in Raycast extensions repo. To test it with Termcast')
  .action(async (prNumber: string) => {
    try {
      // Parse PR number from URL if provided
      let parsedPrNumber = prNumber
      const urlMatch = prNumber.match(
        /github\.com\/raycast\/extensions\/pull\/(\d+)/,
      )
      if (urlMatch) {
        parsedPrNumber = urlMatch[1]
      }

      console.log(`Fetching PR #${parsedPrNumber} from GitHub...`)

      // Fetch PR data from GitHub API
      const prResponse = await fetch(
        `https://api.github.com/repos/raycast/extensions/pulls/${parsedPrNumber}`,
      )

      if (!prResponse.ok) {
        console.error(
          `Failed to fetch PR #${parsedPrNumber}: ${prResponse.statusText}`,
        )
        process.exit(1)
      }

      const prData = await prResponse.json()
      const prAuthor = prData.head.user.login
      const branch = prData.head.ref
      const forkUrl = prData.head.repo.clone_url

      console.log(`PR Author: ${prAuthor}`)
      console.log(`Branch: ${branch}`)

      // Extract extension name from branch name (usually format: "ext/extension-name")
      let extensionName = ''
      if (branch.startsWith('ext/')) {
        extensionName = branch.substring(4) // Remove "ext/" prefix
      } else {
        // Fallback to last part of branch name
        const branchParts = branch.split('/')
        extensionName = branchParts[branchParts.length - 1]
      }

      console.log(`Extension name: ${extensionName}`)

      // Sanitize branch name for directory name (remove special characters)
      const sanitizedBranch = branch.replace(/[\/\\:*?"<>|]/g, '-')

      // Create directory for PR
      const homeDir = process.env.HOME || process.env.USERPROFILE || ''
      const prsDir = path.join(homeDir, '.termcast', 'prs')
      const prDir = path.join(
        prsDir,
        `${prAuthor}-${sanitizedBranch}-${parsedPrNumber}`,
      )

      // Create directories if they don't exist
      if (!fs.existsSync(prsDir)) {
        fs.mkdirSync(prsDir, { recursive: true })
      }

      // Clean up existing directory if it exists
      if (fs.existsSync(prDir)) {
        console.log(`Removing existing directory: ${prDir}`)
        fs.rmSync(prDir, { recursive: true, force: true })
      }

      // Clone the extension using sparse-checkout
      console.log(`\nCloning extension from ${forkUrl}...`)

      // Step 1: Clone with sparse-checkout
      const dirName = path.basename(prDir)
      const cloneCmd = `git clone -n --depth=1 --filter=tree:0 -b "${branch}" "${forkUrl}" "${dirName}"`
      console.log(`Running: ${cloneCmd}`)
      try {
        execSync(cloneCmd, {
          cwd: prsDir,
          stdio: 'inherit',
        })
      } catch (error) {
        console.error(`Failed to clone repository`)
        process.exit(1)
      }

      // Step 2: Set up sparse-checkout
      const sparseCmd = `git sparse-checkout set --no-cone "extensions/${extensionName}"`
      console.log(`Running: ${sparseCmd}`)
      try {
        execSync(sparseCmd, {
          cwd: prDir,
          stdio: 'inherit',
        })
      } catch (error) {
        console.error(`Failed to set sparse-checkout`)
        process.exit(1)
      }

      // Step 3: Checkout the files
      const checkoutCmd = 'git checkout'
      console.log(`Running: ${checkoutCmd}`)
      try {
        execSync(checkoutCmd, {
          cwd: prDir,
          stdio: 'inherit',
        })
      } catch (error) {
        console.error(`Failed to checkout files`)
        process.exit(1)
      }

      // Navigate to the extension directory
      const extensionPath = path.join(prDir, 'extensions', extensionName)

      if (!fs.existsSync(extensionPath)) {
        console.error(`Extension directory not found: ${extensionPath}`)
        console.log('Available extensions:')
        const extensionsDir = path.join(prDir, 'extensions')
        if (fs.existsSync(extensionsDir)) {
          const dirs = fs.readdirSync(extensionsDir)
          dirs.forEach((dir) => console.log(`  - ${dir}`))
        }
        process.exit(1)
      }

      // Install dependencies
      console.log(`\nInstalling dependencies...`)
      execSync('npm install', {
        cwd: extensionPath,
        stdio: 'inherit',
      })

      console.log(`\n✅ Extension downloaded successfully!`)
      console.log(`📁 Path: ${extensionPath}`)
      process.exit(0)
    } catch (error) {
      console.error('Error downloading PR:', error)
      process.exit(1)
    }
  })

cli
  .command('raycast-search <query>', 'Search for extensions in the Raycast store')
  .option('-n, --limit <number>', 'Number of results to show', { default: '10' })
  .action(async (query: string, options: { limit: string }) => {
    try {
      const limit = parseInt(options.limit, 10)
      const result = await searchStoreListings({ query, perPage: limit })

      if (result.data.length === 0) {
        console.log(`No extensions found for "${query}"`)
        process.exit(0)
      }

      console.log(`Found ${result.data.length} extensions for "${query}":\n`)

      for (const ext of result.data) {
        const downloads = ext.download_count.toLocaleString()
        const commands = ext.commands.map((c) => c.name).join(', ')
        console.log(`  ${ext.name}`)
        console.log(`    Path: extensions/${ext.relative_path.replace('extensions/', '')}`)
        console.log(`    Downloads: ${downloads}`)
        console.log(`    Commands: ${commands || 'none'}`)
        console.log(`    Description: ${ext.description.slice(0, 100)}${ext.description.length > 100 ? '...' : ''}`)
        console.log()
      }

      console.log(`Download with: termcast download <extension-name>`)
      process.exit(0)
    } catch (error: any) {
      console.error('Search failed:', error.message)
      process.exit(1)
    }
  })

cli
  .command('download <extensionName>', 'Download extension from Raycast extensions repo')
  .option('-o, --output <path>', 'Output directory', { default: '.' })
  .option('--no-dir', 'Put files directly in output directory instead of creating extension subdirectory')
  .action(async (extensionName: string, options: { output: string; dir: boolean }) => {
    try {
      const destPath = path.resolve(options.output)
      // When --no-dir is passed, dir is false; put files directly in destPath
      const extensionDir = options.dir ? path.join(destPath, extensionName) : destPath
      const tempCloneDir = path.join(destPath, `.tmp-${extensionName}-${Date.now()}`)

      console.log(`Downloading extension '${extensionName}' from raycast/extensions...`)

      if (options.dir && fs.existsSync(extensionDir)) {
        console.log(`Removing existing directory: ${extensionDir}`)
        fs.rmSync(extensionDir, { recursive: true, force: true })
      }

      fs.mkdirSync(destPath, { recursive: true })

      const repoUrl = 'https://github.com/raycast/extensions.git'
      const cloneDirName = path.basename(tempCloneDir)
      const cloneCmd = `git clone -n --depth=1 --filter=tree:0 "${repoUrl}" "${cloneDirName}"`
      console.log(`Running: ${cloneCmd}`)
      try {
        execSync(cloneCmd, {
          cwd: destPath,
          stdio: 'inherit',
        })
      } catch (error) {
        console.error(`Failed to clone repository`)
        process.exit(1)
      }

      const sparseCmd = `git sparse-checkout set --no-cone "extensions/${extensionName}"`
      console.log(`Running: ${sparseCmd}`)
      try {
        execSync(sparseCmd, {
          cwd: tempCloneDir,
          stdio: 'inherit',
        })
      } catch (error) {
        console.error(`Failed to set sparse-checkout`)
        fs.rmSync(tempCloneDir, { recursive: true, force: true })
        process.exit(1)
      }

      const checkoutCmd = 'git checkout'
      console.log(`Running: ${checkoutCmd}`)
      try {
        execSync(checkoutCmd, {
          cwd: tempCloneDir,
          stdio: 'inherit',
        })
      } catch (error) {
        console.error(`Failed to checkout files`)
        fs.rmSync(tempCloneDir, { recursive: true, force: true })
        process.exit(1)
      }

      const extensionPath = path.join(tempCloneDir, 'extensions', extensionName)

      if (!fs.existsSync(extensionPath)) {
        console.error(`Extension '${extensionName}' not found in raycast/extensions repo`)
        fs.rmSync(tempCloneDir, { recursive: true, force: true })
        process.exit(1)
      }

      // Move files to final destination
      if (options.dir) {
        fs.mkdirSync(extensionDir, { recursive: true })
      }
      const filesToMove = fs.readdirSync(extensionPath)
      for (const file of filesToMove) {
        const src = path.join(extensionPath, file)
        const dest = path.join(extensionDir, file)
        fs.renameSync(src, dest)
      }

      // Clean up temp clone directory
      fs.rmSync(tempCloneDir, { recursive: true, force: true })

      console.log(`\nInstalling dependencies...`)
      execSync('npm install', {
        cwd: extensionDir,
        stdio: 'inherit',
      })

      console.log(`\n✅ Extension downloaded successfully!`)
      console.log(`📁 Path: ${extensionDir}`)
      process.exit(0)
    } catch (error) {
      console.error('Error downloading extension:', error)
      process.exit(1)
    }
  })

cli.command('', 'List and run installed extensions').action(async () => {
  await runHomeCommand()
})

cli.help()
cli.version('0.1.0')

cli.parse()
