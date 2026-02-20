---
title: Standalone Termcast App Distribution
description: |
  Plan for distributing termcast TUI apps as standalone desktop apps
  by wrapping pre-built WezTerm binaries. No fork needed.
  Covers packaging, CLI commands, download page, and cross-platform support.
---

# Standalone Termcast App Distribution

Wrap pre-built WezTerm binaries to distribute termcast TUI apps as native
desktop apps. Non-technical users double-click to launch — no terminal
knowledge required. Mouse support makes these work like normal GUI apps.

WezTerm is MIT licensed, redistribution is fully allowed.

## Architecture

Each app is a self-contained bundle:
- WezTerm `wezterm-gui` binary (from official release, ~65-130MB)
- A `wezterm.lua` config that launches the termcast extension
- The compiled termcast extension binary
- A thin launcher that passes `--config-file` to `wezterm-gui`
- Custom icon and app metadata

Multiple apps run fully isolated: WezTerm auto-isolates when
`--config-file` is used (sets `CONFIG_FILE_OVERRIDE` →
`is_config_overridden()` returns true → `NoConnectNoPublish`).
Each process gets its own `gui-sock-{pid}` Unix socket, no cross-connect.

## CLI Commands

### `termcast app build`

Packages a termcast extension into a standalone desktop app.

```bash
termcast app build \
  --name "My App" \
  --icon ./icon.png \
  --bundle-id com.author.myapp
```

Steps:
1. Compiles the termcast extension into a single binary
2. Downloads/caches `wezterm-gui` from official WezTerm release
3. Generates `wezterm.lua` config pointing to the extension binary
4. Generates platform launcher (shell script / .exe)
5. Generates platform metadata (Info.plist / .desktop)
6. Converts icon (PNG → `.icns` on macOS, → `.ico` on Windows)
7. Assembles the bundle into a zip

Output: `dist/MyApp-{platform}-{arch}.zip`

### `termcast app build --release`

Same as above, but also uploads the app zips as GitHub release assets
alongside the regular termcast release artifacts.

```bash
termcast app build --release
```

This attaches to the current release (or creates one):
- `MyApp-macos-universal.zip`
- `MyApp-windows-x64.zip`
- `MyApp-linux-x64.AppImage`

Developers add this to their existing CI release workflow.

### `termcast app sign` (low priority, later)

Code signing is deferred. See the Code Signing section below for the full
plan. For now, apps ship unsigned:
- macOS: users right-click → Open on first launch (or `xattr -cr`)
- Windows: users click "More info" → "Run anyway" on SmartScreen
- Linux: no signing needed

This is acceptable for early adopters and developer-audience apps.
Signing becomes important when targeting non-technical end users at scale.

## Download Page

Each termcast app can have an HTML download page hosted anywhere (GitHub
Pages, termcast.app, personal site). The page detects the user's platform
and offers the right download.

The page fetches release assets from the GitHub API to find download URLs.

```html
<!DOCTYPE html>
<html>
<head>
  <title>My App — Download</title>
  <style>
    body { font-family: system-ui; max-width: 600px; margin: 80px auto; text-align: center; }
    .btn { display: inline-block; padding: 16px 32px; background: #f60; color: white;
           border-radius: 8px; text-decoration: none; font-size: 18px; font-weight: 600; }
    .btn:hover { background: #e50; }
    .alt { margin-top: 24px; color: #666; font-size: 14px; }
    .alt a { color: #333; }
  </style>
</head>
<body>
  <h1>My App</h1>
  <p>A short description of what the app does.</p>
  <a id="download" class="btn" href="#">Download for your platform</a>
  <div class="alt">
    Also available for
    <a id="alt-mac" href="#">macOS</a> ·
    <a id="alt-win" href="#">Windows</a> ·
    <a id="alt-linux" href="#">Linux</a>
  </div>

  <script>
    const REPO = 'owner/my-termcast-app'
    const APP_NAME = 'MyApp'

    async function main() {
      const res = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`)
      const release = await res.json()
      const assets = release.assets || []

      const urls = {
        mac: assets.find(a => a.name.includes('macos'))?.browser_download_url,
        win: assets.find(a => a.name.includes('windows'))?.browser_download_url,
        linux: assets.find(a => a.name.includes('linux'))?.browser_download_url,
      }

      // Detect platform
      const ua = navigator.userAgent.toLowerCase()
      const platform = ua.includes('mac') ? 'mac' : ua.includes('win') ? 'win' : 'linux'
      const labels = { mac: 'macOS', win: 'Windows', linux: 'Linux' }

      const btn = document.getElementById('download')
      btn.href = urls[platform] || '#'
      btn.textContent = `Download for ${labels[platform]}`

      document.getElementById('alt-mac').href = urls.mac || '#'
      document.getElementById('alt-win').href = urls.win || '#'
      document.getElementById('alt-linux').href = urls.linux || '#'
    }
    main()
  </script>
