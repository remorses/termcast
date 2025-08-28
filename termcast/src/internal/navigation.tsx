import React, { createContext, useContext, useState, useCallback, type ReactNode } from "react"
import { useKeyboard } from "@opentui/react"
import { CommonProps } from '@termcast/api/src/utils'
import { useStore } from '@termcast/api/src/state'
import { useIsInFocus } from '@termcast/api/src/internal/focus-context'
import { logger } from "../logger"

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
    logger.log('pushing', (component as any)?.type?.name)
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

  const inFocus = useIsInFocus()

  // Handle ESC key to pop navigation
  useKeyboard((evt) => {
    if (!inFocus) return
    if (evt.name === 'escape' && stack.length > 1) {
      logger.log(
        'popping navigation',
        stack.length - 1,
        'stack:',
        stack.map((item) => (item.component as any).type.name)
      )
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
