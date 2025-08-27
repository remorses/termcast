// @ts-nocheck
// Set up global references for external packages

declare global {
    var opentuiCore: typeof import('@opentui/core')
    var opentuiReact: typeof import('@opentui/react')
    var react: typeof import('react')
    var reactJsxRuntime: typeof import('react/jsx-runtime')
    var termcastApi: typeof import('@termcast/api')
}

// Initialize globals - these will be set by the runtime before bundled code runs
// For now, set them to empty objects to prevent undefined errors
globalThis.opentuiCore = globalThis.opentuiCore || {}
globalThis.opentuiReact = globalThis.opentuiReact || {}
globalThis.react = globalThis.react || {}
globalThis.reactJsxRuntime = globalThis.reactJsxRuntime || {}
globalThis.termcastApi = globalThis.termcastApi || {}