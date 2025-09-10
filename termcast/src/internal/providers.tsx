import React, {
  Component,
  Suspense,
  type ReactNode,
  type ErrorInfo,
} from 'react'
import { QueryClient } from '@tanstack/react-query'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { DialogProvider } from '@termcast/cli/src/internal/dialog'
import { NavigationProvider } from '@termcast/cli/src/internal/navigation'
import { CommonProps } from '@termcast/cli/src/utils'
import { Cache } from '@termcast/cli/src/cache'
import { logger } from '@termcast/cli/src/logger'
import { Theme } from '@termcast/cli/src/theme'

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

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
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
      return (
        <box padding={2} flexDirection='column'>
          <text>An error occurred</text>
          <text fg={Theme.error}>
            {this.state.error?.message || 'An unexpected error occurred'}
          </text>
          <text fg={Theme.error}>{this.state.error?.stack || ''}</text>
        </box>
      )
    }

    return this.props.children
  }
}

const ErrorBoundary = ErrorBoundaryClass as any

export function Providers(props: ProvidersProps): any {
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
          <DialogProvider>
            <box padding={2}>
              {/* NavigationProvider must be last to ensure parent providers remain in the tree when navigation changes */}
              <NavigationProvider>{props.children}</NavigationProvider>
            </box>
          </DialogProvider>
        </PersistQueryClientProvider>
      </Suspense>
    </ErrorBoundary>
  )
}
