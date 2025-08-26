import React, { type ReactNode, type ReactElement } from "react"
import { useKeyboard } from "@opentui/react"
import { Theme } from "@termcast/api/src/theme"

export enum ActionStyle {
  Regular = "regular",
  Destructive = "destructive"
}

export interface ActionProps {
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

export interface ActionPanelProps {
  children?: ReactNode
  title?: string
}

export interface ActionPanelSectionProps {
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

const ActionPanel: ActionPanelType = (props) => {
  // ActionPanel doesn't render anything visible
  // It's just a container for actions
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