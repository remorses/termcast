import React, {
  createContext,
  useContext,
  useCallback,
  type ReactNode,
  useEffect,
  useLayoutEffect,
  startTransition,
  useTransition,
} from 'react'
import { useKeyboard } from '@opentui/react'
import { CommonProps } from 'termcast/src/utils'
import { useStore, type NavigationStackItem } from 'termcast/src/state'
import { useIsInFocus } from 'termcast/src/internal/focus-context'
import { logger } from '../logger'

interface Navigation {
  push: (element: ReactNode, onPop?: () => void) => void
  pop: () => void
}

interface NavigationContextType {
  navigation: Navigation
  stack: NavigationStackItem[]
  isPending: boolean
}

const NavigationContext = createContext<NavigationContextType | undefined>(
  undefined,
)

interface NavigationProviderProps extends CommonProps {
  children: ReactNode
}

export function NavigationProvider(props: NavigationProviderProps): any {
  const stack = useStore((state) => state.navigationStack)
  const [isPending, startNavigationTransition] = useTransition()

  // Initialize stack with children if empty
  useLayoutEffect(() => {
    if (stack.length === 0) {
      useStore.setState({
        navigationStack: [{ element: props.children }],
      })
    }
  }, [])

  const push = useCallback((element: any, onPop?: () => void) => {
    if (!element) {
      throw new Error(`cannot push falsy value ${element}`)
    }

    logger.log(
      'pushing',
      (element as any)?.type?.name || (element as any)?.type,
    )

    const currentStack = useStore.getState().navigationStack
    startNavigationTransition(() => {
      useStore.setState({
        navigationStack: [...currentStack, { element, onPop }],
        dialogStack: [],
      })
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

    startNavigationTransition(() => {
      useStore.setState({ navigationStack: newStack })
    })
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
      stack: stack.length > 0 ? stack : [{ element: props.children }],
      isPending,
    }),
    [navigation, stack, props.children, isPending],
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
        stack.map((item) => (item.element as any).type.name),
      )
      pop()
    }
  })

  const currentItem =
    stack.length > 0 ? stack[stack.length - 1] : { element: props.children }

  return (
    <NavigationContext.Provider value={value}>
      {React.cloneElement(currentItem?.element as React.ReactElement, {
        key: stack.length,
      })}
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

export function useNavigationPending(): boolean {
  const context = useContext(NavigationContext)
  return context?.isPending || false
}

interface NavigationContainerProps extends CommonProps {
  children: ReactNode
}

export function NavigationContainer({
  children,
}: NavigationContainerProps): any {
  return <NavigationProvider>{children}</NavigationProvider>
}
