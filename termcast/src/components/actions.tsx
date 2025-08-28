import React, { type ReactNode, type ReactElement, createContext, useContext, useMemo } from "react"
import { useKeyboard } from "@opentui/react"
import { Theme } from "@termcast/api/src/theme"
import { copyToClipboard, openInBrowser, openFile, pasteContent } from "@termcast/api/src/action-utils"
import { useDialog } from "@termcast/api/src/internal/dialog"
import { Dropdown } from "@termcast/api/src/components/dropdown"
import { useIsInFocus } from "@termcast/api/src/internal/focus-context"
import { CommonProps } from "@termcast/api/src/utils"
import { showToast, Toast } from "@termcast/api/src/toast"
import { createDescendants } from "@termcast/api/src/descendants"
import { logger } from "../logger"

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

// Create descendants for Actions - minimal fields needed
interface ActionDescendant {
  title: string
  shortcut?: { modifiers?: string[]; key: string } | null
  execute: () => void
}

const { DescendantsProvider: ActionDescendantsProvider, useDescendants: useActionDescendants, useDescendant: useActionDescendant } = createDescendants<ActionDescendant>()

// Context for ActionPanel
interface ActionPanelContextValue {
  currentSection?: string
}

const ActionPanelContext = createContext<ActionPanelContextValue>({})

const Action: ActionType = (props) => {
  // Register as descendant with execute function
  useActionDescendant({
    title: props.title,
    shortcut: props.shortcut,
    execute: () => props.onAction?.()
  })

  // Render as Dropdown.Item
  return (
    <Dropdown.Item
      title={props.title}
      value={props.title}
      icon={props.icon}
      label={formatShortcut(props.shortcut)}
    />
  )
}

Action.Push = (props) => {
  const dialog = useDialog()

  // Register as descendant with execute function
  useActionDescendant({
    title: props.title,
    shortcut: props.shortcut,
    execute: () => {
      props.onPush?.()
      // Push the target to dialog if needed
      if (props.target) {
        dialog.push(props.target, 'center')
      }
    }
  })

  // Render as Dropdown.Item
  return (
    <Dropdown.Item
      title={props.title}
      value={props.title}
      icon={props.icon}
      label={formatShortcut(props.shortcut)}
    />
  )
}

Action.CopyToClipboard = (props) => {
  // Register as descendant with execute function
  useActionDescendant({
    title: props.title,
    shortcut: props.shortcut,
    execute: () => {
      copyToClipboard(props.content, props.concealed)
      props.onCopy?.(props.content)
      const displayContent = props.concealed ? "Concealed content" : String(props.content)
      showToast({
        title: "Copied to Clipboard",
        message: displayContent.length > 50 ? displayContent.substring(0, 50) + "..." : displayContent,
        style: Toast.Style.Success
      })
    }
  })

  // Render as Dropdown.Item
  return (
    <Dropdown.Item
      title={props.title}
      value={props.title}
      icon={props.icon}
      label={formatShortcut(props.shortcut)}
    />
  )
}

Action.OpenInBrowser = (props) => {
  // Register as descendant with execute function
  useActionDescendant({
    title: props.title,
    shortcut: props.shortcut,
    execute: () => {
      openInBrowser(props.url)
      props.onOpen?.(props.url)
      showToast({
        title: "Opening in Browser",
        message: props.url,
        style: Toast.Style.Success
      })
    }
  })

  // Render as Dropdown.Item
  return (
    <Dropdown.Item
      title={props.title}
      value={props.title}
      icon={props.icon}
      label={formatShortcut(props.shortcut)}
    />
  )
}

Action.Open = (props) => {
  // Register as descendant with execute function
  useActionDescendant({
    title: props.title,
    shortcut: props.shortcut,
    execute: () => {
      openFile(props.target, props.application)
      props.onOpen?.(props.target)
      const appText = props.application ? ` with ${props.application}` : ""
      showToast({
        title: `Opening File${appText}`,
        message: props.target,
        style: Toast.Style.Success
      })
    }
  })

  // Render as Dropdown.Item
  return (
    <Dropdown.Item
      title={props.title}
      value={props.title}
      icon={props.icon}
      label={formatShortcut(props.shortcut)}
    />
  )
}

Action.Paste = (props) => {
  // Register as descendant with execute function
  useActionDescendant({
    title: props.title,
    shortcut: props.shortcut,
    execute: () => {
      pasteContent(props.content)
      props.onPaste?.(props.content)
      showToast({
        title: "Content Pasted",
        message: String(props.content).length > 50 ? String(props.content).substring(0, 50) + "..." : String(props.content),
        style: Toast.Style.Success
      })
    }
  })

  // Render as Dropdown.Item
  return (
    <Dropdown.Item
      title={props.title}
      value={props.title}
      icon={props.icon}
      label={formatShortcut(props.shortcut)}
    />
  )
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


const ActionPanel: ActionPanelType = (props) => {
  const { children, title } = props
  const dialog = useDialog()
  const inFocus = useIsInFocus()
  const descendantsContext = useActionDescendants()

  // Create context value
  const contextValue = useMemo<ActionPanelContextValue>(
    () => ({ currentSection: undefined }),
    [],
  )

  // Handle keyboard events when this ActionPanel is focused
  useKeyboard((evt) => {

    if (!inFocus) return

    // Handle Enter key to execute selected action
    if (evt.name === 'return') {
      // Get all registered actions sorted by index
      const items = Object.values(descendantsContext.map.current)
        .filter((item: any) => item.index !== -1)
        .sort((a: any, b: any) => a.index - b.index)
        .map((item: any) => item.props as ActionDescendant)

      // Execute the first action if available
      if (items.length > 0) {
        items[0].execute()
      }
    }
  })

  // ActionPanel renders as Dropdown with children
  return (
    <ActionDescendantsProvider value={descendantsContext}>
      <ActionPanelContext.Provider value={contextValue}>
        <Dropdown
          tooltip={title}
          placeholder="Search actions..."
          filtering={true}
          onChange={(value) => {
            // Find and execute the selected action
            const allActions = Object.values(descendantsContext.map.current)
              .filter((item: any) => item.index !== -1)
              .map((item: any) => item.props as ActionDescendant)

            const action = allActions.find(a => a.title === value)
            if (action) {
              action.execute()
            }
          }}
        >
          {children}
        </Dropdown>
      </ActionPanelContext.Provider>
    </ActionDescendantsProvider>
  )
}

ActionPanel.Section = (props) => {
  const parentContext = useContext(ActionPanelContext)

  // Create new context with section title
  const sectionContextValue = useMemo(() => ({
    ...parentContext,
    currentSection: props.title,
  }), [parentContext, props.title])

  // Section provides context to its children
  return (
    <ActionPanelContext.Provider value={sectionContextValue}>
      {props.children}
    </ActionPanelContext.Provider>
  )
}

ActionPanel.Submenu = (props) => {
  const parentContext = useContext(ActionPanelContext)

  // Create new context with submenu title
  const submenuContextValue = useMemo(() => ({
    ...parentContext,
    currentSection: props.title,
  }), [parentContext, props.title])

  // Submenu provides context to its children
  return (
    <ActionPanelContext.Provider value={submenuContextValue}>
      {props.children}
    </ActionPanelContext.Provider>
  )
}

export { Action, ActionPanel }
