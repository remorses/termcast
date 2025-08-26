import React, { useState } from "react"
import { useKeyboard } from "@opentui/react"
import { renderExample } from "../utils"
import { useDialog } from "../internal/dialog"
import { Theme } from "../theme"

function DialogContent({ onClose }: { onClose: () => void }): any {
  return (
    <box
      width="100%"
      height={10}
      flexDirection="column"
      padding={1}
    >
      <text style={{ fg: Theme.text }}>This is a dialog!</text>
      <text style={{ fg: Theme.textMuted }}>Press ESC to close or ENTER to dismiss</text>
      <box marginTop={2}>
        <text style={{ fg: Theme.accent }}>Dialog content goes here...</text>
      </box>
    </box>
  )
}

function App(): any {
  const dialog = useDialog()
  const [showDialog, setShowDialog] = useState(false)

  useKeyboard((key) => {
    if (key.name === "d") {
      dialog.push(<DialogContent onClose={() => dialog.clear()} />)
      setShowDialog(true)
    } else if (key.name === "c") {
      dialog.clear()
      setShowDialog(false)
    } else if (key.name === "r") {
      dialog.replace(<DialogContent onClose={() => dialog.clear()} />)
      setShowDialog(true)
    }
  })

  return (
    <box width="100%" height="100%" flexDirection="column">
      <text style={{ fg: Theme.primary }}>Dialog Example</text>
      <text style={{ fg: Theme.textMuted }}>Press 'd' to show dialog</text>
      <text style={{ fg: Theme.textMuted }}>Press 'c' to clear all dialogs</text>
      <text style={{ fg: Theme.textMuted }}>Press 'r' to replace dialog</text>
      <text style={{ fg: Theme.textMuted }}>Press 'ESC' to close the top dialog</text>
      {showDialog && (
        <text style={{ fg: Theme.success }}>Dialog is open (stack size: {dialog.stack.length})</text>
      )}
    </box>
  )
}

renderExample(<App />)