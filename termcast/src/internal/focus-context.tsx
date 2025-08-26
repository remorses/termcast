import React, { createContext, useContext, ReactNode } from 'react'

interface FocusContextValue {
    inFocus: boolean
}

const FocusContext = createContext<FocusContextValue>({ inFocus: true })

interface InFocusProps {
    children: ReactNode
    inFocus: boolean
}

export function InFocus({ children, inFocus }: InFocusProps): any {
    return (
        <FocusContext.Provider value={{ inFocus }}>
            {children}
        </FocusContext.Provider>
    )
}

export function useIsInFocus(): boolean {
    const context = useContext(FocusContext)
    return context.inFocus
}