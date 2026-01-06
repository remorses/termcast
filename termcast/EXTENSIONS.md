# Extension Execution Modes

termcast supports two ways to run extensions: dev mode and compiled.

## Storage Paths

| Mode | Extension Path | SQLite Database |
|------|----------------|-----------------|
| Dev | Local folder (e.g. `~/my-extension`) | `{extensionPath}/.termcast-bundle/data.db` |
| Compiled | N/A (embedded in binary) | `~/.termcast/{extensionName}/data.db` |

For dev mode, the database path is determined by `extensionPath` in state. For compiled mode, no filesystem path exists - data is stored in user's home directory. 

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

## Preferences

Preferences are stored in SQLite with keys:
- Extension-level: `preferences.{extensionName}`
- Command-level: `preferences.{extensionName}.{commandName}`

The `ExtensionPreferences` component loads preference definitions from `package.json` at the extension path.

## logs

logs that happen during extension execution are output in a local app.log file, in the cwd where the extension was run

## Testing extensions

See `TESTING_RAYCAST_EXTENSIONS.md` for detailed instructions on testing extensions, including how to skip tests in CI when the extension folder doesn't exist.
