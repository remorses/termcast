import React, { createContext, useContext, useState, useCallback, type ReactNode } from "react"
import { useKeyboard } from "@opentui/react"
import { CommonProps } from '@termcast/api/src/utils'
import { useStore } from '@termcast/api/src/state'

interface NavigationStackItem {
  component: ReactNode
  onPop?: () => void
}

interface Navigation {
  push: (component: ReactNode, onPop?: () => void) => void
  pop: () => void
}

interface NavigationContextType {
  navigation: Navigation
  stack: NavigationStackItem[]
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined)

interface NavigationProviderProps extends CommonProps {
  children: ReactNode
}

export function NavigationProvider(props: NavigationProviderProps): any {
  const [stack, setStack] = useState<NavigationStackItem[]>([
    { component: props.children }
  ])

  const push = useCallback((component: ReactNode, onPop?: () => void) => {
    setStack((prev) => [...prev, { component, onPop }])
    useStore.setState({ dialogStack: [] })
  }, [])

  const pop = useCallback(() => {
    setStack((prev) => {
      if (prev.length <= 1) return prev
      const newStack = prev.slice(0, -1)
      const poppedItem = prev[prev.length - 1]
      if (poppedItem?.onPop) {
        poppedItem.onPop()
      }
      return newStack
    })
  }, [])

  const navigation = React.useMemo(() => ({
    push,
    pop
  }), [push, pop])

  const value = React.useMemo(() => ({
    navigation,
    stack
  }), [navigation, stack])

  // Handle ESC key to pop navigation
  useKeyboard((evt) => {
    if (evt.name === 'escape' && stack.length > 1) {
      pop()
    }
  })

  const currentItem = stack[stack.length - 1]

  return (
    <NavigationContext.Provider value={value}>
      {currentItem?.component}
    </NavigationContext.Provider>
  )
}

export function useNavigation(): Navigation {
  const context = useContext(NavigationContext)
  if (!context) {
    throw new Error("useNavigation must be used within a NavigationProvider")
  }
  return context.navigation
}

interface NavigationContainerProps extends CommonProps {
  children: ReactNode
}

export function NavigationContainer({ children }: NavigationContainerProps): any {
  return (
    <NavigationProvider>
      {children}
    </NavigationProvider>
  )
}