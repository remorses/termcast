// Theme resolver for termcast
// Adapted from https://github.com/sst/opencode

import { parseColor, RGBA } from '@opentui/core'

import aura from './themes/aura.json'
import ayu from './themes/ayu.json'
import catppuccin from './themes/catppuccin.json'
import catppuccinFrappe from './themes/catppuccin-frappe.json'
import catppuccinMacchiato from './themes/catppuccin-macchiato.json'
import cobalt2 from './themes/cobalt2.json'
import cursor from './themes/cursor.json'
import dracula from './themes/dracula.json'
import everforest from './themes/everforest.json'
import flexoki from './themes/flexoki.json'
import github from './themes/github.json'
import githubLight from './themes/github-light.json'
import gruvbox from './themes/gruvbox.json'
import kanagawa from './themes/kanagawa.json'
import material from './themes/material.json'
import matrix from './themes/matrix.json'
import mercury from './themes/mercury.json'
import monokai from './themes/monokai.json'
import nightowl from './themes/nightowl.json'
import nord from './themes/nord.json'
import oneDark from './themes/one-dark.json'
import opencode from './themes/opencode.json'
import opencodeLight from './themes/opencode-light.json'
import orng from './themes/orng.json'
import palenight from './themes/palenight.json'
import rosepine from './themes/rosepine.json'
import solarized from './themes/solarized.json'
import synthwave84 from './themes/synthwave84.json'
import termcast from './themes/termcast.json'
import tokyonight from './themes/tokyonight.json'
import vercel from './themes/vercel.json'
import vesper from './themes/vesper.json'
import zenburn from './themes/zenburn.json'

type HexColor = `#${string}`
type RefName = string
type Variant = {
  dark: HexColor | RefName
  light: HexColor | RefName
}
type ColorValue = HexColor | RefName | Variant

interface ThemeJson {
  $schema?: string
  defs?: Record<string, HexColor | RefName>
  theme: Record<string, ColorValue>
}

export interface ResolvedTheme {
  // Text colors
  text: string
  textMuted: string

  // Background colors
  background: string
  backgroundPanel: string
  backgroundElement: string

  // Primary/accent colors
  primary: string
  secondary: string
  accent: string

  // Semantic colors
  info: string
  success: string
  warning: string
  error: string

  // Border colors
  border: string
  borderActive: string
  borderSubtle: string

  // Diff colors
  diffAdded: string
  diffRemoved: string
  diffContext: string
  diffHunkHeader: string
  diffHighlightAdded: string
  diffHighlightRemoved: string
  diffAddedBg: string
  diffRemovedBg: string
  diffContextBg: string
  diffLineNumber: string
  diffAddedLineNumberBg: string
  diffRemovedLineNumberBg: string

  // Markdown colors
  markdownText: string
  markdownHeading: string
  markdownLink: string
  markdownLinkText: string
  markdownCode: string
  markdownBlockQuote: string
  markdownEmph: string
  markdownStrong: string
  markdownHorizontalRule: string
  markdownListItem: string
  markdownListEnumeration: string
  markdownImage: string
  markdownImageText: string
  markdownCodeBlock: string

  // Syntax colors
  syntaxComment: string
  syntaxKeyword: string
  syntaxFunction: string
  syntaxVariable: string
  syntaxString: string
  syntaxNumber: string
  syntaxType: string
  syntaxOperator: string
  syntaxPunctuation: string

  // Transparent
  transparent: undefined
}

// Note: lucent-orng excluded because it uses transparent backgrounds
const DEFAULT_THEMES: Record<string, ThemeJson> = {
  aura,
  ayu,
  catppuccin,
  'catppuccin-frappe': catppuccinFrappe,
  'catppuccin-macchiato': catppuccinMacchiato,
  cobalt2,
  cursor,
  dracula,
  everforest,
  flexoki,
  github,
  'github-light': githubLight,
  gruvbox,
  kanagawa,
  material,
  matrix,
  mercury,
  monokai,
  nightowl,
  nord,
  'one-dark': oneDark,
  opencode,
  'opencode-light': opencodeLight,
  orng,
  palenight,
  rosepine,
  solarized,
  synthwave84,
  termcast,
  tokyonight,
  vercel,
  vesper,
  zenburn,
}

function rgbaToHex(rgba: RGBA): string {
  const r = Math.round(rgba.r * 255)
    .toString(16)
    .padStart(2, '0')
  const g = Math.round(rgba.g * 255)
    .toString(16)
    .padStart(2, '0')
  const b = Math.round(rgba.b * 255)
    .toString(16)
    .padStart(2, '0')
  return `#${r}${g}${b}`
}

