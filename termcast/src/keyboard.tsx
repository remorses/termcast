export type KeyEquivalent =
  | 'a'
  | 'b'
  | 'c'
  | 'd'
  | 'e'
  | 'f'
  | 'g'
  | 'h'
  | 'i'
  | 'j'
  | 'k'
  | 'l'
  | 'm'
  | 'n'
  | 'o'
  | 'p'
  | 'q'
  | 'r'
  | 's'
  | 't'
  | 'u'
  | 'v'
  | 'w'
  | 'x'
  | 'y'
  | 'z'
  | '0'
  | '1'
  | '2'
  | '3'
  | '4'
  | '5'
  | '6'
  | '7'
  | '8'
  | '9'
  | '.'
  | ','
  | ';'
  | '='
  | '+'
  | '-'
  | '['
  | ']'
  | '{'
  | '}'
  | '«'
  | '»'
  | '('
  | ')'
  | '/'
  | '\\'
  | "'"
  | '`'
  | '§'
  | '^'
  | '@'
  | '$'
  | 'return'
  | 'delete'
  | 'deleteForward'
  | 'tab'
  | 'arrowUp'
  | 'arrowDown'
  | 'arrowLeft'
  | 'arrowRight'
  | 'pageUp'
  | 'pageDown'
  | 'home'
  | 'end'
  | 'space'
  | 'escape'
  | 'enter'
  | 'backspace'

export type KeyModifier = 'cmd' | 'ctrl' | 'opt' | 'shift' | 'alt' | 'windows'

export interface Shortcut {
  key: KeyEquivalent
  modifiers: KeyModifier[]
}

export interface CrossPlatformShortcut {
  macOS: Shortcut
  Windows: Shortcut
}

const CommonShortcuts = {
  Copy: { modifiers: ['cmd', 'shift'], key: 'c' } as Shortcut,
  CopyDeeplink: { modifiers: ['cmd', 'shift'], key: 'c' } as Shortcut,
  CopyName: { modifiers: ['cmd', 'shift'], key: '.' } as Shortcut,
  CopyPath: { modifiers: ['cmd', 'shift'], key: ',' } as Shortcut,
  Save: { modifiers: ['cmd'], key: 's' } as Shortcut,
  Duplicate: { modifiers: ['cmd'], key: 'd' } as Shortcut,
  Edit: { modifiers: ['cmd'], key: 'e' } as Shortcut,
  MoveDown: { modifiers: ['cmd', 'shift'], key: 'arrowDown' } as Shortcut,
  MoveUp: { modifiers: ['cmd', 'shift'], key: 'arrowUp' } as Shortcut,
  New: { modifiers: ['cmd'], key: 'n' } as Shortcut,
  Open: { modifiers: ['cmd'], key: 'o' } as Shortcut,
  OpenWith: { modifiers: ['cmd', 'shift'], key: 'o' } as Shortcut,
  Pin: { modifiers: ['cmd', 'shift'], key: 'p' } as Shortcut,
  Refresh: { modifiers: ['cmd'], key: 'r' } as Shortcut,
  Remove: { modifiers: ['ctrl'], key: 'x' } as Shortcut,
  RemoveAll: { modifiers: ['ctrl', 'shift'], key: 'x' } as Shortcut,
  ToggleQuickLook: { modifiers: ['cmd'], key: 'y' } as Shortcut,
} as const

export const Keyboard = {
  Shortcut: {
    Common: CommonShortcuts,
  },
} as const

export type { KeyEquivalent as KeyboardKeyEquivalent }
export type { KeyModifier as KeyboardKeyModifier }
export type { Shortcut as KeyboardShortcut }
export type { CrossPlatformShortcut as KeyboardCrossPlatformShortcut }
