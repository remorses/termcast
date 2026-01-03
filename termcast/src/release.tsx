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
  installUrl: string
}

export async function releaseExtension({
  extensionPath,
  single = false,
}: ReleaseOptions): Promise<ReleaseResult> {
  const resolvedPath = path.resolve(extensionPath)

  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`Extension path does not exist: ${resolvedPath}`)
  }

  // Read package.json to get extension name
  const packageJsonPath = path.join(resolvedPath, 'package.json')
  if (!fs.existsSync(packageJsonPath)) {
    throw new Error(`package.json not found at ${packageJsonPath}`)
  }
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))
  const extensionName = packageJson.name

  if (!extensionName) {
    throw new Error(`package.json must have a "name" field`)
  }

  // Get repo owner and name from git remote
  let repoOwner: string
  let repoName: string
  try {
    const remoteUrl = execSync('git config --get remote.origin.url', {
      cwd: resolvedPath,
      encoding: 'utf-8',
    }).trim()
    // Handle both HTTPS and SSH URLs:
    // https://github.com/user/repo.git -> user/repo
    // git@github.com:user/repo.git -> user/repo
    const httpsMatch = remoteUrl.match(/github\.com\/([^/]+)\/([^/]+?)(?:\.git)?$/)
    const sshMatch = remoteUrl.match(/github\.com:([^/]+)\/([^/]+?)(?:\.git)?$/)
    const match = httpsMatch || sshMatch
    if (!match) {
      throw new Error(`Could not parse owner/repo from remote URL: ${remoteUrl}`)
    }
    repoOwner = match[1]
    repoName = match[2].replace(/\.git$/, '')
  } catch (error: any) {
    throw new Error(`Failed to get git remote: ${error.message}`)
  }

  // Validate that repo name matches package.json name
  // This ensures the install script and runtime use the same directory
  if (repoName !== extensionName) {
    throw new Error(
      `Repository name "${repoName}" does not match package.json name "${extensionName}".\n` +
      `These must match for the install script and runtime to use the same directory.\n` +
      `Either rename your repository or update the "name" field in package.json.`
    )
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
        version: tag,
      })

      console.log(`  ✓ ${path.basename(result.outfile)}`)

      const archiveExt = getArchiveExtension(target)
      const archiveName = `${repoName}-${suffix.replace(/\.exe$/, '')}${archiveExt}`
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



  const installUrl = `https://termcast.app/${repoOwner}/${repoName}/install`
  console.log(`\n✅ Release ${tag} published successfully!`)
  console.log(`   ${compileResults.length} binaries uploaded`)
  console.log(`\nInstall script:`)
  console.log(`   curl -sf ${installUrl} | bash`)

  return {
    success: true,
    tag,
    uploadedFiles: compileResults,
    installUrl,
  }
}
