import { create } from 'zustand'
import { type ReactNode } from 'react'
import type { RaycastPackageJson } from './package-json'

export type DialogPosition = 'center' | 'top-right' | 'bottom-right'

export interface DialogStackItem {
  element: ReactNode
  position?: DialogPosition
}

export interface NavigationStackItem {
  element: ReactNode
  onPop?: () => void
}

interface AppState {
  toast: ReactNode | null
  dialogStack: DialogStackItem[]
  // Navigation state
  navigationStack: NavigationStackItem[]
  // Dev mode state
  devElement: ReactNode | null
  devRebuildCount: number
  // Extension and command state
  extensionPath: string | null
  extensionPackageJson: RaycastPackageJson | null
  currentCommandName: string | null
  currentCommandArguments: Record<string, string> | null
  // OAuth state
  googleAccessToken?: string
  googleIdToken?: string
  // Actions state - when true, auto-execute first action instead of showing sheet
  shouldAutoExecuteFirstAction: boolean
  // First action title for footer display (set by offscreen ActionPanel)
  firstActionTitle: string
}

export const useStore = create<AppState>(() => ({
  toast: null,
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
}))
