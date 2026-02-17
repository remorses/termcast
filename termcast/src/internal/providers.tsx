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

  render(): any {
    if (this.state.hasError) {
      return <ErrorDisplay error={this.state.error} />
    }

    return this.props.children
  }
}

function ErrorDisplay({ error }: { error: Error | null }): any {
  const theme = useTheme()
  return (
    <box padding={2}>
      <text fg={theme.error} wrapMode='none'>
        {error?.stack}
      </text>
    </box>
  )
}

const ErrorBoundary = ErrorBoundaryClass as any

export function TermcastProvider(props: ProvidersProps): any {
  const theme = useTheme()
  const renderer = useRenderer()
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
