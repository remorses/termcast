import React, { ReactNode, useMemo, ReactElement } from 'react'
import { TextAttributes } from '@opentui/core'
import { useKeyboard } from '@opentui/react'
import { Theme } from 'termcast/src/theme'
import { InFocus, useIsInFocus } from 'termcast/src/internal/focus-context'
import { ActionPanel, Action } from 'termcast/src/components/actions'
import { Image } from 'termcast/src/components/list'
import { Color } from 'termcast/src/colors'
import { useStore } from 'termcast/src/state'
import { useDialog } from 'termcast/src/internal/dialog'

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

interface LabelProps {
  title: string
  icon?: Image.ImageLike | undefined | null
  text?:
    | string
    | {
        value: string
        color?: Color | null
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
  icon?: Image.ImageLike | undefined | null
  text?: string
  color?: Color.ColorLike | undefined | null
  onAction?: () => void
}

interface DetailType {
  (props: DetailProps): any
  Metadata: DetailMetadataType
}

const DetailMetadataLabel = (props: LabelProps): any => {
  const textValue =
    typeof props.text === 'string' ? props.text : props.text?.value
  const textColor =
    typeof props.text === 'object' ? props.text?.color : undefined

  return (
    <box
      style={{
        flexDirection: 'row',
        paddingBottom: 1,
      }}
    >
      <text fg={Theme.textMuted} style={{ minWidth: 15 }}>
        {props.title}:
      </text>
      <text fg={textColor || Theme.text}>{textValue || '—'}</text>
    </box>
  )
}

const DetailMetadataSeparator = (props: SeparatorProps): any => {
  return (
    <box
      style={{
        paddingTop: 1,
        paddingBottom: 1,
      }}
    >
      <text fg={Theme.textMuted}>{'─'.repeat(30)}</text>
    </box>
  )
}

const DetailMetadataLink = (props: LinkProps): any => {
  return (
    <box
      style={{
        flexDirection: 'row',
        paddingBottom: 1,
      }}
    >
      <text fg={Theme.textMuted} style={{ minWidth: 15 }}>
        {props.title}:
      </text>
      <text fg={Theme.accent} attributes={TextAttributes.UNDERLINE}>
        {props.text}
      </text>
    </box>
  )
}

const DetailMetadataTagListItem = (props: TagListItemProps): any => {
  const displayText = props.text || ''

  return (
    <text
      fg={props.color || Theme.text}
      style={{
        paddingRight: 1,
        paddingLeft: props.icon ? 1 : 0,
      }}
    >
      {displayText}
    </text>
  )
}

interface DetailMetadataTagListType {
  (props: TagListProps): any
  Item: (props: TagListItemProps) => any
}

const DetailMetadataTagList: DetailMetadataTagListType = (props) => {
  return (
    <box
      style={{
        flexDirection: 'column',
        paddingBottom: 1,
      }}
    >
      <text fg={Theme.textMuted} style={{ minWidth: 15 }}>
        {props.title}:
      </text>
      <box style={{ flexDirection: 'row' }}>{props.children}</box>
    </box>
  )
}

DetailMetadataTagList.Item = DetailMetadataTagListItem

interface DetailMetadataType {
  (props: MetadataProps): any
  Label: (props: LabelProps) => any
  Separator: (props: SeparatorProps) => any
  Link: (props: LinkProps) => any
  TagList: DetailMetadataTagListType
}

const DetailMetadata: DetailMetadataType = (props) => {
  return (
    <box
      style={{
        flexDirection: 'column',
        paddingTop: 2,
        paddingLeft: 2,
        paddingRight: 2,
      }}
    >
      {props.children}
    </box>
  )
}

DetailMetadata.Label = DetailMetadataLabel
DetailMetadata.Separator = DetailMetadataSeparator
DetailMetadata.Link = DetailMetadataLink
DetailMetadata.TagList = DetailMetadataTagList

function DetailFooter({
  hasActions,
  firstActionTitle,
}: {
  hasActions?: boolean
  firstActionTitle?: string
}): any {
  const toast = useStore((state) => state.toast)

  if (toast) {
    return (
      <box
        border={false}
        style={{
          paddingLeft: 1,
          paddingRight: 1,
          paddingTop: 1,
          marginTop: 1,
        }}
      >
        {toast}
      </box>
    )
  }

  return (
    <box
      border={false}
      style={{
        paddingLeft: 1,
        paddingRight: 1,
        paddingTop: 1,
        marginTop: 1,
        flexDirection: 'row',
      }}
    >
      <text fg={Theme.text} attributes={TextAttributes.BOLD}>
        esc
      </text>
      <text fg={Theme.textMuted}> go back</text>
      {hasActions && (
        <>
          <text fg={Theme.text} attributes={TextAttributes.BOLD}>
            {'   '}^k
          </text>
          <text fg={Theme.textMuted}> actions</text>
        </>
      )}
      {hasActions && firstActionTitle && (
        <>
          <text fg={Theme.text} attributes={TextAttributes.BOLD}>
            {'   '}↵
          </text>
          <text fg={Theme.textMuted}> {firstActionTitle}</text>
        </>
      )}
    </box>
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

const Detail: DetailType = (props) => {
  const { actions } = props
  const dialog = useDialog()
  const inFocus = useIsInFocus()

  const markdownLines = useMemo(() => {
    if (!props.markdown) return []
    // TODO: Implement proper markdown parsing
    return props.markdown.split('\n')
  }, [props.markdown])

  const firstActionTitle = useMemo(() => {
    return actions ? getFirstActionTitle(actions) : undefined
  }, [actions])

  // Handle Ctrl+K and Return to show actions
  useKeyboard((evt) => {
    if (!inFocus) return

    if (evt.name === 'k' && evt.ctrl && actions) {
      dialog.push(actions, 'bottom-right')
    } else if (evt.name === 'return' && actions) {
      dialog.push(actions, 'bottom-right')
    }
  })

  const content = (
    <box
      style={{
        flexDirection: 'row',
        flexGrow: 1,
        width: '100%',
      }}
    >
      <box
        style={{
          flexGrow: 1,
          flexDirection: 'column',
          paddingTop: 2,
          // paddingLeft: 2,
          paddingRight: props.metadata ? 1 : 2,
        }}
      >
        {markdownLines.map((line, index) => (
          <text key={index} fg={Theme.text}>
            {line || ' '}
          </text>
        ))}
      </box>
      {props.metadata && (
        <box
          style={{
            flexShrink: 0,
            width: 40,
          }}
        >
          {props.metadata}
        </box>
      )}
    </box>
  )

  return (
    <box style={{ flexDirection: 'column', height: '100%' }}>
      {content}
      <DetailFooter
        hasActions={!!actions}
        firstActionTitle={firstActionTitle}
      />
    </box>
  )
}

Detail.Metadata = DetailMetadata

export { Detail }
export type { DetailProps, DetailPropsWithLoading }
