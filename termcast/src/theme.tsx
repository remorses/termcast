import { SyntaxStyle } from '@opentui/core'
import { getResolvedTheme, getSyntaxTheme, type ResolvedTheme, defaultThemeName, themeNames } from './themes'
import { useStore } from './state'
import { Cache } from './apis/cache'
import { Color } from './colors'

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
  // TERMCAST_DEFAULT_THEME is set by the app launcher to override the default theme
  return process.env.TERMCAST_DEFAULT_THEME || defaultThemeName
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

// Resolve a visible but subtle hover background for interactive rows.
// Some themes map background and backgroundPanel to the same value.
export function getInteractiveHoverBackground(theme: ResolvedTheme): string {
  const normalize = (color: string): string => {
    return color.toLowerCase()
  }
  const background = normalize(theme.background)

  if (normalize(theme.backgroundElement) !== background) {
    return theme.backgroundElement
  }
  if (normalize(theme.backgroundPanel) !== background) {
    return theme.backgroundPanel
  }
  if (normalize(theme.borderSubtle) !== background) {
    return theme.borderSubtle
  }
  if (normalize(theme.border) !== background) {
    return theme.border
  }

  return theme.primary
}

// Shared color palette for chart components.
// Based on the original Histogram showcase colors, which read better than a
// strictly semantic theme order for categorical data.
export function getThemePalette(theme: ResolvedTheme): string[] {
  return [
    Color.Orange,
    Color.SecondaryText,
    '#00CCCC',
    Color.Purple,
    Color.Yellow,
    Color.Green,
    Color.Blue,
  ]
}

// For backward compatibility - some code imports markdownSyntaxStyle directly
// This is a getter that returns the current theme's syntax style
export const markdownSyntaxStyle = new Proxy({} as SyntaxStyle, {
  get(_, prop: string) {
    return getMarkdownSyntaxStyle()[prop as keyof SyntaxStyle]
  },
})
