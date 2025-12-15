export enum Color {
  Blue = '#0080FF',
  Green = '#00FF80',
  Magenta = '#FF00FF',
  Orange = '#FF8000',
  Purple = '#8000FF',
  Red = '#FF0000',
  Yellow = '#FFFF00',
  PrimaryText = '#FFFFFF',
  SecondaryText = '#999999',
}

export namespace Color {
  export interface Dynamic {
    light: string
    dark: string
    adjustContrast?: boolean
  }

  export type Raw = string

  export type ColorLike = Color | Dynamic | Raw
}

export function resolveColor(color: Color.ColorLike | undefined | null): string | undefined {
  if (!color) {
    return undefined
  }
  if (typeof color === 'string') {
    return color
  }
  if (typeof color === 'object' && 'dark' in color) {
    return color.dark
  }
  return undefined
}
