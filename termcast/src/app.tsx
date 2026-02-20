// Build standalone macOS .app bundles that wrap WezTerm + a compiled termcast extension.
// The .app contains: wezterm-gui binary, baked wezterm.lua config, compiled extension,
// a thin launch script, and a custom icon. Multiple apps run fully isolated because
// --config-file triggers WezTerm's NoConnectNoPublish mode (separate PID sockets).
// See termcast/docs/wezterm-fork.md for the full architecture.

import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { compileExtension, type CompileTarget } from './compile'

const execFileAsync = promisify(execFile)

// Pin to a known-good WezTerm release. Update manually when needed.
const WEZTERM_TAG = '20240203-110809-5046fc22'
const WEZTERM_MACOS_ZIP_URL = `https://github.com/wez/wezterm/releases/download/${WEZTERM_TAG}/WezTerm-macos-${WEZTERM_TAG}.zip`

// Bundled default icon shipped with termcast source.
// __dirname is termcast/src/ in dev or termcast/dist/ when published.
// The asset lives in src/assets/, so resolve from the package root.
const termcastRoot = path.resolve(__dirname, '..')
const DEFAULT_ICON_PATH = path.join(termcastRoot, 'src', 'assets', 'default-app-icon.png')

function getCacheDir(): string {
  return path.join(os.homedir(), '.termcast', 'cache')
}

// Download and cache the wezterm-gui universal binary from official WezTerm release.
// Returns the path to the cached universal binary.
async function downloadWeztermUniversal(): Promise<string> {
  const cacheDir = path.join(getCacheDir(), 'wezterm', WEZTERM_TAG)
  const cachedBinary = path.join(cacheDir, 'wezterm-gui-universal')

  if (fs.existsSync(cachedBinary)) {
    return cachedBinary
  }

  console.log(`Downloading WezTerm ${WEZTERM_TAG}...`)
  fs.mkdirSync(cacheDir, { recursive: true })

  const response = await fetch(WEZTERM_MACOS_ZIP_URL)
  if (!response.ok) {
    throw new Error(
      `Failed to download WezTerm: ${response.status} ${response.statusText}`,
    )
  }

  const buffer = await response.arrayBuffer()
  console.log(`Downloaded ${(buffer.byteLength / 1024 / 1024).toFixed(1)}MB`)

  // Extract wezterm-gui binary from the zip using JSZip (cross-platform, no shell deps)
  console.log('Extracting wezterm-gui...')
  const JSZip = (await import('jszip')).default
  const zip = await JSZip.loadAsync(buffer)

  const weztermGuiEntry = Object.keys(zip.files).find((name) => {
    return name.endsWith('/wezterm-gui') && name.includes('MacOS')
  })

  if (!weztermGuiEntry) {
    const entries = Object.keys(zip.files).slice(0, 20).join('\n  ')
    throw new Error(
      `Could not find wezterm-gui in archive. First entries:\n  ${entries}`,
    )
  }

  const weztermGuiData = await zip.files[weztermGuiEntry].async('nodebuffer')

  // Write to temp file then rename for atomic cache write (concurrency safe)
  const tmpBinary = cachedBinary + `.tmp-${process.pid}`
  fs.writeFileSync(tmpBinary, weztermGuiData)
  fs.chmodSync(tmpBinary, 0o755)
  fs.renameSync(tmpBinary, cachedBinary)

  console.log(`Cached wezterm-gui at ${cacheDir}`)
  return cachedBinary
}

