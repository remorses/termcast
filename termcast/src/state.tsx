import { create } from 'zustand'
import { type ReactNode } from 'react'
import type { RaycastPackageJson } from './package-json'

export type DialogPosition = 'center' | 'top-right' | 'bottom-right'

export interface DialogStackItem {
  element: ReactNode
  position?: DialogPosition
}

interface AppState {
  toast: ReactNode | null
  dialogStack: DialogStackItem[]
  // Dev mode state
  devElement: ReactNode | null
  devRebuildCount: number
  // Extension and command state
  extensionPath: string | null
  extensionPackageJson: RaycastPackageJson | null
  currentCommandName: string | null
}

export const useStore = create<AppState>(() => ({
  toast: null,
  dialogStack: [],
  // Dev mode state
  devElement: null,
  devRebuildCount: 0,
  // Extension and command state
  extensionPath: null,
  extensionPackageJson: null,
  currentCommandName: null
}))