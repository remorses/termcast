import React, { type ReactNode, type ReactElement, Fragment } from "react"
import { useKeyboard } from "@opentui/react"
import { Theme } from "@termcast/api/src/theme"
import { copyToClipboard, openInBrowser, openFile, pasteContent } from "@termcast/api/src/action-utils"
import { useDialog } from "@termcast/api/src/internal/dialog"
import { Dropdown } from "@termcast/api/src/dropdown"
import { useIsInFocus } from "@termcast/api/src/internal/focus-context"
import { CommonProps } from "@termcast/api/src/utils"

export enum ActionStyle {
  Regular = "regular",
  Destructive = "destructive"
}

export interface ActionProps extends CommonProps {
  title: string
  icon?: string | null
  style?: ActionStyle
  shortcut?: {
    modifiers?: string[]
    key: string
  } | null
  onAction?: () => void
  autoFocus?: boolean
}

export interface ActionPanelProps extends CommonProps {
  children?: ReactNode
  title?: string
}

export interface ActionPanelSectionProps extends CommonProps {
  title?: string
  children?: ReactNode
}

interface ActionType {
  (props: ActionProps): any
  Push: (props: PushActionProps) => any
  CopyToClipboard: (props: CopyToClipboardProps) => any
  OpenInBrowser: (props: OpenInBrowserProps) => any
  Open: (props: OpenProps) => any
  Paste: (props: PasteProps) => any
}

interface PushActionProps extends Omit<ActionProps, 'onAction'> {
  target: ReactElement
  onPush?: () => void
}

interface CopyToClipboardProps extends Omit<ActionProps, 'onAction'> {
  content: string | number
  concealed?: boolean
  onCopy?: (content: string | number) => void
}

interface OpenInBrowserProps extends Omit<ActionProps, 'onAction'> {
  url: string
  onOpen?: (url: string) => void
}

interface OpenProps extends Omit<ActionProps, 'onAction'> {
  target: string
  application?: string
  onOpen?: (target: string) => void
}

interface PasteProps extends Omit<ActionProps, 'onAction'> {
  content: string | number
  onPaste?: (content: string | number) => void
}

const Action: ActionType = (props) => {
  // Action components don't render anything visible
  // They're just containers for the action data
  return null
}

Action.Push = (props) => {
  // Action components don't render anything visible
  return null
}

Action.CopyToClipboard = (props) => {
  // Action components don't render anything visible
  return null
}

Action.OpenInBrowser = (props) => {
  // Action components don't render anything visible
  return null
}

Action.Open = (props) => {
  // Action components don't render anything visible
  return null
}

Action.Paste = (props) => {
  // Action components don't render anything visible
  return null
}

interface ActionPanelType {
  (props: ActionPanelProps): any
  Section: (props: ActionPanelSectionProps) => any
  Submenu: (props: ActionPanelSubmenuProps) => any
}

interface ActionPanelSubmenuProps extends ActionPanelSectionProps {
  title: string
  icon?: string | null
  shortcut?: {
    modifiers?: string[]
    key: string
  } | null
}

// Type guards for action types
function isRegularAction(element: ReactElement, props: any): props is ActionProps {
  return element.type === Action
}

function isCopyToClipboardAction(element: ReactElement, props: any): props is CopyToClipboardProps {
  return element.type === Action.CopyToClipboard
}

function isOpenInBrowserAction(element: ReactElement, props: any): props is OpenInBrowserProps {
  return element.type === Action.OpenInBrowser
}

function isOpenAction(element: ReactElement, props: any): props is OpenProps {
  return element.type === Action.Open
}

function isPasteAction(element: ReactElement, props: any): props is PasteProps {
  return element.type === Action.Paste
}

function isPushAction(element: ReactElement, props: any): props is PushActionProps {
  return element.type === Action.Push
}

// Helper function to format shortcuts for display
function formatShortcut(shortcut?: { modifiers?: string[]; key: string } | null): string {
  if (!shortcut) return ''

  const modifiers = shortcut.modifiers || []
  const parts = [...modifiers, shortcut.key]

  return parts
    .map(part => {
      // Convert common modifiers to symbols
      switch (part.toLowerCase()) {
        case 'cmd':
        case 'meta':
          // Map cmd to ctrl since terminals can't intercept cmd
          return '⌃'
        case 'ctrl':
        case 'control':
          return '⌃'
        case 'alt':
        case 'option':
          return '⌥'
        case 'shift':
          return '⇧'
        default:
          return part.toUpperCase()
      }
    })
    .join('')
}

