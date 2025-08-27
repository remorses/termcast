import path from 'node:path'
import { cac } from 'cac'
import chokidar from 'chokidar'
import { buildExtensionCommands } from './build'

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
        const { renderExtensionCommands } = await import('./dev-ui')

        // Initial render
        await renderExtensionCommands(extensionPath)

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
            ignored: [
                '**/node_modules/**',
                '**/.termcast-bundle/**',
                '**/.git/**',
                '**/dist/**',
                '**/build/**',
            ],
            awaitWriteFinish: {
                stabilityThreshold: 300,
                pollInterval: 100,
            },
        })

        const rebuild = async () => {
            if (isBuilding) {
                console.log('Build already in progress, skipping...')
                return
            }

            isBuilding = true
            console.log('\nFile changed, rebuilding...')
            try {
                await renderExtensionCommands(extensionPath)
                console.log('Rebuild complete')
            } catch (error: any) {
                console.error('Build failed:', error.message)
            } finally {
                isBuilding = false
            }
        }

        watcher
            .on('change', rebuild)
            .on('add', rebuild)
            .on('unlink', rebuild)
            .on('error', (error) => console.error('Watcher error:', error))
    })

cli.command('build', 'Build the extension without watching')
    .option('--path <path>', 'Path to the extension directory', {
        default: process.cwd(),
    })
    .action(async (options) => {
        const extensionPath = path.resolve(options.path)

        console.log('Building extension...')
        try {
            const { commands } = await buildExtensionCommands(extensionPath)
            console.log(`Successfully built ${commands.length} commands`)

            for (const cmd of commands) {
                if (cmd.bundledPath) {
                    console.log(`  ✓ ${cmd.name}`)
                }
            }
        } catch (error: any) {
            console.error('Build failed:', error.message)
            process.exit(1)
        }
    })

cli.help()
cli.version('0.1.0')

cli.parse()
