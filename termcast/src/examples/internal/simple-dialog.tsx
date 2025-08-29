import React, { useState } from "react"
import { useKeyboard } from "@opentui/react"
import { renderWithProviders } from '@termcast/cli'
import { useDialog, type DialogPosition } from '@termcast/cli/src/internal/dialog'
import { Theme } from '@termcast/cli'
import { List } from '@termcast/cli'
import { ActionPanel, Action } from '@termcast/cli'
import { Dropdown } from '@termcast/cli'
import { logger } from '@termcast/cli'

function DialogContent({ position }: { position: DialogPosition }): any {
  const [selectedDrink, setSelectedDrink] = useState<string>('coffee')

  const handleDrinkChange = (newValue: string) => {
    logger.log('Selected drink:', newValue)
    setSelectedDrink(newValue)
  }

  return (
    <Dropdown
      tooltip="Select Drink"
      onChange={handleDrinkChange}
      value={selectedDrink}
      placeholder="Search drinks..."
    >
      <Dropdown.Section title="Hot Drinks">
        <Dropdown.Item
          value="coffee"
          title="Coffee"
          icon="☕"
          keywords={['espresso', 'latte', 'cappuccino']}
        />
        <Dropdown.Item
          value="tea"
          title="Tea"
          icon="🍵"
          keywords={['green', 'black', 'herbal']}
        />
      </Dropdown.Section>

      <Dropdown.Section title="Cold Drinks">
        <Dropdown.Item
          value="juice"
          title="Juice"
          icon="🧃"
          keywords={['orange', 'apple', 'grape']}
        />
        <Dropdown.Item
          value="water"
          title="Water"
          icon="💧"
          keywords={['sparkling', 'still', 'mineral']}
        />
        <Dropdown.Item
          value="cola"
          title="Cola"
          icon="🥤"
          keywords={['coke', 'pepsi', 'soda']}
        />
      </Dropdown.Section>
    </Dropdown>
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
      title: "Top Right",
      position: "top-right",
      description: "Shows dialog in the top-right corner"
    },
    {
      title: "Bottom Right",
      position: "bottom-right",
      description: "Shows dialog in the bottom-right corner"
    }
  ]

  return (
    <List navigationTitle="Dialog with Dropdown Example">
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

renderWithProviders(<App />)
