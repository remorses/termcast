import fs from 'node:fs'
import path from 'node:path'
import type { BunPlugin } from 'bun'
import { logger } from './logger'
import { getCommandsWithFiles } from './package-json'
import { swiftLoaderPlugin } from './swift-loader'

// compile.tsx lives at termcast/src/compile.tsx, so __dirname is termcast/src/
const termcastRoot = path.resolve(__dirname, '..')

const raycastAliasPlugin: BunPlugin = {
  name: 'raycast-to-termcast',
  setup(build) {
    build.onResolve({ filter: /@raycast\/api/ }, () => ({
      path: path.join(__dirname, 'index.tsx'),
    }))
    build.onResolve({ filter: /@raycast\/utils/ }, () => ({
      path: require.resolve('@termcast/utils'),
    }))
    // termcast and termcast/* — resolve directly from the package source
    build.onResolve({ filter: /^termcast/ }, (args) => ({
      path: args.path === 'termcast'
        ? path.join(__dirname, 'index.tsx')
        : require.resolve(args.path, { paths: [termcastRoot] }),
    }))
    build.onResolve({ filter: /^react(\/|$)/ }, (args) => ({
      path: require.resolve(args.path),
    }))
  },
}

export function generateEntryCode({
  packageJson,
  commands,
}: {
  packageJson: import('./package-json').RaycastPackageJson
  commands: Array<{ name: string; bundledPath: string }>
}): string {
  // Generate lazy loaders instead of importing all commands at startup
  const commandsArray = commands
    .map(
      (cmd) => `    {
      name: ${JSON.stringify(cmd.name)},
      loadComponent: () => import(${JSON.stringify(cmd.bundledPath)}).then(m => m.default),
    }`,
    )
    .join(',\n')

  return `
async function main() {
  // Set state BEFORE importing commands so module-scope code (e.g. getPreferenceValues) can access extensionPackageJson
  const { useStore } = await import('termcast');
  const os = await import('node:os');
  const path = await import('node:path');

  const packageJson = ${JSON.stringify(packageJson)};
  const compiledExtensionPath = path.join(os.homedir(), '.termcast', 'compiled', packageJson.name);

  useStore.setState({
    extensionPath: compiledExtensionPath,
    extensionPackageJson: packageJson,
  });

  // Commands are lazily loaded when selected (not at startup)
  const compiledCommands = [
${commandsArray}
  ];

  const { startCompiledExtension } = await import('termcast/src/extensions/dev');

  await startCompiledExtension({
    packageJson,
    compiledCommands,
    skipArgv: 0,
  });
}

main().catch((err) => {
  console.error('Failed to start:', err);
  console.error('Stack:', err.stack);
  process.exit(1);
});
`
}

export interface CompileTarget {
  os: 'linux' | 'darwin' | 'win32'
  arch: 'arm64' | 'x64'
  abi?: 'musl'
  avx2?: false
}

export function targetToString(target: CompileTarget): string {
  return [
    'bun',
    target.os === 'win32' ? 'windows' : target.os,
    target.arch,
    target.avx2 === false ? 'baseline' : undefined,
    target.abi,
  ]
    .filter(Boolean)
    .join('-')
}

export function targetToFileSuffix(target: CompileTarget): string {
  const os =
    target.os === 'win32'
      ? 'windows'
      : target.os === 'darwin'
        ? 'darwin'
        : 'linux'
  const ext = target.os === 'win32' ? '.exe' : ''
  const parts = [os, target.arch]
  if (target.abi) {
    parts.push(target.abi)
  }
  if (target.avx2 === false) {
    parts.push('baseline')
  }
  return parts.join('-') + ext
}

export function getArchiveExtension(target: CompileTarget): string {
  return target.os === 'linux' ? '.tar.gz' : '.zip'
}

export const ALL_TARGETS: CompileTarget[] = [
  { os: 'linux', arch: 'arm64' },
  { os: 'linux', arch: 'x64' },
  // { os: 'linux', arch: 'x64', avx2: false },
  // { os: 'linux', arch: 'arm64', abi: 'musl' },
  // { os: 'linux', arch: 'x64', abi: 'musl' },
  // { os: 'linux', arch: 'x64', abi: 'musl', avx2: false },
  { os: 'darwin', arch: 'arm64' },
  { os: 'darwin', arch: 'x64' },
  // { os: 'darwin', arch: 'x64', avx2: false },
  { os: 'win32', arch: 'x64' },
  // { os: 'win32', arch: 'x64', avx2: false },
]

export function getCurrentTarget(): CompileTarget {
  const platform = process.platform as 'linux' | 'darwin' | 'win32'
  const arch = process.arch === 'arm64' ? 'arm64' : 'x64'
  return { os: platform, arch }
}

export interface CompileOptions {
  extensionPath: string
  outfile?: string
  minify?: boolean
  target?: CompileTarget
  version?: string
  /** Custom entry file. When set, this file is used as the entrypoint instead of
   *  the auto-generated one. Useful for CLIs that have their own subcommands and
   *  only launch termcast for one of them (e.g. a "tui" subcommand). The same
   *  raycast alias plugin and swift loader plugin are still applied. */
  entry?: string
}

