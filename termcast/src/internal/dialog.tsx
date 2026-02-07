import { useKeyboard } from '@opentui/react'
import React, { type ReactNode, useRef, useContext, useCallback } from 'react'
import { useTheme } from 'termcast/src/theme'
import { InFocus, useIsInFocus } from 'termcast/src/internal/focus-context'
import { CommonProps } from 'termcast/src/utils'
import { useStore, type DialogPosition } from 'termcast/src/state'

import { NavigationContext } from 'termcast/src/internal/navigation'

export type { DialogPosition } from 'termcast/src/state'

interface DialogProps extends CommonProps {
  children: ReactNode
  position?: DialogPosition
  onClickOutside?: () => void
}

export function Dialog({
  children,
  position = 'center',
  onClickOutside,
}: DialogProps): any {
  const theme = useTheme()
  const inFocus = useIsInFocus()
  const clickedInsideDialog = useRef(false)

  const handleBackdropClick = () => {
    if (!inFocus) return
    if (!clickedInsideDialog.current) {
      onClickOutside?.()
    }
    clickedInsideDialog.current = false
  }

  const handleDialogClick = () => {
    clickedInsideDialog.current = true
  }

  const getPositionStyles = () => {
    switch (position) {
      case 'top-right':
        return {
          alignItems: 'flex-end' as const,
          justifyContent: 'flex-start' as const,
          padding: 2,
        }
      case 'bottom-right':
        return {
          alignItems: 'flex-end' as const,
          justifyContent: 'flex-end' as const,
          padding: 2,
        }
      case 'center':
      default:
        return {
          alignItems: 'center' as const,
          justifyContent: 'center' as const,
          padding: 0,
        }
    }
  }

  const positionStyles = getPositionStyles()

  return (
    <box
      border={false}
      flexGrow={1}
      left={-2}
      alignItems={positionStyles.alignItems}
      justifyContent={positionStyles.justifyContent}
      padding={positionStyles.padding}
      // backgroundColor={theme.background}
      onMouseDown={handleBackdropClick}
    >
      <box
        border
        borderStyle='rounded'
        width={76}
        maxWidth='95%'
        backgroundColor={theme.backgroundPanel}
        borderColor={theme.accent}
        paddingTop={1}
        onMouseDown={handleDialogClick}
      >
        {children}
      </box>
    </box>
  )
}

interface DialogProviderProps {
  children: ReactNode
}

export function DialogProvider(props: DialogProviderProps): any {
  const dialogStack = useStore((state) => state.dialogStack)
  const showActionsDialog = useStore((state) => state.showActionsDialog)
  const inFocus = useIsInFocus()

  useKeyboard((evt) => {
    if (!inFocus) return
    if (evt.name === 'escape') {
      const state = useStore.getState()
      
      // Handle actions dialog first
      if (state.showActionsDialog) {
        // Check if there's a search input with text that should be cleared first
        const activeSearchInputRef = state.activeSearchInputRef
        if (activeSearchInputRef && activeSearchInputRef.plainText) {
          activeSearchInputRef.setText('')
          return
        }
        useStore.setState({ showActionsDialog: false })
        return
      }
      
      if (state.dialogStack.length > 0) {
        // Check if there's a search input with text that should be cleared first
        const activeSearchInputRef = state.activeSearchInputRef
        if (activeSearchInputRef && activeSearchInputRef.plainText) {
          // Clear the search text instead of closing dialog
          activeSearchInputRef.setText('')
          return
        }
        useStore.setState({
          dialogStack: state.dialogStack.slice(0, -1),
        })
      }
    }
  })

  // Children lose focus only when there's a dialog or actions dialog
  const childrenInFocus = !dialogStack?.length && !showActionsDialog

  return (
    <>
      <InFocus inFocus={childrenInFocus}>{props.children}</InFocus>

    </>
  )
}

/**
 * DialogOverlay renders dialog stack items and provides a portal target for
 * ActionPanel. The portal target is always mounted so ActionPanel can use
 * createPortal to render its Dropdown here while keeping its React context
 * (FormSubmitContext, NavigationContext, etc.) from the original tree.
 */
export function DialogOverlay(): any {
  const dialogStack = useStore((state) => state.dialogStack)
  const showActionsDialog = useStore((state) => state.showActionsDialog)
  const navContext = useContext(NavigationContext)

  const setActionsPortalTargetRef = useCallback((node: any) => {
    if (!node) {
      useStore.setState({ actionsPortalTarget: null })
      return
    }

    useStore.setState({ actionsPortalTarget: node })

    return () => {
      if (useStore.getState().actionsPortalTarget === node) {
        useStore.setState({ actionsPortalTarget: null })
      }
    }
  }, [])

  if (dialogStack.length === 0 && !showActionsDialog) {
    return null
  }

  const topIndex = dialogStack.length - 1
  const item = topIndex >= 0 ? dialogStack[topIndex] : undefined

  return (
    <>
      {showActionsDialog && (
        <box position='absolute' width='100%' height='100%' flexDirection='column'>
          <InFocus inFocus={true}>
            <Dialog
              position='center'
              onClickOutside={() => {
                useStore.setState({ showActionsDialog: false })
              }}
            >
              <box
                ref={setActionsPortalTargetRef}
                flexDirection='column'
                flexGrow={1}
              />
            </Dialog>
          </InFocus>
        </box>
      )}
      {item && (
        <box position='absolute' width='100%' height='100%' flexDirection='column'>
          <InFocus inFocus={true}>
            <Dialog
              position={item.position}
              onClickOutside={() => {
                const state = useStore.getState()
                if (state.dialogStack.length > 0) {
                  useStore.setState({
                    dialogStack: state.dialogStack.slice(0, -1),
                  })
                }
              }}
            >
              <NavigationContext.Provider value={navContext}>
                {item.element}
              </NavigationContext.Provider>
            </Dialog>
          </InFocus>
        </box>
      )}
    </>
  )
}

export function useDialog() {
  const dialogStack = useStore((state) => state.dialogStack)

  const pushDialog = (args: {
    element: ReactNode
    position?: DialogPosition
    type?: 'actions'
  }) => {
    const state = useStore.getState()
    useStore.setState({
      dialogStack: [
        ...state.dialogStack,
        { element: args.element, position: args.position, type: args.type },
      ],
    })
  }

  const pushActions = (element: ReactNode, position: DialogPosition='center') => {
    pushDialog({ element, position, type: 'actions' })
  }

  const clearDialogs = () => {
    useStore.setState({ dialogStack: [] })
  }

  const replaceDialog = (element: ReactNode, position?: DialogPosition) => {
    useStore.setState({ dialogStack: [{ element, position }] })
  }

  return {
    push: pushDialog,
    pushActions,
    clear: clearDialogs,
    replace: replaceDialog,
    stack: dialogStack,
  }
}
