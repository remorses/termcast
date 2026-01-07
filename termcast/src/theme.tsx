import { SyntaxStyle, RGBA } from '@opentui/core'
import { getResolvedTheme, type ResolvedTheme, defaultThemeName, themeNames } from './themes'
import { useStore } from './state'
import { Cache } from './apis/cache'

// Reactive hook for theme - use this in React components
export function useTheme(): ResolvedTheme {
  const themeName = useStore((state) => state.currentThemeName)
  return getResolvedTheme(themeName)
}

// Global cache for theme persistence (no namespace = global storage)
let globalCache: Cache | null = null

function getGlobalCache(): Cache {
  if (!globalCache) {
    globalCache = new Cache()
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

// Proxy-based Theme object that reads from zustand state
export const Theme: ResolvedTheme = new Proxy({} as ResolvedTheme, {
  get(_, prop: string) {
    const themeName = useStore.getState().currentThemeName
    const resolved = getResolvedTheme(themeName)
    return resolved[prop as keyof ResolvedTheme]
  },
})

export function getMarkdownSyntaxStyle(): SyntaxStyle {
  const themeName = useStore.getState().currentThemeName
  const t = getResolvedTheme(themeName)
  return SyntaxStyle.fromStyles({
    default: { fg: RGBA.fromHex(t.markdownText) },
    'markup.heading.1': { fg: RGBA.fromHex(t.markdownHeading), bold: true },
    'markup.heading.2': { fg: RGBA.fromHex(t.markdownHeading), bold: true },
    'markup.heading.3': { fg: RGBA.fromHex(t.markdownHeading), bold: true },
    'markup.heading.4': { fg: RGBA.fromHex(t.markdownHeading), bold: true },
    'markup.heading.5': { fg: RGBA.fromHex(t.markdownHeading), bold: true },
    'markup.heading.6': { fg: RGBA.fromHex(t.markdownHeading), bold: true },
    'markup.heading': { fg: RGBA.fromHex(t.markdownHeading), bold: true },
    'markup.raw.block': { fg: RGBA.fromHex(t.markdownCode) },
    'markup.link.url': { fg: RGBA.fromHex(t.markdownLink) },
    'markup.link.label': { fg: RGBA.fromHex(t.markdownLinkText) },
    'markup.list': { fg: RGBA.fromHex(t.markdownListItem) },
    'markup.list.checked': { fg: RGBA.fromHex(t.success) },
    'markup.list.unchecked': { fg: RGBA.fromHex(t.textMuted) },
    'markup.quote': { fg: RGBA.fromHex(t.markdownBlockQuote), italic: true },
    'punctuation.special': { fg: RGBA.fromHex(t.syntaxPunctuation) },
    'punctuation.delimiter': { fg: RGBA.fromHex(t.syntaxPunctuation) },
    'string.escape': { fg: RGBA.fromHex(t.syntaxString) },
    label: { fg: RGBA.fromHex(t.accent) },
  })
}

// For backward compatibility - some code imports markdownSyntaxStyle directly
// This is a getter that returns the current theme's syntax style
export const markdownSyntaxStyle = new Proxy({} as SyntaxStyle, {
  get(_, prop: string) {
    return getMarkdownSyntaxStyle()[prop as keyof SyntaxStyle]
  },
})

export default Theme
