// Build standalone desktop app bundles (macOS .app, Windows folder) that wrap WezTerm
// + a compiled termcast extension. Each bundle contains: wezterm-gui binary, baked
// wezterm.lua config, compiled extension, a platform launcher, and a custom icon.
// Multiple apps run fully isolated because --config-file triggers WezTerm's
// NoConnectNoPublish mode (separate PID sockets per process).
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
const WEZTERM_WINDOWS_ZIP_URL = `https://github.com/wez/wezterm/releases/download/${WEZTERM_TAG}/WezTerm-windows-${WEZTERM_TAG}.zip`

// Files to extract from the Windows WezTerm zip. wezterm-gui.exe is the main binary,
// conpty.dll + OpenConsole.exe are required for PTY support, and the ANGLE DLLs
// (libEGL/libGLESv2) provide WebGpu/OpenGL on machines with older GPU drivers.
const WEZTERM_WINDOWS_FILES = [
  'wezterm-gui.exe',
  'conpty.dll',
  'OpenConsole.exe',
  'libEGL.dll',
  'libGLESv2.dll',
]

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

// Download and cache WezTerm Windows files from official release.
// Returns a map of filename -> cached file path for the needed DLLs and executables.
async function downloadWeztermWindows(): Promise<Map<string, string>> {
  const cacheDir = path.join(getCacheDir(), 'wezterm', WEZTERM_TAG, 'windows')
  const sentinel = path.join(cacheDir, '.complete')

  // Check if all files are already cached. Verify each file exists
  // in case of partial cleanup or corruption.
  if (fs.existsSync(sentinel)) {
    const allExist = WEZTERM_WINDOWS_FILES.every((name) => {
      return fs.existsSync(path.join(cacheDir, name))
    })
    if (allExist) {
      const result = new Map<string, string>()
      for (const name of WEZTERM_WINDOWS_FILES) {
        result.set(name, path.join(cacheDir, name))
      }
      return result
    }
    // Sentinel exists but files are missing — remove sentinel and re-download
    fs.unlinkSync(sentinel)
  }

  console.log(`Downloading WezTerm Windows ${WEZTERM_TAG}...`)
  fs.mkdirSync(cacheDir, { recursive: true })

  const response = await fetch(WEZTERM_WINDOWS_ZIP_URL)
  if (!response.ok) {
    throw new Error(
      `Failed to download WezTerm Windows: ${response.status} ${response.statusText}`,
    )
  }

  const buffer = await response.arrayBuffer()
  console.log(`Downloaded ${(buffer.byteLength / 1024 / 1024).toFixed(1)}MB`)

  console.log('Extracting WezTerm Windows files...')
  const JSZip = (await import('jszip')).default
  const zip = await JSZip.loadAsync(buffer)

  const result = new Map<string, string>()
  for (const name of WEZTERM_WINDOWS_FILES) {
    const zipEntry = Object.keys(zip.files).find((entry) => {
      return entry.endsWith('/' + name) || entry === name
    })
    if (!zipEntry) {
      throw new Error(`Could not find ${name} in WezTerm Windows archive`)
    }
    const data = await zip.files[zipEntry].async('nodebuffer')
    const outPath = path.join(cacheDir, name)
    const tmpPath = outPath + `.tmp-${process.pid}`
    fs.writeFileSync(tmpPath, data)
    fs.renameSync(tmpPath, outPath)
    result.set(name, outPath)
  }

  // Write sentinel after all files are extracted successfully
  fs.writeFileSync(sentinel, '')
  console.log(`Cached WezTerm Windows files at ${cacheDir}`)
  return result
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

// Build a .ico file from a PNG buffer. Pure TypeScript, no native deps.
// Modern Windows ICO files accept embedded PNG data (since Vista).
// Format: ICO header (6B) + directory entries (16B each) + PNG data blocks.
// We embed the same PNG at standard sizes (256, 128, 64, 48, 32, 16).
// Windows handles scaling from the provided PNG at each entry.
function buildIcoFromPng(pngData: Buffer): Buffer {
  const sizes = [256, 128, 64, 48, 32, 16]

  // ICO header: reserved(2) + type(2, 1=ICO) + count(2)
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0)          // reserved
  header.writeUInt16LE(1, 2)          // type = ICO
  header.writeUInt16LE(sizes.length, 4) // image count

  // Directory entries come right after header, then PNG data blocks
  const dirEntrySize = 16
  const dataOffset = 6 + dirEntrySize * sizes.length

  const dirEntries: Buffer[] = []
  let currentOffset = dataOffset

  for (const size of sizes) {
    const entry = Buffer.alloc(16)
    // width/height: 0 means 256 in ICO format
    entry.writeUInt8(size >= 256 ? 0 : size, 0)   // width
    entry.writeUInt8(size >= 256 ? 0 : size, 1)   // height
    entry.writeUInt8(0, 2)                          // color palette count
    entry.writeUInt8(0, 3)                          // reserved
    entry.writeUInt16LE(1, 4)                       // color planes
    entry.writeUInt16LE(32, 6)                      // bits per pixel
    entry.writeUInt32LE(pngData.length, 8)          // image data size
    entry.writeUInt32LE(currentOffset, 12)          // offset to image data
    dirEntries.push(entry)
    currentOffset += pngData.length
  }

  // Each size entry points to the same PNG data (Windows scales as needed)
  const pngBlocks = sizes.map(() => pngData)

  return Buffer.concat([header, ...dirEntries, ...pngBlocks])
}

