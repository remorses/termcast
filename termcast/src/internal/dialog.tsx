import { useKeyboard, useTerminalDimensions } from "@opentui/react"
import React, { createContext, useContext, useState, useCallback, type ReactNode } from "react"
import { Theme } from "../theme"
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

interface DialogProps {
  children: ReactNode
}

export function Dialog({ children }: DialogProps): any {
  const dimensions = useTerminalDimensions()

  return (
    <box
      border={false}
      width={dimensions.width}
      height={dimensions.height}
      alignItems="center"
      position="absolute"
      paddingTop={Math.floor(dimensions.height / 4)}
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

interface DialogContextType {
  push: (element: ReactNode) => void
  clear: () => void
  replace: (element: ReactNode) => void
  stack: ReactNode[]
}

const DialogContext = createContext<DialogContextType | undefined>(undefined)

interface DialogProviderProps {
  children: ReactNode
}

export function DialogProvider(props: DialogProviderProps): any {
  const [stack, setStack] = useState<ReactNode[]>([])

  useKeyboard((evt) => {
    if (evt.name === "escape") {
      setStack((prev) => prev.slice(0, -1))
    }
  })

  const push = useCallback((element: ReactNode) => {
    setStack((prev) => [...prev, element])
  }, [])

  const clear = useCallback(() => {
    setStack([])
  }, [])

  const replace = useCallback((element: ReactNode) => {
    setStack([element])
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
          <Dialog>
            {stack[0]}
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