</body>
</html>
```

This page can be:
- A static `index.html` in the repo, deployed via GitHub Pages
- Hosted on termcast.app as a per-app landing page
- Embedded in any website

The GitHub API provides download URLs directly — no server needed.

## Distribution Format

**Zips of the app bundle**, same as WezTerm does.

| Platform | Format | Contents | User action |
|---|---|---|---|
| macOS | `.zip` | `MyApp.app/` bundle | Unzip, drag to Applications |
| Windows | `.zip` | `MyApp/` folder with launcher | Unzip, run `MyApp.exe` |
| Linux | `.AppImage` | Single executable file | `chmod +x`, double-click |

All transformations are baked into the bundle:
- Config lives inside the bundle
- Launcher passes `--config-file` to `wezterm-gui`
- No system-level install, no registry changes, no PATH modifications

## Platform-Specific Bundles

### macOS (.app in .zip)

```
MyApp.app/
  Contents/
    Info.plist
    MacOS/
      launch              ← CFBundleExecutable, tiny shell script
      wezterm-gui         ← from WezTerm release (130MB universal)
    Resources/
      app.icns            ← custom icon (converted from PNG)
      wezterm.lua         ← baked config
      my-app              ← compiled termcast extension binary
```

**launch** script:
```bash
#!/bin/bash
DIR="$(cd "$(dirname "$0")" && pwd)"
exec "$DIR/wezterm-gui" --config-file "$DIR/../Resources/wezterm.lua"
```

**Info.plist**:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
  "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleExecutable</key>
  <string>launch</string>
  <key>CFBundleIdentifier</key>
  <string>com.author.myapp</string>
  <key>CFBundleName</key>
  <string>My App</string>
  <key>CFBundleDisplayName</key>
  <string>My App</string>
  <key>CFBundleIconFile</key>
  <string>app.icns</string>
  <key>CFBundlePackageType</key>
  <string>APPL</string>
  <key>CFBundleShortVersionString</key>
  <string>1.0.0</string>
  <key>NSHighResolutionCapable</key>
  <true/>
  <key>NSSupportsAutomaticGraphicsSwitching</key>
  <true/>
  <key>NSRequiresAquaSystemAppearance</key>
  <string>NO</string>
</dict>
</plist>
```

### Windows (folder in .zip)

```
MyApp/
  MyApp.exe               ← tiny compiled launcher (~100KB)
  wezterm-gui.exe         ← from WezTerm release
  config/
    wezterm.lua           ← baked config
  my-app.exe              ← compiled termcast extension binary
```

**MyApp.exe** launcher (compiled from small Rust program, has custom icon
embedded via resource compiler):
```rust
// Hides the console window on launch
#![windows_subsystem = "windows"]

fn main() {
    let dir = std::env::current_exe().unwrap()
        .parent().unwrap().to_owned();
    let config = dir.join("config").join("wezterm.lua");
    std::process::Command::new(dir.join("wezterm-gui.exe"))
        .arg("--config-file")
        .arg(&config)
        .spawn()
        .expect("failed to launch");
}
```