// Helper function to collect all actions from children
function collectAllActions(children: ReactNode): Array<{
  title: string
  shortcut?: { modifiers?: string[]; key: string } | null
  execute: () => void
}> {
  const actions: Array<{
    title: string
    shortcut?: { modifiers?: string[]; key: string } | null
    execute: () => void
  }> = []

  const processChildren = (nodes: ReactNode) => {
    React.Children.forEach(nodes, (child) => {
      if (!React.isValidElement(child)) return

      const actionTypes = [Action, Action.Push, Action.CopyToClipboard, Action.OpenInBrowser, Action.Open, Action.Paste]

      if (actionTypes.includes(child.type as any)) {
        const props = child.props
        const execute = () => {
          if (isRegularAction(child, props)) {
            props.onAction?.()
          } else if (isCopyToClipboardAction(child, props)) {
            copyToClipboard(props.content, props.concealed)
            props.onCopy?.(props.content)
          } else if (isOpenInBrowserAction(child, props)) {
            openInBrowser(props.url)
            props.onOpen?.(props.url)
          } else if (isOpenAction(child, props)) {
            openFile(props.target, props.application)
            props.onOpen?.(props.target)
          } else if (isPasteAction(child, props)) {
            pasteContent(props.content)
            props.onPaste?.(props.content)
          } else if (isPushAction(child, props)) {
            props.onPush?.()
          }
        }

        actions.push({
          title: props.title,
          shortcut: props.shortcut,
          execute
        })
      } else if (child.type === ActionPanel.Section || child.type === ActionPanel.Submenu) {
        processChildren(child.props.children)
      } else if (child.type === Fragment || child.type === React.Fragment) {
        // Handle Fragment components
        processChildren(child.props.children)
      }
    })
  }

  processChildren(children)
  return actions
}

const ActionPanel: ActionPanelType = (props) => {
  const { children } = props
  const dialog = useDialog()
  const inFocus = useIsInFocus()

  // Handle keyboard events when this ActionPanel is focused
  useKeyboard((evt) => {
    if (!inFocus) return

    // Handle Ctrl+K to show all actions in dropdown
    if (evt.name === 'k' && evt.ctrl) {
      const allActions = collectAllActions(children)

      if (allActions.length === 0) return

      const ActionDropdown = () => {
        return (
          <Dropdown
            // tooltip="Select Action"
            placeholder="Search actions..."
            onChange={(value) => {
              const action = allActions.find(a => a.title === value)
              if (action) {
                action.execute()
                dialog.clear()
              }
            }}
          >
            {allActions.map((action, index) => (
                <Dropdown.Item
                  value={action.title}
                  title={action.title}
                  label={formatShortcut(action.shortcut)}
                />
            ))}
          </Dropdown>
        )
      }

      dialog.push(<ActionDropdown />, 'bottom-right')
      return
    }

    // Handle Enter key to execute first action
    if (evt.name !== 'return') return

    // Find the first action in children
    const findFirstAction = (nodes: ReactNode): { element: ReactElement, props: any } | null => {
      let firstAction: { element: ReactElement, props: any } | null = null

      React.Children.forEach(nodes, (child) => {
        if (firstAction) return

        if (React.isValidElement(child)) {
          const actionTypes = [Action, Action.Push, Action.CopyToClipboard, Action.OpenInBrowser, Action.Open, Action.Paste]

          if (actionTypes.includes(child.type as any)) {
            firstAction = { element: child, props: child.props }
          } else if (child.type === ActionPanel.Section) {
            const nestedAction = findFirstAction(child.props.children)
            if (nestedAction) {
              firstAction = nestedAction
            }
          }
        }
      })

      return firstAction
    }

    const firstAction = findFirstAction(children)

    // Execute the first action based on its type
    if (firstAction) {
      const { element, props } = firstAction

      // Check the component type and execute accordingly
      if (isRegularAction(element, props)) {
        props.onAction?.()
      } else if (isCopyToClipboardAction(element, props)) {
        copyToClipboard(props.content, props.concealed)
        props.onCopy?.(props.content)
      } else if (isOpenInBrowserAction(element, props)) {
        openInBrowser(props.url)
        props.onOpen?.(props.url)
      } else if (isOpenAction(element, props)) {
        openFile(props.target, props.application)
        props.onOpen?.(props.target)
      } else if (isPasteAction(element, props)) {
        pasteContent(props.content)
        props.onPaste?.(props.content)
      } else if (isPushAction(element, props)) {
        props.onPush?.()
      }
    }
  })

  // ActionPanel doesn't render anything visible
  return null
}

ActionPanel.Section = (props) => {
  // Section doesn't render anything visible
  return null
}

ActionPanel.Submenu = (props) => {
  // Submenu doesn't render anything visible
  return null
}

export { Action, ActionPanel }
