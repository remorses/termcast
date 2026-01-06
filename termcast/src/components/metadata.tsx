/**
 * Shared Metadata components used by both Detail.Metadata and List.Item.Detail.Metadata
 * 
 * Provides Label, Separator, Link, and TagList components with configurable styling
 * via MetadataContext for different use cases (standalone Detail vs List detail panel).
 */

import React, { createContext, useContext, ReactNode } from 'react'
import { TextAttributes } from '@opentui/core'
import { Theme } from 'termcast/src/theme'
import { Color, resolveColor } from 'termcast/src/colors'
import type { ImageLike } from 'termcast/src/components/image'

interface MetadataConfig {
  /** 
   * Maximum text length before switching to column layout.
   * Can be a number or a function that takes title length and returns max value length.
   * This allows dynamic calculation based on terminal width and title length.
   */
  maxValueLen: number | ((titleLen: number) => number)
  /** Minimum width for title column in row layout (default: 12) */
  titleMinWidth: number
  /** Padding below each metadata item (default: 0.5) */
  paddingBottom: number
  /** Width of separator line (default: 17) */
  separatorWidth: number
}

const defaultConfig: MetadataConfig = {
  maxValueLen: 20,
  titleMinWidth: 12,
  paddingBottom: 0.5,
  separatorWidth: 17,
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

// Components
const MetadataLabel = (props: LabelProps): any => {
  const config = useContext(MetadataContext)
  const textValue = typeof props.text === 'string' ? props.text : props.text?.value
  const textColor = typeof props.text === 'object' ? props.text?.color : undefined

  // No text = header label (just title, no colon or dash)
  if (!textValue) {
    return (
      <box style={{ paddingBottom: config.paddingBottom }}>
        <text flexShrink={0} fg={Theme.textMuted}>{props.title}</text>
      </box>
    )
  }

  const maxLen = resolveMaxValueLen(config, props.title.length)

  // Long value = column layout (title on one line, value below)
  if (textValue.length > maxLen) {
    return (
      <box style={{ flexDirection: 'column', paddingBottom: config.paddingBottom }}>
        <text flexShrink={0} fg={Theme.textMuted}>{props.title}:</text>
        <text flexShrink={0} fg={resolveColor(textColor) || Theme.text}>{textValue}</text>
      </box>
    )
  }

  // Short value = row layout (title: value on same line)
  return (
    <box style={{ flexDirection: 'row', paddingBottom: config.paddingBottom }}>
      <text flexShrink={0} fg={Theme.textMuted} style={{ minWidth: config.titleMinWidth }}>{props.title}:</text>
      <text flexShrink={0} fg={resolveColor(textColor) || Theme.text}>{textValue}</text>
    </box>
  )
}

const MetadataSeparator = (_props: SeparatorProps): any => {
  const config = useContext(MetadataContext)
  return (
    <box style={{ paddingBottom: config.paddingBottom }}>
      <text flexShrink={0} fg={Theme.border}>{'─'.repeat(config.separatorWidth)}</text>
    </box>
  )
}

const MetadataLink = (props: LinkProps): any => {
  const config = useContext(MetadataContext)
  const maxLen = resolveMaxValueLen(config, props.title.length)
  const isLongValue = props.text.length > maxLen

  if (isLongValue) {
    return (
      <box style={{ flexDirection: 'column', paddingBottom: config.paddingBottom }}>
        <text flexShrink={0} fg={Theme.textMuted}>{props.title}:</text>
        <text flexShrink={0} fg={Theme.accent} attributes={TextAttributes.UNDERLINE}>{props.text}</text>
      </box>
    )
  }

  return (
    <box style={{ flexDirection: 'row', paddingBottom: config.paddingBottom }}>
      <text flexShrink={0} fg={Theme.textMuted} style={{ minWidth: config.titleMinWidth }}>{props.title}:</text>
      <text flexShrink={0} fg={Theme.accent} attributes={TextAttributes.UNDERLINE}>{props.text}</text>
    </box>
  )
}

const MetadataTagListItem = (props: TagListItemProps): any => {
  const displayText = props.text || ''

  return (
    <text
      fg={resolveColor(props.color) || Theme.text}
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
  const config = useContext(MetadataContext)

  return (
    <box style={{ flexDirection: 'row', paddingBottom: config.paddingBottom }}>
      <text flexShrink={0} fg={Theme.textMuted} style={{ minWidth: config.titleMinWidth }}>{props.title}:</text>
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
  const config = { ...defaultConfig, ...props.config }

  return (
    <MetadataContext.Provider value={config}>
      <box style={{ flexDirection: 'column' }}>
        {props.children}
      </box>
    </MetadataContext.Provider>
  )
}

Metadata.Label = MetadataLabel
Metadata.Separator = MetadataSeparator
Metadata.Link = MetadataLink
Metadata.TagList = MetadataTagList

export { Metadata, MetadataContext, defaultConfig }
export type { MetadataProps, MetadataConfig, LabelProps, SeparatorProps, LinkProps, TagListProps, TagListItemProps }
