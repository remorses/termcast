import fs from 'node:fs'
import path from 'node:path'
import { execSync, spawn } from 'node:child_process'
import { cac } from 'cac'
import chokidar from 'chokidar'
import { buildExtensionCommands } from './build'
import { logger } from './logger'
import { installExtension } from './utils'
import './globals'
import { startDevMode, triggerRebuild } from './extensions/dev'
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
      latestRelease.tag_name?.replace('@termcast/cli@', '') ||
      latestRelease.tag_name?.replace('v', '')

    // Compare versions
    if (latestVersion && latestVersion !== currentVersion) {
      // Run the install script in background
      spawn('bash', ['-c', 'curl -sf https://termcast.app/install | bash'], {
        detached: true,
        stdio: 'ignore',
      }).unref()

      // Show toast notification
      await showToast({
        title: 'Update available',
        message: `Restart to use the new version ${latestVersion}`,
        style: Toast.Style.Success,
      })
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
  .action(async (extensionPath, options) => {
    try {
      extensionPath = path.resolve(extensionPath || process.cwd())
      let isBuilding = false

      // Start dev mode with initial render
      await startDevMode({ extensionPath })

      logger.log(`dev mode started`)
      // Only watch if running in a TTY (interactive terminal)
      if (!process.stdout.isTTY) {
        console.log('Not running in interactive terminal, watching disabled')
        return
      }

      console.log('\nWatching for file changes...')

      // Watch entire extension directory
      const watcher = chokidar.watch(extensionPath, {
        persistent: true,
        ignoreInitial: true,
        awaitWriteFinish: {
          stabilityThreshold: 300,
          pollInterval: 100,
        },
      })

      const ignoredPatterns = [
        'node_modules',
        '.termcast-bundle',
        '.git',
        'app.log',
        'dist',
        'build',
      ]

      const shouldIgnore = (filePath: string) => {
        const relativePath = path.relative(extensionPath, filePath)
        return ignoredPatterns.some(
          (pattern) =>
            relativePath.includes(pattern) || filePath.endsWith('.log'),
        )
      }

      const rebuild = async (filePath: string) => {
        if (shouldIgnore(filePath)) {
          return
        }

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

      watcher
        .on('change', rebuild)
        .on('add', rebuild)
        .on('unlink', rebuild)
        .on('error', (error) => logger.error('Watcher error:', error))
    } catch (e) {
      logger.error(e)
      logger.log(`failed to start dev`, e)
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
  .command('pr <prNumber>', 'Download extension from a GitHub PR')
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

cli.command('', 'List and run installed extensions').action(async () => {
  await runHomeCommand()
})

cli.help()
cli.version('0.1.0')

cli.parse()
