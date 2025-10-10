import React, {
  Component,
  Suspense,
  type ReactNode,
  type ErrorInfo,
} from 'react'
import { QueryClient } from '@tanstack/react-query'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { DialogProvider } from 'termcast/src/internal/dialog'
import { NavigationProvider } from 'termcast/src/internal/navigation'
import { CommonProps } from 'termcast/src/utils'
import { Cache } from 'termcast/src/apis/cache'
import { logger } from 'termcast/src/logger'
import { Theme } from 'termcast/src/theme'
import { useKeyboard } from '@opentui/react'
import { TextAttributes } from '@opentui/core'
import { useStore } from 'termcast/src/state'
import * as fs from 'fs'
import * as path from 'path'
import { exec } from 'child_process'
import dedent from 'string-dedent'
import { initializeErrorHandlers } from 'termcast/src/internal/error-handler'

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
        const lines = content.split('\n').filter((line) => line.trim())
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

    // Get navigation stack information for body
    const navigationStack = useStore.getState().navigationStack
    const navigationInfo = navigationStack
      .map((item, index) => {
        const element = item.element as any
        const componentName =
          element?.type?.displayName ||
          element?.type?.name ||
          element?.type ||
          'Unknown'
        return `${index + 1}. ${componentName}`
      })
      .join('\n')

    // Get current extension/command info
    const extensionPackageJson = useStore.getState().extensionPackageJson
    const currentCommandName = useStore.getState().currentCommandName
    const extensionPath = useStore.getState().extensionPath

    const extensionName =
      extensionPackageJson?.name ||
      (extensionPath ? path.basename(extensionPath) : null)

    let contextInfo = ''
    let titlePrefix = ''

    if (extensionName) {
      contextInfo = `Extension: ${extensionName}`
      titlePrefix = `\`${extensionName}\``
      if (currentCommandName) {
        contextInfo += ` | Command: ${currentCommandName}`
        titlePrefix += ` > \`${currentCommandName}\``
      }
    }

    const title = encodeURIComponent(
      titlePrefix ? `${titlePrefix}: ${error.message}` : error.message,
    )

    const MAX_URL_LENGTH = 4096
    const baseUrl = 'https://github.com/remorses/termcast/issues/new?title='
    const titlePart = `${baseUrl}${title}&body=`

    // Calculate how much space we have for the body
    const availableBodyLength = MAX_URL_LENGTH - titlePart.length

    // Always create a minimal body
    const minimalBody = dedent`
      ## Error Details

      **Message:** ${error.message}
      **Context:** ${contextInfo || 'No extension loaded'}
      **Navigation:** \`${navigationStack
        .map((item) => {
          const element = item.element as any
          return (
            element?.type?.displayName ||
            element?.type?.name ||
            element?.type ||
            'Unknown'
          )
        })
        .join(' > ')}\`

      ## Stack Trace

      \`\`\`\`
      ${error.stack || 'No stack trace available'}
      \`\`\`\`

      ## Environment

      - Platform: ${process.platform}
      - Node Version: ${process.version}
      - Date: ${new Date().toISOString()}
    `

    let body = encodeURIComponent(minimalBody)

    // If still too long, just truncate it
    if (body.length > availableBodyLength) {
      body = body.substring(0, availableBodyLength)
    }

    const url = `${titlePart}${body}`

    // Open in browser
    const openCmd =
      process.platform === 'darwin'
        ? 'open'
        : process.platform === 'win32'
          ? 'start'
          : 'xdg-open'

    exec(`${openCmd} "${url}"`, (err) => {
      if (err) {
        logger.error('Failed to open browser:', err)
      }
    })
  }

  render(): any {
    if (this.state.hasError) {
      return (
        <ErrorDisplay
          error={this.state.error}
          onOpenIssue={this.openGitHubIssue}
          getRecentLogs={this.getRecentLogs}
        />
      )
    }

    return this.props.children
  }
}

