export enum Color {
  Blue = '#5CB8FF',
  Green = '#34EE7F',
  Magenta = '#F07FFF',
  Orange = '#FF9F43',
  Purple = '#BF8FFF',
  Red = '#FF7B7B',
  Yellow = '#FFD534',
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
    // Color.Dynamic - just use dark variant (light themes should use flat colors)
    return color.dark
  }
  return undefined
}
