import fs from 'node:fs'
import path from 'node:path'
import { spawn } from 'node:child_process'
import type { BunPlugin } from 'bun'
import { logger } from './logger'

const SWIFT_NAMESPACE = 'swift-loader'

interface SwiftBuildCache {
  [swiftPath: string]: {
    result: SwiftBuildResult
    buildTime: number
  }
}

const buildCache: SwiftBuildCache = {}

async function buildSwiftPackage(swiftPath: string): Promise<SwiftBuildResult> {
  logger.log(`Swift: building package at ${swiftPath}`)

  // Check if already built and cached in memory
  const cached = buildCache[swiftPath]
  if (cached && fs.existsSync(cached.result.binaryPath)) {
    logger.log(`Swift: using cached build at ${cached.result.binaryPath}`)
    return cached.result
  }

  // Check if binary already exists on disk (from previous build/process)
  try {
    const existingResult = await findSwiftBuildResult(swiftPath)
    logger.log(`Swift: found existing binary at ${existingResult.binaryPath}`)
    buildCache[swiftPath] = { result: existingResult, buildTime: Date.now() }
    return existingResult
  } catch {
    // Binary doesn't exist, need to build
  }

  // Run swift build using Node's spawn
  // Use debug build for faster compilation (skips optimizations)
  logger.log(`Swift: running swift build -c debug in ${swiftPath}`)
  const exitCode = await new Promise<number>((resolve, reject) => {
    const proc = spawn('swift', ['build', '-c', 'debug'], {
      cwd: swiftPath,
      stdio: 'inherit',
    })
    proc.on('error', reject)
    proc.on('close', (code) => resolve(code ?? 1))
  })
  logger.log(`Swift: build exited with code ${exitCode}`)

  if (exitCode !== 0) {
    throw new Error(`Swift build failed with exit code ${exitCode}`)
  }
  logger.log(`Swift: build completed successfully`)

  // Find the binary and generated files
  const result = await findSwiftBuildResult(swiftPath)

  // Cache the result
  buildCache[swiftPath] = {
    result,
    buildTime: Date.now(),
  }

  logger.log(`Swift: built binary at ${result.binaryPath}`)
  return result
}

interface SwiftBuildResult {
  binaryPath: string
  raycastJsPath: string
  packageName: string
}

function findFilesRecursively(dir: string, filename: string): string[] {
  const results: string[] = []

  if (!fs.existsSync(dir)) {
    return results
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      results.push(...findFilesRecursively(fullPath, filename))
    } else if (entry.name === filename) {
      results.push(fullPath)
    }
  }
  return results
}

async function findSwiftBuildResult(swiftPath: string): Promise<SwiftBuildResult> {
  // Parse Package.swift to find executable target name
  const packageSwiftPath = path.join(swiftPath, 'Package.swift')
  const packageSwift = fs.readFileSync(packageSwiftPath, 'utf-8')

  // Look for: name: "PackageName" at the top level
  const nameMatch = packageSwift.match(/name:\s*"([^"]+)"/)
  if (!nameMatch) {
    throw new Error(`Could not find package name in ${packageSwiftPath}`)
  }

  const packageName = nameMatch[1]

  // Find binary - check debug first, then release
  const debugBinaryPath = path.join(swiftPath, '.build', 'debug', packageName)
  const releaseBinaryPath = path.join(swiftPath, '.build', 'release', packageName)

  let binaryPath: string
  if (fs.existsSync(debugBinaryPath)) {
    binaryPath = debugBinaryPath
  } else if (fs.existsSync(releaseBinaryPath)) {
    binaryPath = releaseBinaryPath
  } else {
    throw new Error(`Swift binary not found at ${debugBinaryPath} or ${releaseBinaryPath}`)
  }

  // Find raycast.js using glob-like search
  const buildDir = path.join(swiftPath, '.build')
  const raycastJsFiles = findFilesRecursively(buildDir, 'raycast.js')

  // Filter to find the one from RaycastTypeScriptPlugin for our package
  const matchingFiles = raycastJsFiles.filter(f =>
    f.includes('RaycastTypeScriptPlugin') && f.includes(packageName)
  )

  if (matchingFiles.length === 0) {
    throw new Error(`Generated raycast.js not found in ${buildDir}. Found files: ${raycastJsFiles.join(', ') || 'none'}`)
  }

  // Prefer the one in plugins/outputs (not index-build)
  const raycastJsPath = matchingFiles.find(f => f.includes('plugins/outputs')) || matchingFiles[0]

  logger.log(`Swift: found raycast.js at ${raycastJsPath}`)
  return { binaryPath, raycastJsPath, packageName }
}

