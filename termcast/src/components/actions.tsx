import React, {
  type ReactNode,
  type ReactElement,
  createContext,
  useContext,
  useMemo,
  useLayoutEffect,
} from 'react'
import { createPortal, useRenderer } from '@opentui/react'
import { useTheme } from 'termcast/src/theme'
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
import { ThemePicker } from 'termcast/src/components/theme-picker'
import { useStore } from 'termcast/src/state'
import { InFocus } from 'termcast/src/internal/focus-context'
import { Onscreen, useIsOffscreen } from 'termcast/src/internal/offscreen'
import { CommonProps } from 'termcast/src/utils'
import type {
  KeyboardKeyEquivalent,
  KeyboardKeyModifier,
} from 'termcast/src/keyboard'
import { showToast, Toast } from 'termcast/src/apis/toast'
import { Clipboard } from 'termcast/src/apis/clipboard'
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

// Create descendants for Actions - includes all data needed for display
interface ActionDescendant {
  title: string
  icon?: string | null
  shortcut?: { modifiers?: KeyboardKeyModifier[]; key: KeyboardKeyEquivalent } | null
  style?: ActionStyle
  sectionTitle?: string
  execute: () => void
}

const {
  DescendantsProvider: ActionDescendantsProvider,
  useDescendants: useActionDescendants,
  useDescendant: useActionDescendant,
} = createDescendants<ActionDescendant>()

// Context for ActionPanel - provides section info to child actions
interface ActionPanelContextValue {
  currentSection?: string
}

const ActionPanelContext = createContext<ActionPanelContextValue>({})

const Action: ActionType = (props) => {
  const { currentSection } = useContext(ActionPanelContext)

  // Register as descendant with execute function - captures all data including section
  useActionDescendant({
    title: props.title || 'View',
    icon: props.icon,
    shortcut: props.shortcut,
    style: props.style,
    sectionTitle: currentSection,
    execute: () => props.onAction?.(),
  })

  // Render as Dropdown.Item (handles offscreen check internally)
  return (
    <Dropdown.Item
      title={props.title}
      value={props.title}
      icon={props.icon}
      label={formatShortcut(props.shortcut)}
    />
  )
}

Action.Style = ActionStyle