function convertToIco({
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

  const ico = buildIcoFromPng(pngData)
  fs.writeFileSync(outputPath, ico)
}

// Generate the C source for the Windows launcher. This tiny program hides the console
// window (via WinMain + windows subsystem) and launches wezterm-gui.exe with the
// baked config file. All WezTerm/extension files live in a runtime/ subdirectory so
// the user only sees the launcher .exe at the top level. Cross-compiled with `zig cc`.
function generateLauncherC(): string {
  return `\
#define WIN32_LEAN_AND_MEAN
#include <windows.h>
#include <wchar.h>

int WINAPI WinMain(HINSTANCE hInstance, HINSTANCE hPrevInstance, LPSTR lpCmdLine, int nCmdShow) {
    (void)hInstance; (void)hPrevInstance; (void)lpCmdLine; (void)nCmdShow;

    WCHAR dir[MAX_PATH];
    GetModuleFileNameW(NULL, dir, MAX_PATH);
    /* Strip executable name to get the directory */
    for (int i = (int)wcslen(dir) - 1; i >= 0; i--) {
        if (dir[i] == L'\\\\') { dir[i + 1] = L'\\0'; break; }
    }

    WCHAR cmdline[MAX_PATH * 3];
    wsprintfW(cmdline,
        L"\\"%sruntime\\\\wezterm-gui.exe\\" --config-file \\"%sruntime\\\\config\\\\wezterm.lua\\"",
        dir, dir);

    STARTUPINFOW si;
    ZeroMemory(&si, sizeof(si));
    si.cb = sizeof(si);
    PROCESS_INFORMATION pi;
    ZeroMemory(&pi, sizeof(pi));

    if (!CreateProcessW(NULL, cmdline, NULL, NULL, FALSE, 0, NULL, NULL, &si, &pi)) {
        MessageBoxW(NULL, L"Failed to launch wezterm-gui.exe", L"Launch Error", 0x10);
        return 1;
    }
    CloseHandle(pi.hProcess);
    CloseHandle(pi.hThread);
    return 0;
}
`
}

// Generate the .rc resource file that embeds the icon into the launcher .exe.
// The icon ID 1 is used by Windows Explorer to display the app icon.
function generateLauncherRc({ icoPath }: { icoPath: string }): string {
  // Use forward slashes in the .rc file — the Windows resource compiler accepts them
  const normalizedPath = icoPath.replace(/\\/g, '/')
  return `1 ICON "${normalizedPath}"\n`
}

// Font/typography options passed through to the generated wezterm.lua config.
// All are optional — sensible defaults are used when omitted.
interface WeztermFontOptions {
  /** Font family name (e.g. 'Inter Mono', 'Fira Code'). Uses WezTerm built-in JetBrains Mono if unset. */
  fontFamily?: string
  /** Font size in points. Default: 14 */
  fontSize?: number
  /** Vertical line spacing multiplier. 1.0 = default, 1.2 = 20% more. Default: 1.2 */
  lineHeight?: number
  /** Horizontal cell width multiplier. 1.0 = default. Default: 1.0 */
  cellWidth?: number
  /** Whether bundled fonts exist in the fonts/ dir (enables font_dirs in config). */
  hasBundledFonts?: boolean
}

// Generate the font/typography portion of wezterm.lua, shared by macOS and Windows configs.
function generateFontConfig(opts: WeztermFontOptions): string {
  const fontSize = opts.fontSize ?? 14
  const lineHeight = opts.lineHeight ?? 1.3
  const cellWidth = opts.cellWidth ?? 1.05

  const lines: string[] = []
  lines.push(`-- Typography`)
  lines.push(`config.font_size = ${fontSize}`)
  lines.push(`config.line_height = ${lineHeight}`)
  if (cellWidth !== 1.0) {
    lines.push(`config.cell_width = ${cellWidth}`)
  }

  if (opts.fontFamily) {
    // Escape single quotes for Lua string literal
    const escapedFamily = opts.fontFamily.replace(/'/g, "\\'")
    lines.push(`config.font = wezterm.font '${escapedFamily}'`)
  }

  if (opts.hasBundledFonts) {
    lines.push(``)
    lines.push(`-- Load bundled fonts from the fonts/ directory next to this config`)
    lines.push(`config.font_dirs = { config_dir .. '/fonts' }`)
  }

  return lines.join('\n')
}

function generateWeztermConfig({ binaryName, font }: { binaryName: string; font?: WeztermFontOptions }): string {
  return `\
local wezterm = require 'wezterm'
local config = wezterm.config_builder()

local config_dir = wezterm.config_dir
config.default_prog = { config_dir .. '/${binaryName}' }

-- Strip all chrome
config.enable_tab_bar = false
config.window_decorations = 'RESIZE'
config.window_padding = { left = 0, right = 0, top = 0, bottom = 0 }

-- Default window size: 120x36 is comfortable for TUI apps (WezTerm default is 80x24)
config.initial_cols = 120
config.initial_rows = 36

-- Snap resize to cell grid
config.use_resize_increments = true

-- Kitty protocols
config.enable_kitty_graphics = true
config.enable_kitty_keyboard = true

-- Memory optimization: TUI controls its own scrolling
config.scrollback_lines = 0

-- Reduce font rasterizer memory (no ligatures needed in TUI)
config.harfbuzz_features = { 'calt=0', 'clig=0', 'liga=0' }

-- No cursor blink or visual bell animations needed
config.animation_fps = 1

${generateFontConfig(font ?? {})}

-- Crisp macOS rendering
config.front_end = 'WebGpu'
config.webgpu_power_preference = 'HighPerformance'
config.max_fps = 60
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

function generateLaunchScript({ weztermBinaryName }: { weztermBinaryName: string }): string {
  return `\
#!/bin/bash
DIR="$(cd "$(dirname "$0")" && pwd)"
exec "$DIR/${weztermBinaryName}" --config-file "$DIR/../Resources/wezterm.lua"
`
}

// Windows wezterm.lua: backslash paths, CTRL copy/paste (no SUPER/Cmd on Windows),
// Windows-style file quoting for drag-and-drop.
function generateWeztermConfigWindows({ binaryName, font }: { binaryName: string; font?: WeztermFontOptions }): string {
  return `\
local wezterm = require 'wezterm'
local config = wezterm.config_builder()

local config_dir = wezterm.config_dir
config.default_prog = { config_dir .. '\\\\..\\\\${binaryName}' }

-- Strip all chrome
config.enable_tab_bar = false
config.window_decorations = 'RESIZE'
config.window_padding = { left = 0, right = 0, top = 0, bottom = 0 }

-- Default window size: 120x36 is comfortable for TUI apps (WezTerm default is 80x24)
config.initial_cols = 120
config.initial_rows = 36

-- Snap resize to cell grid
config.use_resize_increments = true

-- Kitty protocols
config.enable_kitty_graphics = true
config.enable_kitty_keyboard = true

-- Memory optimization: TUI controls its own scrolling
config.scrollback_lines = 0

-- Reduce font rasterizer memory (no ligatures needed in TUI)
config.harfbuzz_features = { 'calt=0', 'clig=0', 'liga=0' }

-- No cursor blink or visual bell animations needed
config.animation_fps = 1

${generateFontConfig(font ?? {})}

-- Rendering
config.front_end = 'WebGpu'
config.webgpu_power_preference = 'HighPerformance'
config.max_fps = 60
config.freetype_render_target = 'HorizontalLcd'
config.freetype_load_target = 'Light'

-- Termcast controls all key bindings.
-- On Windows there is no SUPER/Cmd modifier, so use CTRL for copy/paste.
config.disable_default_key_bindings = true
config.keys = {
  { key = 'c', mods = 'CTRL', action = wezterm.action.CopyTo 'Clipboard' },
  { key = 'v', mods = 'CTRL', action = wezterm.action.PasteFrom 'Clipboard' },
}

config.quote_dropped_files = 'Windows'

return config
`
}

// Generate an NSIS installer script (.nsi) for a Windows app folder.
// NSIS (Nullsoft Scriptable Install System) cross-compiles on macOS via `makensis`.
// The installer:
//   - Copies all files from the app folder to Program Files
//   - Creates Start Menu shortcuts (launcher exe + uninstaller)
//   - Creates a Desktop shortcut for the launcher
//   - Registers uninstaller in Windows Add/Remove Programs
//   - Embeds the app icon in installer/uninstaller/shortcuts
// RequestExecutionLevel admin is required for Program Files write access.
function generateNsisScript({
  appName,
  safeName,
  version,
  appDir,
  launcherExeName,
  icoPath,
  outFile,
}: {
  appName: string
  safeName: string
  version: string
  appDir: string
  launcherExeName: string
  icoPath?: string
  /** Absolute path for the output installer exe. */
  outFile: string
}): string {
  // NSIS !define MUI_ICON uses build-host paths (POSIX on macOS/Linux).
  // Do NOT convert to backslashes — makensis reads source files using host OS paths.
  const iconDirective = icoPath
    ? `!define MUI_ICON "${icoPath}"\n!define MUI_UNICON "${icoPath}"`
    : ''

  // Escape special NSIS characters in display strings.
  // NSIS treats $ as variable prefix and " as string delimiter.
  const escapeNsis = (s: string): string => {
    return s.replace(/\$/g, '$$$$').replace(/"/g, '$\\"')
  }
  const safeAppName = escapeNsis(appName)
  const safeSafeName = escapeNsis(safeName)

  // Collect all files from the app folder to generate File commands.
  // We recursively walk the directory and emit SetOutPath + File for each subdir.
  // File paths in the install section are build-host paths (POSIX) — makensis
  // reads them on the host OS. Install-target paths ($INSTDIR\...) use backslashes.
  const installFileCommands: string[] = []
  const uninstallFileCommands: string[] = []
  const uninstallDirCommands: string[] = []

  const walkDir = (dir: string, relPrefix: string) => {
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    const files = entries.filter((e) => !e.isDirectory())
    const dirs = entries.filter((e) => e.isDirectory())

    if (files.length > 0) {
      installFileCommands.push(`  SetOutPath "$INSTDIR${relPrefix ? '\\' + relPrefix : ''}"`)
      for (const file of files) {
        // Build-host path: keep POSIX slashes for makensis to read the file
        const fullPath = path.join(dir, file.name)
        installFileCommands.push(`  File "${fullPath}"`)
        uninstallFileCommands.push(`  Delete "$INSTDIR${relPrefix ? '\\' + relPrefix : ''}\\${file.name}"`)
      }
    }

    for (const subdir of dirs) {
      const newRel = relPrefix ? `${relPrefix}\\${subdir.name}` : subdir.name
      walkDir(path.join(dir, subdir.name), newRel)
    }

    // Post-order: push AFTER recursing into children, so children dirs
    // appear earlier in the array and get removed first by RMDir.
    if (relPrefix) {
      uninstallDirCommands.push(`  RMDir "$INSTDIR\\${relPrefix}"`)
    }
  }

  walkDir(appDir, '')

  return `\
; NSIS installer script for ${safeAppName}
; Generated by termcast app build. Do not edit manually.
Unicode True
!include "MUI2.nsh"

Name "${safeAppName}"
OutFile "${outFile}"
InstallDir "$PROGRAMFILES64\\${safeAppName}"
InstallDirRegKey HKLM "Software\\${safeSafeName}" "InstallDir"
RequestExecutionLevel admin

${iconDirective}

!define MUI_ABORTWARNING

; Pages
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES

!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES

!insertmacro MUI_LANGUAGE "English"

Section "Install"
  SetShellVarContext all

${installFileCommands.join('\n')}

  ; Store install dir in registry
  WriteRegStr HKLM "Software\\${safeSafeName}" "InstallDir" "$INSTDIR"

  ; Create uninstaller
  WriteUninstaller "$INSTDIR\\Uninstall.exe"

  ; Add/Remove Programs entry
  WriteRegStr HKLM "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\${safeSafeName}" "DisplayName" "${safeAppName}"
  WriteRegStr HKLM "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\${safeSafeName}" "UninstallString" '"$INSTDIR\\Uninstall.exe"'
  WriteRegStr HKLM "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\${safeSafeName}" "DisplayVersion" "${version}"
  WriteRegStr HKLM "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\${safeSafeName}" "Publisher" "termcast"
${icoPath ? `  WriteRegStr HKLM "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\${safeSafeName}" "DisplayIcon" "$INSTDIR\\${launcherExeName}"` : ''}
  WriteRegDWORD HKLM "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\${safeSafeName}" "NoModify" 1
  WriteRegDWORD HKLM "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\${safeSafeName}" "NoRepair" 1

  ; Start Menu shortcuts
  CreateDirectory "$SMPROGRAMS\\${safeAppName}"
  CreateShortcut "$SMPROGRAMS\\${safeAppName}\\${safeAppName}.lnk" "$INSTDIR\\${launcherExeName}"
  CreateShortcut "$SMPROGRAMS\\${safeAppName}\\Uninstall ${safeAppName}.lnk" "$INSTDIR\\Uninstall.exe"

  ; Desktop shortcut
  CreateShortcut "$DESKTOP\\${safeAppName}.lnk" "$INSTDIR\\${launcherExeName}"
SectionEnd

Section "Uninstall"
  SetShellVarContext all

${uninstallFileCommands.join('\n')}
  Delete "$INSTDIR\\Uninstall.exe"

${uninstallDirCommands.join('\n')}
  RMDir "$INSTDIR"

  ; Remove Start Menu shortcuts
  Delete "$SMPROGRAMS\\${safeAppName}\\${safeAppName}.lnk"
  Delete "$SMPROGRAMS\\${safeAppName}\\Uninstall ${safeAppName}.lnk"
  RMDir "$SMPROGRAMS\\${safeAppName}"

  ; Remove Desktop shortcut
  Delete "$DESKTOP\\${safeAppName}.lnk"

  ; Remove registry keys
  DeleteRegKey HKLM "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\${safeSafeName}"
  DeleteRegKey HKLM "Software\\${safeSafeName}"
SectionEnd
`
}

// Build an NSIS installer (.exe) from the assembled app folder.
// Writes a temp .nsi script, runs makensis to compile it, and returns the
// path to the resulting Setup exe. Requires `makensis` in PATH (brew install nsis).
async function buildNsisInstaller({
  appName,
  safeName,
  version,
  appDir,
  launcherExeName,
  icoPath,
  distDir,
}: {
  appName: string
  safeName: string
  version: string
  appDir: string
  launcherExeName: string
  icoPath?: string
  distDir: string
}): Promise<string> {
  const installerExeName = `${safeName}-Setup-x64.exe`
  const installerPath = path.join(distDir, installerExeName)

  const nsiScript = generateNsisScript({
    appName,
    safeName,
    version,
    appDir,
    launcherExeName,
    icoPath,
    outFile: installerPath,
  })

  const buildTmpDir = path.join(distDir, `.nsis-tmp-${process.pid}`)
  fs.mkdirSync(buildTmpDir, { recursive: true })

  const nsiPath = path.join(buildTmpDir, 'installer.nsi')
  fs.writeFileSync(nsiPath, nsiScript)

  console.log('Building NSIS installer...')
  try {
    await execFileAsync('makensis', [nsiPath])
  } catch (e) {
    // makensis might not be installed — warn but don't fail the build
    const msg = e instanceof Error ? e.message : String(e)
    if (msg.includes('ENOENT') || msg.includes('not found')) {
      console.log('Warning: makensis not found. Install NSIS to generate Windows installers:')
      console.log('  macOS:  brew install nsis')
      console.log('  Linux:  apt install nsis')
      return ''
    }
    throw new Error(`NSIS installer build failed`, { cause: e })
  } finally {
    fs.rmSync(buildTmpDir, { recursive: true, force: true })
  }

  const installerSize = fs.statSync(installerPath).size
  console.log(`Installer: ${installerExeName} (${(installerSize / 1024 / 1024).toFixed(1)}MB)`)
  return installerPath
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
  /** Target OS: 'darwin' | 'linux' | 'win32'. */
  platform?: CompileTarget['os']
  /** Target arch: 'arm64' | 'x64'. Defaults to current machine arch. */
  arch?: CompileTarget['arch']
  /** Skip NSIS installer generation on Windows (default: false, installer is built). */
  noInstaller?: boolean
  /** Font family name to use (e.g. 'Inter Mono'). Default: WezTerm built-in JetBrains Mono. */
  fontFamily?: string
  /** Directory of .ttf/.otf font files to bundle in the app. Enables font_dirs in wezterm config. */
  fontDir?: string
  /** Font size in points. Default: 14 */
  fontSize?: number
  /** Line height multiplier. 1.0 = tight, 1.2 = comfortable. Default: 1.2 */
  lineHeight?: number
}

export interface BuildAppResult {
  appPath: string
  appName: string
  /** Path to NSIS installer exe (Windows only, absent if --no-installer or makensis missing). */
  installerPath?: string
}

// Shared setup for all platforms: resolve paths, read package.json, compile extension.
interface ResolvedBuildContext {
  resolvedPath: string
  extensionName: string
  appName: string
  safeName: string
  version: string
  resolvedArch: CompileTarget['arch']
  target: CompileTarget
  distDir: string
  compileResult: { outfile: string }
  iconPng: string
  packageJson: Record<string, string>
  resolvedBundleId: string
  fontOptions: WeztermFontOptions
  /** Resolved absolute path to font directory, if provided and exists. */
  fontDirPath?: string
}

async function resolveBuildContext({
  extensionPath,
  name,
  icon,
  bundleId,
  entry,
  platform,
  arch,
  fontFamily,
  fontDir,
  fontSize,
  lineHeight,
}: BuildAppOptions & { platform: CompileTarget['os'] }): Promise<ResolvedBuildContext> {
  const resolvedPath = path.resolve(extensionPath)

  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`Extension path does not exist: ${resolvedPath}`)
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
  // For Windows x64, always use baseline (no AVX2 requirement) so the app runs on
  // all x64 CPUs. The default bun-windows-x64 target requires AVX2 (Haswell 2013+)
  // which causes silent crashes on older machines.
  const avx2 = platform === 'win32' ? false as const : undefined
  const target: CompileTarget = { os: platform, arch: resolvedArch, avx2 }

  console.log(`Building app "${appName}" for ${platform}-${resolvedArch}...`)

  // Compile the termcast extension
  console.log(`Compiling termcast extension...`)
  const distDir = path.join(resolvedPath, 'dist')
  fs.mkdirSync(distDir, { recursive: true })
  const distGitignore = path.join(distDir, '.gitignore')
  if (!fs.existsSync(distGitignore)) {
    fs.writeFileSync(distGitignore, '*\n')
  }
  // Bun.build with compile appends .exe for Windows targets, so include it in the path
  const exeSuffix = platform === 'win32' ? '.exe' : ''
  const compiledBinaryPath = path.join(distDir, `${extensionName}-app-binary-${resolvedArch}${exeSuffix}`)

  const compileResult = await compileExtension({
    extensionPath: resolvedPath,
    outfile: compiledBinaryPath,
    minify: true,
    target,
    entry,
  })

  const iconPng = resolveIcon({
    extensionPath: resolvedPath,
    iconOverride: icon,
    packageJson,
  })

  // Replace slashes, spaces, and other problematic chars with hyphens.
  // Spaces in filenames break PowerShell (WezTerm's default shell on Windows)
  // because PowerShell splits unquoted paths on whitespace.
  const safeName = appName.replace(/[/\\\s]+/g, '-').replace(/^-+|-+$/g, '')

  // Resolve font directory: --font-dir flag, or fonts/ in extension root.
  // --font-dir is resolved relative to the extension path (not cwd) for consistency.
  const fontDirPath = (() => {
    if (fontDir) {
      const resolved = path.isAbsolute(fontDir)
        ? fontDir
        : path.resolve(resolvedPath, fontDir)
      if (!fs.existsSync(resolved)) {
        throw new Error(`Font directory not found: ${resolved}`)
      }
      if (!fs.statSync(resolved).isDirectory()) {
        throw new Error(`--font-dir must be a directory, not a file: ${resolved}`)
      }
      return resolved
    }
    // Auto-detect fonts/ directory in extension root
    const defaultFontDir = path.join(resolvedPath, 'fonts')
    if (fs.existsSync(defaultFontDir) && fs.statSync(defaultFontDir).isDirectory()) {
      return defaultFontDir
    }
    return undefined
  })()

  const fontOptions: WeztermFontOptions = {
    fontFamily,
    fontSize,
    lineHeight,
    hasBundledFonts: !!fontDirPath,
  }

  return {
    resolvedPath,
    extensionName,
    appName,
    safeName,
    version,
    resolvedArch,
    target,
    distDir,
    compileResult,
    iconPng,
    packageJson,
    resolvedBundleId,
    fontOptions,
    fontDirPath,
  }
}

export async function buildApp(options: BuildAppOptions): Promise<BuildAppResult> {
  const resolvedPlatform = options.platform || (process.platform as CompileTarget['os'])

  if (resolvedPlatform === 'darwin') {
    return buildDarwinApp(options, resolvedPlatform)
  }
  if (resolvedPlatform === 'win32') {
    return buildWin32App(options, resolvedPlatform)
  }

  throw new Error(
    `Platform "${resolvedPlatform}" is not supported yet. Supported: darwin, win32.`,
  )
}

// ── macOS .app bundle ────────────────────────────────────────────────────────

async function buildDarwinApp(
  options: BuildAppOptions,
  resolvedPlatform: 'darwin',
): Promise<BuildAppResult> {
  const ctx = await resolveBuildContext({ ...options, platform: resolvedPlatform })

  // Download/cache WezTerm and thin to target arch (~65MB instead of ~130MB)
  const weztermBinary = await getWeztermBinary({ arch: ctx.resolvedArch })

  // Assemble .app bundle
  const archSuffix = ctx.resolvedArch === 'x64' ? 'x86_64' : 'arm64'
  const appDir = path.join(ctx.distDir, `${ctx.safeName}-${archSuffix}.app`)

  if (fs.existsSync(appDir)) {
    fs.rmSync(appDir, { recursive: true, force: true })
  }

  const macosDir = path.join(appDir, 'Contents', 'MacOS')
  const resourcesDir = path.join(appDir, 'Contents', 'Resources')
  fs.mkdirSync(macosDir, { recursive: true })
  fs.mkdirSync(resourcesDir, { recursive: true })

  console.log('Assembling .app bundle...')

  // Copy wezterm-gui binary renamed to the app name so macOS Activity Monitor
  // shows the app name instead of "wezterm-gui" (exec replaces the process image,
  // and the OS derives the display name from the binary filename).
  const weztermBinaryName = ctx.safeName
  fs.copyFileSync(weztermBinary, path.join(macosDir, weztermBinaryName))
  fs.chmodSync(path.join(macosDir, weztermBinaryName), 0o755)

  // Copy compiled extension binary
  const binaryName = ctx.extensionName
  fs.copyFileSync(ctx.compileResult.outfile, path.join(resourcesDir, binaryName))
  fs.chmodSync(path.join(resourcesDir, binaryName), 0o755)

  // Bundle custom fonts if a font directory was provided/detected.
  // Copies all .ttf/.otf files into Resources/fonts/ so wezterm's font_dirs can find them.
  if (ctx.fontDirPath) {
    const bundledFontsDir = path.join(resourcesDir, 'fonts')
    fs.mkdirSync(bundledFontsDir, { recursive: true })
    const fontFiles = fs.readdirSync(ctx.fontDirPath).filter((f) => {
      return /\.(ttf|otf|woff2?)$/i.test(f)
    })
    for (const fontFile of fontFiles) {
      fs.copyFileSync(
        path.join(ctx.fontDirPath, fontFile),
        path.join(bundledFontsDir, fontFile),
      )
    }
    console.log(`Bundled ${fontFiles.length} font file(s)`)
  }

  // Write config, launch script
  fs.writeFileSync(
    path.join(resourcesDir, 'wezterm.lua'),
    generateWeztermConfig({ binaryName, font: ctx.fontOptions }),
  )

  const launchPath = path.join(macosDir, 'launch')
  fs.writeFileSync(launchPath, generateLaunchScript({ weztermBinaryName }))
  fs.chmodSync(launchPath, 0o755)

  // Convert and write icon, then write Info.plist with the correct icon filename
  let iconFile = 'app.icns'
  const icnsPath = path.join(resourcesDir, 'app.icns')
  try {
    convertToIcns({ pngPath: ctx.iconPng, outputPath: icnsPath })
  } catch (e) {
    console.log(`Warning: could not convert icon to .icns (${e instanceof Error ? e.message : e}), copying PNG as fallback`)
    iconFile = 'app.png'
    fs.copyFileSync(ctx.iconPng, path.join(resourcesDir, iconFile))
  }

  fs.writeFileSync(
    path.join(appDir, 'Contents', 'Info.plist'),
    generateInfoPlist({ appName: ctx.safeName, bundleId: ctx.resolvedBundleId, version: ctx.version, iconFile }),
  )

  // Clean up intermediate compiled binary + sourcemap
  fs.rmSync(ctx.compileResult.outfile, { force: true })
  fs.rmSync(ctx.compileResult.outfile + '.map', { force: true })

  // Ad-hoc sign — only on macOS where codesign is available.
  // The wezterm-gui binary's original signature is invalid in the new bundle.
  if (process.platform === 'darwin') {
    console.log('Ad-hoc signing...')
    await execFileAsync('codesign', ['--force', '--deep', '-s', '-', appDir])
  } else {
    console.log('Skipping ad-hoc signing (not on macOS). Sign manually before distributing.')
  }

  const appSize = getDirectorySize(appDir)
  console.log(`\nBuilt: ${appDir} (${(appSize / 1024 / 1024).toFixed(0)}MB)`)

  if (options.release) {
    await uploadToRelease({
      extensionPath: ctx.resolvedPath,
      extensionName: ctx.extensionName,
      appDir,
      appName: ctx.safeName,
      arch: ctx.resolvedArch,
      platform: 'darwin',
    })
  }

  return { appPath: appDir, appName: ctx.safeName }
}

// ── Windows folder bundle ────────────────────────────────────────────────────
// TODO: Windows standalone executables compiled with Bun --compile segfault on
// launch. This is a known Bun bug (not our code), tracked across multiple issues:
//   https://github.com/oven-sh/bun/issues/26862
//   https://github.com/oven-sh/bun/issues/26853
//   https://github.com/oven-sh/bun/issues/17406
// Crash report: https://bun.report/1.3.9/w_1cf6cdbbEggggCq6l3vCA2AoxG
//   panic(main thread): Segmentation fault at address 0xD14
//   Bun v1.3.9 on windows x86_64, Features: standalone_executable, jsc
// Until Bun fixes this, Windows app builds will produce a valid folder structure
// but the extension binary will crash on launch. Possible workaround: ship bun.exe
// + the JS bundle instead of a compiled standalone exe.
//
// Produces a clean folder where the user only sees the launcher exe at root.
// All WezTerm/extension files live in runtime/ so it's obvious what to click.
//   MyApp/
//     MyApp.exe             ← tiny Zig-compiled launcher (hides console, has icon)
//     runtime/
//       wezterm-gui.exe     ← from WezTerm release
//       conpty.dll          ← required for PTY
//       OpenConsole.exe     ← required for PTY
//       libEGL.dll          ← ANGLE (WebGpu/OpenGL compat)
//       libGLESv2.dll       ← ANGLE
//       my-app.exe          ← compiled termcast extension binary
//       config/
//         wezterm.lua       ← baked config

async function buildWin32App(
  options: BuildAppOptions,
  resolvedPlatform: 'win32',
): Promise<BuildAppResult> {
  const ctx = await resolveBuildContext({ ...options, platform: resolvedPlatform })

  // Only x64 is supported for Windows (WezTerm doesn't ship arm64 Windows builds)
  if (ctx.resolvedArch !== 'x64') {
    throw new Error(
      `Windows app build only supports x64 architecture. WezTerm does not ship arm64 Windows binaries.`,
    )
  }

  // Download/cache WezTerm Windows files
  const weztermFiles = await downloadWeztermWindows()

  // Assemble folder structure: launcher at root, everything else in runtime/
  const appDir = path.join(ctx.distDir, ctx.safeName)

  if (fs.existsSync(appDir)) {
    fs.rmSync(appDir, { recursive: true, force: true })
  }

  const runtimeDir = path.join(appDir, 'runtime')
  const configDir = path.join(runtimeDir, 'config')
  fs.mkdirSync(configDir, { recursive: true })

  console.log('Assembling Windows app folder...')

  // Copy WezTerm files into runtime/ (wezterm-gui.exe, conpty.dll, OpenConsole.exe, ANGLE DLLs)
  for (const [name, cachedPath] of weztermFiles) {
    fs.copyFileSync(cachedPath, path.join(runtimeDir, name))
  }

  // Copy compiled extension binary into runtime/ (with .exe extension)
  const binaryName = ctx.extensionName + '.exe'
  fs.copyFileSync(ctx.compileResult.outfile, path.join(runtimeDir, binaryName))

  // Bundle custom fonts if a font directory was provided/detected.
  // Copies all .ttf/.otf files into runtime/fonts/ so wezterm's font_dirs can find them.
  if (ctx.fontDirPath) {
    const bundledFontsDir = path.join(configDir, 'fonts')
    fs.mkdirSync(bundledFontsDir, { recursive: true })
    const fontFiles = fs.readdirSync(ctx.fontDirPath).filter((f) => {
      return /\.(ttf|otf|woff2?)$/i.test(f)
    })
    for (const fontFile of fontFiles) {
      fs.copyFileSync(
        path.join(ctx.fontDirPath, fontFile),
        path.join(bundledFontsDir, fontFile),
      )
    }
    console.log(`Bundled ${fontFiles.length} font file(s)`)
  }

  // Write wezterm.lua config
  fs.writeFileSync(
    path.join(configDir, 'wezterm.lua'),
    generateWeztermConfigWindows({ binaryName, font: ctx.fontOptions }),
  )

  // Build the launcher .exe with Zig cross-compilation:
  // 1. Write launcher.c source
  // 2. Convert PNG icon to .ico
  // 3. Write .rc resource file referencing the .ico
  // 4. Cross-compile with: zig cc launcher.c launcher.rc -o MyApp.exe
  //    targeting x86_64-windows-gnu with --subsystem windows
  const buildTmpDir = path.join(ctx.distDir, `.win-build-tmp-${process.pid}`)
  fs.mkdirSync(buildTmpDir, { recursive: true })

  // Persist the .ico in a dedicated temp dir (NOT inside appDir, to avoid it being
  // included in the NSIS installer payload during folder walk).
  const icoTmpDir = path.join(ctx.distDir, `.ico-tmp-${process.pid}`)
  fs.mkdirSync(icoTmpDir, { recursive: true })
  const persistedIcoPath = path.join(icoTmpDir, 'app.ico')
  let hasIcon = false

  try {
    const launcherCPath = path.join(buildTmpDir, 'launcher.c')
    fs.writeFileSync(launcherCPath, generateLauncherC())

    // Convert PNG → ICO → RC → RES for icon embedding.
    // zig rc compiles .rc to .res, then zig cc links .res into the exe.
    const icoPath = path.join(buildTmpDir, 'app.ico')
    const rcPath = path.join(buildTmpDir, 'launcher.rc')
    const resPath = path.join(buildTmpDir, 'launcher.res')

    try {
      convertToIco({ pngPath: ctx.iconPng, outputPath: icoPath })
      // Also persist for NSIS (the buildTmpDir gets cleaned up)
      fs.copyFileSync(icoPath, persistedIcoPath)
      fs.writeFileSync(rcPath, generateLauncherRc({ icoPath }))
      await execFileAsync('zig', ['rc', rcPath, resPath])
      hasIcon = true
    } catch (e) {
      console.log(`Warning: could not build icon resource (${e instanceof Error ? e.message : e}), launcher will have no custom icon`)
    }

    const launcherExePath = path.join(appDir, `${ctx.safeName}.exe`)

    // Zig cross-compiles C to Windows x64 from any host platform.
    // -Wl,--subsystem,windows hides the console window on launch (GUI subsystem).
    // -Os optimizes for size, -s strips symbols. Result is ~19-29KB.
    const zigArgs = [
      'cc',
      launcherCPath,
      ...(hasIcon ? [resPath] : []),
      '-o', launcherExePath,
      '-target', 'x86_64-windows-gnu',
      '-Os',
      '-s',
      '-Wl,--subsystem,windows',
    ]

    console.log('Cross-compiling Windows launcher with Zig...')
    await execFileAsync('zig', zigArgs)

    const launcherSize = fs.statSync(launcherExePath).size
    console.log(`Launcher: ${ctx.safeName}.exe (${(launcherSize / 1024).toFixed(0)}KB)`)
  } finally {
    // Clean up build temp directory
    fs.rmSync(buildTmpDir, { recursive: true, force: true })
  }

  // Clean up intermediate compiled binary + sourcemap
  fs.rmSync(ctx.compileResult.outfile, { force: true })
  fs.rmSync(ctx.compileResult.outfile + '.map', { force: true })

  const appSize = getDirectorySize(appDir)
  console.log(`\nBuilt: ${appDir} (${(appSize / 1024 / 1024).toFixed(0)}MB)`)

  // Build NSIS installer by default. Skip with --no-installer.
  // Always clean up the .ico temp dir afterward, even if NSIS fails.
  const launcherExeName = `${ctx.safeName}.exe`
  let installerPath: string | undefined
  try {
    if (!options.noInstaller) {
      const result = await buildNsisInstaller({
        appName: ctx.appName,
        safeName: ctx.safeName,
        version: ctx.version,
        appDir,
        launcherExeName,
        icoPath: hasIcon ? persistedIcoPath : undefined,
        distDir: ctx.distDir,
      })
      if (result) {
        installerPath = result
      }
    }
  } finally {
    fs.rmSync(icoTmpDir, { recursive: true, force: true })
  }

  if (options.release) {
    await uploadToRelease({
      extensionPath: ctx.resolvedPath,
      extensionName: ctx.extensionName,
      appDir,
      appName: ctx.safeName,
      arch: ctx.resolvedArch,
      platform: 'win32',
      installerPath,
    })
  }

  return { appPath: appDir, appName: ctx.safeName, installerPath }
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
  platform,
  installerPath,
}: {
  extensionPath: string
  extensionName: string
  appDir: string
  appName: string
  arch: CompileTarget['arch']
  platform: CompileTarget['os']
  installerPath?: string
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

  // Zip the app bundle using JSZip (cross-platform).
  // Platform name in the zip: darwin, windows (not win32).
  const platformName = platform === 'win32' ? 'windows' : platform
  const zipName = `${appName}-${platformName}-${arch}.zip`
  const zipPath = path.join(distDir, zipName)
  fs.rmSync(zipPath, { force: true })

  const JSZip = (await import('jszip')).default
  const zip = new JSZip()
  const appBasename = path.basename(appDir)

  // Use UNIX platform for macOS (preserves executable permissions) and DOS for Windows
  const zipPlatform = platform === 'win32' ? 'DOS' : 'UNIX'

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
    platform: zipPlatform as 'UNIX' | 'DOS',
  })
  fs.writeFileSync(zipPath, zipBuffer)
  console.log(`Created ${zipName}`)

  await execFileAsync('gh', ['release', 'upload', latestTag, zipPath, '--clobber'], {
    cwd: extensionPath,
  })

  console.log(`Uploaded ${zipName} to release ${latestTag}`)
  fs.unlinkSync(zipPath)

  // Upload NSIS installer alongside the zip if available
  if (installerPath && fs.existsSync(installerPath)) {
    const installerName = path.basename(installerPath)
    await execFileAsync('gh', ['release', 'upload', latestTag, installerPath, '--clobber'], {
      cwd: extensionPath,
    })
    console.log(`Uploaded ${installerName} to release ${latestTag}`)
  }
}
