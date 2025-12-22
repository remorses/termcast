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
