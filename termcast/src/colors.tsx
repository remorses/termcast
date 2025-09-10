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
  export type ColorLike = Color | string
}
