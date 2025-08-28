import fs from 'node:fs'
import path from 'node:path'
import { cac } from 'cac'
import chokidar from 'chokidar'
import { buildExtensionCommands } from './build'
import { logger } from './logger'
import { installExtension } from './store'

const cli = cac('termcast')

cli.command('dev', 'Run the extension in the current working directory')
    .option('--path <path>', 'Path to the extension directory', {
        default: process.cwd(),
    })
    .action(async (options) => {
        await import('./globals')
        const extensionPath = path.resolve(options.path)
        let isBuilding = false

        // Dynamically import the UI module
        const { startDevMode, triggerRebuild } = await import('./dev-ui')

        // Start dev mode with initial render
        await startDevMode({ extensionPath })

        // Only watch if running in a TTY (interactive terminal)
        if (!process.stdout.isTTY) {
            console.log(
                'Not running in interactive terminal, watching disabled',
            )
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
            'dist',
            'build',
        ]

        const shouldIgnore = (filePath: string) => {
            const relativePath = path.relative(extensionPath, filePath)
            return ignoredPatterns.some(pattern => 
                relativePath.includes(pattern) || filePath.endsWith('.log')
            )
        }

        const rebuild = async (filePath: string) => {
            if (shouldIgnore(filePath)) {
                return
            }

            if (isBuilding) {
                console.log('Build already in progress, skipping...')
                return
            }

            isBuilding = true
            console.log('\nFile changed, rebuilding...')
            try {
                await triggerRebuild({ extensionPath })
                console.log('Rebuild complete')
            } catch (error: any) {
                console.error('Failed to trigger rebuild:', error.message)
            } finally {
                isBuilding = false
            }
        }

        watcher
            .on('change', rebuild)
            .on('add', rebuild)
            .on('unlink', rebuild)
            .on('error', (error) => logger.error('Watcher error:', error))
    })

cli.command('build', 'Build and install the extension to user store')
    .option('--path <path>', 'Path to the extension directory', {
        default: process.cwd(),
    })
    .action(async (options) => {
        const extensionPath = path.resolve(options.path)

        console.log('Building extension...')
        try {
            const buildResult = await buildExtensionCommands({ extensionPath })
            console.log(`Successfully built ${buildResult.commands.length} commands`)

            for (const cmd of buildResult.commands) {
                if (cmd.bundledPath) {
                    console.log(`  ✓ ${cmd.name}`)
                }
            }

            const packageJsonPath = path.join(extensionPath, 'package.json')
            const packageJson = JSON.parse(
                fs.readFileSync(packageJsonPath, 'utf-8')
            )
            const extensionName = packageJson.name || path.basename(extensionPath)
            installExtension({ extensionName, extensionSourcePath: extensionPath })
            console.log(`\nExtension installed to store as '${extensionName}'`)
        } catch (error: any) {
            console.error('Build failed:', error.message)
            process.exit(1)
        }
    })

cli.command('', 'List and run installed extensions')
    .action(async () => {
        const { runHomeCommand } = await import('./home-command')
        await runHomeCommand()
    })

cli.help()
cli.version('0.1.0')

cli.parse()
