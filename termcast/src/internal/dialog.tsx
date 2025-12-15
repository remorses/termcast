import { useKeyboard, useTerminalDimensions } from '@opentui/react'
import React, { type ReactNode, useRef } from 'react'
import { Theme } from 'termcast/src/theme'
import { InFocus, useIsInFocus } from 'termcast/src/internal/focus-context'
import { CommonProps } from 'termcast/src/utils'
import {
  useStore,
  type DialogPosition,
  type DialogStackItem,
} from 'termcast/src/state'
import { logger } from '../logger'
import { ToastOverlay } from 'termcast/src/apis/toast'

const Border = {
  topLeft: '',
  topRight: '',
  bottomLeft: '',
  bottomRight: '',
  horizontal: '',
  vertical: '┃',
  topT: '+',
  bottomT: '+',
  leftT: '+',
  rightT: '+',
  cross: '+',
}

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
  const dimensions = useTerminalDimensions()
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
          paddingTop: 2,
          paddingRight: 2,
          paddingBottom: undefined,
          paddingLeft: undefined,
        }
      case 'bottom-right':
      // TODO show in center for now. easier to read
      // return {
      //   alignItems: 'flex-end' as const,
      //   justifyContent: 'flex-end' as const,
      //   paddingTop: undefined,
      //   paddingBottom: 2,
      //   paddingRight: 2,
      //   paddingLeft: undefined
      // }
      case 'center':
      default:
        return {
          alignItems: 'center' as const,
          justifyContent: 'flex-start' as const,
          paddingTop: Math.floor(dimensions.height / 4),
          paddingBottom: undefined,
          paddingLeft: undefined,
          paddingRight: undefined,
        }
    }
  }

  const positionStyles = getPositionStyles()

  return (
    <box
      border={false}
      width={dimensions.width}
      height={dimensions.height}
      alignItems={positionStyles.alignItems}
      justifyContent={positionStyles.justifyContent}
      position='absolute'
      paddingTop={positionStyles.paddingTop}
      paddingBottom={positionStyles.paddingBottom}
      paddingLeft={positionStyles.paddingLeft}
      paddingRight={positionStyles.paddingRight}
      left={0}
      top={0}
      onMouseDown={handleBackdropClick}
    >
      <box
        border={false}
        customBorderChars={Border}
        width={76}
        maxWidth={dimensions.width - 2}
        backgroundColor={Theme.backgroundPanel}
        borderColor={Theme.border}
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

  return (
    <>
      <InFocus inFocus={!dialogStack?.length}>{props.children}</InFocus>
      {dialogStack.length > 0 && (
        <box position='absolute'>
          {dialogStack.map((item, index) => {
            const isLastItem = index === dialogStack.length - 1
            return (
              <InFocus key={'dialog' + String(index)} inFocus={isLastItem}>
                <Dialog
                  position={item.position}
                  onClickOutside={() => {
                    if (!isLastItem) return
                    const state = useStore.getState()
                    if (state.dialogStack.length > 0) {
                      useStore.setState({
                        dialogStack: state.dialogStack.slice(0, -1),
                      })
                    }
                  }}
                >
                  {item.element}
                </Dialog>
              </InFocus>
            )
          })}
        </box>
      )}
      <InFocus inFocus={false}>
        <ToastOverlay />
      </InFocus>
    </>
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
