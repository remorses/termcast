import { SyntaxStyle } from '@opentui/core'
import { getResolvedTheme, getSyntaxTheme, type ResolvedTheme, defaultThemeName, themeNames } from './themes'
import { useStore } from './state'
import { Cache } from './apis/cache'

// Global cache for theme persistence (no namespace = global storage).
// Tracks extensionPath so the cache is recreated if the path changes.
let globalCache: Cache | null = null
let globalCachePath: string | null = null

function getGlobalCache(): Cache {
  const currentPath = useStore.getState().extensionPath
  if (!globalCache || currentPath !== globalCachePath) {
    globalCache = new Cache()
    globalCachePath = currentPath
  }
  return globalCache
}

const THEME_STORAGE_KEY = 'termcast.theme'

export function loadPersistedTheme(): string {
  try {
    const stored = getGlobalCache().get(THEME_STORAGE_KEY)
    if (stored && themeNames.includes(stored)) {
      return stored
    }
  } catch {
    // Ignore errors on load
  }
  return defaultThemeName
}

export function persistTheme(name: string): void {
  try {
    getGlobalCache().set(THEME_STORAGE_KEY, name)
  } catch {
    // Ignore errors on save
  }
}

// Initialize theme from persistence - call this on app startup
export function initializeTheme(): void {
  const themeName = loadPersistedTheme()
  useStore.setState({ currentThemeName: themeName })
}

// Reactive hook for theme - use this in React components
export function useTheme(): ResolvedTheme {
  const themeName = useStore((state) => state.currentThemeName)
  return getResolvedTheme(themeName)
}

// Returns a full SyntaxStyle with all code + markdown scopes.
// Code blocks inside markdown get proper syntax highlighting (keywords, strings, etc.)
export function getMarkdownSyntaxStyle(): SyntaxStyle {
  const themeName = useStore.getState().currentThemeName
  return SyntaxStyle.fromStyles(getSyntaxTheme(themeName))
}

// For backward compatibility - some code imports markdownSyntaxStyle directly
// This is a getter that returns the current theme's syntax style
export const markdownSyntaxStyle = new Proxy({} as SyntaxStyle, {
  get(_, prop: string) {
    return getMarkdownSyntaxStyle()[prop as keyof SyntaxStyle]
  },
})


