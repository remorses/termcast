/**
 * Image types and raster rendering for Raycast Image.ImageLike.
 *
 * Raycast Docs: https://developers.raycast.com/api-reference/user-interface/icons-and-images
 *
 * `Image` is a Raycast type, not a view. Built-in icons and emoji stay unicode
 * glyphs. URLs, assets, and file paths render through OpenTUI `<image>`
 * (Kitty, then Sixel, then Unicode blocks).
 */

import path from 'node:path'
import { useRef, useState } from 'react'
import type { ImageRenderable, NativeImage } from '@opentui/core'
import { environment } from 'termcast/src/apis/environment'
import { getIconEmoji, iconIds } from 'termcast/src/components/icon'

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

const RASTER_EXTENSION = /\.(png|jpe?g|gif|webp|svg|bmp|ico)(\?.*)?$/i
const DEFAULT_CELL_ASPECT_RATIO = 2

/**
 * Convert a pixel image into terminal cells that keep the source aspect.
 * Terminal cells are about 2:1 (height:width), so a square PNG needs
 * twice as many columns as rows. OpenTUI `fit` still stretches if the
 * layout box itself is the wrong shape; size the box with this helper.
 */
export function fittedImageCellSize({
  sourceWidth,
  sourceHeight,
  maxWidth,
  maxHeight,
  cellAspectRatio = DEFAULT_CELL_ASPECT_RATIO,
}: {
  sourceWidth: number
  sourceHeight: number
  maxWidth: number
  maxHeight: number
  cellAspectRatio?: number
}): { width: number; height: number } {
  if (sourceWidth <= 0 || sourceHeight <= 0 || maxWidth <= 0 || maxHeight <= 0) {
    return { width: 0, height: 0 }
  }
  const displayAspect = (sourceWidth / sourceHeight) * cellAspectRatio
  const scale = Math.min(maxWidth / displayAspect, maxHeight)
  return {
    width: Math.max(1, Math.round(displayAspect * scale)),
    height: Math.max(1, Math.round(scale)),
  }
}

export type ResolvedImage =
  | {
      kind: 'glyph'
      text: string
    }
  | {
      kind: 'raster'
      source: string
      fallback?: ResolvedImage
    }

function isFileIcon(value: object): value is FileIcon {
  return 'fileIcon' in value && typeof (value as FileIcon).fileIcon === 'string'
}

function pickThemeSource({
  light,
  dark,
  appearance,
}: {
  light: string
  dark: string
  appearance: 'dark' | 'light'
}): string {
  if (appearance === 'light') {
    return light
  }
  return dark
}

function isRasterSource(source: string): boolean {
  if (/^(https?:|file:|data:)/i.test(source)) {
    return true
  }
  if (source.startsWith('/') || source.includes('/') || source.includes('\\')) {
    return true
  }
  if (RASTER_EXTENSION.test(source)) {
    return true
  }
  return false
}

function resolveAssetSource({
  source,
  assetsPath,
}: {
  source: string
  assetsPath?: string
}): string {
  if (/^(https?:|file:|data:)/i.test(source)) {
    return source
  }
  if (source.startsWith('/') || source.includes('://')) {
    return source
  }
  if (assetsPath && (RASTER_EXTENSION.test(source) || !source.includes('/'))) {
    return path.join(assetsPath, source)
  }
  return source
}

function resolveSourceString({
  source,
  appearance,
  assetsPath,
}: {
  source: string
  appearance: 'dark' | 'light'
  assetsPath?: string
}): ResolvedImage {
  if (iconIds.includes(source) || source.endsWith('-16')) {
    return { kind: 'glyph', text: getIconEmoji(source) }
  }
  if (isRasterSource(source)) {
    return {
      kind: 'raster',
      source: resolveAssetSource({ source, assetsPath }),
    }
  }
  return { kind: 'glyph', text: getIconEmoji(source) }
}

/**
 * Classify a Raycast Image.ImageLike as a 1-cell glyph or a raster source.
 * Built-in icons, emoji, and fileIcon stay glyphs. URLs, assets, and paths
 * become rasters for OpenTUI `<image>`.
 */
