import { create } from 'zustand'
import { type ReactNode } from 'react'

export type DialogPosition = 'center' | 'top-right' | 'bottom-right'

export interface DialogStackItem {
  element: ReactNode
  position?: DialogPosition
}

interface AppState {
  toast: ReactNode | null
  setToast: (toast: ReactNode | null) => void
  dialogStack: DialogStackItem[]
  pushDialog: (element: ReactNode, position?: DialogPosition) => void
  clearDialogs: () => void
  replaceDialog: (element: ReactNode, position?: DialogPosition) => void
  popDialog: () => void
}

export const useStore = create<AppState>((set) => ({
  toast: null,
  setToast: (toast) => set({ toast }),
  dialogStack: [],
  pushDialog: (element, position) => set((state) => ({ 
    dialogStack: [...state.dialogStack, { element, position }] 
  })),
  clearDialogs: () => set({ dialogStack: [] }),
  replaceDialog: (element, position) => set({ 
    dialogStack: [{ element, position }] 
  }),
  popDialog: () => set((state) => ({ 
    dialogStack: state.dialogStack.slice(0, -1) 
  }))
}))