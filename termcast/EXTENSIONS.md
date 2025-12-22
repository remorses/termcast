# Extension Execution Modes

termcast supports three ways to run extensions: dev mode, compiled, and installed from store.

## Storage Paths

| Mode | Extension Path | SQLite Database |
|------|----------------|-----------------|
| Dev | Local folder (e.g. `~/my-extension`) | `{extensionPath}/.termcast-bundle/data.db` |
| Compiled | N/A (embedded in binary) | `~/.termcast/{extensionName}/data.db` |
| Store | `~/.termcast/store/{extensionName}` | `{extensionPath}/.termcast-bundle/data.db` |

For dev and store modes, the database path is determined by `extensionPath` in state. For compiled mode, no filesystem path exists - data is stored in user's home directory. 

## Dev Mode

Entry: `startDevMode({ extensionPath })`

1. Reads `package.json` from local `extensionPath`
2. Builds commands with esbuild (ESM format, bun target)
3. Sets state: `extensionPath`, `extensionPackageJson`
4. Shows command list, imports bundled files with cache-busting query param on each rebuild
5. Watches for changes and triggers `triggerRebuild()`

## Compiled Mode

Entry: `startCompiledExtension({ packageJson, compiledCommands })`

1. Commands are pre-compiled and passed as `Component` functions
2. `packageJson` is embedded directly into the binary at compile time (no filesystem reads)
3. Sets state: `extensionPackageJson` (no `extensionPath` needed)
4. No build step needed - components are already bundled
5. Binary is fully portable - no hardcoded paths

## Store Mode

Entry: Home list shows installed extensions from `getStoreDirectory()`

1. Extensions installed to `~/.termcast/store/{extensionName}/`
2. Each has its own `package.json` and pre-built bundle
3. Sets `extensionPath` to the store subdirectory when running

## Preferences

Preferences are stored in SQLite with keys:
- Extension-level: `preferences.{extensionName}`
- Command-level: `preferences.{extensionName}.{commandName}`

The `ExtensionPreferences` component loads preference definitions from `package.json` at the extension path.

## logs

logs that happen during extension execution are output in a local app.log file, in the cwd where the extension was run
