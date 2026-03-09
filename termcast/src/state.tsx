import fs from 'node:fs'
import { create } from 'zustand'
import { type ReactNode } from 'react'
import type { TextareaRenderable } from '@opentui/core'
import type { RaycastPackageJson } from './package-json'
import type { KeyboardKeyEquivalent, KeyboardKeyModifier } from 'termcast/src/keyboard'
import { getResolvedTheme } from './themes'
import { logger } from './logger'

// Registered action shortcuts for global keyboard handling
// Stored by ActionPanel, consumed by List/Detail/Form keyboard handlers
export interface RegisteredActionShortcut {
  shortcut: { modifiers?: KeyboardKeyModifier[]; key: KeyboardKeyEquivalent }
  execute: () => void
}

// Toast action keyboard shortcuts (ctrl+t for primary, ctrl+g for secondary)
export const toastPrimaryActionKey = { ctrl: true, name: 't' } as const
export const toastSecondaryActionKey = { ctrl: true, name: 'g' } as const

export type ToastStyle = 'SUCCESS' | 'FAILURE' | 'ANIMATED'

export interface ToastActionData {
  title: string
  onAction: () => void
}

export interface ToastData {
  id: string
  title: string
  message?: string
  style: ToastStyle
  primaryAction?: ToastActionData
  secondaryAction?: ToastActionData
  onHide: () => void
}

export type DialogPosition = 'center' | 'top-right' | 'bottom-right'
export type DialogStackItemType = 'actions' | undefined

export interface DialogStackItem {
  element: ReactNode
  position?: DialogPosition
  type?: DialogStackItemType
  onClose?: () => void
}

export interface NavigationStackItem {
  element: ReactNode
  onPop?: () => void
  selectedListIndex?: number
  searchText?: string
}

// Vim mode types
// inputMode: global mode persisted across sessions
// vimInputSubMode: transient sub-state within the current mode
export type InputMode = 'raycast' | 'vim'
export type VimInputSubMode = 'default' | 'search' | 'command'

interface AppState {
  // Vim mode state
  inputMode: InputMode
  vimInputSubMode: VimInputSubMode
  vimCommandText: string
  toast: ToastData | null
  toastWithPrimaryAction: boolean
  dialogStack: DialogStackItem[]
  navigationStack: NavigationStackItem[]
  // Dev mode state
  devElement: ReactNode | null
  // used to bust cache in bun after imports. incremented on each file change
  devRebuildCount: number
  // Extension and command state
  // TODO this should always be available. for compiled extensions it should be homedir/.termcast/extension-name
  // there we should put data, cache, etc. the logic should be same exact as dev command extensions. simply changes the extension path
  // in this same folder we should also put the binary executable, which will be added in PATH. inside a bin folder
  extensionPath: string | null
  // TODO extensionPackageJson should be always defined. even for dev extensions or compiled extensions.
  // it is ok to fail in functions that need it. if examples without package.json need to use this field we should move them to actual extensions inside fixtures then
  extensionPackageJson: RaycastPackageJson | null
  currentCommandName: string | null
  currentCommandArguments: Record<string, string> | null
  googleAccessToken?: string
  googleIdToken?: string
  // Actions state - when true, auto-execute first action instead of showing sheet
  shouldAutoExecuteFirstAction: boolean
  // First action title for footer display (set by offscreen ActionPanel)
  firstActionTitle: string
  // Selected List.Dropdown item title shown in List footer (^p label)
  dropdownFooterLabel: string
  // List.Dropdown tooltip shown in footer as ^p label (preferred over dropdownFooterLabel)
  dropdownTooltip: string
  // Flag to show actions dialog via portal
  showActionsDialog: boolean
  // Portal target node for rendering ActionPanel dialog in the overlay area.
  // Set by DialogOverlay, consumed by ActionPanel via createPortal.
  actionsPortalTarget: any
  // Theme state
  currentThemeName: string
  // Active search input ref - used to clear search before exiting on ESC
  activeSearchInputRef: TextareaRenderable | null
  // Registered action shortcuts for global keyboard handling
  // ActionPanel populates this, List/Detail/Form consume it
  registeredActionShortcuts: RegisteredActionShortcut[]
}

export const useStore = create<AppState>(() => ({
  // Vim mode — initialized from persistence in initializeVimMode()
  inputMode: 'raycast',
  vimInputSubMode: 'default',
  vimCommandText: '',
  toast: null,
  toastWithPrimaryAction: false,
  dialogStack: [],
  // Navigation state
  navigationStack: [],
  // Dev mode state
  devElement: null,
  devRebuildCount: 0,
  // Extension and command state
  extensionPath: null,
  extensionPackageJson: null,
  currentCommandName: null,
  currentCommandArguments: null,
  // OAuth state
  googleAccessToken: undefined,
  googleIdToken: undefined,
  // Actions state
  shouldAutoExecuteFirstAction: false,
  firstActionTitle: '',
  dropdownFooterLabel: '',
  dropdownTooltip: '',
  showActionsDialog: false,
  actionsPortalTarget: null,
  // Theme state — TERMCAST_DEFAULT_THEME env var is set by the app launcher
  currentThemeName: process.env.TERMCAST_DEFAULT_THEME || 'nerv',
  // Active search input ref
  activeSearchInputRef: null,
  // Registered action shortcuts
  registeredActionShortcuts: [],
}))

// Sync WezTerm's window background with the active termcast theme.
// When the theme changes, rewrite the background color in wezterm.lua.
// WezTerm auto-reloads the config on file change, updating the window edges/padding.
// The config path is passed from the launcher via TERMCAST_WEZTERM_CONFIG env var.
const weztermConfigPath = process.env.TERMCAST_WEZTERM_CONFIG
if (weztermConfigPath) {
  useStore.subscribe((state, prevState) => {
    if (state.currentThemeName === prevState.currentThemeName) {
      return
    }
    try {
      const theme = getResolvedTheme(state.currentThemeName)
      const content = fs.readFileSync(weztermConfigPath, 'utf-8')
      // Replace the background hex in: config.colors = { background = '#xxxxxx' }
      const updated = content.replace(
        /background\s*=\s*'#[0-9a-fA-F]{6}'/,
        `background = '${theme.background}'`,
      )
      if (updated !== content) {
        fs.writeFileSync(weztermConfigPath, updated)
      }
    } catch (e) {
      logger.log('Failed to update wezterm config background:', e)
    }
  })
}
