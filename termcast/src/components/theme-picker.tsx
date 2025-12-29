import React, { useState } from 'react'
import { useKeyboard } from '@opentui/react'
import { Theme, persistTheme } from 'termcast/src/theme'
import { themeNames } from '../themes'
import { useStore } from 'termcast/src/state'
import { useDialog } from 'termcast/src/internal/dialog'
import { useIsInFocus } from 'termcast/src/internal/focus-context'
import { Dropdown } from 'termcast/src/components/dropdown'

export function ThemePicker(): any {
  const dialog = useDialog()
  const inFocus = useIsInFocus()
  const currentThemeName = useStore((state) => state.currentThemeName)
  const [previousTheme] = useState(currentThemeName)

  const handleSelectionChange = (value: string) => {
    // Preview theme on selection change
    useStore.setState({ currentThemeName: value })
  }

  const handleChange = (value: string) => {
    // Confirm selection
    useStore.setState({ currentThemeName: value })
    persistTheme(value)
    dialog.clear()
  }

  useKeyboard((evt) => {
    if (!inFocus) {
      return
    }
    if (evt.name === 'escape') {
      // Revert to previous theme on escape
      useStore.setState({ currentThemeName: previousTheme })
      dialog.clear()
    }
  })

  return (
    <Dropdown
      tooltip="Change Theme"
      placeholder="Search themes..."
      filtering
      onChange={handleChange}
      onSelectionChange={handleSelectionChange}
    >
      {themeNames.map((name) => (
        <Dropdown.Item
          key={name}
          title={name}
          value={name}
          color={name === previousTheme ? Theme.primary : undefined}
        />
      ))}
    </Dropdown>
  )
}
