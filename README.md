<div align='center'>
    <br/>
    <br/>
    <h3>termcast</h3>
    <p>Build terminal user interfaces with React and a Raycast APIs</p>
    <br/>
    <br/>
</div>

Termcast is a framework for building terminal user interfaces (TUIs) using React and an API inspired by Raycast. It's designed for developers who want to create TUI applications, especially those who already have Raycast extensions and want to port them to the terminal.

## Install

```sh
# IMPORTANT! this package requires Bun. does not work in Node.js
bun install -g termcast 
```

## What is Termcast?

Termcast provides a Raycast-like API for building terminal applications. If you're familiar with Raycast extension development, you can use that knowledge to create TUIs that run anywhere—including Linux and remote servers.

This is **not** a way to run arbitrary Raycast extensions in the terminal. Instead, it's a tool for developers who want to:

- Build TUIs using a familiar, React-based API
- Port existing Raycast extension code to the terminal
- Create standalone CLI tools that can be distributed independently
- Take advantage of terminal-native capabilities

## Quick Start

Create a new extension and start developing:

```sh
termcast new my-extension
cd my-extension
termcast dev
```

## Usage

### New

Create a new extension from the template:

```sh
termcast new <name>
```

### Development

Run your extension in dev mode with hot reloading:

```sh
termcast dev
```

This watches for file changes and rebuilds automatically.

### Compile

Build a standalone executable:

```sh
termcast compile
```

### Release

Build and publish to GitHub releases for all platforms:

```sh
termcast release
```

This creates binaries for macOS (arm64, x64), Linux (arm64, x64), and Windows, then uploads them to a GitHub release. After release, you'll get an install script URL:

```
Install script:
   curl -sf https://termcast.app/owner/repo/install | bash
```

Share this URL so others can install your TUI with a single command.

## Why Termcast?

Raycast extensions are limited to macOS and the Raycast app. Termcast lets you use similar patterns to build terminal applications that work cross-platform.

Termcast is a **superset** of the Raycast API—it supports what makes sense in a terminal context, while also enabling terminal-native features that Raycast can't provide:

- **Current working directory** — your TUI knows where it was invoked from
- **Command-line arguments** — accept input directly from the command line
- **stdin** — pipe data into your application
- **Environment context** — full access to the terminal environment

These capabilities make Termcast ideal for building developer tools that integrate naturally with terminal workflows.

## Use Case

If your team already has a Raycast extension, you can use Termcast to create a terminal version that shares code with your existing extension. For example:

- A deployment tool that works both as a Raycast extension and a CLI
- An internal tool that needs to run on Linux servers
- A utility you want to distribute without requiring users to install Raycast

## Differences from Raycast

- Uses Bun instead of Node
- Renders in a terminal instead of a macOS app
- Cross-platform (macOS, Linux)
- No store—distribute your TUI however you want
- Best-effort API compatibility (not a drop-in replacement)
