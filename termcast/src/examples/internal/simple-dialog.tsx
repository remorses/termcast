import React from "react"
import { useKeyboard } from "@opentui/react"
import { renderExample } from '@termcast/api/src/utils'
import { useDialog, type DialogPosition } from '@termcast/api/src/internal/dialog'
import { Theme } from '@termcast/api/src/theme'
import { List } from '@termcast/api/src/list'
import { ActionPanel, Action } from '@termcast/api/src/actions'

function DialogContent({ position }: { position: DialogPosition }): any {
  return (
    <box
      width="100%"
      height={10}
      flexDirection="column"
      padding={1}
    >
      <text style={{ fg: Theme.text }}>Dialog Position: {position}</text>
      <text style={{ fg: Theme.textMuted }}>Press ESC to close</text>
      <box marginTop={2}>
        <text style={{ fg: Theme.accent }}>This dialog is positioned at {position}</text>
      </box>
    </box>
  )
}

function App(): any {
  const dialog = useDialog()

  const positions: { title: string; position: DialogPosition; description: string }[] = [
    {
      title: "Center",
      position: "center",
      description: "Shows dialog in the center of the screen"
    },
    {
      title: "Top Left",
      position: "top-left",
      description: "Shows dialog in the top-left corner"
    },
    {
      title: "Bottom Right",
      position: "bottom-right",
      description: "Shows dialog in the bottom-right corner"
    }
  ]

  return (
    <List navigationTitle="Dialog Position Example">
      {positions.map((item) => (
        <List.Item
          title={item.title}
          subtitle={item.description}
          actions={
            <ActionPanel>
              <Action
                title={`Open ${item.title} Dialog`}
                onAction={() => {
                  dialog.push(<DialogContent position={item.position} />, item.position)
                }}
              />
              <Action
                title="Clear All Dialogs"
                onAction={() => {
                  dialog.clear()
                }}
              />
            </ActionPanel>
          }
        />
      ))}
    </List>
  )
}

renderExample(<App />)