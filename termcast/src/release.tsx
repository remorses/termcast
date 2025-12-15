import fs from 'node:fs'
import path from 'node:path'
import { execSync, exec } from 'node:child_process'
import { promisify } from 'node:util'

const execAsync = promisify(exec)
import {
  compileExtension,
  ALL_TARGETS,
  targetToFileSuffix,
  getArchiveExtension,
  type CompileTarget,
} from './compile'

export interface ReleaseOptions {
  extensionPath: string
  single?: boolean
}

export interface ReleaseResult {
  success: boolean
  version: string
  uploadedFiles: string[]
}

export async function releaseExtension({
  extensionPath,
  single = false,
}: ReleaseOptions): Promise<ReleaseResult> {
  const resolvedPath = path.resolve(extensionPath)

  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`Extension path does not exist: ${resolvedPath}`)
  }

  const packageJsonPath = path.join(resolvedPath, 'package.json')
  if (!fs.existsSync(packageJsonPath)) {
    throw new Error(`No package.json found at: ${packageJsonPath}`)
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))
  const name = packageJson.name
  const version = packageJson.version

  if (!name) {
    throw new Error('package.json must have a name field')
  }
  if (!version) {
    throw new Error('package.json must have a version field')
  }

  const tag = `${name}@${version}`
  console.log(`Preparing release ${tag}...`)

  // Check if release already exists
  try {
    const checkResult = execSync(`gh release view "${tag}" --json tagName`, {
      cwd: resolvedPath,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    })
    if (checkResult.includes(tag)) {
      throw new Error(`Release ${tag} already exists. Bump the version in package.json first.`)
    }
  } catch (error: any) {
    if (error.message?.includes('already exists')) {
      throw error
    }
  }

  // Install dependencies for all platforms
  console.log('Installing dependencies for all platforms...')
  execSync('bun install --os="*" --cpu="*"', {
    cwd: resolvedPath,
    stdio: 'inherit',
  })

  const targets: CompileTarget[] = single
    ? ALL_TARGETS.filter((t) => t.os === process.platform && t.arch === process.arch)
    : ALL_TARGETS

  if (targets.length === 0) {
    throw new Error(`No targets found for current platform: ${process.platform}-${process.arch}`)
  }

  const outputDir = path.join(resolvedPath, 'dist')
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  // Compile for all targets in parallel
  console.log(`Compiling for ${targets.length} targets in parallel...`)
  const compileResults = await Promise.all(
    targets.map(async (target) => {
      const suffix = targetToFileSuffix(target)
      const binaryName = `${name}-${suffix}`
      const outfile = path.join(outputDir, binaryName)

      const result = await compileExtension({
        extensionPath: resolvedPath,
        outfile,
        minify: true,
        target,
      })

      console.log(`  ✓ ${path.basename(result.outfile)}`)

      const archiveExt = getArchiveExtension(target)
      const archiveName = `${name}-${suffix}${archiveExt}`
      const archivePath = path.join(outputDir, archiveName)

      if (archiveExt === '.tar.gz') {
        await execAsync(`tar -czvf "${archiveName}" "${binaryName}"`, { cwd: outputDir })
      } else {
        await execAsync(`zip "${archiveName}" "${binaryName}"`, { cwd: outputDir })
      }

      fs.unlinkSync(result.outfile)
      console.log(`  ✓ ${archiveName}`)

      return archivePath
    }),
  )

  // Create GitHub release
  console.log(`\nCreating GitHub release ${tag}...`)
  try {
    execSync(`gh release create "${tag}" --title "${tag}" --notes "Release ${version}"`, {
      cwd: resolvedPath,
      stdio: 'inherit',
    })
  } catch (error: any) {
    throw new Error(`Failed to create release: ${error.message}`)
  }

  // Upload all binaries in parallel
  console.log('\nUploading binaries in parallel...')
  await Promise.all(
    compileResults.map(async (file) => {
      const fileName = path.basename(file)
      await execAsync(`gh release upload "${tag}" "${file}" --clobber`, {
        cwd: resolvedPath,
      })
      console.log(`  ✓ ${fileName}`)
    }),
  )



  console.log(`\n✅ Release ${tag} published successfully!`)
  console.log(`   ${compileResults.length} binaries uploaded`)


  return {
    success: true,
    version,
    uploadedFiles: compileResults,
  }
}
