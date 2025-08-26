import React, { type ReactNode } from 'react'
import { DialogProvider } from '@termcast/api/src/internal/dialog'
import { NavigationProvider } from '@termcast/api/src/internal/navigation'
import { CommonProps } from '@termcast/api/src/utils'

interface ProvidersProps extends CommonProps {
    children: ReactNode
}

export function Providers(props: ProvidersProps): any {
    return (
        <DialogProvider>
            <group padding={2}>
                {/* NavigationProvider must be last to ensure parent providers remain in the tree when navigation changes */}
                <NavigationProvider>
                    {props.children}
                </NavigationProvider>
            </group>
        </DialogProvider>
    )
}