export interface CompileResult {
  success: boolean
  outfile: string
}

export async function compileExtension({
  extensionPath,
  outfile,
  minify = false,
  target,
  version,
  entry,
}: CompileOptions): Promise<CompileResult> {
  const resolvedPath = path.resolve(extensionPath)

  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`Extension path does not exist: ${resolvedPath}`)
  }

  const packageJsonPath = path.join(resolvedPath, 'package.json')
  if (!fs.existsSync(packageJsonPath)) {
    throw new Error(`No package.json found at: ${packageJsonPath}`)
  }

  // When using a custom entry, commands are optional — the user manages their own entry
  const { packageJson, commands } = getCommandsWithFiles({ packageJsonPath })

  if (!entry) {
    const existingCommands = commands.filter((cmd) => cmd.exists)
    if (existingCommands.length === 0) {
      throw new Error('No command files found to build')
    }
    logger.log(`Compiling ${existingCommands.length} commands...`)
  } else {
    logger.log(`Compiling with custom entry: ${entry}`)
  }

  const bundleDir = path.join(resolvedPath, '.termcast-bundle')
  if (!fs.existsSync(bundleDir)) {
    fs.mkdirSync(bundleDir, { recursive: true })
  }
  fs.writeFileSync(path.join(bundleDir, '.gitignore'), '*\n')

  const existingCommands = commands.filter((cmd) => cmd.exists)
  const entryCode = entry
    ? undefined
    : generateEntryCode({
        packageJson,
        commands: existingCommands.map((cmd) => ({
          name: cmd.name,
          bundledPath: cmd.filePath,
        })),
      })

  // IMPORTANT: always compile with a concrete target (bun-linux-x64, bun-darwin-arm64, ...)
  // rather than the generic "bun" target. Using the generic target can cause Bun.build to
  // keep platform branches during bundling and attempt to resolve optional platform packages
  // (e.g. @opentui/core-linux-musl-x64) even when compiling/running on glibc Linux.
  const resolvedTarget: CompileTarget = target || getCurrentTarget()

  // When using a custom entry, resolve it relative to extensionPath and use directly.
  // Otherwise generate a temp entry file with embedded packageJson and command loaders.
  const resolvedEntry = entry ? path.resolve(resolvedPath, entry) : undefined
  if (resolvedEntry && !fs.existsSync(resolvedEntry)) {
    throw new Error(`Custom entry file does not exist: ${resolvedEntry}`)
  }

  const targetSuffix = target ? targetToFileSuffix(target) : 'local'
  const tempEntryPath = resolvedEntry
    ? undefined
    : path.join(bundleDir, `_entry-${targetSuffix}.tsx`)
  if (tempEntryPath && entryCode) {
    fs.writeFileSync(tempEntryPath, entryCode)
  }

  const entrypoint = resolvedEntry || tempEntryPath!

  const bunTarget = targetToString(resolvedTarget)
  const distDir = path.join(resolvedPath, 'dist')
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true })
  }
  const defaultOutfile =
    outfile || path.join(distDir, packageJson.name || 'extension')

  try {
    const result = await Bun.build({
      entrypoints: [entrypoint],
      target: bunTarget as 'bun',
      format: 'esm',
      minify,
      bytecode: true,
      sourcemap: 'external',
      compile: {
        outfile: defaultOutfile,
      },
      define: {
        'process.env.VERSION': JSON.stringify(version || ''),
        // Use 'development' to avoid React bundling issues with CJS/ESM interop
        'process.env.NODE_ENV': JSON.stringify('production'),
      },
      plugins: [raycastAliasPlugin, swiftLoaderPlugin],
      throw: false,
    } as Parameters<typeof Bun.build>[0])

    if (!result.success) {
      const errorDetails = result.logs.map((log: any) => {
        const parts = [log.message || String(log)]
        if (log.position) {
          parts.push(
            `  at ${log.position.file}:${log.position.line}:${log.position.column}`,
          )
        }
        if (log.notes) {
          for (const note of log.notes) {
            parts.push(`  note: ${note.text}`)
            if (note.location) {
              parts.push(`    at ${note.location.file}:${note.location.line}`)
            }
          }
        }
        return parts.join('\n')
      })
      logger.log('Compile errors:', JSON.stringify(result.logs, null, 2))
      throw new Error(
        `Compile failed: ${errorDetails.join('\n\n') || 'Unknown error'}`,
      )
    }

    logger.log(
      'Build outputs:',
      result.outputs?.map((o) => o.path),
    )

    if (!fs.existsSync(defaultOutfile)) {
      throw new Error(
        `Compiled executable not found at ${defaultOutfile}. Outputs: ${result.outputs?.map((o) => o.path).join(', ')}`,
      )
    }

    logger.log(`Successfully compiled: ${defaultOutfile}`)

    return {
      success: true,
      outfile: defaultOutfile,
    }
  } finally {
    if (tempEntryPath && fs.existsSync(tempEntryPath)) {
      fs.unlinkSync(tempEntryPath)
    }
  }
}
