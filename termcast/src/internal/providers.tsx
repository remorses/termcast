import React, { type ReactNode } from 'react'
import { QueryClient } from '@tanstack/react-query'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { DialogProvider } from '@termcast/api/src/internal/dialog'
import { NavigationProvider } from '@termcast/api/src/internal/navigation'
import { CommonProps } from '@termcast/api/src/utils'
import { Cache } from '@termcast/api/src/cache'

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            gcTime: 1000 * 60 * 60 * 24, // 24 hours
            staleTime: 1000 * 60 * 5, // 5 minutes
            retry: 2,
        },
    },
})

// Create a custom persister using the Cache class
const queryCache = new Cache({ namespace: 'tanstack-query' })

const persister = {
    persistClient: async (client: any) => {
        const serialized = JSON.stringify(client)
        queryCache.set('query-client-data', serialized)
    },
    restoreClient: async () => {
        const data = queryCache.get('query-client-data')
        return data ? JSON.parse(data) : undefined
    },
    removeClient: async () => {
        queryCache.remove('query-client-data')
    },
}

interface ProvidersProps extends CommonProps {
    children: ReactNode
}

export function Providers(props: ProvidersProps): any {
    return (
        <PersistQueryClientProvider 
            client={queryClient} 
            persistOptions={{ 
                persister,
                maxAge: 1000 * 60 * 60 * 24, // 24 hours
            }}
        >
            <DialogProvider>
                <group padding={2}>
                    {/* NavigationProvider must be last to ensure parent providers remain in the tree when navigation changes */}
                    <NavigationProvider>
                        {props.children}
                    </NavigationProvider>
                </group>
            </DialogProvider>
        </PersistQueryClientProvider>
    )
}
