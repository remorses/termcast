import React, {
  type ReactNode,
  type ReactElement,
  createContext,
  useContext,
  useMemo,
  useLayoutEffect,
} from 'react'
import { useKeyboard } from '@opentui/react'
import { Theme } from 'termcast/src/theme'
import {
  copyToClipboard,
  openInBrowser,
  openFile,
  pasteContent,
  showInFinder,
  moveToTrash,
} from 'termcast/src/action-utils'
import { useDialog } from 'termcast/src/internal/dialog'
import { useNavigation } from 'termcast/src/internal/navigation'
import { Dropdown } from 'termcast/src/components/dropdown'
import { ExtensionPreferences } from 'termcast/src/components/extension-preferences'
import { useStore } from 'termcast/src/state'
import { useIsInFocus } from 'termcast/src/internal/focus-context'
import { CommonProps } from 'termcast/src/utils'
import type {
  KeyboardShortcut,
  KeyboardKeyEquivalent,
  KeyboardKeyModifier,
} from 'termcast/src/keyboard'
import { showToast, Toast } from 'termcast/src/apis/toast'
import { createDescendants } from 'termcast/src/descendants'
import { useFormSubmit } from 'termcast/src/components/form/index'
import { logger } from '../logger'

export enum ActionStyle {
  Regular = 'regular',
  Destructive = 'destructive',
}

export interface ActionProps extends CommonProps {
  title: string
  icon?: string | null
  style?: ActionStyle
  shortcut?: {
    modifiers?: KeyboardKeyModifier[]
    key: KeyboardKeyEquivalent
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
  Style: typeof ActionStyle
  Push: (props: PushActionProps) => any
  CopyToClipboard: (props: CopyToClipboardProps) => any
  OpenInBrowser: (props: OpenInBrowserProps) => any
  Open: (props: OpenProps) => any
  OpenWith: (props: OpenWithProps) => any
  Paste: (props: PasteProps) => any
  ShowInFinder: (props: ShowInFinderProps) => any
  Trash: (props: TrashProps) => any
  SubmitForm: (props: SubmitFormProps) => any
  CreateSnippet: (props: CreateSnippetProps) => any
  CreateQuicklink: (props: CreateQuicklinkProps) => any
  ToggleQuickLook: (props: ToggleQuickLookProps) => any
  PickDate: (props: PickDateProps) => any
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

interface ShowInFinderProps extends Omit<ActionProps, 'onAction'> {
  path: string
  onShow?: (path: string) => void
}

interface OpenWithProps extends Omit<ActionProps, 'onAction'> {
  path: string
  application: string
  onOpen?: (path: string) => void
}

interface TrashProps extends Omit<ActionProps, 'onAction'> {
  paths: string | string[]
  onTrash?: (paths: string[]) => void
}

interface SubmitFormProps<T = any> extends Omit<ActionProps, 'onAction'> {
  onSubmit?: (values: T) => void | Promise<void>
}

interface CreateSnippetProps extends Omit<ActionProps, 'onAction'> {
  snippet: {
    name?: string
    text: string
  }
  onCreated?: () => void
}

interface CreateQuicklinkProps extends Omit<ActionProps, 'onAction'> {
  quicklink: {
    name?: string
    link: string
  }
  onCreated?: () => void
}

interface ToggleQuickLookProps extends Omit<ActionProps, 'onAction'> {
  path?: string
  onToggle?: () => void
}

interface PickDateProps extends Omit<ActionProps, 'onAction'> {
  type?: 'date' | 'datetime'
  min?: Date
  max?: Date
  onPick?: (date: Date | null) => void
}

// Create descendants for Actions - minimal fields needed
interface ActionDescendant {
  title: string
  shortcut?: { modifiers?: KeyboardKeyModifier[]; key: KeyboardKeyEquivalent } | null
  execute: () => void
}

const {
  DescendantsProvider: ActionDescendantsProvider,
  useDescendants: useActionDescendants,
  useDescendant: useActionDescendant,
} = createDescendants<ActionDescendant>()

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
    execute: () => props.onAction?.(),
  })

  const isDestructive = props.style === ActionStyle.Destructive

  // Render as Dropdown.Item
  return (
    <Dropdown.Item
      title={props.title}
      value={props.title}
      icon={props.icon}
      label={formatShortcut(props.shortcut)}
      color={isDestructive ? Theme.error : undefined}
    />
  )
}