// Get a single-arch wezterm-gui binary, thinning the universal binary with lipo.
// On macOS: uses lipo to extract the requested arch (~65MB instead of ~130MB).
// On Linux: can't run lipo, so returns the full universal binary as-is.
async function getWeztermBinary({ arch }: { arch: 'arm64' | 'x64' }): Promise<string> {
  const universalBinary = await downloadWeztermUniversal()
  const cacheDir = path.dirname(universalBinary)
  const archName = arch === 'x64' ? 'x86_64' : 'arm64'
  const thinnedBinary = path.join(cacheDir, `wezterm-gui-${archName}`)

  if (fs.existsSync(thinnedBinary)) {
    return thinnedBinary
  }

  // lipo is macOS-only — on other platforms return the universal binary
  if (process.platform !== 'darwin') {
    console.log(`Not on macOS, using universal binary (130MB). Thin with lipo on macOS for ~65MB.`)
    return universalBinary
  }

  console.log(`Thinning wezterm-gui to ${archName}...`)
  const tmpThinned = thinnedBinary + `.tmp-${process.pid}`
  await execFileAsync('lipo', ['-thin', archName, universalBinary, '-output', tmpThinned])
  fs.chmodSync(tmpThinned, 0o755)
  fs.renameSync(tmpThinned, thinnedBinary)

  const stat = fs.statSync(thinnedBinary)
  console.log(`Thinned to ${(stat.size / 1024 / 1024).toFixed(1)}MB (${archName})`)
  return thinnedBinary
}

// Resolve the icon to use. Returns path to a PNG file.
// Priority: --icon flag > package.json icon field > bundled default
function resolveIcon({
  extensionPath,
  iconOverride,
  packageJson,
}: {
  extensionPath: string
  iconOverride?: string
  packageJson: { icon?: string }
}): string {
  if (iconOverride) {
    const resolved = path.resolve(iconOverride)
    if (!fs.existsSync(resolved)) {
      throw new Error(`Icon file not found: ${resolved}`)
    }
    return resolved
  }

  if (packageJson.icon) {
    const directPath = path.join(extensionPath, packageJson.icon)
    if (fs.existsSync(directPath)) {
      return directPath
    }
    const assetsPath = path.join(extensionPath, 'assets', packageJson.icon)
    if (fs.existsSync(assetsPath)) {
      return assetsPath
    }
  }

  if (fs.existsSync(DEFAULT_ICON_PATH)) {
    return DEFAULT_ICON_PATH
  }

  throw new Error(
    `No icon found. Provide --icon flag or add an "icon" field to package.json`,
  )
}

// Build a .icns file from a PNG buffer. Pure TypeScript, no native deps.
// Modern macOS icns files are just a container wrapping PNG data at various sizes.
// The format is: 'icns' magic (4B) + total file size (4B BE) + entries.
// Each entry: type code (4B) + entry size including header (4B BE) + PNG data.
// Type codes: ic07=128, ic08=256, ic09=512, ic10=1024 (retina 512).
// macOS handles scaling from the provided PNG, so we embed the original at all
// sizes. This produces a valid .icns without any image resizing tools.
function buildIcnsFromPng(pngData: Buffer): Buffer {
  const types = ['ic10', 'ic09', 'ic08', 'ic07']

  const entries: Buffer[] = types.map((type) => {
    const header = Buffer.alloc(8)
    header.write(type, 0, 4, 'ascii')
    header.writeUInt32BE(8 + pngData.length, 4)
    return Buffer.concat([header, pngData])
  })

  const totalEntrySize = entries.reduce((sum, e) => sum + e.length, 0)
  const fileHeader = Buffer.alloc(8)
  fileHeader.write('icns', 0, 4, 'ascii')
  fileHeader.writeUInt32BE(8 + totalEntrySize, 4)

  return Buffer.concat([fileHeader, ...entries])
}

function convertToIcns({
  pngPath,
  outputPath,
}: {
  pngPath: string
  outputPath: string
}): void {
  const pngData = fs.readFileSync(pngPath)

  if (pngData[0] !== 0x89 || pngData[1] !== 0x50 || pngData[2] !== 0x4e || pngData[3] !== 0x47) {
    throw new Error(`File is not a valid PNG: ${pngPath}`)
  }

  const icns = buildIcnsFromPng(pngData)
  fs.writeFileSync(outputPath, icns)
}

