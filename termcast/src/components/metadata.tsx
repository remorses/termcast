/**
 * Shared Metadata components used by both Detail.Metadata and List.Item.Detail.Metadata
 *
 * Provides Label, Separator, Link, and TagList components with configurable styling
 * via MetadataContext for different use cases (standalone Detail vs List detail panel).
 *
 * Title column width is dynamically computed from the longest title among all children,
 * ensuring consistent alignment without wasting space.
 */

import React, { createContext, useContext, ReactNode, useMemo } from 'react'
import { TextAttributes } from '@opentui/core'
import { useTheme } from 'termcast/src/theme'
import { Color, resolveColor } from 'termcast/src/colors'
import type { ImageLike } from 'termcast/src/components/image'

interface MetadataConfig {
  /**
   * Maximum text length before switching to column layout.
   * Can be a number or a function that takes title length and returns max value length.
   * This allows dynamic calculation based on terminal width and title length.
   */
  maxValueLen: number | ((titleLen: number) => number)
  /**
   * Width for title column in row layout.
   * Dynamically computed from longest title if not explicitly set.
   */
  titleMinWidth: number
  /** Padding below each metadata item (default: 1) */
  paddingBottom: number
  /** Width of separator line - computed from titleMinWidth + extra */
  separatorWidth: number
}

const defaultConfig: MetadataConfig = {
  maxValueLen: 20,
  titleMinWidth: 12,
  paddingBottom: 0,
  separatorWidth: 30,
}

/** Helper to resolve maxValueLen - handles both number and function */
const resolveMaxValueLen = (config: MetadataConfig, titleLen: number): number => {
  if (typeof config.maxValueLen === 'function') {
    return config.maxValueLen(titleLen)
  }
  return config.maxValueLen
}

const MetadataContext = createContext<MetadataConfig>(defaultConfig)

// Props types
interface MetadataProps {
  children: ReactNode
  /** Configuration for metadata display */
  config?: Partial<MetadataConfig>
}

interface LabelProps {
  title: string
  icon?: ImageLike | undefined | null
  text?:
    | string
    | {
        value: string
        color?: Color.ColorLike | null
      }
}

interface SeparatorProps {}

interface LinkProps {
  title: string
  target: string
  text: string
}

interface TagListProps {
  title: string
  children: ReactNode
}

interface TagListItemProps {
  icon?: ImageLike | undefined | null
  text?: string
  color?: Color.ColorLike | undefined | null
  onAction?: () => void
}

/**
 * Extract all title lengths from metadata children.
 * Only counts titles that have values (not header labels).
 */
function extractTitleLengths(children: ReactNode): number[] {
  const lengths: number[] = []

  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) {
      return
    }

    const props = child.props as Record<string, unknown>

    // Label with text value (not header labels which have no text)
    if (props.title && typeof props.title === 'string') {
      // Only count if it has a text value (Labels) or is a Link/TagList
      const hasText = props.text !== undefined || props.target !== undefined
      const isTagList = React.Children.count(props.children) > 0 && props.title
      if (hasText || isTagList) {
        lengths.push((props.title as string).length)
      }
    }
  })

  return lengths
}

// Components
const MetadataLabel = (props: LabelProps): any => {
  const theme = useTheme()
  const config = useContext(MetadataContext)
  const textValue = typeof props.text === 'string' ? props.text : props.text?.value
  const textColor = typeof props.text === 'object' ? props.text?.color : undefined

  // No text = header label (just title, no colon or dash)
  if (!textValue) {
    return (
      <box style={{ paddingBottom: config.paddingBottom }}>
        <text flexShrink={0} fg={theme.textMuted}>
          {props.title}
        </text>
      </box>
    )
  }

  // Row layout for all values - title with minWidth ensures alignment
  // Long values wrap to next line but stay aligned with the title column
  return (
    <box style={{ flexDirection: 'row', paddingBottom: config.paddingBottom }}>
      <text flexShrink={0} fg={theme.textMuted} style={{ minWidth: config.titleMinWidth }}>
        {props.title}:{' '}
      </text>
      <text fg={resolveColor(textColor) || theme.text}>
        {textValue}
      </text>
    </box>
  )
}

