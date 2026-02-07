import { createContext, useContext, ReactNode } from 'react'

const OffscreenContext = createContext(false)

export function useIsOffscreen(): boolean {
  return useContext(OffscreenContext)
}

export function Offscreen({ children }: { children: ReactNode }): any {
  return (
    <OffscreenContext.Provider value={true}>
      {children}
    </OffscreenContext.Provider>
  )
}

// Resets the offscreen context to false. Used by portals that render content
// from an offscreen tree into a visible overlay area.
export function Onscreen({ children }: { children: ReactNode }): any {
  return (
    <OffscreenContext.Provider value={false}>
      {children}
    </OffscreenContext.Provider>
  )
}