function generateWeztermConfig({ binaryName }: { binaryName: string }): string {
  return `\
local wezterm = require 'wezterm'
local config = wezterm.config_builder()

local config_dir = wezterm.config_dir
config.default_prog = { config_dir .. '/${binaryName}' }

-- Strip all chrome
config.enable_tab_bar = false
config.window_decorations = 'RESIZE'
config.window_padding = { left = 0, right = 0, top = 0, bottom = 0 }

-- Snap resize to cell grid
config.use_resize_increments = true

-- Kitty protocols
config.enable_kitty_graphics = true
config.enable_kitty_keyboard = true

-- Crisp macOS rendering
config.front_end = 'WebGpu'
config.webgpu_power_preference = 'HighPerformance'
config.max_fps = 120
config.freetype_render_target = 'HorizontalLcd'
config.freetype_load_target = 'Light'

-- Termcast controls all key bindings
config.disable_default_key_bindings = true
config.keys = {
  { key = 'c', mods = 'SUPER', action = wezterm.action.SendKey { key = 'c', mods = 'SUPER' } },
  { key = 'v', mods = 'SUPER', action = wezterm.action.SendKey { key = 'v', mods = 'SUPER' } },
  { key = 'q', mods = 'SUPER', action = wezterm.action.QuitApplication },
}

config.quote_dropped_files = 'Posix'

return config
`
}

function generateLaunchScript(): string {
  return `\
#!/bin/bash
DIR="$(cd "$(dirname "$0")" && pwd)"
exec "$DIR/wezterm-gui" --config-file "$DIR/../Resources/wezterm.lua"
`
}

function escapeXml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function generateInfoPlist({
  appName,
  bundleId,
  version,
  iconFile = 'app.icns',
}: {
  appName: string
  bundleId: string
  version: string
  iconFile?: string
}): string {
  const safeBundleId = escapeXml(bundleId)
  const safeAppName = escapeXml(appName)
  const safeVersion = escapeXml(version)
  return `\
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
  "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleExecutable</key>
  <string>launch</string>
  <key>CFBundleIdentifier</key>
  <string>${safeBundleId}</string>
  <key>CFBundleName</key>
  <string>${safeAppName}</string>
  <key>CFBundleDisplayName</key>
  <string>${safeAppName}</string>
  <key>CFBundleIconFile</key>
  <string>${iconFile}</string>
  <key>CFBundlePackageType</key>
  <string>APPL</string>
  <key>CFBundleShortVersionString</key>
  <string>${safeVersion}</string>
  <key>CFBundleVersion</key>
  <string>1</string>
  <key>NSHighResolutionCapable</key>
  <true/>
  <key>NSSupportsAutomaticGraphicsSwitching</key>
  <true/>
  <key>NSRequiresAquaSystemAppearance</key>
  <string>NO</string>
</dict>
</plist>
`
}

export interface BuildAppOptions {
  extensionPath: string
  name?: string
  icon?: string
  bundleId?: string
  release?: boolean
  entry?: string
  /** Target OS: 'darwin' | 'linux' | 'win32'. Only 'darwin' is supported for now. */
  platform?: CompileTarget['os']
  /** Target arch: 'arm64' | 'x64'. Defaults to current machine arch. */
  arch?: CompileTarget['arch']
}

export interface BuildAppResult {
  appPath: string
  appName: string
}