function generateSwiftModule(result: SwiftBuildResult): string {
  // Read the generated raycast.js from RaycastTypeScriptPlugin
  // This file exports named functions that call runSwiftFunction(functionName, ...args)
  // We prepend our runSwiftFunction implementation with the binary path
  const generatedJs = fs.readFileSync(result.raycastJsPath, 'utf-8')

  // Prepend our runSwiftFunction implementation using Node's child_process
  // Use ESM import to match the export statements in generated raycast.js
  const runtime = `
import { spawn as _spawn } from 'node:child_process';

const BINARY_PATH = ${JSON.stringify(result.binaryPath)};

function runSwiftFunction(functionName, ...args) {
  return new Promise((resolve, reject) => {
    const jsonArgs = args.map((arg) => JSON.stringify(arg));
    const proc = _spawn(BINARY_PATH, [functionName, ...jsonArgs], {
      stdio: ['pipe', 'pipe', 'inherit'],
    });

    let stdout = '';
    proc.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    proc.on('error', (err) => {
      reject(new Error('Swift function "' + functionName + '" failed to spawn: ' + err.message));
    });

    proc.on('close', (exitCode) => {
      if (exitCode !== 0) {
        reject(new Error('Swift function "' + functionName + '" failed with exit code ' + exitCode));
        return;
      }

      const trimmed = stdout.trim();
      if (!trimmed) {
        resolve(undefined);
        return;
      }

      try {
        resolve(JSON.parse(trimmed));
      } catch {
        reject(new Error('Swift function "' + functionName + '" returned invalid JSON: ' + trimmed));
      }
    });
  });
}

`

  return runtime + generatedJs
}

export const swiftLoaderPlugin: BunPlugin = {
  name: 'swift-loader',
  async setup(build) {
    // Resolve swift: imports
    build.onResolve({ filter: /^swift:/ }, (args) => {
      logger.log(`Swift: onResolve called for ${args.path} from ${args.importer}`)

      // Extract the path after "swift:"
      const swiftRelativePath = args.path.slice(6) // Remove "swift:"

      // Resolve relative to the importer's directory
      const importerDir = args.importer ? path.dirname(args.importer) : process.cwd()
      const resolvedSwiftPath = path.resolve(importerDir, swiftRelativePath)

      logger.log(`Swift: resolved to ${resolvedSwiftPath}`)

      return {
        path: resolvedSwiftPath,
        namespace: SWIFT_NAMESPACE,
      }
    })

    // Load swift packages
    build.onLoad({ filter: /.*/, namespace: SWIFT_NAMESPACE }, async (args) => {
      logger.log(`Swift: onLoad called for ${args.path}`)
      const swiftPath = args.path

      // Build the Swift package and get paths to binary + generated JS
      logger.log(`Swift: calling buildSwiftPackage...`)
      const result = await buildSwiftPackage(swiftPath)
      logger.log(`Swift: buildSwiftPackage returned, binaryPath=${result.binaryPath}`)

      // Generate module by combining runtime with generated raycast.js
      logger.log(`Swift: generating module...`)
      const contents = generateSwiftModule(result)
      logger.log(`Swift: module generated, length=${contents.length}`)
      // logger.log(`Swift: module contents:\n${contents}`)

      return {
        contents,
        loader: 'js',
      }
    })
  },
}