function ErrorDisplay({
  error,
  onOpenIssue,
  getRecentLogs,
}: {
  error: Error | null
  onOpenIssue: () => void
  getRecentLogs: () => string
}): any {
  const [isHovered, setIsHovered] = React.useState(false)
  const [showLogs, setShowLogs] = React.useState(false)
  const [focusedIndex, setFocusedIndex] = React.useState(0) // 0 = issue button, 1+ = stack trace lines

  // Parse stack trace to get file paths with line numbers
  const stackLines = React.useMemo(() => {
    if (!error?.stack) return []

    const lines = error.stack.split('\n')
    const parsedLines: Array<{ text: string; file?: string; line?: number }> =
      []

    for (const line of lines) {
      // Match file paths with line:column format
      // Common patterns: "at file:///path/to/file.ts:123:45" or "at /path/to/file.ts:123:45"
      const match = line.match(
        /at\s+(?:.*?\s+\()?(?:file:\/\/)?([^:\s]+(?:\.tsx?|\.jsx?)):(\d+)(?::\d+)?/,
      )

      if (match) {
        parsedLines.push({
          text: line,
          file: match[1],
          line: parseInt(match[2], 10),
        })
      } else {
        parsedLines.push({ text: line })
      }
    }

    return parsedLines
  }, [error?.stack])

  // Count of focusable stack lines (those with file paths)
  const focusableStackLines = stackLines.filter((line) => line.file).length

  useKeyboard(async (evt) => {
    if (evt.name === 'down') {
      setFocusedIndex((prev) => {
        const maxIndex = focusableStackLines // 0 for button + focusable stack lines
        return Math.min(prev + 1, maxIndex)
      })
    } else if (evt.name === 'up') {
      setFocusedIndex((prev) => Math.max(prev - 1, 0))
    } else if (evt.name === 'return') {
      if (focusedIndex === 0) {
        // Issue button is focused
        onOpenIssue()
      } else {
        // Stack trace line is focused - copy file path to clipboard
        let currentFocusableIndex = 0
        for (const line of stackLines) {
          if (line.file) {
            currentFocusableIndex++
            if (currentFocusableIndex === focusedIndex) {
              const filePathWithLine = `${line.file}:${line.line}`
              const { Clipboard } = await import(
                'termcast/src/apis/clipboard'
              )
              await Clipboard.copy(filePathWithLine)
              logger.log(`📋 Copied to clipboard: ${filePathWithLine}`)
              break
            }
          }
        }
      }
    }
  })

  return (
    <box padding={2} flexDirection='column' gap={1}>
      <text fg={Theme.error} attributes={TextAttributes.BOLD}>
        ⚠️ An error occurred
      </text>

      <text fg={Theme.error}>
        {error?.message || 'An unexpected error occurred'}
      </text>

      <box
        paddingLeft={1}
        paddingRight={1}
        borderStyle='rounded'
        border={true}
        borderColor={
          focusedIndex === 0
            ? Theme.highlight
            : isHovered
              ? Theme.highlight
              : Theme.border
        }
        backgroundColor={
          focusedIndex === 0
            ? Theme.backgroundPanel
            : isHovered
              ? Theme.backgroundPanel
              : undefined
        }
        onMouseMove={() => setIsHovered(true)}
        onMouseOut={() => setIsHovered(false)}
        onMouseDown={onOpenIssue}
        marginTop={1}
      >
        <text>
          {focusedIndex === 0 ? '▶ ' : '  '}📝 Press Enter or click to report
          on GitHub
        </text>
      </box>

      <box flexDirection='column' marginTop={1}>
        <text fg={Theme.textMuted} attributes={TextAttributes.BOLD}>
          Stack Trace:
        </text>
        {stackLines.map((line, index) => {
          let currentFocusableIndex = 0
          let isFocused = false

          // Determine if this line is focused
          if (line.file) {
            currentFocusableIndex = stackLines
              .slice(0, index + 1)
              .filter((l) => l.file).length
            isFocused = focusedIndex === currentFocusableIndex
          }

          return (
            <box
              key={index}
              backgroundColor={isFocused ? Theme.backgroundPanel : undefined}
            >
              <text fg={isFocused ? Theme.highlight : Theme.error}>
                {isFocused ? '▶ ' : '  '}
                {line.text}
              </text>
            </box>
          )
        })}
      </box>

      <box marginTop={1} onMouseDown={() => setShowLogs(!showLogs)}>
        <text fg={Theme.textMuted} attributes={TextAttributes.UNDERLINE}>
          {showLogs ? '▼' : '▶'} Toggle logs (last 200 lines)
        </text>
      </box>

      {showLogs && (
        <box flexDirection='column' marginTop={1}>
          <text fg={Theme.textMuted} attributes={TextAttributes.BOLD}>
            Recent Logs:
          </text>
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

export function TermcastProvider(props: ProvidersProps): any {
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
