import fs from 'node:fs'
import path from 'node:path'
import type { BunPlugin } from 'bun'
import { logger } from './logger'
import { getCommandsWithFiles, CommandWithFile } from './package-json'
import * as termcastApi from '@termcast/cli'
import * as opentuiReact from '@opentui/react'
import * as opentuiCore from '@opentui/core'
import * as react from 'react'

const GLOBALS_NAMESPACE = 'globals'

const aliasPlugin: BunPlugin = {
    name: 'alias-raycast-to-termcast',
    async setup(build) {
        // Import packages once at setup time
        const packages = [
            {
                path: '@termcast/cli',
                module: termcastApi,
                globalName: 'termcastApi',
            },
            {
                path: '@opentui/react',
                module: opentuiReact,
                globalName: 'opentuiReact',
            },
            {
                path: '@opentui/core',
                module: opentuiCore,
                globalName: 'opentuiCore',
            },
            {
                path: 'react',
                module: react,
                globalName: 'react',
            },
        ]

        // Alias @raycast/api to @termcast/cli using namespace
        build.onResolve({ filter: /@raycast\/api/ }, () => {
            logger.log('Resolving @raycast/api to @termcast/cli')
            return {
                path: '@termcast/cli',
                namespace: GLOBALS_NAMESPACE,
            }
        })

        // Resolve external packages to globals namespace
        build.onResolve({ filter: /^@termcast\/cli/ }, (args) => {
            return {
                path: '@termcast/cli',
                namespace: GLOBALS_NAMESPACE,
            }
        })

        build.onResolve({ filter: /^@opentui\/react/ }, (args) => {
            // Handle @opentui/react/jsx-dev-runtime specifically
            if (args.path.includes('jsx')) {
                return {
                    path: 'react/jsx-runtime',
                    namespace: GLOBALS_NAMESPACE,
                }
            }
            return {
                path: '@opentui/react',
                namespace: GLOBALS_NAMESPACE,
            }
        })

        build.onResolve({ filter: /^@opentui\/core/ }, () => {
            return {
                path: '@opentui/core',
                namespace: GLOBALS_NAMESPACE,
            }
        })

        build.onResolve({ filter: /^react\/jsx-runtime/ }, () => {
            return {
                path: 'react/jsx-runtime',
                namespace: GLOBALS_NAMESPACE,
            }
        })

        build.onResolve({ filter: /^react($|\/|$)/ }, (args) => {
            if (args.path === 'react' || args.path === 'react/') {
                return {
                    path: 'react',
                    namespace: GLOBALS_NAMESPACE,
                }
            }
            // For jsx-dev-runtime
            if (args.path.includes('jsx')) {
                return {
                    path: 'react/jsx-runtime',
                    namespace: GLOBALS_NAMESPACE,
                }
            }
            return null
        })

        // Handle loading from globals namespace
        build.onLoad(
            { filter: /.*/, namespace: GLOBALS_NAMESPACE },
            async (args) => {
                // Handle regular packages
                const pkg = packages.find((p) => p.path === args.path)
                if (pkg) {
                    const exports: string[] = []

                    for (const key in pkg.module) {
                        if (key === 'default') {
                            // Special handling for react default export
                            if (pkg.path === 'react') {
                                exports.push(
                                    `export default /* @__PURE__ */ globalThis.${pkg.globalName};`,
                                )
                            } else {
                                exports.push(
                                    `export default /* @__PURE__ */ globalThis.${pkg.globalName}.default;`,
                                )
                            }
                        } else {
                            exports.push(
                                `export const ${key} = /* @__PURE__ */ globalThis.${pkg.globalName}.${key};`,
                            )
                        }
                    }

                    return {
                        contents: exports.join('\n'),
                        loader: 'js',
                        pure: true,
                    }
                }

                // Special handling for react/jsx-runtime
                if (args.path === 'react/jsx-runtime') {
                    const jsxRuntime = await import('react/jsx-runtime')
                    const jsxDevRuntime = await import('react/jsx-dev-runtime')
                    const exports: string[] = []

                    // Export from jsx-runtime
                    for (const key in jsxRuntime) {
                        if (key === 'default') {
                            // Skip default export for jsx-runtime
                            continue
                        }
                        exports.push(
                            `export const ${key} = /* @__PURE__ */ globalThis.reactJsxRuntime.${key};`,
                        )
                    }

                    // Also export jsxDEV from jsx-dev-runtime
                    exports.push(
                        `export const jsxDEV = /* @__PURE__ */ (globalThis.reactJsxRuntime.jsxDEV || globalThis.reactJsxRuntime.jsx);`,
                    )

                    return {
                        contents: exports.join('\n'),
                        loader: 'js',
                        pure: true,
                    }
                }

                logger.error(`matched a file that had no handling for exports plugin ${args.path}`)
                return {
                    contents: 'export {}',
                    loader: 'js',
                    pure: true,
                }
            },
        )
    },
}

interface BundledCommand extends CommandWithFile {
    bundledPath: string
}

export interface BuildResult {
    commands: BundledCommand[]
    bundleDir: string
}

export async function buildExtensionCommands({
    extensionPath,
}: {
    extensionPath: string
}): Promise<BuildResult> {
    const resolvedPath = path.resolve(extensionPath)
    const bundleDir = path.join(resolvedPath, '.termcast-bundle')

    // Ensure bundle directory exists
    if (!fs.existsSync(bundleDir)) {
        fs.mkdirSync(bundleDir, { recursive: true })
    }

    const commandsData = getCommandsWithFiles({
        packageJsonPath: path.join(resolvedPath, 'package.json'),
    })

    // Filter existing command files as entrypoints
    const entrypoints = commandsData.commands
        .filter((cmd) => cmd.exists)
        .map((cmd) => cmd.filePath)

    if (entrypoints.length === 0) {
        throw new Error('No command files found to build')
    }

    logger.log(`Building ${entrypoints.length} commands...`)

    const result = await Bun.build({
        entrypoints,
        outdir: bundleDir,
        target: 'node',
        format: 'cjs',
        // external: [],
        plugins: [aliasPlugin],
        naming: '[name].js',
        throw: false,
    })

    if (!result.success) {
        const errorMessage = result.logs
            .map((log: any) => log.message || log)
            .join('\n')
        throw new Error(`Build failed: ${errorMessage}`)
    }

    // Map outputs back to commands
    const bundledCommands: BundledCommand[] = commandsData.commands.map(
        (command) => {
            if (!command.exists) {
                return {
                    ...command,
                    bundledPath: '',
                }
            }

            // Find the corresponding output for this command
            const outputFileName = `${command.name}.js`
            const output = result.outputs.find((out) => {
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
        },
    )

    logger.log(`Successfully built ${result.outputs.length} files`)

    return {
        commands: bundledCommands,
        bundleDir,
    }
}
