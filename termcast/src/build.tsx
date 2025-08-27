import fs from 'node:fs'
import path from 'node:path'
import type { BunPlugin } from 'bun'
import { logger } from './logger'
import { getCommandsWithFiles, CommandWithFile } from './package-json'

const aliasPlugin: BunPlugin = {
    name: 'alias-raycast-to-termcast',
    setup(build) {
        build.onResolve({ filter: /@raycast\/api/ }, () => {
            logger.log('Resolving @raycast/api to @termcast/api')
            return {
                path: require.resolve('@termcast/api'),
                // external: true,
            }
        })

        // // Mark @termcast packages as external
        // build.onResolve({ filter: /^@termcast\// }, (args) => {
        //     return {
        //         path: require.resolve(args.path),
        //         external: true,
        //     }
        // })

        // // Mark @opentui packages as external
        // build.onResolve({ filter: /^@opentui\// }, (args) => {
        //     return {
        //         path: require.resolve(args.path),
        //         external: true,
        //     }
        // })

        // // Mark react and react subpaths as external
        // build.onResolve({ filter: /^react($|\/)/ }, (args) => {
        //     return {
        //         path: require.resolve(args.path),
        //         external: true,
        //     }
        // })
    },
}

interface BundledCommand extends CommandWithFile {
    bundledPath: string
}

interface BuildResult {
    commands: BundledCommand[]
    bundleDir: string
}

export async function buildExtensionCommands(
    extensionPath: string,
): Promise<BuildResult> {
    const resolvedPath = path.resolve(extensionPath)
    const bundleDir = path.join(resolvedPath, '.termcast-bundle')

    // Ensure bundle directory exists
    if (!fs.existsSync(bundleDir)) {
        fs.mkdirSync(bundleDir, { recursive: true })
    }

    const commandsData = getCommandsWithFiles(
        path.join(resolvedPath, 'package.json'),
    )

    // Filter existing command files as entrypoints
    const entrypoints = commandsData.commands
        .filter(cmd => cmd.exists)
        .map(cmd => cmd.filePath)

    if (entrypoints.length === 0) {
        throw new Error('No command files found to build')
    }

    logger.log(`Building ${entrypoints.length} commands...`)

    const result = await Bun.build({
        entrypoints,
        outdir: bundleDir,
        target: 'bun',
        format: 'esm',
        external: [],

        plugins: [aliasPlugin],
        naming: '[name].js',
    })

    if (!result.success) {
        const errorMessage = result.logs.map((log: any) => log.message || log).join('\n')
        throw new Error(`Build failed: ${errorMessage}`)
    }

    // Map outputs back to commands
    const bundledCommands: BundledCommand[] = commandsData.commands.map((command) => {
        if (!command.exists) {
            return {
                ...command,
                bundledPath: '',
            }
        }

        // Find the corresponding output for this command
        const outputFileName = `${command.name}.js`
        const output = result.outputs.find(out => {
            return path.basename(out.path) === outputFileName
        })

        if (output) {
            const bundledPath = path.join(bundleDir, outputFileName)
            logger.log(`Built ${command.name} -> ${bundledPath}`)
            return {
                ...command,
                bundledPath,
            }
        } else {
            throw new Error(`No output found for command: ${command.name}`)
        }
    })

    logger.log(`Successfully built ${result.outputs.length} files`)

    return {
        commands: bundledCommands,
        bundleDir,
    }
}