Action.Style = ActionStyle

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
    },
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
      const displayContent = props.concealed
        ? 'Concealed content'
        : String(props.content)
      showToast({
        title: 'Copied to Clipboard',
        message:
          displayContent.length > 50
            ? displayContent.substring(0, 50) + '...'
            : displayContent,
        style: Toast.Style.Success,
      })
    },
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
        title: 'Opening in Browser',
        message: props.url,
        style: Toast.Style.Success,
      })
    },
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
      const appText = props.application ? ` with ${props.application}` : ''
      showToast({
        title: `Opening File${appText}`,
        message: props.target,
        style: Toast.Style.Success,
      })
    },
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
        title: 'Content Pasted',
        message:
          String(props.content).length > 50
            ? String(props.content).substring(0, 50) + '...'
            : String(props.content),
        style: Toast.Style.Success,
      })
    },
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

Action.ShowInFinder = (props) => {
  // Register as descendant with execute function
  useActionDescendant({
    title: props.title || 'Show in Finder',
    shortcut: props.shortcut,
    execute: () => {
      showInFinder(props.path)
      props.onShow?.(props.path)
      showToast({
        title: 'Showing in Finder',
        message: props.path,
        style: Toast.Style.Success,
      })
    },
  })

  // Render as Dropdown.Item
  return (
    <Dropdown.Item
      title={props.title || 'Show in Finder'}
      value={props.title || 'Show in Finder'}
      icon={props.icon}
      label={formatShortcut(props.shortcut)}
    />
  )
}

Action.OpenWith = (props) => {
  // Register as descendant with execute function
  useActionDescendant({
    title: props.title || `Open with ${props.application}`,
    shortcut: props.shortcut,
    execute: () => {
      openFile(props.path, props.application)
      props.onOpen?.(props.path)
      showToast({
        title: `Opening with ${props.application}`,
        message: props.path,
        style: Toast.Style.Success,
      })
    },
  })

  // Render as Dropdown.Item
  return (
    <Dropdown.Item
      title={props.title || `Open with ${props.application}`}
      value={props.title || `Open with ${props.application}`}
      icon={props.icon}
      label={formatShortcut(props.shortcut)}
    />
  )
}

Action.Trash = (props) => {
  const paths = Array.isArray(props.paths) ? props.paths : [props.paths]

  // Register as descendant with execute function
  useActionDescendant({
    title: props.title || 'Move to Trash',
    shortcut: props.shortcut,
    execute: async () => {
      for (const path of paths) {
        await moveToTrash(path)
      }
      props.onTrash?.(paths)
      showToast({
        title: 'Moved to Trash',
        message: paths.length > 1 ? `${paths.length} items` : paths[0],
        style: Toast.Style.Success,
      })
    },
  })

  // Render as Dropdown.Item
  return (
    <Dropdown.Item
      title={props.title || 'Move to Trash'}
      value={props.title || 'Move to Trash'}
      icon={props.icon}
      label={formatShortcut(props.shortcut)}
    />
  )
}

Action.SubmitForm = (props) => {
  const dialog = useDialog()

  // Get form context - will be null if not in a form
  const formContext = useFormSubmit()

  // Register as descendant with execute function
  useActionDescendant({
    title: props.title || 'Submit',
    shortcut: props.shortcut || { modifiers: ['cmd'], key: 'return' },
    execute: () => {
      if (formContext) {
        // Also call the onSubmit if provided
        if (props.onSubmit) {
          const values = formContext.getFormValues()
          props.onSubmit(values)
        }
      } else if (props.onSubmit) {
        throw new Error(`SubmitForm should be called inside a Form`)
      }
      dialog.clear()
    },
  })

  // Render as Dropdown.Item
  return (
    <Dropdown.Item
      title={props.title || 'Submit'}
      value={props.title || 'Submit'}
      icon={props.icon}
      label={formatShortcut(
        props.shortcut || { modifiers: ['cmd'], key: 'return' },
      )}
    />
  )
}

