// This module MUST be imported before @opentui/react to ensure the devtools
// hook exists before the reconciler tries to call injectIntoDevTools()
import * as RefreshRuntime from 'react-refresh/runtime'

// Store captured renderer internals for manual refresh triggering
let capturedRendererInternals: any = null

// Initialize React Refresh BEFORE any React rendering
// This must happen before @opentui/react is loaded
function initializeReactRefresh() {
  // Inject into the global devtools hook
  // This sets up __REACT_DEVTOOLS_GLOBAL_HOOK__ which the reconciler uses
  RefreshRuntime.injectIntoGlobalHook(globalThis)

  const hook = (globalThis as any).__REACT_DEVTOOLS_GLOBAL_HOOK__
  if (hook) {
    // Intercept the inject call to capture renderer internals
    // This is called by react-reconciler when injectIntoDevTools is called
    const originalInject = hook.inject
    hook.inject = (renderer: any) => {
      // Capture the renderer internals - we need scheduleRefresh
      capturedRendererInternals = renderer
      // Call the original inject
      return originalInject.call(hook, renderer)
    }
  }

  // Set up the globals that the babel transform expects
  // These are called by the transformed code to register components
  ;(globalThis as any).$RefreshReg$ = (type: any, id: string) => {
    RefreshRuntime.register(type, id)
  }
  ;(globalThis as any).$RefreshSig$ = () => {
    return RefreshRuntime.createSignatureFunctionForTransform()
  }
}

// Call immediately at module load time
initializeReactRefresh()

// Get captured renderer internals
export function getRendererInternals() {
  return capturedRendererInternals
}

// Check if we have a valid renderer with refresh capabilities
export function hasRefreshCapability() {
  return !!(capturedRendererInternals?.scheduleRefresh)
}

export { RefreshRuntime }
