import { Icon, getIconEmoji } from 'termcast/src/components/icon'

// Image types similar to Raycast
export interface ImageProps {
  source: ImageSource
  mask?: ImageMask
  tintColor?: string
}

export type ImageSource =
  | string
  | { light: string; dark: string }
  | FileIcon
  | ImageLike

export interface FileIcon {
  fileIcon: string
}

export type ImageLike = string | FileIcon | ImageProps

export enum ImageMask {
  Circle = 'circle',
  RoundedRectangle = 'rounded-rectangle',
}

// Image component that displays emoji or text representation
export function Image({ source }: ImageProps): any {
  if (typeof source === 'string') {
    // Check if it's an icon ID
    if (source.endsWith('-16')) {
      return getIconEmoji(source)
    }
    // Check if it's a single emoji
    if (source.length <= 4) {
      return source
    }
    // Otherwise treat as a file path
    return '📄'
  }

  if ('light' in source && 'dark' in source) {
    // For theme-aware images, just use light version for now
    return Image({ source: source.light } as ImageProps)
  }

  if ('fileIcon' in source) {
    // File icon - return file emoji
    return '📁'
  }

  // Default fallback
  return '🖼️'
}