Action.CreateSnippet = (props) => {
  // Register as descendant with execute function
  useActionDescendant({
    title: props.title || 'Create Snippet',
    shortcut: props.shortcut,
    execute: () => {
      // TODO: Navigate to Create Snippet command when extension system is implemented
      logger.log(
        `Creating snippet: ${props.snippet.name || 'Untitled'} - ${props.snippet.text}`,
      )
      props.onCreated?.()
      showToast({
        title: 'Create Snippet',
        message: 'Snippet creation not yet implemented',
        style: Toast.Style.Failure,
      })
    },
  })

  // Render as Dropdown.Item
  return (
    <Dropdown.Item
      title={props.title || 'Create Snippet'}
      value={props.title || 'Create Snippet'}
      icon={props.icon}
      label={formatShortcut(props.shortcut)}
    />
  )
}

Action.CreateQuicklink = (props) => {
  // Register as descendant with execute function
  useActionDescendant({
    title: props.title || 'Create Quicklink',
    shortcut: props.shortcut,
    execute: () => {
      // TODO: Navigate to Create Quicklink command when extension system is implemented
      logger.log(
        `Creating quicklink: ${props.quicklink.name || 'Untitled'} - ${props.quicklink.link}`,
      )
      props.onCreated?.()
      showToast({
        title: 'Create Quicklink',
        message: 'Quicklink creation not yet implemented',
        style: Toast.Style.Failure,
      })
    },
  })

  // Render as Dropdown.Item
  return (
    <Dropdown.Item
      title={props.title || 'Create Quicklink'}
      value={props.title || 'Create Quicklink'}
      icon={props.icon}
      label={formatShortcut(props.shortcut)}
    />
  )
}

Action.ToggleQuickLook = (props) => {
  // Register as descendant with execute function
  useActionDescendant({
    title: props.title || 'Quick Look',
    shortcut: props.shortcut || { key: 'space' },
    execute: () => {
      // TODO: Implement Quick Look using macOS qlmanage command
      if (props.path) {
        logger.log(`Quick Look: ${props.path}`)
      }
      props.onToggle?.()
      showToast({
        title: 'Quick Look',
        message: 'Quick Look not yet implemented',
        style: Toast.Style.Failure,
      })
    },
  })

  // Render as Dropdown.Item
  return (
    <Dropdown.Item
      title={props.title || 'Quick Look'}
      value={props.title || 'Quick Look'}
      icon={props.icon}
      label={formatShortcut(props.shortcut || { key: 'space' })}
    />
  )
}

Action.PickDate = (props) => {
  const dialog = useDialog()

  // Register as descendant with execute function
  useActionDescendant({
    title: props.title || 'Pick Date',
    shortcut: props.shortcut,
    execute: () => {
      // TODO: Show date picker dialog when implemented
      logger.log(`Picking ${props.type || 'date'}`)
      props.onPick?.(new Date())
      showToast({
        title: 'Pick Date',
        message: 'Date picker not yet implemented',
        style: Toast.Style.Failure,
      })
    },
  })

  // Render as Dropdown.Item
  return (
    <Dropdown.Item
      title={props.title || 'Pick Date'}
      value={props.title || 'Pick Date'}
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
    modifiers?: KeyboardKeyModifier[]
    key: KeyboardKeyEquivalent
  } | null
}

