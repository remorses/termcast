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
import { Cache } from '@termcast/cli/src/apis/cache'
import { logger } from '@termcast/cli/src/logger'
import { Theme } from '@termcast/cli/src/theme'
import { useKeyboard } from '@opentui/react'
import { TextAttributes } from '@opentui/core'
import { useStore } from '@termcast/cli/src/state'
import * as fs from 'fs'
import * as path from 'path'
import { exec } from 'child_process'
import dedent from 'string-dedent'

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
    
    this.openGitHubIssue = this.openGitHubIssue.bind(this)
    this.getRecentLogs = this.getRecentLogs.bind(this)
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

  getRecentLogs(): string {
    const LOG_FILE = path.join(process.cwd(), 'app.log')
    try {
      if (fs.existsSync(LOG_FILE)) {
        const content = fs.readFileSync(LOG_FILE, 'utf-8')
        const lines = content.split('\n').filter(line => line.trim())
        // Get last 200 lines
        const recentLines = lines.slice(-200)
        return recentLines.join('\n')
      }
    } catch (err) {
      logger.error('Failed to read log file:', err)
    }
    return 'No logs available'
  }

  openGitHubIssue(): void {
    const error = this.state.error
    if (!error) return

    const logs = this.getRecentLogs()
    
    // Get navigation stack information
    const navigationStack = useStore.getState().navigationStack
    const navigationComponents = navigationStack.map((item) => {
      const element = item.element as any
      const componentName = element?.type?.displayName || 
                           element?.type?.name || 
                           element?.type || 
                           'Unknown'
      return componentName
    })
    
    // Create navigation path for title (max 4 components)
    const navigationPath = navigationComponents
      .slice(-4)  // Take last 4 components
      .map(name => `\`${name}\``)
      .join(' > ')
    
    // Create full navigation info for body
    const navigationInfo = navigationComponents
      .map((name, index) => `${index + 1}. ${name}`)
      .join('\n')

    // Get current extension/command info
    const extensionPackageJson = useStore.getState().extensionPackageJson
    const currentCommandName = useStore.getState().currentCommandName
    const extensionPath = useStore.getState().extensionPath
    
    let contextInfo = ''
    const extensionName = extensionPackageJson?.name || (extensionPath ? path.basename(extensionPath) : null)
    
    if (extensionName) {
      contextInfo = `Extension: ${extensionName}`
      if (currentCommandName) {
        contextInfo += ` | Command: ${currentCommandName}`
      }
    }

    const title = encodeURIComponent(`${navigationPath}: ${error.message}`)
    
    const body = encodeURIComponent(dedent`
      ## Error Details

      **Message:** ${error.message}
      **Context:** ${contextInfo || 'No extension loaded'}

      ## Navigation Stack

      \`\`\`\`
      ${navigationInfo}
      \`\`\`\`

      ## Stack Trace

      \`\`\`\`
      ${error.stack || 'No stack trace available'}
      \`\`\`\`

      ## Recent Logs (last 200 lines)

      <details>
      <summary>Click to expand logs</summary>

      \`\`\`\`
      ${logs}
      \`\`\`\`

      </details>

      ## Environment

      - Platform: ${process.platform}
      - Node Version: ${process.version}
      - Date: ${new Date().toISOString()}
    `)

    const url = `https://github.com/sst/opencode/issues/new?title=${title}&body=${body}`
    
    // Open in browser
    const openCmd = process.platform === 'darwin' ? 'open' : 
                    process.platform === 'win32' ? 'start' : 'xdg-open'
    
    exec(`${openCmd} "${url}"`, (err) => {
      if (err) {
        logger.error('Failed to open browser:', err)
      }
    })
  }

  render(): any {
    if (this.state.hasError) {
      return <ErrorDisplay 
        error={this.state.error}
        onOpenIssue={this.openGitHubIssue}
        getRecentLogs={this.getRecentLogs}
      />
    }

    return this.props.children
  }
}

function ErrorDisplay({ error, onOpenIssue, getRecentLogs }: {
  error: Error | null
  onOpenIssue: () => void
  getRecentLogs: () => string
}): any {
  const [isHovered, setIsHovered] = React.useState(false)
  const [showLogs, setShowLogs] = React.useState(false)
  
  useKeyboard((evt) => {
    if (evt.name === 'return') {
      onOpenIssue()
    }
  })

  return (
    <box padding={2} flexDirection='column' gap={1}>
      <text fg={Theme.error} attributes={TextAttributes.BOLD}>⚠️  An error occurred</text>
      
      <text fg={Theme.error}>
        {error?.message || 'An unexpected error occurred'}
      </text>

      <box 
        paddingLeft={1}
        paddingRight={1}
        borderStyle='rounded' 
        border={true}
        borderColor={isHovered ? Theme.highlight : Theme.border}
        backgroundColor={isHovered ? Theme.backgroundPanel : undefined}
        onMouseMove={() => setIsHovered(true)}
        onMouseOut={() => setIsHovered(false)}
        onMouseDown={onOpenIssue}
        marginTop={1}
      >
        <text>📝 Press Enter or click to report on GitHub</text>
      </box>

      <box flexDirection='column' marginTop={1}>
        <text fg={Theme.textMuted} attributes={TextAttributes.BOLD}>Stack Trace:</text>
        <text fg={Theme.error}>{error?.stack || 'No stack trace available'}</text>
      </box>

      <box marginTop={1} onMouseDown={() => setShowLogs(!showLogs)}>
        <text fg={Theme.textMuted} attributes={TextAttributes.UNDERLINE}>
          {showLogs ? '▼' : '▶'} Toggle logs (last 200 lines)
        </text>
      </box>

      {showLogs && (
        <box flexDirection='column' marginTop={1}>
          <text fg={Theme.textMuted} attributes={TextAttributes.BOLD}>Recent Logs:</text>
          <box 
            padding={1} 
            borderStyle='single' 
            border={true}
            borderColor={Theme.border}
            maxHeight={20}
          >
            <text fg={Theme.textMuted}>{getRecentLogs()}</text>
          </box>
        </box>
      )}
    </box>
  )
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
