import { create } from 'zustand'
import { type ReactNode } from 'react'
import type { TextareaRenderable } from '@opentui/core'
import type { RaycastPackageJson } from './package-json'

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
}

export interface NavigationStackItem {
  element: ReactNode
  onPop?: () => void
  selectedListIndex?: number
}

interface AppState {
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
  // Flag to show actions dialog via portal
  showActionsDialog: boolean
  // Portal target node for rendering ActionPanel dialog in the overlay area.
  // Set by DialogOverlay, consumed by ActionPanel via createPortal.
  actionsPortalTarget: any
  // Theme state
  currentThemeName: string
  // Active search input ref - used to clear search before exiting on ESC
  activeSearchInputRef: TextareaRenderable | null
}

export const useStore = create<AppState>(() => ({
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
  showActionsDialog: false,
  actionsPortalTarget: null,
  // Theme state
  currentThemeName: 'termcast',
  // Active search input ref
  activeSearchInputRef: null,
}))