// Helper function to format shortcuts for display
function formatShortcut(
  shortcut?: { modifiers?: KeyboardKeyModifier[]; key: KeyboardKeyEquivalent } | null,
): string {
  if (!shortcut) return ''

  const modifiers = shortcut.modifiers || []
  const parts = [...modifiers, shortcut.key]

  return parts
    .map((part) => {
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
  const { push } = useNavigation()
  const inFocus = useIsInFocus()
  const descendantsContext = useActionDescendants()

  // Get extension and command info for configure actions
  const extensionPackageJson = useStore((state) => state.extensionPackageJson)
  const currentCommandName = useStore((state) => state.currentCommandName)

  const hasExtensionPrefs =
    (extensionPackageJson?.preferences?.length ?? 0) > 0
  const currentCommand = extensionPackageJson?.commands?.find(
    (c) => c.name === currentCommandName,
  )
  const hasCommandPrefs = (currentCommand?.preferences?.length ?? 0) > 0

  // Create context value
  const contextValue = useMemo<ActionPanelContextValue>(
    () => ({ currentSection: undefined }),
    [],
  )

  // prevent showing actions if no dialog is shown
  if (!dialog.stack.length) return null
  // if (!inFocus) return

  // Auto-execute first action if flag is set (triggered by enter/ctrl+enter)
  useLayoutEffect(() => {
    const shouldExecute = useStore.getState().shouldAutoExecuteFirstAction
    useStore.setState({ shouldAutoExecuteFirstAction: false })

    if (!shouldExecute) return

    const allActions = Object.values(descendantsContext.map.current)
      .filter((item: any) => item.index !== -1)
      // .sort((a: any, b: any) => a.index - b.index)
      .map((item: any) => item.props as ActionDescendant)

    if (allActions[0]) {
      logger.log(`Auto-executing first action: ${allActions[0].title}`)
      dialog.clear()
      allActions[0].execute()
    }
  }, [descendantsContext.map, dialog])

  // ActionPanel renders as Dropdown with children
  return (
    <ActionDescendantsProvider value={descendantsContext}>
      <ActionPanelContext.Provider value={contextValue}>
        <Dropdown
          tooltip={title}
          placeholder='Search actions...'
          filtering
          onChange={(value) => {
            logger.log(`actions dropdown onChange`, value)
            // Find and execute the selected action
            const allActions = Object.values(descendantsContext.map.current)
              .filter((item: any) => item.index !== -1)
              .map((item: any) => item.props as ActionDescendant)

            const action = allActions.find((a) => a.title === value)
            if (action) {
              dialog.clear()
              action.execute()
            }
          }}
        >
          {children}
          {(hasExtensionPrefs || hasCommandPrefs) && (
            <ActionPanel.Section title="Settings">
              {hasExtensionPrefs && (
                <Action
                  title="Configure Extension..."
                  shortcut={{ modifiers: ['cmd', 'shift'], key: ',' }}
                  onAction={() => {
                    dialog.clear()
                    push(
                      <ExtensionPreferences
                        extensionName={extensionPackageJson!.name}
                      />,
                    )
                  }}
                />
              )}
              {hasCommandPrefs && (
                <Action
                  title="Configure Command..."
                  onAction={() => {
                    dialog.clear()
                    push(
                      <ExtensionPreferences
                        extensionName={extensionPackageJson!.name}
                        commandName={currentCommandName!}
                      />,
                    )
                  }}
                />
              )}
            </ActionPanel.Section>
          )}
        </Dropdown>
      </ActionPanelContext.Provider>
    </ActionDescendantsProvider>
  )
}

ActionPanel.Section = (props) => {
  const parentContext = useContext(ActionPanelContext)

  // Create new context with section title
  const sectionContextValue = useMemo(
    () => ({
      ...parentContext,
      currentSection: props.title,
    }),
    [parentContext, props.title],
  )

  // Section renders Dropdown.Section and provides context to its children
  return (
    <Dropdown.Section title={props.title}>
      <ActionPanelContext.Provider value={sectionContextValue}>
        {props.children}
      </ActionPanelContext.Provider>
    </Dropdown.Section>
  )
}

ActionPanel.Submenu = (props) => {
  const parentContext = useContext(ActionPanelContext)

  // Create new context with submenu title
  const submenuContextValue = useMemo(
    () => ({
      ...parentContext,
      currentSection: props.title,
    }),
    [parentContext, props.title],
  )

  // Submenu renders Dropdown.Section and provides context to its children
  return (
    <Dropdown.Section title={props.title}>
      <ActionPanelContext.Provider value={submenuContextValue}>
        {props.children}
      </ActionPanelContext.Provider>
    </Dropdown.Section>
  )
}

export { Action, ActionPanel }