export function resolveImageLike({
  image,
  appearance = 'dark',
  assetsPath,
}: {
  image: unknown
  appearance?: 'dark' | 'light'
  assetsPath?: string
}): ResolvedImage {
  if (image == null || image === false) {
    return { kind: 'glyph', text: '' }
  }

  if (typeof image === 'string') {
    return resolveSourceString({ source: image, appearance, assetsPath })
  }

  if (typeof image !== 'object') {
    return { kind: 'glyph', text: '' }
  }

  if (isFileIcon(image)) {
    return { kind: 'glyph', text: '▤' }
  }

  const obj = image as Record<string, unknown>

  if ('value' in obj && obj.value != null) {
    return resolveImageLike({
      image: obj.value,
      appearance,
      assetsPath,
    })
  }

  if ('light' in obj && 'dark' in obj && typeof obj.light === 'string' && typeof obj.dark === 'string') {
    return resolveSourceString({
      source: pickThemeSource({
        light: obj.light,
        dark: obj.dark,
        appearance,
      }),
      appearance,
      assetsPath,
    })
  }

  if ('source' in obj) {
    const source = obj.source
    const resolved = resolveImageLike({
      image: source,
      appearance,
      assetsPath,
    })
    if (resolved.kind === 'raster') {
      if (obj.fallback == null) {
        return resolved
      }
      return {
        kind: 'raster',
        source: resolved.source,
        fallback: resolveImageLike({
          image: obj.fallback,
          appearance,
          assetsPath,
        }),
      }
    }
    return resolved
  }

  return { kind: 'glyph', text: '' }
}

/**
 * Render a raster Image.ImageLike with OpenTUI `<image>`.
 * On load error, shows fallback glyph or raster, then 🖼️.
 */
export function RasterImage({
  source,
  fallback,
  width,
  height,
  fit = 'fit',
}: {
  source: string
  fallback?: ResolvedImage
  width: number | `${number}%`
  height: number
  fit?: 'fit' | 'cover' | 'fill'
}): any {
  const [failed, setFailed] = useState(false)
  const [fitted, setFitted] = useState<{ width: number; height: number } | undefined>(undefined)
  const imageRef = useRef<ImageRenderable>(null)

  if (failed) {
    if (fallback?.kind === 'raster') {
      return (
        <RasterImage
          source={fallback.source}
          fallback={fallback.fallback}
          width={width}
          height={height}
          fit={fit}
        />
      )
    }
    const text = fallback?.kind === 'glyph' && fallback.text ? fallback.text : '🖼️'
    return (
      <text flexShrink={0} wrapMode='none'>
        {text}
      </text>
    )
  }

  const displayWidth = fitted?.width ?? width
  const displayHeight = fitted?.height ?? height

  return (
    <image
      ref={imageRef}
      source={source}
      fit={fit}
      protocol='auto'
      width={displayWidth}
      height={displayHeight}
      flexShrink={0}
      onLoad={(image: NativeImage) => {
        if (fit === 'fill') {
          return
        }
        const node = imageRef.current
        const maxWidth = typeof width === 'number' ? width : (node?.width || 0)
        const maxHeight = height
        if (maxWidth <= 0 || maxHeight <= 0) {
          return
        }
        const size = fittedImageCellSize({
          sourceWidth: image.width,
          sourceHeight: image.height,
          maxWidth,
          maxHeight,
          cellAspectRatio: node?.cellAspectRatio ?? DEFAULT_CELL_ASPECT_RATIO,
        })
        setFitted(size)
      }}
      onError={() => {
        setFailed(true)
      }}
    />
  )
}

export function ImageLikeView({
  image,
  width,
  height,
  fit = 'fit',
}: {
  image: unknown
  width: number | `${number}%`
  height: number
  fit?: 'fit' | 'cover' | 'fill'
}): any {
  const resolved = resolveImageLike({
    image,
    appearance: environment.appearance,
    assetsPath: environment.assetsPath,
  })
  if (resolved.kind === 'glyph') {
    if (!resolved.text) {
      return null
    }
    return (
      <text flexShrink={0} wrapMode='none'>
        {resolved.text}
      </text>
    )
  }
  return (
    <RasterImage
      source={resolved.source}
      fallback={resolved.fallback}
      width={width}
      height={height}
      fit={fit}
    />
  )
}

/**
 * Image component that displays emoji or text representation.
 * In terminal, we can't render actual images, so we use emoji placeholders.
 * The mask property is stored but visual masking isn't possible in terminal.
 */
function ImageComponent({ source }: ImageProps): any {
  const resolved = resolveImageLike({ image: source })
  if (resolved.kind === 'glyph') {
    return resolved.text || '🖼️'
  }
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
