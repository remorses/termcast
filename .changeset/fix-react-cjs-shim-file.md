---
'termcast': patch
---

Fix React hooks being undefined in extension bundles when dependencies load React through Bun's CJS interop path.

`@termcast/utils` crashed on first render with `import_react.useRef is not a function` because Bun can turn virtual ESM react shims into empty `__commonJS` bodies.

React is now resolved through a real on-disk `_react-shim.cjs` (`module.exports = globalThis.react`), and the build post-processes bundles to repair any bare-var shim shape before writing output.
