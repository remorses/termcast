import { describe, test, expect } from 'bun:test'
import { Keyboard } from 'termcast/src/keyboard'
import type {
  KeyboardKeyEquivalent,
  KeyboardKeyModifier,
  KeyboardShortcut,
} from 'termcast/src/keyboard'

describe('Keyboard', () => {
  test('Keyboard.Shortcut.Common has all expected shortcuts', () => {
    const commonShortcuts = Object.keys(Keyboard.Shortcut.Common)
    expect(commonShortcuts).toMatchInlineSnapshot(`
[
  "Copy",
  "CopyDeeplink",
  "CopyName",
  "CopyPath",
  "Save",
  "Duplicate",
  "Edit",
  "MoveDown",
  "MoveUp",
  "New",
  "Open",
  "OpenWith",
  "Pin",
  "Refresh",
  "Remove",
  "RemoveAll",
  "ToggleQuickLook",
]
`)
  })

  test('Keyboard.Shortcut.Common.Open has correct structure', () => {
    expect(Keyboard.Shortcut.Common.Open).toMatchInlineSnapshot(`
{
  "key": "o",
  "modifiers": [
    "cmd",
  ],
}
`)
  })

  test('Keyboard.Shortcut.Common.Copy has correct structure', () => {
    expect(Keyboard.Shortcut.Common.Copy).toMatchInlineSnapshot(`
{
  "key": "c",
  "modifiers": [
    "cmd",
    "shift",
  ],
}
`)
  })

  test('Keyboard.Shortcut.Common.Remove uses ctrl modifier', () => {
    expect(Keyboard.Shortcut.Common.Remove).toMatchInlineSnapshot(`
{
  "key": "x",
  "modifiers": [
    "ctrl",
  ],
}
`)
  })

})
