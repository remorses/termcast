/**
 * Vim mode persistence and command execution.
 * Mirrors theme.tsx pattern: global Cache storage (not per-extension),
 * load/persist/initialize functions, and a command registry.
 *
 * Vim mode has two sub-modes (vimInputSubMode in state):
 * - 'default': j/k navigate, textarea unfocused, keystrokes go to useKeyboard
 * - 'search': activated by /, textarea focused, live-filtering like raycast mode
 * - 'command': activated by : (from empty search bar), footer shows command input
 *
 * The ':' command system works in both raycast and vim modes. In raycast mode,
 * ':' is intercepted when the search bar is empty via onContentChange. In vim mode,
 * ':' is caught directly by useKeyboard since the textarea is unfocused.
 */

import { Cache } from 'termcast/src/apis/cache'
import { useStore, type InputMode } from 'termcast/src/state'
import { logger } from 'termcast/src/logger'

const VIM_MODE_STORAGE_KEY = 'termcast.vimMode'

let globalCache: Cache | null = null
let globalCachePath: string | null = null

function getGlobalCache(): Cache {
  const currentPath = useStore.getState().extensionPath
  if (!globalCache || currentPath !== globalCachePath) {
    globalCache = new Cache()
    globalCachePath = currentPath
  }
  return globalCache
}

export function loadPersistedInputMode(): InputMode {
  try {
    const stored = getGlobalCache().get(VIM_MODE_STORAGE_KEY)
    if (stored === 'vim' || stored === 'raycast') {
      return stored
    }
  } catch {
    // Ignore errors on load
  }
  return 'raycast'
}

export function persistInputMode(mode: InputMode): void {
  try {
    getGlobalCache().set(VIM_MODE_STORAGE_KEY, mode)
  } catch {
    // Ignore errors on save
  }
}

export function initializeVimMode(): void {
  const mode = loadPersistedInputMode()
  useStore.setState({ inputMode: mode })
}

// Command registry for ':' commands.
// Each command has a name and an execute function.
// Some commands need special handling by the caller (e.g. opening dialogs,
// accessing component refs). These return their name from executeVimCommand()
// so the caller can handle them.
export interface VimCommand {
  name: string
  execute: () => void
  // Only show this command when in a specific mode (undefined = show always)
  showWhenMode?: InputMode
  // Commands that need the caller to do something (open dialog, access refs)
  // return their name from executeVimCommand() instead of handling everything here.
  handledByCaller?: boolean
}

const VIM_COMMANDS: VimCommand[] = [
  {
    name: 'vim',
    showWhenMode: 'raycast',
    execute: () => {
      useStore.setState({ inputMode: 'vim', vimInputSubMode: 'default', vimCommandText: '' })
      persistInputMode('vim')
      logger.log('Vim mode enabled')
    },
  },
  {
    name: 'theme',
    handledByCaller: true,
    execute: () => {
      useStore.setState({ vimInputSubMode: 'default', vimCommandText: '' })
    },
  },
  {
    name: 'actions',
    handledByCaller: true,
    execute: () => {
      useStore.setState({ vimInputSubMode: 'default', vimCommandText: '' })
    },
  },
  {
    name: 'filter',
    handledByCaller: true,
    execute: () => {
      useStore.setState({ vimInputSubMode: 'default', vimCommandText: '' })
    },
  },
  {
    name: 'q',
    execute: () => {
      useStore.setState({ vimInputSubMode: 'default', vimCommandText: '' })
      process.exit(0)
    },
  },
]

/**
 * Get commands matching the current typed text, filtered by current mode.
 */
export function getMatchingCommands(text: string): VimCommand[] {
  const currentMode = useStore.getState().inputMode
  return VIM_COMMANDS.filter((cmd) => {
    if (cmd.showWhenMode && cmd.showWhenMode !== currentMode) return false
    if (text.length === 0) return true
    return cmd.name.startsWith(text)
  })
}

/**
 * Execute a command by name.
 * Returns the command name if it needs caller handling (e.g. 'theme', 'actions', 'filter').
 * Returns true if the command executed fully.
 * Returns false if no matching command was found.
 */
export function executeVimCommand(text: string): string | boolean {
  const currentMode = useStore.getState().inputMode
  const command = VIM_COMMANDS.find((cmd) => {
    if (cmd.showWhenMode && cmd.showWhenMode !== currentMode) return false
    return cmd.name === text
  })
  if (!command) return false
  command.execute()
  if (command.handledByCaller) return command.name
  return true
}

/**
 * Toggle vim mode on/off. Used by the action panel "Toggle Vim Mode" action.
 */
export function toggleVimMode(): void {
  const currentMode = useStore.getState().inputMode
  const newMode: InputMode = currentMode === 'vim' ? 'raycast' : 'vim'
  useStore.setState({ inputMode: newMode, vimInputSubMode: 'default', vimCommandText: '' })
  persistInputMode(newMode)
  logger.log(`Input mode: ${newMode}`)
}
