#!/usr/bin/env bun

// CRITICAL: Import react-refresh-init FIRST before anything that imports @opentui/react
// This ensures the devtools hook exists before the reconciler calls injectIntoDevTools()
import './extensions/react-refresh-init'

import fs from 'node:fs'
import path from 'node:path'
import { execSync, spawn } from 'node:child_process'
import { goke } from 'goke'
import { getWatcher } from './watcher'
import { buildExtensionCommands } from './build'
import { logger } from './logger'
import { installExtension } from './utils'
import { searchStoreListings } from './store-api/search'
import './globals'
import { startDevMode, triggerRebuild } from './extensions/dev'
import { compileExtension } from './compile'
import { releaseExtension } from './release'
import { buildApp } from './app'
import { themeNames } from './themes'
import { runHomeCommand } from './extensions/home'
import { showToast, Toast } from './apis/toast'
import packageJson from '../package.json'

const cli = goke('termcast')


// TODO: re-enable auto-update check once install script temp dir issue is fixed
// checkForUpdates()

// Shared dev mode action used by both 'dev' and '' commands
async function runDevAction(rawExtensionPath?: string) {
  try {
    // Check if the provided arg looks like a path (contains / or . or is existing dir)
    const looksLikePath =
      rawExtensionPath &&
      (rawExtensionPath.includes('/') ||
        rawExtensionPath.startsWith('.') ||
        fs.existsSync(rawExtensionPath))
    const extensionPath = path.resolve(
      looksLikePath ? rawExtensionPath : process.cwd(),
    )
    let isBuilding = false

    // Start dev mode with initial render
    // Skip args up to and including "dev" subcommand, plus path if it looks like one
    const devIndex = process.argv.findIndex((arg) => arg === 'dev')
    const skipArgv = devIndex === -1 ? 0 : devIndex - 1 + (looksLikePath ? 1 : 0)
    await startDevMode({ extensionPath, skipArgv })

    logger.log(`dev mode started`)
    // Only watch if running in a TTY (interactive terminal)
    if (!process.stdout.isTTY) {
      console.log('Not running in interactive terminal, watching disabled')
      return
    }

    console.log('\nWatching for file changes...')

    // Watch entire extension directory using @parcel/watcher
    // Single source of truth for ignored patterns
    const IGNORED_DIRS = [
      'node_modules',
      '.termcast-bundle',
      '.git',
      '.build', // Swift build output
      '.cache',
      'tmp',
      '.tmp',
      'dist',
      'build',
    ]
    const IGNORED_EXTENSIONS = ['.log', '.db', '.sqlite']

    // Glob patterns for @parcel/watcher (matched against relative paths using micromatch)
    const ignoredPatterns = [
      ...IGNORED_DIRS.map((dir) => `**/${dir}/**`),
      ...IGNORED_EXTENSIONS.map((ext) => `**/*${ext}`),
      // SQLite creates .db-wal and .db-shm alongside .db
      '**/*.db-*',
      '**/*.sqlite-*',
    ]

    // Backup filter for files that should never trigger rebuild
    // This catches cases where @parcel/watcher ignore doesn't work as expected
    const shouldIgnoreFile = (filePath: string): boolean => {
      const relativePath = path.relative(extensionPath, filePath)
      // Ignore files outside the extension directory
      if (relativePath.startsWith('..')) {
        return true
      }
      // Check if path contains any ignored directory
      const hasIgnoredDir = IGNORED_DIRS.some(
        (dir) =>
          relativePath.includes(`/${dir}/`) ||
          relativePath.startsWith(`${dir}/`),
      )
      if (hasIgnoredDir) {
        return true
      }
      // Check if file has ignored extension
      if (IGNORED_EXTENSIONS.some((ext) => relativePath.endsWith(ext))) {
        return true
      }
      // Also catch .db-* and .sqlite-* patterns
      if (/\.db-|\.sqlite-/.test(relativePath)) {
        return true
      }
      return false
    }

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

    const subscription = await getWatcher().subscribe(
      extensionPath,
      (err, events) => {
        if (err) {
          logger.error('Watcher error:', err)
          return
        }

        // Filter out events for files that should be ignored
        const relevantEvents = events.filter(
          (event) => !shouldIgnoreFile(event.path),
        )

        if (relevantEvents.length > 0) {
          rebuild(relevantEvents[0].path)
        }
      },
      { ignore: ignoredPatterns },
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
}

// Default command (no args) is an alias for dev
cli.command('', 'Run dev mode in current directory').action(async () => {
  await runDevAction()
})

cli
  .command('dev [path]', 'Run the extension in the current working directory')
  .action(async (rawExtensionPath) => {
    await runDevAction(rawExtensionPath)
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
      process.exit(0)
    } catch (error: any) {
      console.error('Build failed:', error.message)
      process.exit(1)
    }
  })

cli
  .command('compile [path]', 'Compile the extension to a standalone executable')
  .option('-o, --outfile <path>', 'Output file path for the executable')
  .option('--minify', 'Minify the output')
  .option('--entry <file>', 'Custom entry file (instead of auto-generated one)')
  .action(async (extensionPath, options) => {
    extensionPath = path.resolve(extensionPath || process.cwd())

    console.log('Compiling extension to executable...')
    try {
      const result = await compileExtension({
        extensionPath,
        outfile: options.outfile,
        minify: options.minify,
        entry: options.entry,
      })

      console.log(`\nExecutable created: ${result.outfile}`)
      console.log(`Run it with: ${result.outfile}`)
      process.exit(0)
    } catch (error: any) {
      console.error('Compile failed:', error.message)
      process.exit(1)
    }
  })

cli
  .command('release [path]', 'Build and publish extension to GitHub releases')
  .option('--single', 'Only compile for the current platform')
  .option('--entry <file>', 'Custom entry file (instead of auto-generated one)')
  .action(async (extensionPath: string | undefined, options: { single?: boolean; entry?: string }) => {
    const resolvedPath = path.resolve(extensionPath || process.cwd())

    console.log('Building and releasing extension...')
    try {
      const result = await releaseExtension({
        extensionPath: resolvedPath,
        single: options.single,
        entry: options.entry,
      })

      console.log(`\nRelease complete: ${result.tag}`)
      console.log(`Uploaded ${result.uploadedFiles.length} binaries`)
      process.exit(0)
    } catch (error: any) {
      console.error('Release failed:', error.message)
      process.exit(1)
    }
  })

cli
  .command(
    'app build [path]',
    'Build a standalone desktop app from a termcast extension (macOS .app, Linux folder, or Windows folder)',
  )
  .option('--name <name>', 'App display name (default: package.json title)')
  .option('--icon <path>', 'Custom icon PNG path (default: extension icon or bundled default)')
  .option('--bundle-id <id>', 'macOS bundle identifier (default: com.termcast.{name})')
  .option('--release', 'Upload the app zip to the latest GitHub release')
  .option('--entry <file>', 'Custom entry file (instead of auto-generated one)')
  .option('--platform <platform>', 'Target platform: darwin, linux, or win32 (default: current OS)')
  .option('--arch <arch>', 'Target architecture: arm64 or x64 (default: current machine)')
  .option('--no-installer', 'Skip NSIS installer generation on Windows')
  .option('--font <family>', 'Font family name (e.g. "Inter Mono", "Fira Code")')
  .option('--font-dir <path>', 'Directory of .ttf/.otf files to bundle (auto-detects fonts/ in extension)')
  .option('--font-size <size>', 'Font size in points (default: 14)')
  .option('--line-height <height>', 'Line height multiplier (default: 1.2)')
  .option('--theme <name>', 'Default theme name (default: nerv)')
  .action(
    async (
      extensionPath: string | undefined,
      options: {
        name?: string
        icon?: string
        bundleId?: string
        release?: boolean
        entry?: string
        platform?: string
        arch?: string
        installer?: boolean
        font?: string
        fontDir?: string
        fontSize?: string
        lineHeight?: string
        theme?: string
        // `--no-installer` adds noInstaller to the inferred type
        noInstaller?: boolean
      },
    ) => {
      extensionPath = path.resolve(extensionPath || process.cwd())

      if (options.arch && options.arch !== 'arm64' && options.arch !== 'x64') {
        console.error(`Invalid --arch "${options.arch}". Must be "arm64" or "x64".`)
        process.exit(1)
      }
      if (options.platform && options.platform !== 'darwin' && options.platform !== 'linux' && options.platform !== 'win32') {
        console.error(`Invalid --platform "${options.platform}". Must be "darwin", "linux", or "win32".`)
        process.exit(1)
      }

      const fontSize = options.fontSize ? parseFloat(options.fontSize) : undefined
      if (fontSize !== undefined && !Number.isFinite(fontSize)) {
        console.error(`Invalid --font-size "${options.fontSize}". Must be a number.`)
        process.exit(1)
      }
      const lineHeight = options.lineHeight ? parseFloat(options.lineHeight) : undefined
      if (lineHeight !== undefined && !Number.isFinite(lineHeight)) {
        console.error(`Invalid --line-height "${options.lineHeight}". Must be a number.`)
        process.exit(1)
      }

      if (options.theme && !themeNames.includes(options.theme)) {
        console.error(`Invalid --theme "${options.theme}". Available themes: ${themeNames.join(', ')}`)
        process.exit(1)
      }

      try {
        const result = await buildApp({
          extensionPath,
          name: options.name,
          icon: options.icon,
          bundleId: options.bundleId,
          release: options.release,
          entry: options.entry,
          platform: options.platform as 'darwin' | 'linux' | 'win32' | undefined,
          arch: options.arch as 'arm64' | 'x64' | undefined,
          // goke parses --no-installer as installer:false
          noInstaller: options.installer === false,
          fontFamily: options.font,
          fontDir: options.fontDir,
          fontSize,
          lineHeight,
          theme: options.theme,
        })

        const resolvedPlatform = options.platform || process.platform
        console.log(`\nApp built: ${result.appPath}`)
        if (resolvedPlatform === 'win32') {
          if (result.installerPath) {
            console.log(`Installer: ${result.installerPath}`)
            console.log(`Distribute the installer .exe. Users double-click to install.`)
          } else {
            console.log(`Distribute the folder as a zip. Users run: ${result.appName}.exe`)
          }
        } else {
          console.log(`Run it with: open "${result.appPath}"`)
        }
        process.exit(0)
      } catch (error) {
        console.error('App build failed:', error instanceof Error ? error.message : error)
        process.exit(1)
      }
    },
  )

cli
  .command(
    'raycast-pr <prNumber>',
    'Download extension from a GitHub PR in Raycast extensions repo. To test it with Termcast',
  )
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
        if (prResponse.status === 403) {
          const rateLimitRemaining = prResponse.headers.get(
            'x-ratelimit-remaining',
          )
          if (rateLimitRemaining === '0') {
            const resetTime = prResponse.headers.get('x-ratelimit-reset')
            const resetDate = resetTime
              ? new Date(parseInt(resetTime) * 1000).toLocaleTimeString()
              : 'soon'
            console.error(
              `GitHub API rate limit exceeded. Resets at ${resetDate}`,
            )
          } else {
            console.error(`Access forbidden for PR #${parsedPrNumber}`)
          }
        } else if (prResponse.status === 404) {
          console.error(`PR #${parsedPrNumber} not found`)
        } else {
          console.error(
            `Failed to fetch PR #${parsedPrNumber}: ${prResponse.status} ${prResponse.statusText}`,
          )
        }
        process.exit(1)
      }

      const prData = (await prResponse.json()) as {
        head: { user: { login: string }; ref: string; repo: { clone_url: string } }
      }
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
  .command(
    'raycast-pr-diff <prNumber>',
    'Show the diff of a PR in Raycast extensions repo',
  )
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

      console.error(`Fetching diff for PR #${parsedPrNumber}...`)

      // Fetch diff directly from GitHub API
      const response = await fetch(
        `https://api.github.com/repos/raycast/extensions/pulls/${parsedPrNumber}`,
        {
          headers: {
            Accept: 'application/vnd.github.v3.diff',
          },
        },
      )

      if (!response.ok) {
        if (response.status === 403) {
          const rateLimitRemaining = response.headers.get(
            'x-ratelimit-remaining',
          )
          if (rateLimitRemaining === '0') {
            const resetTime = response.headers.get('x-ratelimit-reset')
            const resetDate = resetTime
              ? new Date(parseInt(resetTime) * 1000).toLocaleTimeString()
              : 'soon'
            console.error(
              `GitHub API rate limit exceeded. Resets at ${resetDate}`,
            )
          } else {
            console.error(`Access forbidden for PR #${parsedPrNumber}`)
          }
        } else if (response.status === 404) {
          console.error(`PR #${parsedPrNumber} not found`)
        } else {
          console.error(
            `Failed to fetch PR #${parsedPrNumber}: ${response.status} ${response.statusText}`,
          )
        }
        process.exit(1)
      }

      const diff = await response.text()
      console.log(diff)
      process.exit(0)
    } catch (error) {
      console.error('Error fetching PR diff:', error)
      process.exit(1)
    }
  })

