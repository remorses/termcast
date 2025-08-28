import { useKeyboard, useTerminalDimensions } from "@opentui/react"
import React, { type ReactNode } from "react"
import { Theme } from "@termcast/api/src/theme"
import { RGBA } from "@opentui/core"
import { InFocus } from '@termcast/api/src/internal/focus-context'
import { CommonProps } from '@termcast/api/src/utils'
import { useStore, type DialogPosition, type DialogStackItem } from '@termcast/api/src/state'

const Border = {
  topLeft: "┃",
  topRight: "┃",
  bottomLeft: "┃",
  bottomRight: "┃",
  horizontal: "",
  vertical: "┃",
  topT: "+",
  bottomT: "+",
  leftT: "+",
  rightT: "+",
  cross: "+",
}

export type { DialogPosition } from '@termcast/api/src/state'

interface DialogProps extends CommonProps {
  children: ReactNode
  position?: DialogPosition
}

export function Dialog({ children, position = 'center' }: DialogProps): any {
  const dimensions = useTerminalDimensions()

  const getPositionStyles = () => {
    switch (position) {
      case 'top-right':
        return {
          alignItems: 'flex-end' as const,
          justifyContent: 'flex-start' as const,
          paddingTop: 2,
          paddingRight: 2,
          paddingBottom: undefined,
          paddingLeft: undefined
        }
      case 'bottom-right':
        return {
          alignItems: 'flex-end' as const,
          justifyContent: 'flex-end' as const,
          paddingTop: undefined,
          paddingBottom: 2,
          paddingRight: 2,
          paddingLeft: undefined
        }
      case 'center':
      default:
        return {
          alignItems: 'center' as const,
          justifyContent: 'flex-start' as const,
          paddingTop: Math.floor(dimensions.height / 4),
          paddingBottom: undefined,
          paddingLeft: undefined,
          paddingRight: undefined
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
      position="absolute"
      paddingTop={positionStyles.paddingTop}
      paddingBottom={positionStyles.paddingBottom}
      paddingLeft={positionStyles.paddingLeft}
      paddingRight={positionStyles.paddingRight}
      left={0}
      top={0}
      backgroundColor={RGBA.fromInts(0, 0, 0, 150)}
    >
      <box
        border={false}
        customBorderChars={Border}
        width={76}
        maxWidth={dimensions.width - 2}
        backgroundColor={Theme.backgroundPanel}
        borderColor={Theme.border}
        paddingTop={1}
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

  useKeyboard((evt) => {
    if (evt.name === "escape" && dialogStack.length > 0) {
      const state = useStore.getState()
      useStore.setState({ dialogStack: state.dialogStack.slice(0, -1) })
    }
  })

  return (
    <>
      <InFocus inFocus={dialogStack.length === 0}>
        {props.children}
      </InFocus>
      <group position="absolute">
        {dialogStack.map((item, index) => {
          const isLastItem = index === dialogStack.length - 1
          return (
            <InFocus key={String(index)} inFocus={isLastItem}>
              <Dialog position={item.position}>
                {item.element}
              </Dialog>
            </InFocus>
          )
        })}
      </group>
    </>
  )
}

export function useDialog() {
  const dialogStack = useStore((state) => state.dialogStack)
  
  const pushDialog = (element: ReactNode, position?: DialogPosition) => {
    const state = useStore.getState()
    useStore.setState({ 
      dialogStack: [...state.dialogStack, { element, position }] 
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
    stack: dialogStack
  }
}