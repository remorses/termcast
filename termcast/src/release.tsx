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
  tag: string
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

  // Get repo name from git remote
  let repoName: string
  try {
    const remoteUrl = execSync('git config --get remote.origin.url', {
      cwd: resolvedPath,
      encoding: 'utf-8',
    }).trim()
    // Handle both HTTPS and SSH URLs:
    // https://github.com/user/repo.git -> repo
    // git@github.com:user/repo.git -> repo
    const match = remoteUrl.match(/\/([^/]+?)(?:\.git)?$/) || remoteUrl.match(/:([^/]+?)(?:\.git)?$/)
    if (!match) {
      throw new Error(`Could not parse repo name from remote URL: ${remoteUrl}`)
    }
    repoName = match[1].replace(/\.git$/, '')
  } catch (error: any) {
    throw new Error(`Failed to get git remote: ${error.message}`)
  }

  // Generate date-based tag with hour and minute
  const now = new Date()
  const dateTag = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
    String(now.getHours()).padStart(2, '0'),
    String(now.getMinutes()).padStart(2, '0'),
  ].join('')

  const tag = `${repoName}@${dateTag}`
  console.log(`Preparing release ${tag}...`)

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
  fs.writeFileSync(path.join(outputDir, '.gitignore'), '*\n')

  // Compile for all targets in parallel
  console.log(`Compiling for ${targets.length} targets in parallel...`)
  const compileResults = await Promise.all(
    targets.map(async (target) => {
      const suffix = targetToFileSuffix(target)
      const binaryName = `${repoName}-${suffix}`
      const outfile = path.join(outputDir, binaryName)

      const result = await compileExtension({
        extensionPath: resolvedPath,
        outfile,
        minify: true,
        target,
      })

      console.log(`  ✓ ${path.basename(result.outfile)}`)

      const archiveExt = getArchiveExtension(target)
      const archiveName = `${repoName}-${suffix}${archiveExt}`
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
    execSync(`gh release create "${tag}" --title "${tag}" --notes "Release ${tag}"`, {
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
    tag,
    uploadedFiles: compileResults,
  }
}
