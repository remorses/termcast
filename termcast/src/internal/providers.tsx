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
import { CommonProps } from 'termcast/src/utils'
import { Cache } from 'termcast/src/apis/cache'
import { logger } from 'termcast/src/logger'
import { Theme, initializeTheme } from 'termcast/src/theme'
import { useStore } from 'termcast/src/state'
import { useKeyboard, useRenderer, useTerminalDimensions } from '@opentui/react'
import { initializeErrorHandlers } from 'termcast/src/internal/error-handler'

import { InFocus } from './focus-context'
import { Clipboard } from '../apis/clipboard'

// Initialize error handlers at module load time
initializeErrorHandlers()

// Initialize theme from persisted storage
initializeTheme()

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24, // 24 hours
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 2,
    },
  },
})

// Create a custom persister using the Cache class
const queryCache = new Cache({ namespace: 'tanstack-query' })

const persister = {
  persistClient: async (client: any) => {
    const serialized = JSON.stringify(client)
    queryCache.set('query-client-data', serialized)
  },
  restoreClient: async () => {
    const data = queryCache.get('query-client-data')
    return data ? JSON.parse(data) : undefined
  },
  removeClient: async () => {
    queryCache.remove('query-client-data')
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
  return (
    <box padding={2}>
      <text fg={Theme.error} wrapMode='none'>
        {error?.stack}
      </text>
    </box>
  )
}

const ErrorBoundary = ErrorBoundaryClass as any

export function TermcastProvider(props: ProvidersProps): any {
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
            backgroundColor={Theme.background}
            // borderColor={Theme.border}
            // fg={Theme.text}
          >
            <box padding={2}>
              <DialogProvider>
                {/* NavigationProvider must be last to ensure parent providers remain in the tree when navigation changes */}
                <NavigationProvider overlay={<DialogOverlay />}>
                  <box>{props.children}</box>
                </NavigationProvider>
              </DialogProvider>
            </box>
          </box>
        </PersistQueryClientProvider>
      </Suspense>
    </ErrorBoundary>
  )
}
