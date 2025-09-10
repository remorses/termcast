import React, {
  createContext,
  useContext,
  useCallback,
  type ReactNode,
  useEffect,
  useLayoutEffect,
} from 'react'
import { useKeyboard } from '@opentui/react'
import { CommonProps } from '@termcast/cli/src/utils'
import { useStore, type NavigationStackItem } from '@termcast/cli/src/state'
import { useIsInFocus } from '@termcast/cli/src/internal/focus-context'
import { logger } from '../logger'

interface Navigation {
  push: (component: ReactNode, onPop?: () => void) => void
  pop: () => void
}

interface NavigationContextType {
  navigation: Navigation
  stack: NavigationStackItem[]
}

const NavigationContext = createContext<NavigationContextType | undefined>(
  undefined,
)

interface NavigationProviderProps extends CommonProps {
  children: ReactNode
}

export function NavigationProvider(props: NavigationProviderProps): any {
  const stack = useStore((state) => state.navigationStack)

  // Initialize stack with children if empty
  useLayoutEffect(() => {
    if (stack.length === 0) {
      useStore.setState({
        navigationStack: [{ component: props.children }],
      })
    }
  }, [])

  const push = useCallback((component: any, onPop?: () => void) => {
    if (!component) {
      throw new Error(`cannot push falsy value ${component}`)
    }

    logger.log(
      'pushing',
      (component as any)?.type?.name || (component as any)?.type,
    )

    const currentStack = useStore.getState().navigationStack
    useStore.setState({
      navigationStack: [...currentStack, { component, onPop }],
      dialogStack: [],
    })
  }, [])

  const pop = useCallback(() => {
    const currentStack = useStore.getState().navigationStack
    if (currentStack.length <= 1) return

    const newStack = currentStack.slice(0, -1)
    const poppedItem = currentStack[currentStack.length - 1]
    if (poppedItem?.onPop) {
      poppedItem.onPop()
    }

    useStore.setState({ navigationStack: newStack })
  }, [])

  const navigation = React.useMemo(
    () => ({
      push,
      pop,
    }),
    [push, pop],
  )

  const value = React.useMemo(
    () => ({
      navigation,
      stack: stack.length > 0 ? stack : [{ component: props.children }],
    }),
    [navigation, stack, props.children],
  )

  const inFocus = useIsInFocus()

  // Handle ESC key to pop navigation
  useKeyboard((evt) => {
    if (!inFocus) return
    if (evt.name === 'escape' && stack.length > 1) {
      logger.log(
        'popping navigation',
        stack.length - 1,
        'stack:',
        stack.map((item) => (item.component as any).type.name),
      )
      pop()
    }
  })

  const currentItem =
    stack.length > 0 ? stack[stack.length - 1] : { component: props.children }

  return (
    <NavigationContext.Provider value={value}>
      {currentItem?.component}
    </NavigationContext.Provider>
  )
}

export function useNavigation(): Navigation {
  const context = useContext(NavigationContext)
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider')
  }
  return context.navigation
}

interface NavigationContainerProps extends CommonProps {
  children: ReactNode
}

export function NavigationContainer({
  children,
}: NavigationContainerProps): any {
  return <NavigationProvider>{children}</NavigationProvider>
}