cli
  .command(
    'raycast-search <query>',
    'Search for extensions in the Raycast store',
  )
  .option('-n, --limit [number]', 'Number of results to show (default: 10)')
  .action(async (query, options) => {
    try {
      const limit = parseInt(options.limit || '10', 10)
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
        console.log(
          `    Path: extensions/${ext.relative_path.replace('extensions/', '')}`,
        )
        console.log(`    Downloads: ${downloads}`)
        console.log(`    Commands: ${commands || 'none'}`)
        console.log(
          `    Description: ${ext.description.slice(0, 100)}${ext.description.length > 100 ? '...' : ''}`,
        )
        console.log()
      }

      console.log(`Download with: termcast raycast-download <extension-name>`)
      process.exit(0)
    } catch (error: any) {
      console.error('Search failed:', error.message)
      process.exit(1)
    }
  })

cli
  .command(
    'raycast-download <extensionName>',
    'Download extension from Raycast extensions repo',
  )
  .option('-o, --output [path]', 'Output directory (default: .)')
  .option(
    '--no-dir',
    'Put files directly in output directory instead of creating extension subdirectory',
  )
  .action(async (extensionName, options) => {
      try {
        const destPath = path.resolve(options.output || '.')
        // When --no-dir is passed, noDir is true; put files directly in destPath
        const useSubdir = !options.noDir
        const extensionDir = useSubdir
          ? path.join(destPath, extensionName)
          : destPath
        const tempCloneDir = path.join(
          destPath,
          `.tmp-${extensionName}-${Date.now()}`,
        )

        console.log(
          `Downloading extension '${extensionName}' from raycast/extensions...`,
        )

        if (useSubdir && fs.existsSync(extensionDir)) {
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

        const extensionPath = path.join(
          tempCloneDir,
          'extensions',
          extensionName,
        )

        if (!fs.existsSync(extensionPath)) {
          console.error(
            `Extension '${extensionName}' not found in raycast/extensions repo`,
          )
          fs.rmSync(tempCloneDir, { recursive: true, force: true })
          process.exit(1)
        }

        // Move files to final destination
        if (useSubdir) {
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
    },
  )

cli
  .command('new [name]', 'Create a new termcast extension')
  .action(async (name: string | undefined) => {
    if (!name) {
      console.log('Usage: termcast new <extension-name>\n')
      console.log('Create a new termcast extension with the given name.\n')
      console.log('Example:')
      console.log('  termcast new my-extension')
      console.log('  cd my-extension')
      console.log('  termcast dev')
      process.exit(0)
    }

    try {
      const targetDir = path.resolve(name)

      if (fs.existsSync(targetDir)) {
        console.error(`Directory "${name}" already exists`)
        process.exit(1)
      }

      console.log(`Creating new extension "${name}"...`)

      // Download template from GitHub
      const templateUrl =
        'https://github.com/remorses/termcast/archive/refs/heads/main.zip'

      console.log('Downloading template...')
      const response = await fetch(templateUrl)
      if (!response.ok) {
        throw new Error(`Failed to download template: ${response.status}`)
      }

      console.log('Extracting...')
      const JSZip = (await import('jszip')).default
      const zip = await JSZip.loadAsync(await response.arrayBuffer())

      // Find the template folder in the zip
      const templatePrefix = 'termcast-main/termcast/template/'
      const templateFiles = Object.keys(zip.files).filter((name) =>
        name.startsWith(templatePrefix),
      )

      if (templateFiles.length === 0) {
        throw new Error('Template not found in downloaded archive')
      }

      // Extract template files to target directory
      fs.mkdirSync(targetDir, { recursive: true })

      for (const filePath of templateFiles) {
        const relativePath = filePath.slice(templatePrefix.length)
        if (!relativePath) {
          continue
        }

        const targetPath = path.join(targetDir, relativePath)
        const zipEntry = zip.files[filePath]

        if (zipEntry.dir) {
          fs.mkdirSync(targetPath, { recursive: true })
        } else {
          fs.mkdirSync(path.dirname(targetPath), { recursive: true })
          const content = await zipEntry.async('nodebuffer')
          fs.writeFileSync(targetPath, content)
        }
      }

      // Replace placeholders in package.json
      const packageJsonPath = path.join(targetDir, 'package.json')
      let packageJsonContent = fs.readFileSync(packageJsonPath, 'utf-8')
      const title = name
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
      packageJsonContent = packageJsonContent
        .replace(/\{\{name\}\}/g, name)
        .replace(/\{\{title\}\}/g, title)
      fs.writeFileSync(packageJsonPath, packageJsonContent)

      console.log('\nInstalling dependencies...')
      execSync('bun install', { cwd: targetDir, stdio: 'inherit' })

      console.log(`\n✅ Created "${name}" successfully!`)
      console.log(`\nNext steps:`)
      console.log(`  cd ${name}`)
      console.log(`  termcast dev`)
      process.exit(0)
    } catch (error: any) {
      console.error('Failed to create extension:', error.message)
      process.exit(1)
    }
  })

cli
  .command('legacy-raycast-store', 'List and run installed extensions')
  .action(async () => {
    await runHomeCommand()
  })



cli.help()
cli.version('0.1.0')

cli.parse()
