import React, { type ReactNode, type ReactElement } from "react"
import { useKeyboard } from "@opentui/react"
import { Theme } from "@termcast/api/src/theme"
import { copyToClipboard, openInBrowser, openFile, pasteContent } from "@termcast/api/src/action-utils"

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
  __focused?: boolean
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

const ActionPanel: ActionPanelType = (props) => {
  const { children, __focused } = props
  
  // Handle Enter key when this ActionPanel is focused
  useKeyboard((evt) => {
    if (!__focused || evt.name !== 'return') return
    
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