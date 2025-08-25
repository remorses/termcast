# Ghostty Overlay

A lightweight macOS app that displays Ghostty terminal as a centered overlay with Cmd+Space hotkey.

## Features

- Press **Cmd+Option+T** to show/hide Ghostty terminal
- Ghostty appears centered on screen (800x600)
- Automatically hides when clicking anywhere else
- Runs in background (no dock icon)

## Build

```bash
./build.sh
```

## Run

```bash
open build/GhosttyOverlay.app
```

## Important

On first launch, you'll need to grant Accessibility permissions:
1. System Settings → Privacy & Security → Accessibility
2. Add and enable GhosttyOverlay.app

## Requirements

- macOS 10.15+
- Ghostty installed in /Applications
- Accessibility permissions