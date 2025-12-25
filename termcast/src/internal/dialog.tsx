import { useKeyboard } from '@opentui/react'
import React, { type ReactNode, useRef, useContext } from 'react'
import { Theme } from 'termcast/src/theme'
import { InFocus, useIsInFocus } from 'termcast/src/internal/focus-context'
import { CommonProps } from 'termcast/src/utils'
import { useStore, type DialogPosition } from 'termcast/src/state'
import { ToastOverlay } from 'termcast/src/apis/toast'
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
      backgroundColor={Theme.background}
      onMouseDown={handleBackdropClick}
    >
      <box
        border
        width={76}
        maxWidth='95%'
        backgroundColor={Theme.backgroundPanel}
        borderColor={Theme.border}
        // paddingTop={1}
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
  const inFocus = useIsInFocus()

  useKeyboard((evt) => {
    if (!inFocus) return
    if (evt.name === 'escape') {
      const state = useStore.getState()
      if (state.dialogStack.length > 0) {
        useStore.setState({
          dialogStack: state.dialogStack.slice(0, -1),
        })
      }
    }
  })

  // Children lose focus only when there's a dialog (toast uses unique shortcuts so no focus stealing needed)
  const childrenInFocus = !dialogStack?.length

  return (
    <>
      <InFocus inFocus={childrenInFocus}>{props.children}</InFocus>

    </>
  )
}

export function DialogOverlay(): any {
  const dialogStack = useStore((state) => state.dialogStack)
  const navContext = useContext(NavigationContext)

  if (dialogStack.length === 0) {
    return null
  }

  // Only render the topmost dialog
  const topIndex = dialogStack.length - 1
  const item = dialogStack[topIndex]

  return (
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
  )
}

export function useDialog() {
  const dialogStack = useStore((state) => state.dialogStack)

  const pushDialog = (element: ReactNode, position?: DialogPosition) => {
    const state = useStore.getState()
    useStore.setState({
      dialogStack: [...state.dialogStack, { element, position }],
    })
  }

  const clearDialogs = () => {
    useStore.setState({ dialogStack: [] })
  }

  const replaceDialog = (element: ReactNode, position?: DialogPosition) => {
    useStore.setState({ dialogStack: [{ element, position }] })
  }

  return {
    push: pushDialog,
    clear: clearDialogs,
    replace: replaceDialog,
    stack: dialogStack,
  }
}