A compiled .exe launcher (not .bat) because:
- Non-technical users expect to click an .exe
- .bat files flash a console window
- .exe can have its own icon embedded
- `#![windows_subsystem = "windows"]` hides the console

Note: WezTerm checks for `wezterm.lua` next to the exe on Windows only
(config.rs:1025), but this does NOT trigger instance isolation. The
`--config-file` flag is required for multi-app isolation.

### Linux (AppImage)

```
MyApp-x86_64.AppImage     ← single file, chmod +x, run
  AppRun                  ← entry script
  wezterm-gui             ← from WezTerm release
  config/
    wezterm.lua
  my-app                  ← compiled termcast extension binary
  myapp.desktop           ← freedesktop entry
  myapp.png               ← icon
```

**AppRun** script:
```bash
#!/bin/bash
DIR="$(dirname "$(readlink -f "$0")")"
exec "$DIR/wezterm-gui" --config-file "$DIR/config/wezterm.lua"
```

## Baked wezterm.lua Config

```lua
local wezterm = require 'wezterm'
local config = wezterm.config_builder()

-- Resolve the termcast binary relative to config file
local config_dir = wezterm.config_dir
local sep = package.config:sub(1, 1)
local termcast_bin
if sep == '\\' then
  termcast_bin = config_dir .. '\\..\\my-app.exe'
else
  termcast_bin = config_dir .. '/my-app'
end

config.default_prog = { termcast_bin }

-- Strip all chrome
config.enable_tab_bar = false
config.window_decorations = 'RESIZE'
config.window_padding = { left = 0, right = 0, top = 0, bottom = 0 }

-- Snap resize to cell grid (no sub-character pixel gaps)
config.use_resize_increments = true

-- Kitty protocols
config.enable_kitty_graphics = true   -- images (default on)
config.enable_kitty_keyboard = true   -- progressive keyboard enhancement

-- Crisp rendering (macOS Metal backend)
config.front_end = 'WebGpu'
config.webgpu_power_preference = 'HighPerformance'
config.max_fps = 120
config.freetype_render_target = 'HorizontalLcd'
config.freetype_load_target = 'Light'

-- Termcast controls all key bindings
config.disable_default_key_bindings = true
config.keys = {
  -- Forward cmd+c/v to terminal via kitty keyboard protocol
  { key = 'c', mods = 'SUPER', action = wezterm.action.SendKey { key = 'c', mods = 'SUPER' } },
  { key = 'v', mods = 'SUPER', action = wezterm.action.SendKey { key = 'v', mods = 'SUPER' } },
  { key = 'q', mods = 'SUPER', action = wezterm.action.QuitApplication },
}

-- Drag-and-drop: POSIX-escape file paths pasted into PTY
config.quote_dropped_files = 'Posix'

return config
```

## WezTerm Binary Cache

`termcast app build` downloads `wezterm-gui` from official releases.

Cache location: `~/.cache/termcast/wezterm/{version}/{platform}/`

Download URLs:
```
https://github.com/wez/wezterm/releases/download/{tag}/WezTerm-macos-{tag}.zip
https://github.com/wez/wezterm/releases/download/{tag}/WezTerm-windows-{tag}.zip
https://github.com/wez/wezterm/releases/download/{tag}/wezterm-{tag}.Ubuntu22.04.tar.xz
```

Only `wezterm-gui` is extracted (skip mux-server, CLI, strip-ansi-escapes).
Pin to a known-good WezTerm version in termcast's config.

## Code Signing (low priority, implement later)

Signing is not needed for v1. Ship unsigned, document the first-launch
workarounds. Implement signing when targeting non-technical end users.

**Current state (unsigned):**
- macOS: users right-click → Open, or run `xattr -cr MyApp.app`
- Windows: users click "More info" → "Run anyway" on SmartScreen prompt
- Linux: no signing needed

**Future `termcast app sign` command:**

When implemented, this will handle:
- macOS: `codesign` + `notarytool` (requires Apple Developer ID, $99/yr)
- Windows: `signtool` (requires OV/EV cert, ~$200-400/yr)

