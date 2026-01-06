/**
 * Image component and types for displaying images in terminal UI
 *
 * Raycast Docs: https://developers.raycast.com/api-reference/user-interface/icons-and-images
 *
 * In terminal environments, true image rendering is limited. This module provides
 * the same API as Raycast for compatibility, using emoji/text representations.
 * The mask property is preserved for extensions that may use it for other purposes.
 */

import { Icon, getIconEmoji } from 'termcast/src/components/icon'

// Image types similar to Raycast
export interface ImageProps {
  source: ImageSource
  mask?: ImageMask
  tintColor?: string
  fallback?: ImageFallback
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

export type ImageFallback = string | { light: string; dark: string }

/**
 * Available masks that can be used to change the shape of an image.
 * Can be handy to shape avatars or other items in a list.
 *
 * Access via Image.Mask.Circle or Image.Mask.RoundedRectangle
 */
export enum ImageMask {
  Circle = 'circle',
  RoundedRectangle = 'roundedRectangle',
}

/**
 * Image component that displays emoji or text representation.
 * In terminal, we can't render actual images, so we use emoji placeholders.
 * The mask property is stored but visual masking isn't possible in terminal.
 */
function ImageComponent({ source, mask }: ImageProps): any {
  if (typeof source === 'string') {
    // Check if it's an icon ID
    if (source.endsWith('-16')) {
      return getIconEmoji(source)
    }
    // Check if it's a single emoji
    if (source.length <= 4) {
      return source
    }
    // Otherwise treat as a file path or URL
    return '📄'
  }

  if (typeof source === 'object' && 'light' in source && 'dark' in source) {
    // For theme-aware images, just use light version for now
    return ImageComponent({ source: source.light } as ImageProps)
  }

  if (typeof source === 'object' && 'fileIcon' in source) {
    // File icon - return file emoji
    return '📁'
  }

  // Default fallback
  return '🖼️'
}

/**
 * Image type with Mask enum attached for Raycast API compatibility.
 * Usage: Image.Mask.Circle, Image.Mask.RoundedRectangle
 */
export interface ImageType {
  (props: ImageProps): any
  Mask: typeof ImageMask
}

/**
 * Image component with Mask enum attached.
 *
 * @example
 * // Using Image.Mask.Circle
 * <List.Item
 *   title="User"
 *   icon={{ source: "avatar.png", mask: Image.Mask.Circle }}
 * />
 *
 * @example
 * // Using Image.Mask.RoundedRectangle
 * <List.Item
 *   title="App"
 *   icon={{ source: "icon.png", mask: Image.Mask.RoundedRectangle }}
 * />
 */
export const Image: ImageType = Object.assign(ImageComponent, {
  Mask: ImageMask,
})