Action.Push = (props) => {
  const { push } = useNavigation()
  const { currentSection } = useContext(ActionPanelContext)

  // Register as descendant with execute function
  useActionDescendant({
    title: props.title || 'Navigate',
    icon: props.icon,
    shortcut: props.shortcut,
    sectionTitle: currentSection,
    execute: () => {
      props.onPush?.()
      // Push the target to navigation stack
      if (props.target) {
        push(props.target)
      }
    },
  })

  // Render as Dropdown.Item (handles offscreen check internally)
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
  const { currentSection } = useContext(ActionPanelContext)

  // Register as descendant with execute function
  useActionDescendant({
    title: props.title || 'Copy to clipboard',
    icon: props.icon,
    shortcut: props.shortcut,
    sectionTitle: currentSection,
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

  // Render as Dropdown.Item (handles offscreen check internally)
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
  const { currentSection } = useContext(ActionPanelContext)

  // Register as descendant with execute function
  useActionDescendant({
    title: props.title || 'Open in Browser',
    icon: props.icon,
    shortcut: props.shortcut,
    sectionTitle: currentSection,
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

  // Render as Dropdown.Item (handles offscreen check internally)
  return (
    <Dropdown.Item
      title={props.title || 'Open in Browser'}
      icon={props.icon}
      label={formatShortcut(props.shortcut)}
    />
  )
}

Action.Open = (props) => {
  const { currentSection } = useContext(ActionPanelContext)

  // Register as descendant with execute function
  useActionDescendant({
    title: props.title || 'Open',
    icon: props.icon,
    shortcut: props.shortcut,
    sectionTitle: currentSection,
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

  // Render as Dropdown.Item (handles offscreen check internally)
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
  const { currentSection } = useContext(ActionPanelContext)

  // Register as descendant with execute function
  useActionDescendant({
    title: props.title || 'Paste',
    icon: props.icon,
    shortcut: props.shortcut,
    sectionTitle: currentSection,
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

  // Render as Dropdown.Item (handles offscreen check internally)
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
  const { currentSection } = useContext(ActionPanelContext)

  // Register as descendant with execute function
  useActionDescendant({
    title: props.title || 'Show in Finder',
    icon: props.icon,
    shortcut: props.shortcut,
    sectionTitle: currentSection,
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

  // Render as Dropdown.Item (handles offscreen check internally)
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
  const { currentSection } = useContext(ActionPanelContext)

  // Register as descendant with execute function
  useActionDescendant({
    title: props.title || `Open with ${props.application}`,
    icon: props.icon,
    shortcut: props.shortcut,
    sectionTitle: currentSection,
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

  // Render as Dropdown.Item (handles offscreen check internally)
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
  const { currentSection } = useContext(ActionPanelContext)

  // Register as descendant with execute function
  useActionDescendant({
    title: props.title || 'Move to Trash',
    icon: props.icon,
    shortcut: props.shortcut,
    style: ActionStyle.Destructive,
    sectionTitle: currentSection,
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

  // Render as Dropdown.Item (handles offscreen check internally)
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
  const { currentSection } = useContext(ActionPanelContext)

  // Get form context - will be null if not in a form
  const formContext = useFormSubmit()

  // Register as descendant with execute function
  useActionDescendant({
    title: props.title || 'Submit',
    icon: props.icon,
    shortcut: props.shortcut || { modifiers: ['cmd'], key: 'return' },
    sectionTitle: currentSection,
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

  // Render as Dropdown.Item (handles offscreen check internally)
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
  const { currentSection } = useContext(ActionPanelContext)

  // Register as descendant with execute function
  useActionDescendant({
    title: props.title || 'Create Snippet',
    icon: props.icon,
    shortcut: props.shortcut,
    sectionTitle: currentSection,
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

  // Render as Dropdown.Item (handles offscreen check internally)
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
  const { currentSection } = useContext(ActionPanelContext)

  // Register as descendant with execute function
  useActionDescendant({
    title: props.title || 'Create Quicklink',
    icon: props.icon,
    shortcut: props.shortcut,
    sectionTitle: currentSection,
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

  // Render as Dropdown.Item (handles offscreen check internally)
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
  const { currentSection } = useContext(ActionPanelContext)

  // Register as descendant with execute function
  useActionDescendant({
    title: props.title || 'Quick Look',
    icon: props.icon,
    shortcut: props.shortcut || { key: 'space' },
    sectionTitle: currentSection,
    execute: async () => {
      if (!props.path) {
        props.onToggle?.()
        return
      }

      if (process.platform !== 'darwin') {
        showToast({
          title: 'Quick Look',
          message: 'Quick Look is only supported on macOS',
          style: Toast.Style.Failure,
        })
        return
      }

      const { spawn } = await import('node:child_process')
      // qlmanage -p opens Quick Look preview
      const child = spawn('qlmanage', ['-p', props.path], {
        stdio: 'ignore',
        detached: true,
      })
      child.unref()
      props.onToggle?.()
    },
  })

  // Render as Dropdown.Item (handles offscreen check internally)
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
  const { currentSection } = useContext(ActionPanelContext)

  // Register as descendant with execute function
  useActionDescendant({
    title: props.title || 'Pick Date',
    icon: props.icon,
    shortcut: props.shortcut,
    sectionTitle: currentSection,
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

  // Render as Dropdown.Item (handles offscreen check internally)
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

/**
 * Check if a keyboard event matches an action shortcut.
 * Handles modifier mapping:
 * - 'cmd' maps to ctrl (terminals can't intercept cmd)
 * - 'alt'/'opt' checks evt.meta (opentui uses meta for alt on Linux/Windows)
 *   and evt.option (opentui uses option for alt on macOS)
 */
export function matchesShortcut(
  evt: { name: string; ctrl?: boolean; alt?: boolean; shift?: boolean; meta?: boolean; option?: boolean },
  shortcut: { modifiers?: KeyboardKeyModifier[]; key: KeyboardKeyEquivalent },
): boolean {
  // Check key name matches (case-insensitive)
  if (evt.name.toLowerCase() !== shortcut.key.toLowerCase()) {
    return false
  }

  const modifiers = shortcut.modifiers || []

  // Map cmd to ctrl (terminals can't intercept cmd)
  const needsCtrl = modifiers.some((m) =>
    ['cmd', 'ctrl', 'control'].includes(m.toLowerCase()),
  )
  // alt/opt in shortcuts - opentui uses meta (Linux/Windows) or option (macOS) for alt key
  const needsAlt = modifiers.some((m) =>
    ['alt', 'opt', 'option'].includes(m.toLowerCase()),
  )
  const needsShift = modifiers.includes('shift')

  // Check all required modifiers are pressed
  if (needsCtrl && !evt.ctrl) return false
  // For alt, check both meta and option (opentui platform differences)
  const hasAlt = evt.alt || evt.meta || evt.option
  if (needsAlt && !hasAlt) return false
  if (needsShift && !evt.shift) return false

  // Check no extra modifiers are pressed (excluding ones that match)
  if (evt.ctrl && !needsCtrl) return false
  if (hasAlt && !needsAlt) return false
  if (evt.shift && !needsShift) return false

  return true
}

/**
 * ActionPanel uses React portals to render its dialog content in the overlay
 * area while staying in the original React tree. This preserves all React
 * context (FormSubmitContext, NavigationContext, etc.) because portals inherit
 * context from the source tree, not the portal target.
 *
 * Flow:
 * 1. ActionPanel is rendered offscreen via <Offscreen> in List/Detail/Form
 * 2. Action children register as descendants (title, icon, shortcut, execute)
 * 3. A useLayoutEffect captures the first action title for footer display
 * 4. When showActionsDialog is true, ActionPanel renders a Dropdown via
 *    createPortal into the overlay target (provided by DialogOverlay)
 * 5. The Dropdown and all callbacks have fresh context from the original tree
 */
const ActionPanel: ActionPanelType = (props) => {
  const { children, title } = props
  const dialog = useDialog()
  const { push } = useNavigation()
  const descendantsContext = useActionDescendants()
  const renderer = useRenderer()
  const isOffscreen = useIsOffscreen()

  const showActionsDialog = useStore((state) => state.showActionsDialog)
  const portalTarget = useStore((state) => state.actionsPortalTarget)
  // Subscribe so a re-render + layout effect fires when Enter sets this flag
  const shouldAutoExecute = useStore((state) => state.shouldAutoExecuteFirstAction)

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

  // Capture first action title for footer display, register shortcuts, and handle auto-execute.
  // Runs after every render so descendant props are always fresh.
  useLayoutEffect(() => {
    const allActions = Object.values(descendantsContext.map.current)
      .filter((item: any) => item.index !== -1)
      .sort((a: any, b: any) => a.index - b.index)

    const firstActionTitle = allActions[0]?.props?.title ?? ''
    if (useStore.getState().firstActionTitle !== firstActionTitle) {
      useStore.setState({ firstActionTitle })
    }

    // Register actions with shortcuts for global keyboard handling
    // List/Detail/Form keyboard handlers will check these to execute shortcuts
    // Only update if shortcuts changed to avoid unnecessary re-renders
    const actionsWithShortcuts = allActions
      .map((item: any) => item.props as ActionDescendant)
      .filter((action) => action.shortcut)
      .map((action) => ({
        shortcut: action.shortcut!,
        execute: action.execute,
      }))
    
    // Compare shortcut keys to detect changes (ignore execute refs which change every render)
    const currentShortcuts = useStore.getState().registeredActionShortcuts
    const shortcutsChanged = actionsWithShortcuts.length !== currentShortcuts.length ||
      actionsWithShortcuts.some((newShortcut, i) => {
        const current = currentShortcuts[i]
        if (!current) return true
        return newShortcut.shortcut.key !== current.shortcut.key ||
          JSON.stringify(newShortcut.shortcut.modifiers) !== JSON.stringify(current.shortcut.modifiers)
      })
    
    if (shortcutsChanged) {
      useStore.setState({ registeredActionShortcuts: actionsWithShortcuts })
    } else if (actionsWithShortcuts.length > 0) {
      // Update execute functions without triggering re-render by mutating existing array
      // This ensures the latest closures are used when shortcuts are executed
      actionsWithShortcuts.forEach((newShortcut, i) => {
        if (currentShortcuts[i]) {
          currentShortcuts[i].execute = newShortcut.execute
        }
      })
    }

    // Auto-execute first action when Enter was pressed (shouldAutoExecuteFirstAction flag)
    if (shouldAutoExecute) {
      useStore.setState({ shouldAutoExecuteFirstAction: false, showActionsDialog: false })
      const firstAction = allActions[0]?.props as ActionDescendant | undefined
      if (firstAction) {
        logger.log(`Auto-executing first action: ${firstAction.title}`)
        firstAction.execute()
      }
    }
  })

  // Keep offscreen registration lightweight for fast initial command startup.
  // We only need descendants for footer title + auto-execute; rendering the full
  // Dropdown tree offscreen adds avoidable mount work before first paint.
  const offscreenRegistrationTree = (
    <ActionDescendantsProvider value={descendantsContext}>
      <ActionPanelContext.Provider value={contextValue}>
        {children}
      </ActionPanelContext.Provider>
    </ActionDescendantsProvider>
  )

  // Always render the full Dropdown tree when actions are visible so Action
  // children stay mounted and descendants are always registered.
  // descendants are always registered. The Dropdown handles offscreen mode
  // internally (returns null for visual output when isOffscreen is true).
  // When showActionsDialog is true, we portal into the DialogOverlay's content
  // target so the dialog shell and z-order are managed in one place.
  const dropdownTree = (
    <Dropdown
      tooltip={title || 'Actions'}
      placeholder='Search actions...'
      filtering
      onChange={(value) => {
        logger.log(`actions dropdown onChange`, value)
        // Find and execute the selected action from live descendants
        const allActions = Object.values(descendantsContext.map.current)
          .filter((item: any) => item.index !== -1)
          .map((item: any) => item.props as ActionDescendant)

        const action = allActions.find((a) => a.title === value)
        if (action) {
          useStore.setState({ showActionsDialog: false, dialogStack: [] })
          action.execute()
        }
      }}
    >
      {children}
      <ActionPanel.Section title="Settings">
        {hasExtensionPrefs && (
          <Action
            title={`Configure ${extensionPackageJson!.title}...`}
            shortcut={{ modifiers: ['cmd', 'shift'], key: ',' }}
            onAction={() => {
              useStore.setState({ showActionsDialog: false })
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
              useStore.setState({ showActionsDialog: false })
              push(
                <ExtensionPreferences
                  extensionName={extensionPackageJson!.name}
                  commandName={currentCommandName!}
                />,
              )
            }}
          />
        )}
        <Action
          title="Change Theme..."
          onAction={() => {
            useStore.setState({ showActionsDialog: false })
            dialog.push({ element: <ThemePicker /> })
          }}
        />
        <Action
          title="See Console Logs"
          onAction={() => {
            useStore.setState({ showActionsDialog: false })
            if (renderer) {
              renderer.console.onCopySelection = (text: any) => {
                Clipboard.copy(text)
              }
              renderer.toggleDebugOverlay()
              renderer.console.toggle()
            }
          }}
        />
      </ActionPanel.Section>
    </Dropdown>
  )

  // When dialog is active and portal target exists, render the Dropdown in
  // a portal. The portal inherits React context from the source tree, which
  // preserves FormSubmitContext, custom contexts, etc.
  // Onscreen resets the OffscreenContext (since we're portaled from an offscreen
  // tree into a visible overlay), so the Dropdown renders its items normally.
  if (showActionsDialog && portalTarget) {
    return createPortal(
      <Onscreen>
        <InFocus inFocus={true}>
          <ActionDescendantsProvider value={descendantsContext}>
            <ActionPanelContext.Provider value={contextValue}>
              {dropdownTree}
            </ActionPanelContext.Provider>
          </ActionDescendantsProvider>
        </InFocus>
      </Onscreen>,
      portalTarget,
      null,
    )
  }

  if (isOffscreen) {
    return offscreenRegistrationTree
  }

  // When not showing dialog, render the tree inline (offscreen) so descendants
  // register and first action title is captured for the footer.
  return (
    <ActionDescendantsProvider value={descendantsContext}>
      <ActionPanelContext.Provider value={contextValue}>
        {dropdownTree}
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