Signing does NOT require modifying `wezterm-gui` — it signs the entire
bundle/launcher. Replacing the icon does not break signing because:
- macOS: icon is a separate `.icns` file, bundle is signed as a whole after assembly
- Windows: icon is on the launcher `.exe` (compiled with it), not on `wezterm-gui.exe`

CI pipeline example for when signing is implemented:

```yaml
- name: Sign (macOS)
  run: |
    codesign --force --deep \
      --sign "Developer ID Application: Name (TEAMID)" \
      --options runtime --timestamp \
      "MyApp.app"
    ditto -c -k "MyApp.app" "MyApp.zip"
    xcrun notarytool submit "MyApp.zip" \
      --apple-id "$APPLE_ID" --team-id "$TEAM_ID" \
      --password "$APP_PASSWORD" --wait
    xcrun stapler staple "MyApp.app"
```

## Cross-Platform Compatibility

The `--config-file` approach works identically on all three platforms:

```
wezterm-gui --config-file /path/to/wezterm.lua
```

It provides both config loading and instance isolation. Platform differences
are only in the wrapper layer:

| Platform | Wrapper | How it launches |
|---|---|---|
| macOS | `launch` shell script | `exec wezterm-gui --config-file ...` |
| Windows | `MyApp.exe` (compiled) | `Command::new("wezterm-gui.exe").arg("--config-file")` |
| Linux | `AppRun` shell script | `exec wezterm-gui --config-file ...` |

The `wezterm.lua` config itself is cross-platform Lua. The only platform
check is `package.config:sub(1, 1)` for path separators.

## Bundle Sizes

| Component | Size |
|---|---|
| wezterm-gui (macOS universal) | 130MB |
| wezterm-gui (macOS arm64 only) | ~65MB |
| wezterm-gui (Windows x64) | ~65MB |
| wezterm-gui (Linux x64) | ~65MB |
| Typical termcast extension | 1-5MB |
| Config + launcher + icon | <1MB |
| **Total (macOS universal)** | **~131MB** |
| **Total (single arch)** | **~66-70MB** |

Comparable to small Electron apps (150-300MB).

## WezTerm Features Available to Termcast Apps

### Rendering
- **WebGpu** (Metal on macOS, Vulkan on Linux/Windows) — fastest renderer
- **FreeType** with configurable hinting (Light, Normal, Mono, HorizontalLcd)
- **max_fps** up to 120 for ProMotion displays (default 60)
- **HiDPI** support with configurable DPI override

### Image Protocols
- **Kitty Graphics Protocol** — full: transmit, display, query, delete, animation frames
- **Sixel** graphics
- **iTerm2** inline images

### Keyboard
- **Kitty Keyboard Protocol** — all 5 progressive enhancement flags:
  disambiguate escape codes, report event types, report alternate keys,
  report all keys as escape codes, report associated text
- **CSI u** key encoding (older protocol)
- Cmd/Ctrl+key override via `disable_default_key_bindings` + `SendKey`

### Window
- **`use_resize_increments`** — snap resize to character cell grid
- **`window_decorations`** — RESIZE (borderless), NONE (frameless),
  TITLE|RESIZE (default), MACOS_FORCE_DISABLE_SHADOW, MACOS_FORCE_SQUARE_CORNERS
- **`window_padding`** — zero padding for edge-to-edge content

### Input
- **Drag-and-drop** — files/URLs pasted into PTY with configurable quoting
  (Posix, SpacesOnly, None, Windows, WindowsAlwaysQuoted).
  Custom drag-and-drop beyond quoting would require a WezTerm Rust change
  (wezterm-gui/src/termwindow/mod.rs:1040).
- **Mouse** — full mouse reporting for TUI interaction

### What requires WezTerm Rust changes (not blocking, nice-to-have later)
- Custom drag-and-drop behavior (trigger app action instead of paste)
- Remove "WezTerm" branding from internal error dialogs
- Window title in RESIZE mode (not visible anyway)