export async function buildApp({
  extensionPath,
  name,
  icon,
  bundleId,
  release = false,
  entry,
  platform,
  arch,
}: BuildAppOptions): Promise<BuildAppResult> {
  const resolvedPath = path.resolve(extensionPath)

  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`Extension path does not exist: ${resolvedPath}`)
  }

  const resolvedPlatform = platform || (process.platform as CompileTarget['os'])
  if (resolvedPlatform !== 'darwin') {
    throw new Error(
      `Platform "${resolvedPlatform}" is not supported yet. Only macOS (darwin) app bundles are implemented.`,
    )
  }

  const packageJsonPath = path.join(resolvedPath, 'package.json')
  if (!fs.existsSync(packageJsonPath)) {
    throw new Error(`No package.json found at: ${packageJsonPath}`)
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))
  const rawExtensionName: string = packageJson.name
  if (!rawExtensionName) {
    throw new Error('package.json must have a "name" field')
  }
  // Strip npm scope prefix (@scope/name -> name) for filesystem and lua paths
  const extensionName = rawExtensionName.replace(/^@[^/]+\//, '')

  const appName = name || packageJson.title || extensionName
  const resolvedBundleId =
    bundleId || `com.termcast.${extensionName.replace(/[^a-zA-Z0-9.-]/g, '-')}`
  const version: string = packageJson.version || '1.0.0'
  const resolvedArch: CompileTarget['arch'] = arch || (process.arch === 'arm64' ? 'arm64' : 'x64')
  const target: CompileTarget = { os: resolvedPlatform, arch: resolvedArch }

  console.log(`Building app "${appName}" for ${resolvedPlatform}-${resolvedArch}...`)

  // Step 1: Download/cache WezTerm and thin to target arch (~65MB instead of ~130MB)
  const weztermBinary = await getWeztermBinary({ arch: resolvedArch })

  // Step 2: Compile the termcast extension
  console.log(`Compiling termcast extension...`)
  const distDir = path.join(resolvedPath, 'dist')
  fs.mkdirSync(distDir, { recursive: true })
  // Ensure dist/ is gitignored (same as release.tsx)
  const distGitignore = path.join(distDir, '.gitignore')
  if (!fs.existsSync(distGitignore)) {
    fs.writeFileSync(distGitignore, '*\n')
  }
  const compiledBinaryPath = path.join(distDir, `${extensionName}-app-binary-${resolvedArch}`)

  const compileResult = await compileExtension({
    extensionPath: resolvedPath,
    outfile: compiledBinaryPath,
    minify: true,
    target,
    entry,
  })

  // Step 3: Resolve icon
  const iconPng = resolveIcon({
    extensionPath: resolvedPath,
    iconOverride: icon,
    packageJson,
  })

  // Step 4: Assemble .app bundle
  const safeName = appName.replace(/[/\\]/g, '-')
  const archSuffix = resolvedArch === 'x64' ? 'x86_64' : 'arm64'
  const appDir = path.join(distDir, `${safeName}-${archSuffix}.app`)

  if (fs.existsSync(appDir)) {
    fs.rmSync(appDir, { recursive: true, force: true })
  }

  const macosDir = path.join(appDir, 'Contents', 'MacOS')
  const resourcesDir = path.join(appDir, 'Contents', 'Resources')
  fs.mkdirSync(macosDir, { recursive: true })
  fs.mkdirSync(resourcesDir, { recursive: true })

  console.log('Assembling .app bundle...')

  // Copy wezterm-gui binary (thinned to target arch)
  fs.copyFileSync(weztermBinary, path.join(macosDir, 'wezterm-gui'))
  fs.chmodSync(path.join(macosDir, 'wezterm-gui'), 0o755)

  // Copy compiled extension binary
  const binaryName = extensionName
  fs.copyFileSync(compileResult.outfile, path.join(resourcesDir, binaryName))
  fs.chmodSync(path.join(resourcesDir, binaryName), 0o755)

  // Write config, launch script
  fs.writeFileSync(
    path.join(resourcesDir, 'wezterm.lua'),
    generateWeztermConfig({ binaryName }),
  )

  const launchPath = path.join(macosDir, 'launch')
  fs.writeFileSync(launchPath, generateLaunchScript())
  fs.chmodSync(launchPath, 0o755)

  // Convert and write icon, then write Info.plist with the correct icon filename
  let iconFile = 'app.icns'
  const icnsPath = path.join(resourcesDir, 'app.icns')
  try {
    convertToIcns({ pngPath: iconPng, outputPath: icnsPath })
  } catch (e) {
    console.log(`Warning: could not convert icon to .icns (${e instanceof Error ? e.message : e}), copying PNG as fallback`)
    iconFile = 'app.png'
    fs.copyFileSync(iconPng, path.join(resourcesDir, iconFile))
  }

  fs.writeFileSync(
    path.join(appDir, 'Contents', 'Info.plist'),
    generateInfoPlist({ appName: safeName, bundleId: resolvedBundleId, version, iconFile }),
  )

  // Clean up intermediate compiled binary + sourcemap
  fs.rmSync(compileResult.outfile, { force: true })
  fs.rmSync(compileResult.outfile + '.map', { force: true })

  // Ad-hoc sign — only on macOS where codesign is available.
  // The wezterm-gui binary's original signature is invalid in the new bundle.
  if (process.platform === 'darwin') {
    console.log('Ad-hoc signing...')
    await execFileAsync('codesign', ['--force', '--deep', '-s', '-', appDir])
  } else {
    console.log('Skipping ad-hoc signing (not on macOS). Sign manually before distributing.')
  }

  const appSize = await getDirectorySize(appDir)
  console.log(`\nBuilt: ${appDir} (${(appSize / 1024 / 1024).toFixed(0)}MB)`)

  // Step 5: --release: zip and upload to GitHub release
  if (release) {
    await uploadToRelease({
      extensionPath: resolvedPath,
      extensionName,
      appDir,
      appName: safeName,
      arch: resolvedArch,
    })
  }

  return { appPath: appDir, appName: safeName }
}

