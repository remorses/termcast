import { SyntaxStyle, RGBA } from '@opentui/core'

export const Theme = {
  // Text colors
  text: '#FFFFFF',
  textMuted: '#999999',

  // Background colors
  background: '#181818',
  backgroundPanel: '#181818', // Darker gray panel background

  // Primary/accent colors
  primary: '#FFC000', // Bright golden orange
  accent: '#FFC000', // Bright golden orange

  // Accessory colors (from List component)
  info: '#FFC000', // Orange for text accessories
  success: '#FFC000', // Orange for date accessories
  warning: '#FFC000', // Orange for tag accessories
  error: '#FF0000', // Red for errors

  // Additional UI colors
  border: '#333333',
  selectedMuted: '#AA8000', // Dimmer orange for selected values when not focused
  highlight: '#FFC000',
  selected: '#FFC000',
  yellow: '#FFFF00', // Yellow for icons
  link: '#FFC000', // Orange for links

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