const MetadataSeparator = (_props: SeparatorProps): any => {
  const theme = useTheme()
  const config = useContext(MetadataContext)
  const separatorWidth = Math.max(20, config.separatorWidth)
  // Separator has same paddingBottom as other elements for symmetrical spacing
  // (element above has paddingBottom, separator also has paddingBottom)
  return (
    <box style={{ paddingBottom: config.paddingBottom }}>
      <box style={{ flexDirection: 'row', overflow: 'hidden' }}>
        <text flexGrow={0} flexShrink={0} fg={theme.border} wrapMode="none">
          {'─'.repeat(separatorWidth)}
        </text>
      </box>
    </box>
  )
}

const MetadataLink = (props: LinkProps): any => {
  const theme = useTheme()
  const config = useContext(MetadataContext)

  // Row layout - title with minWidth ensures alignment
  return (
    <box style={{ flexDirection: 'row', paddingBottom: config.paddingBottom }}>
      <text flexShrink={0} fg={theme.textMuted} style={{ minWidth: config.titleMinWidth }}>
        {props.title}:{' '}
      </text>
      <text fg={theme.accent} attributes={TextAttributes.UNDERLINE}>
        {props.text}
      </text>
    </box>
  )
}

const MetadataTagListItem = (props: TagListItemProps): any => {
  const theme = useTheme()
  const displayText = props.text || ''

  return (
    <text
      fg={resolveColor(props.color) || theme.text}
      style={{
        paddingRight: 1,
        paddingLeft: props.icon ? 1 : 0,
      }}
    >
      {displayText}
    </text>
  )
}

interface MetadataTagListType {
  (props: TagListProps): any
  Item: (props: TagListItemProps) => any
}

const MetadataTagList: MetadataTagListType = (props) => {
  const theme = useTheme()
  const config = useContext(MetadataContext)

  return (
    <box style={{ flexDirection: 'row', paddingBottom: config.paddingBottom }}>
      <text flexShrink={0} fg={theme.textMuted} style={{ minWidth: config.titleMinWidth }}>
        {props.title}:{' '}
      </text>
      <box style={{ flexDirection: 'row' }}>{props.children}</box>
    </box>
  )
}

MetadataTagList.Item = MetadataTagListItem

// Main Metadata component with compound components
interface MetadataType {
  (props: MetadataProps): any
  Label: (props: LabelProps) => any
  Separator: (props: SeparatorProps) => any
  Link: (props: LinkProps) => any
  TagList: MetadataTagListType
}

const Metadata: MetadataType = (props) => {
  // Compute title column width from longest title among children
  const computedTitleWidth = useMemo(() => {
    const lengths = extractTitleLengths(props.children)
    if (lengths.length === 0) {
      return defaultConfig.titleMinWidth
    }
    // +2 for ": " (colon + space)
    const maxTitleLen = Math.max(...lengths)
    return maxTitleLen + 2
  }, [props.children])

  // Use computed width unless explicitly overridden in config
  const titleMinWidth = props.config?.titleMinWidth ?? computedTitleWidth

  // Separator width based on title width + some extra for value preview
  const separatorWidth = props.config?.separatorWidth ?? titleMinWidth + 15

  const config: MetadataConfig = {
    ...defaultConfig,
    ...props.config,
    titleMinWidth,
    separatorWidth,
  }

  return (
    <MetadataContext.Provider value={config}>
      <box gap={1} style={{ flexDirection: 'column' }}>{props.children}</box>
    </MetadataContext.Provider>
  )
}

Metadata.Label = MetadataLabel
Metadata.Separator = MetadataSeparator
Metadata.Link = MetadataLink
Metadata.TagList = MetadataTagList

export { Metadata, MetadataContext, defaultConfig, extractTitleLengths }
export type { MetadataProps, MetadataConfig, LabelProps, SeparatorProps, LinkProps, TagListProps, TagListItemProps }
