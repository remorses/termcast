import { SyntaxStyle, RGBA } from '@opentui/core'

export const Theme = {
  // Text colors
  text: '#FFFFFF',
  textMuted: '#999999',

  // Background colors
  background: '#181818',
  backgroundPanel: '#181818',
  backgroundElement: '#282828',

  // Primary/accent colors
  primary: '#FFC000',
  secondary: '#AA8000',
  accent: '#FFC000',

  // Semantic colors
  info: '#FFC000',
  success: '#FFC000',
  warning: '#FFC000',
  error: '#FF0000',

  // Border colors
  border: '#333333',
  borderActive: '#FFC000',
  borderSubtle: '#252525',

  // Diff colors
  diffAdded: '#4fd6be',
  diffRemoved: '#c53b53',
  diffContext: '#999999',
  diffHunkHeader: '#999999',
  diffHighlightAdded: '#b8db87',
  diffHighlightRemoved: '#e26a75',
  diffAddedBg: '#20303b',
  diffRemovedBg: '#37222c',
  diffContextBg: '#181818',
  diffLineNumber: '#333333',
  diffAddedLineNumberBg: '#1b2b34',
  diffRemovedLineNumberBg: '#2d1f26',

  // Markdown colors
  markdownText: '#FFFFFF',
  markdownHeading: '#FFC000',
  markdownLink: '#FFC000',
  markdownLinkText: '#FFC000',
  markdownCode: '#FFC000',
  markdownBlockQuote: '#999999',
  markdownEmph: '#FFC000',
  markdownStrong: '#FFC000',
  markdownHorizontalRule: '#999999',
  markdownListItem: '#FFC000',
  markdownListEnumeration: '#FFC000',
  markdownImage: '#FFC000',
  markdownImageText: '#FFC000',
  markdownCodeBlock: '#FFFFFF',

  // Syntax colors
  syntaxComment: '#999999',
  syntaxKeyword: '#FFC000',
  syntaxFunction: '#FFC000',
  syntaxVariable: '#FF6666',
  syntaxString: '#FFC000',
  syntaxNumber: '#FFC000',
  syntaxType: '#FFC000',
  syntaxOperator: '#FFC000',
  syntaxPunctuation: '#FFFFFF',

  // Transparent
  transparent: undefined,
} as const

export const markdownSyntaxStyle = SyntaxStyle.fromStyles({
  default: { fg: RGBA.fromHex(Theme.markdownText) },
  'markup.heading.1': { fg: RGBA.fromHex(Theme.markdownHeading), bold: true },
  'markup.heading.2': { fg: RGBA.fromHex(Theme.markdownHeading), bold: true },
  'markup.heading.3': { fg: RGBA.fromHex(Theme.markdownHeading), bold: true },
  'markup.heading.4': { fg: RGBA.fromHex(Theme.markdownHeading), bold: true },
  'markup.heading.5': { fg: RGBA.fromHex(Theme.markdownHeading), bold: true },
  'markup.heading.6': { fg: RGBA.fromHex(Theme.markdownHeading), bold: true },
  'markup.heading': { fg: RGBA.fromHex(Theme.markdownHeading), bold: true },
  'markup.raw.block': { fg: RGBA.fromHex(Theme.markdownCode) },
  'markup.link.url': { fg: RGBA.fromHex(Theme.markdownLink) },
  'markup.link.label': { fg: RGBA.fromHex(Theme.markdownLinkText) },
  'markup.list': { fg: RGBA.fromHex(Theme.markdownListItem) },
  'markup.list.checked': { fg: RGBA.fromHex(Theme.success) },
  'markup.list.unchecked': { fg: RGBA.fromHex(Theme.textMuted) },
  'markup.quote': { fg: RGBA.fromHex(Theme.markdownBlockQuote), italic: true },
  'punctuation.special': { fg: RGBA.fromHex(Theme.syntaxPunctuation) },
  'punctuation.delimiter': { fg: RGBA.fromHex(Theme.syntaxPunctuation) },
  'string.escape': { fg: RGBA.fromHex(Theme.syntaxString) },
  label: { fg: RGBA.fromHex(Theme.accent) },
})

export default Theme
