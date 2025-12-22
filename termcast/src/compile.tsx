import fs from 'node:fs'
import path from 'node:path'
import type { BunPlugin } from 'bun'
import { logger } from './logger'
import { getCommandsWithFiles } from './package-json'
import { swiftLoaderPlugin } from './swift-loader'

const raycastAliasPlugin: BunPlugin = {
  name: 'raycast-to-termcast',
  setup(build) {
    build.onResolve({ filter: /@raycast\/api/ }, () => ({
      path: require.resolve('termcast/src/index'),
    }))

    build.onResolve({ filter: /^termcast/ }, (args) => ({
      path: require.resolve(args.path),
    }))
  },
}

export function generateEntryCode({
  extensionPath,
  commands,
}: {
  extensionPath: string
  commands: Array<{ name: string; bundledPath: string }>
}): string {
  const commandImports = commands
    .map(
      (cmd, i) =>
        `  const { default: Command${i} } = await import(${JSON.stringify(cmd.bundledPath)});`,
    )
    .join('\n')

  const commandsArray = commands
    .map(
      (cmd, i) => `    {
      name: ${JSON.stringify(cmd.name)},
      Component: Command${i},
    }`,
    )
    .join(',\n')

  return `
async function main() {
${commandImports}

  const compiledCommands = [
${commandsArray}
  ];

  const { startCompiledExtension } = await import('termcast/src/extensions/dev');

  await startCompiledExtension({
    extensionPath: ${JSON.stringify(extensionPath)},
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
}: CompileOptions): Promise<CompileResult> {
  const resolvedPath = path.resolve(extensionPath)

  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`Extension path does not exist: ${resolvedPath}`)
  }

  const packageJsonPath = path.join(resolvedPath, 'package.json')
  if (!fs.existsSync(packageJsonPath)) {
    throw new Error(`No package.json found at: ${packageJsonPath}`)
  }

  const { packageJson, commands } = getCommandsWithFiles({ packageJsonPath })

  const existingCommands = commands.filter((cmd) => cmd.exists)
  if (existingCommands.length === 0) {
    throw new Error('No command files found to build')
  }

  logger.log(`Compiling ${existingCommands.length} commands...`)

  const bundleDir = path.join(resolvedPath, '.termcast-bundle')
  if (!fs.existsSync(bundleDir)) {
    fs.mkdirSync(bundleDir, { recursive: true })
  }
  fs.writeFileSync(path.join(bundleDir, '.gitignore'), '*\n')

  const entryCode = generateEntryCode({
    extensionPath: resolvedPath,
    commands: existingCommands.map((cmd) => ({
      name: cmd.name,
      bundledPath: cmd.filePath,
    })),
  })

  const targetSuffix = target ? targetToFileSuffix(target) : 'local'
  const tempEntryPath = path.join(bundleDir, `_entry-${targetSuffix}.tsx`)
  fs.writeFileSync(tempEntryPath, entryCode)

  const bunTarget = target ? targetToString(target) : 'bun'
  const defaultOutfile =
    outfile || path.join(resolvedPath, packageJson.name || 'extension')

  try {
    const result = await Bun.build({
      entrypoints: [tempEntryPath],
      target: bunTarget as 'bun',
      minify,
      // bytecode: true, // TODO need to wait for opentui to support this removing top level await
      sourcemap: 'external',
      compile: {
        outfile: defaultOutfile,
      },
      define: {
        'process.env.VERSION': JSON.stringify(version || ''),
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
    if (fs.existsSync(tempEntryPath)) {
      fs.unlinkSync(tempEntryPath)
    }
  }
}
