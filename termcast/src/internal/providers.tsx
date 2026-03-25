import React, {
  Component,
  Suspense,
  type ReactNode,
  type ErrorInfo,
} from 'react'
import { QueryClient } from '@tanstack/react-query'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { DialogProvider, DialogOverlay } from 'termcast/src/internal/dialog'
import { NavigationProvider } from 'termcast/src/internal/navigation'
import { CommonProps, termcastMaxContentWidth } from 'termcast/src/utils'
import { Cache } from 'termcast/src/apis/cache'
import { logger } from 'termcast/src/logger'
import { useTheme } from 'termcast/src/theme'
import { useStore } from 'termcast/src/state'
import { useKeyboard, useRenderer } from '@opentui/react'
import { initializeErrorHandlers } from 'termcast/src/internal/error-handler'
import { stdoutWrite } from '#platform/runtime'

import { InFocus } from './focus-context'
import { Clipboard } from '../apis/clipboard'

// Initialize error handlers at module load time
initializeErrorHandlers()

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24, // 24 hours
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 2,
    },
  },
})

// Lazy-initialized Cache for TanStack Query persistence.
// Must not be created at module load time because extensionPath may not be set yet
// (e.g. when renderWithProviders sets state right before rendering).
// Tracks the extensionPath it was created with so it can be recreated if the path changes.
let queryCache: Cache | null = null
let queryCachePath: string | null = null

function getQueryCache(): Cache {
  const currentPath = useStore.getState().extensionPath
  if (!queryCache || currentPath !== queryCachePath) {
    queryCache = new Cache({ namespace: 'tanstack-query' })
    queryCachePath = currentPath
  }
  return queryCache
}

const persister = {
  persistClient: async (client: any) => {
    const serialized = JSON.stringify(client)
    getQueryCache().set('query-client-data', serialized)
  },
  restoreClient: async () => {
    const data = getQueryCache().get('query-client-data')
    return data ? JSON.parse(data) : undefined
  },
  removeClient: async () => {
    getQueryCache().remove('query-client-data')
  },
}

interface ProvidersProps extends CommonProps {
  children: ReactNode
}

function LoadingFallback(): any {
  return (
    <box padding={2}>
      <text>Loading suspense...</text>
    </box>
  )
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

class ErrorBoundaryClass extends Component<
  { children: ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { hasError: false, error: null }
    this.reset = this.reset.bind(this)
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    logger.error('ErrorBoundary caught error:', {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    })
  }

  reset(): void {
    // Clear navigation and dialog stacks so the app returns to the root view
    // instead of re-rendering the same crashed component
    useStore.setState({
      navigationStack: [],
      dialogStack: [],
      toast: null,
      toastWithPrimaryAction: false,
      showActionsDialog: false,
    })
    this.setState({ hasError: false, error: null })
  }

  render(): any {
    if (this.state.hasError) {
      return <ErrorDisplay error={this.state.error} onRetry={this.reset} />
    }

    return this.props.children
  }
}

function ErrorDisplay({ error, onRetry }: { error: Error | null; onRetry: () => void }): any {
  const theme = useTheme()

  useKeyboard((evt) => {
    if (evt.name === 'return') {
      onRetry()
    }
  })

  return (
    <box padding={2} flexDirection="column" gap={1}>
      <text fg={theme.error} wrapMode='none'>
        {error?.stack}
      </text>
      <text fg={theme.textMuted}>
        Press Enter to retry
      </text>
    </box>
  )
}

const ErrorBoundary = ErrorBoundaryClass as any

export function TermcastProvider(props: ProvidersProps): any {
  const theme = useTheme()
  const renderer = useRenderer()

  // TODO: Remove this when opentui adds { name: "backspace", super: true, action: "delete-to-line-start" }
  // to defaultTextareaKeybindings in packages/core/src/renderables/Textarea.ts
  // Translate Cmd+Backspace (kitty CSI \x1b[127;9u) to Ctrl+U (\x15) so opentui's
  // textarea keybinding for delete-to-line-start handles it. opentui doesn't have a
  // super+backspace binding, so we remap at the input level before key dispatch.
  React.useLayoutEffect(() => {
    if (!renderer) return
    const handler = (sequence: string) => {
      if (sequence === '\x1b[127;9u') {
        renderer.stdin.emit('data', '\x15')
        return true
      }
      return false
    }
    renderer.prependInputHandler(handler)
    return () => {
      renderer.removeInputHandler(handler)
    }
  }, [renderer])

  // Sync terminal background with the active termcast theme via OSC 11 (standard escape
  // sequence to set terminal background color). This works on WezTerm, iTerm2, kitty, etc.
  // WezTerm's set_config_overrides for colors has a bug (#5451) where it only hot-reloads
  // non-focused windows, so we use OSC 11 instead which updates immediately.
  // Uses renderer's realStdoutWrite to bypass opentui's stdout interception.
  React.useLayoutEffect(() => {
    if (!renderer) return
    // OSC 11 ; color ST — sets terminal default background color
    const sequence = `\x1b]11;${theme.background}\x07`
    const realWrite = (renderer as any).realStdoutWrite as typeof process.stdout.write | undefined
    if (realWrite) {
      // realStdoutWrite needs process.stdout as `this` context
      realWrite.call(process.stdout, sequence)
    } else {
      stdoutWrite(sequence)
    }
  }, [renderer, theme.background])

  useKeyboard((key) => {
    if (!renderer) return
    if (key.ctrl && key.name === 'd') {
      renderer.console.onCopySelection = (text: any) => {
        Clipboard.copy(text)
      }
      renderer?.toggleDebugOverlay()
      renderer?.console.toggle()
    }
  })

  // Cmd+C (super+c): if there's an active selection, copy it to clipboard and clear.
  // Otherwise let the key propagate to the TUI for other handlers.
  // In standalone apps, WezTerm forwards Cmd+C via SendKey so it arrives as super modifier.
  useKeyboard((key) => {
    if (!renderer) return
    if (key.super && key.name === 'c') {
      if (renderer.hasSelection) {
        const selection = renderer.getSelection()
        if (selection) {
          const text = selection.getSelectedText()
          if (text) {
            Clipboard.copy(text)
            renderer.clearSelection()
            key.stopPropagation()
          }
        }
      }
    }
  })

  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingFallback />}>
        <PersistQueryClientProvider
          client={queryClient}
          persistOptions={{
            persister,
            maxAge: 1000 * 60 * 60 * 24, // 24 hours
          }}
        >
          <box
            minHeight={'100%'}
            justifyContent='flex-start'
            backgroundColor={theme.background}
            width='100%'
            flexGrow={1}
            alignItems='center'
            // borderColor={Theme.border}
            // fg={Theme.text}
          >
            <box
              padding={2}
              width='100%'
              maxWidth={termcastMaxContentWidth}
              // flexShrink={1}
              // flexGrow={1}
            >
              <DialogProvider>
                {/* NavigationProvider must be last to ensure parent providers remain in the tree when navigation changes */}
                <NavigationProvider overlay={<DialogOverlay />}>
                  <box width='100%' flexGrow={1} flexShrink={1}>
                    {props.children}
                  </box>
                </NavigationProvider>
              </DialogProvider>
            </box>
          </box>
        </PersistQueryClientProvider>
      </Suspense>
    </ErrorBoundary>
  )
}
