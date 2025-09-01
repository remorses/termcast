import React, { createContext, useContext, ReactNode } from 'react'
import { CommonProps } from '@termcast/cli/src/utils'

interface FocusContextValue {
    inFocus: boolean
}

const FocusContext = createContext<FocusContextValue>({ inFocus: true })

interface InFocusProps extends CommonProps {
    children: ReactNode
    inFocus: boolean
}

export function InFocus({ children, inFocus }: InFocusProps): any {
    const value = React.useMemo(() => ({ inFocus }), [inFocus])
    return (
        <FocusContext.Provider value={value}>
            {children}
        </FocusContext.Provider>
    )
}

export function useIsInFocus(): boolean {
    const context = useContext(FocusContext)
    return context.inFocus
}
