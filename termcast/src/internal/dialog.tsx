import { useKeyboard, useTerminalDimensions } from "@opentui/react"
import React, { createContext, useContext, useState, useCallback, type ReactNode } from "react"
import { Theme } from "@termcast/api/src/theme"
import { RGBA } from "@opentui/core"

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

export type DialogPosition = 'center' | 'top-right' | 'bottom-right'

interface DialogProps {
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
          paddingRight: 2
        }
      case 'bottom-right':
        return {
          alignItems: 'flex-end' as const,
          justifyContent: 'flex-end' as const,
          paddingBottom: 2,
          paddingRight: 2
        }
      case 'center':
      default:
        return {
          alignItems: 'center' as const,
          justifyContent: 'flex-start' as const,
          paddingTop: Math.floor(dimensions.height / 4)
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

interface DialogStackItem {
  element: ReactNode
  position?: DialogPosition
}

interface DialogContextType {
  push: (element: ReactNode, position?: DialogPosition) => void
  clear: () => void
  replace: (element: ReactNode, position?: DialogPosition) => void
  stack: DialogStackItem[]
}

const DialogContext = createContext<DialogContextType | undefined>(undefined)

interface DialogProviderProps {
  children: ReactNode
}

export function DialogProvider(props: DialogProviderProps): any {
  const [stack, setStack] = useState<DialogStackItem[]>([])

  useKeyboard((evt) => {
    if (evt.name === "escape") {
      setStack((prev) => prev.slice(0, -1))
    }
  })

  const push = useCallback((element: ReactNode, position?: DialogPosition) => {
    setStack((prev) => [...prev, { element, position }])
  }, [])

  const clear = useCallback(() => {
    setStack([])
  }, [])

  const replace = useCallback((element: ReactNode, position?: DialogPosition) => {
    setStack([{ element, position }])
  }, [])

  const value = React.useMemo(() => ({
    push,
    clear,
    replace,
    stack
  }), [push, clear, replace, stack])

  return (
    <DialogContext.Provider value={value}>
      {props.children}
      <group position="absolute">
        {stack.length > 0 && (
          <Dialog position={stack[0].position}>
            {stack[0].element}
          </Dialog>
        )}
      </group>
    </DialogContext.Provider>
  )
}

export function useDialog() {
  const value = useContext(DialogContext)
  if (!value) {
    throw new Error("useDialog must be used within a DialogProvider")
  }
  return value
}