function getDirectorySize(dirPath: string): number {
  let total = 0
  const entries = fs.readdirSync(dirPath, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name)
    if (entry.isDirectory()) {
      total += getDirectorySize(fullPath)
    } else {
      total += fs.statSync(fullPath).size
    }
  }
  return total
}

async function uploadToRelease({
  extensionPath,
  extensionName,
  appDir,
  appName,
  arch,
}: {
  extensionPath: string
  extensionName: string
  appDir: string
  appName: string
  arch: CompileTarget['arch']
}): Promise<void> {
  const distDir = path.dirname(appDir)

  // Find the latest release whose tag matches the extensionName@ prefix.
  // This mirrors the install script approach: scan releases for matching assets
  // rather than trusting --limit 1, which could pick an unrelated release
  // (e.g. npm-only releases, drafts, or prereleases in repos with mixed tags).
  console.log(`\nLooking for latest "${extensionName}@*" release...`)
  let latestTag: string
  try {
    const { stdout } = await execFileAsync(
      'gh',
      ['release', 'list', '--limit', '20', '--json', 'tagName', '--jq', '.[].tagName'],
      { cwd: extensionPath },
    )
    const tags = stdout.trim().split('\n').filter(Boolean)
    const prefix = `${extensionName}@`
    const matchingTag = tags.find((tag) => {
      return tag.startsWith(prefix)
    })
    latestTag = matchingTag || ''
  } catch (e) {
    throw new Error(
      'No GitHub releases found. Run `termcast release` first to create a release.',
      { cause: e },
    )
  }

  if (!latestTag) {
    throw new Error(
      `No release found matching "${extensionName}@*". Run \`termcast release\` first.`,
    )
  }

  console.log(`Uploading to release ${latestTag}...`)

  // Zip the .app bundle using JSZip (cross-platform)
  const zipName = `${appName}-darwin-${arch}.zip`
  const zipPath = path.join(distDir, zipName)
  fs.rmSync(zipPath, { force: true })

  const JSZip = (await import('jszip')).default
  const zip = new JSZip()
  const appBasename = path.basename(appDir)

  const addDirToZip = (dirPath: string, zipPrefix: string) => {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name)
      const entryZipPath = `${zipPrefix}/${entry.name}`
      if (entry.isDirectory()) {
        addDirToZip(fullPath, entryZipPath)
      } else {
        const data = fs.readFileSync(fullPath)
        const isExecutable = (fs.statSync(fullPath).mode & 0o111) !== 0
        zip.file(entryZipPath, data, {
          unixPermissions: isExecutable ? 0o755 : 0o644,
        })
      }
    }
  }
  addDirToZip(appDir, appBasename)

  const zipBuffer = await zip.generateAsync({
    type: 'nodebuffer',
    platform: 'UNIX',
  })
  fs.writeFileSync(zipPath, zipBuffer)
  console.log(`Created ${zipName}`)

  await execFileAsync('gh', ['release', 'upload', latestTag, zipPath, '--clobber'], {
    cwd: extensionPath,
  })

  console.log(`Uploaded ${zipName} to release ${latestTag}`)
  fs.unlinkSync(zipPath)
}
