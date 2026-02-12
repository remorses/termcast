import React, { ReactNode, useMemo, ReactElement } from 'react'
import { TextAttributes } from '@opentui/core'
import { useKeyboard, useTerminalDimensions, useRenderer } from '@opentui/react'
import { useTheme, markdownSyntaxStyle } from 'termcast/src/theme'
import { InFocus, useIsInFocus } from 'termcast/src/internal/focus-context'
import { ActionPanel, Action } from 'termcast/src/components/actions'
import { Footer } from 'termcast/src/components/footer'

import { useDialog } from 'termcast/src/internal/dialog'
import { ScrollBox } from 'termcast/src/internal/scrollbox'
import { useStore } from 'termcast/src/state'
import { Offscreen } from 'termcast/src/internal/offscreen'
import { Metadata, MetadataContext, extractTitleLengths, defaultConfig } from 'termcast/src/components/metadata'
import type { LabelProps, SeparatorProps, LinkProps, TagListProps, TagListItemProps, MetadataConfig } from 'termcast/src/components/metadata'
import { createMarkdownRenderNode } from 'termcast/src/markdown-utils'

interface ActionsInterface {
  actions?: ReactNode
}

interface NavigationChildInterface {
  navigationTitle?: string
}

interface DetailProps extends ActionsInterface, NavigationChildInterface {
  markdown?: string | null
  metadata?: ReactNode
}

interface DetailPropsWithLoading {
  isLoading?: boolean
  markdown?: string | null
  metadata?: ReactNode
}

interface MetadataProps {
  children: ReactNode
}

interface DetailMetadataTagListType {
  (props: TagListProps): any
  Item: (props: TagListItemProps) => any
}

interface DetailMetadataType {
  (props: MetadataProps): any
  Label: (props: LabelProps) => any
  Separator: (props: SeparatorProps) => any
  Link: (props: LinkProps) => any
  TagList: DetailMetadataTagListType
}

interface DetailType {
  (props: DetailProps): any
  Metadata: DetailMetadataType
}

const DetailMetadata: DetailMetadataType = (props) => {
  const { width } = useTerminalDimensions()

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

  const config: MetadataConfig = {
    maxValueLen: 9999, // No limit - let text wrap naturally
    titleMinWidth: computedTitleWidth,
    paddingBottom: 1,
    separatorWidth: 200, // Will be clipped by overflow: hidden
  }

  return (
    <MetadataContext.Provider value={config}>
      <box
        style={{
          flexDirection: 'column',
          paddingTop: 1,
        }}
      >
        {props.children}
      </box>
    </MetadataContext.Provider>
  )
}

DetailMetadata.Label = Metadata.Label
DetailMetadata.Separator = Metadata.Separator
DetailMetadata.Link = Metadata.Link
DetailMetadata.TagList = Metadata.TagList

function DetailFooter({
  hasActions,
  firstActionTitle,
}: {
  hasActions?: boolean
  firstActionTitle?: string
}): any {
  const theme = useTheme()

  return (
    <Footer paddingLeft={0} paddingRight={0}>
      <box style={{ flexDirection: 'row', gap: 3 }}>
        <box style={{ flexDirection: 'row', gap: 1 }}>
          <text flexShrink={0} fg={theme.text} attributes={TextAttributes.BOLD}>
            esc
          </text>
          <text flexShrink={0} fg={theme.textMuted}>go back</text>
        </box>
        {hasActions && (
          <box style={{ flexDirection: 'row', gap: 1 }}>
            <text flexShrink={0} fg={theme.text} attributes={TextAttributes.BOLD}>
              ^k
            </text>
            <text flexShrink={0} fg={theme.textMuted}>actions</text>
          </box>
        )}
        {hasActions && firstActionTitle && (
          <box style={{ flexDirection: 'row', gap: 1 }}>
            <text flexShrink={0} fg={theme.text} attributes={TextAttributes.BOLD}>
              ↵
            </text>
            <text flexShrink={0} fg={theme.textMuted}>{firstActionTitle}</text>
          </box>
        )}
      </box>
    </Footer>
  )
}

// Helper to extract first action title from actions
function getFirstActionTitle(actions: ReactNode): string | undefined {
  let firstTitle: string | undefined

  const findFirstAction = (nodes: ReactNode): void => {
    React.Children.forEach(nodes, (child) => {
      if (firstTitle) return

      if (React.isValidElement(child)) {
        const actionTypes = [
          Action,
          Action.Push,
          Action.CopyToClipboard,
          Action.OpenInBrowser,
          Action.Open,
          Action.Paste,
        ]

        if (actionTypes.includes(child.type as any)) {
          firstTitle = (child.props as any).title
        } else if (child.type === ActionPanel) {
          findFirstAction((child.props as any).children)
        } else if (child.type === ActionPanel.Section) {
          findFirstAction((child.props as any).children)
        }
      }
    })
  }

  findFirstAction(actions)
  return firstTitle
}

// Renders markdown with link URL stripping via renderNode.
// Links show only their title text (bold, primary) with click-to-open.
function MarkdownContent({ markdown }: { markdown: string }): any {
  const renderer = useRenderer()
  const renderNode = useMemo(() => {
    return createMarkdownRenderNode(renderer)
  }, [renderer])

  return (
    <markdown content={markdown} syntaxStyle={markdownSyntaxStyle} conceal renderNode={renderNode} />
  )
}

const Detail: DetailType = (props) => {
  const { actions } = props
  const dialog = useDialog()
  const inFocus = useIsInFocus()

  const firstActionTitle = useMemo(() => {
    return actions ? getFirstActionTitle(actions) : undefined
  }, [actions])

  useKeyboard((evt) => {
    if (!inFocus) return

    if (evt.name === 'k' && evt.ctrl) {
      // Ctrl+K shows actions dialog via portal
      if (actions) {
        useStore.setState({ showActionsDialog: true })
      }
    } else if (evt.name === 'return' && actions) {
      // Enter auto-executes first action via ActionPanel's layout effect
      useStore.setState({ shouldAutoExecuteFirstAction: true })
    }
  })

  const content = (
    <ScrollBox
      focused={true}
      // flexGrow={1}
      flexShrink={1}
      style={{
        rootOptions: {
          backgroundColor: undefined,
        },

      }}
    >
      <box
        style={{
          flexDirection: 'column',
          paddingTop: 2,
          paddingRight: 2,
        }}
      >
        {props.markdown && (
          <MarkdownContent markdown={props.markdown} />
        )}
        {props.metadata}
      </box>
    </ScrollBox>
  )

  return (
    <box style={{ flexDirection: 'column', height: '100%', flexGrow: 1 }}>
      {content}
      <DetailFooter
        hasActions={!!actions}
        firstActionTitle={firstActionTitle}
      />
      {/* Render actions offscreen to capture them */}
      {actions && <Offscreen>{actions}</Offscreen>}
    </box>
  )
}

Detail.Metadata = DetailMetadata

export { Detail }
export type { DetailProps, DetailPropsWithLoading }
