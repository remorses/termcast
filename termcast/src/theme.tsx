import { SyntaxStyle, RGBA } from '@opentui/core'

export const Theme = {
  // Text colors
  text: '#FFFFFF',
  textMuted: '#999999',

  // Background colors
  background: '#000000',
  backgroundPanel: '#1E1E1E', // Dark gray panel background

  // Primary/accent colors
  primary: '#0080FF', // Blue
  accent: '#00FF80', // Light green (was using this for dates)

  // Accessory colors (from List component)
  info: '#0080FF', // Blue for text accessories
  success: '#00FF80', // Green for date accessories
  warning: '#FF8000', // Orange for tag accessories
  error: '#FF0000', // Red for errors

  // Additional UI colors
  border: '#333333',
  selectedMuted: '#004488', // Dimmer blue for selected values when not focused
  highlight: '#0080FF',
  selected: '#0080FF',
  yellow: '#FFFF00', // Yellow for icons
  link: '#0080FF', // Blue for links

  // Transparent
  transparent: undefined, // Use undefined for no background color
} as const

export const markdownSyntaxStyle = SyntaxStyle.fromStyles({
  default: { fg: RGBA.fromHex(Theme.text) },
  'markup.heading.1': { fg: RGBA.fromHex(Theme.primary), bold: true },
  'markup.heading.2': { fg: RGBA.fromHex(Theme.primary), bold: true },
  'markup.heading.3': { fg: RGBA.fromHex(Theme.primary), bold: true },
  'markup.heading.4': { fg: RGBA.fromHex(Theme.primary), bold: true },
  'markup.heading.5': { fg: RGBA.fromHex(Theme.primary), bold: true },
  'markup.heading.6': { fg: RGBA.fromHex(Theme.primary), bold: true },
  'markup.heading': { fg: RGBA.fromHex(Theme.primary), bold: true },
  'markup.raw.block': { fg: RGBA.fromHex(Theme.accent) },
  'markup.link.url': { fg: RGBA.fromHex(Theme.link) },
  'markup.link.label': { fg: RGBA.fromHex(Theme.link) },
  'markup.list': { fg: RGBA.fromHex(Theme.warning) },
  'markup.list.checked': { fg: RGBA.fromHex(Theme.success) },
  'markup.list.unchecked': { fg: RGBA.fromHex(Theme.textMuted) },
  'markup.quote': { fg: RGBA.fromHex(Theme.textMuted), italic: true },
  'punctuation.special': { fg: RGBA.fromHex(Theme.textMuted) },
  'punctuation.delimiter': { fg: RGBA.fromHex(Theme.textMuted) },
  'string.escape': { fg: RGBA.fromHex(Theme.warning) },
  label: { fg: RGBA.fromHex(Theme.accent) },
})

export default Theme
