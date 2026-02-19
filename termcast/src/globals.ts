// @ts-nocheck
// Set up global references for external packages
//
import { logger } from './logger'

process.env.TERMCAST = 'true'

import * as opentuiCore from '@opentui/core'
import * as opentuiReact from '@opentui/react'
import * as react from 'react'
import * as reactJsxRuntime from 'react/jsx-runtime'
import * as termcastApi from './index'
import * as termcastOpentui from './opentui'

declare global {
  var opentuiCore: typeof opentuiCore
  var opentuiReact: typeof opentuiReact
  var react: typeof react
  var reactJsxRuntime: typeof reactJsxRuntime
  var termcastApi: typeof termcastApi
  var termcastOpentui: typeof termcastOpentui
}

// Initialize globals
globalThis.opentuiCore = opentuiCore
globalThis.opentuiReact = opentuiReact
globalThis.react = react

globalThis._jsx = react.createElement
globalThis._jsxs = reactJsxRuntime.jsxs
globalThis._Fragment = reactJsxRuntime.Fragment

globalThis.reactJsxRuntime = reactJsxRuntime
globalThis.termcastApi = termcastApi
globalThis.termcastOpentui = termcastOpentui

globalThis.logger = logger