function resolveTheme(
  themeJson: ThemeJson,
  mode: 'dark' | 'light',
): ResolvedTheme {
  const defs = themeJson.defs ?? {}

  function resolveColorToHex(c: ColorValue): string {
    if (typeof c === 'string') {
      if (c === 'transparent' || c === 'none') {
        return '#000000'
      }
      if (c.startsWith('#')) {
        return c
      }
      // Reference to defs
      if (defs[c] != null) {
        return resolveColorToHex(defs[c] as ColorValue)
      }
      // Reference to another theme property
      if (themeJson.theme[c] !== undefined) {
        return resolveColorToHex(themeJson.theme[c] as ColorValue)
      }
      // Fallback
      return '#808080'
    }
    // Variant with dark/light
    return resolveColorToHex(c[mode])
  }

  const t = themeJson.theme
  const fallbackGray = '#808080'
  const fallbackBg = '#1e1e1e'
  const fallbackText = '#d4d4d4'

  return {
    // Text
    text: resolveColorToHex(t.text ?? fallbackText),
    textMuted: resolveColorToHex(t.textMuted ?? fallbackGray),

    // Background
    background: resolveColorToHex(t.background ?? fallbackBg),
    backgroundPanel: resolveColorToHex(t.backgroundPanel ?? fallbackBg),
    backgroundElement: resolveColorToHex(t.backgroundElement ?? fallbackBg),

    // Primary/accent
    primary: resolveColorToHex(t.primary ?? fallbackGray),
    secondary: resolveColorToHex(t.secondary ?? t.primary ?? fallbackGray),
    accent: resolveColorToHex(t.accent ?? t.primary ?? fallbackGray),

    // Semantic
    info: resolveColorToHex(t.info ?? t.primary ?? fallbackGray),
    success: resolveColorToHex(t.success ?? fallbackGray),
    warning: resolveColorToHex(t.warning ?? fallbackGray),
    error: resolveColorToHex(t.error ?? '#ff0000'),

    // Border
    border: resolveColorToHex(t.border ?? fallbackGray),
    borderActive: resolveColorToHex(t.borderActive ?? t.primary ?? fallbackGray),
    borderSubtle: resolveColorToHex(t.borderSubtle ?? fallbackBg),

    // Diff
    diffAdded: resolveColorToHex(t.diffAdded ?? '#4fd6be'),
    diffRemoved: resolveColorToHex(t.diffRemoved ?? '#c53b53'),
    diffContext: resolveColorToHex(t.diffContext ?? fallbackGray),
    diffHunkHeader: resolveColorToHex(t.diffHunkHeader ?? fallbackGray),
    diffHighlightAdded: resolveColorToHex(t.diffHighlightAdded ?? '#b8db87'),
    diffHighlightRemoved: resolveColorToHex(t.diffHighlightRemoved ?? '#e26a75'),
    diffAddedBg: resolveColorToHex(t.diffAddedBg ?? '#1e3a1e'),
    diffRemovedBg: resolveColorToHex(t.diffRemovedBg ?? '#3a1e1e'),
    diffContextBg: resolveColorToHex(t.diffContextBg ?? fallbackBg),
    diffLineNumber: resolveColorToHex(t.diffLineNumber ?? fallbackGray),
    diffAddedLineNumberBg: resolveColorToHex(t.diffAddedLineNumberBg ?? '#1e3a1e'),
    diffRemovedLineNumberBg: resolveColorToHex(t.diffRemovedLineNumberBg ?? '#3a1e1e'),

    // Markdown
    markdownText: resolveColorToHex(t.markdownText ?? t.text ?? fallbackText),
    markdownHeading: resolveColorToHex(t.markdownHeading ?? t.primary ?? fallbackGray),
    markdownLink: resolveColorToHex(t.markdownLink ?? t.primary ?? fallbackGray),
    markdownLinkText: resolveColorToHex(t.markdownLinkText ?? t.primary ?? fallbackGray),
    markdownCode: resolveColorToHex(t.markdownCode ?? t.primary ?? fallbackGray),
    markdownBlockQuote: resolveColorToHex(t.markdownBlockQuote ?? fallbackGray),
    markdownEmph: resolveColorToHex(t.markdownEmph ?? t.primary ?? fallbackGray),
    markdownStrong: resolveColorToHex(t.markdownStrong ?? t.primary ?? fallbackGray),
    markdownHorizontalRule: resolveColorToHex(t.markdownHorizontalRule ?? fallbackGray),
    markdownListItem: resolveColorToHex(t.markdownListItem ?? t.primary ?? fallbackGray),
    markdownListEnumeration: resolveColorToHex(t.markdownListEnumeration ?? t.primary ?? fallbackGray),
    markdownImage: resolveColorToHex(t.markdownImage ?? t.primary ?? fallbackGray),
    markdownImageText: resolveColorToHex(t.markdownImageText ?? t.primary ?? fallbackGray),
    markdownCodeBlock: resolveColorToHex(t.markdownCodeBlock ?? t.text ?? fallbackText),

    // Syntax
    syntaxComment: resolveColorToHex(t.syntaxComment ?? fallbackGray),
    syntaxKeyword: resolveColorToHex(t.syntaxKeyword ?? t.primary ?? fallbackGray),
    syntaxFunction: resolveColorToHex(t.syntaxFunction ?? t.primary ?? fallbackGray),
    syntaxVariable: resolveColorToHex(t.syntaxVariable ?? fallbackGray),
    syntaxString: resolveColorToHex(t.syntaxString ?? t.primary ?? fallbackGray),
    syntaxNumber: resolveColorToHex(t.syntaxNumber ?? t.primary ?? fallbackGray),
    syntaxType: resolveColorToHex(t.syntaxType ?? t.primary ?? fallbackGray),
    syntaxOperator: resolveColorToHex(t.syntaxOperator ?? t.primary ?? fallbackGray),
    syntaxPunctuation: resolveColorToHex(t.syntaxPunctuation ?? t.text ?? fallbackText),

    // Transparent
    transparent: undefined,
  }
}

export function getResolvedTheme(
  name: string,
  mode: 'dark' | 'light' = 'dark',
): ResolvedTheme {
  const themeJson = DEFAULT_THEMES[name] ?? DEFAULT_THEMES.termcast!
  return resolveTheme(themeJson, mode)
}

export const themeNames = Object.keys(DEFAULT_THEMES).sort()

export const defaultThemeName = 'termcast'
