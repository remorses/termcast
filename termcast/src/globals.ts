// @ts-nocheck
// Set up global references for external packages

import * as opentuiCore from '@opentui/core'
import * as opentuiReact from '@opentui/react'
import * as react from 'react'
import * as reactJsxRuntime from 'react/jsx-runtime'
import * as termcastApi from '@termcast/cli'

declare global {
    var opentuiCore: typeof opentuiCore
    var opentuiReact: typeof opentuiReact
    var react: typeof react
    var reactJsxRuntime: typeof reactJsxRuntime
    var termcastApi: typeof termcastApi
}

// Initialize globals
globalThis.opentuiCore = opentuiCore
globalThis.opentuiReact = opentuiReact
globalThis.react = react
globalThis.reactJsxRuntime = reactJsxRuntime
globalThis.termcastApi = termcastApi
