# Contributing to Termcast

Termcast is a terminal-based implementation of the Raycast API, allowing Raycast extensions to run natively in the terminal using React and OpenTUI.

## Quick Start

```bash
# Clone and setup
git clone https://github.com/remorses/termcast
cd termcast
pnpm install

# Run examples
bun --watch termcast/src/examples/simple-list.tsx

# Run tests (from termcast/ package)
cd termcast
bun test
pnpm e2e src/examples/simple-list.vitest.tsx -u  # -u to update snapshots
```

## Project Structure

### Core Files

```
src/
├── cli.tsx                # Main CLI entry point (termcast command)
├── index.tsx              # Public API exports (termcast)
├── state.tsx              # Global state management (Zustand)
├── descendants.tsx        # Component hierarchy management pattern
├── utils.tsx              # Utilities + extension store management
└── logger.tsx             # Logging utilities

src/components/            # Raycast API components
├── list.tsx              # List component with search, sections, items
├── form/                 # Form components (TextField, Dropdown, etc.)
├── actions.tsx           # Action system (Ctrl+K menus)
├── detail.tsx            # Detail view with markdown
└── alert.tsx             # Alert dialogs

src/apis/                 # Raycast APIs (non-component)
├── ai.tsx               # AI API for language models
├── cache.tsx            # Persistent cache storage
├── clipboard.tsx        # Clipboard operations
├── environment.tsx      # Environment info (theme, paths, etc.)
├── localstorage.tsx     # Key-value storage
├── oauth.tsx            # OAuth authentication flows
├── preferences.tsx      # Extension preferences management
├── toast.tsx            # Toast notifications
└── window.tsx           # Window management

src/internal/             # Internal framework utilities
├── navigation.tsx        # Stack-based navigation (push/pop views)
├── dialog.tsx            # Overlay system (action panels, dropdowns)
├── focus-context.tsx     # Focus management for keyboard events
└── providers.tsx         # React context providers

src/extensions/           # Built-in extensions
├── store.tsx            # Extension store (browse/install from Raycast)
├── home.tsx             # Home screen showing installed extensions
└── dev.tsx              # Development mode UI (termcast dev)

src/examples/            # Usage examples (also serve as tests)
├── *.tsx               # Component examples
└── *.vitest.tsx        # E2E tests for examples
```

### Key Concepts

**Raycast Components & APIs**

- **Components** (`src/components/`) - React components for UI (List, Form, Detail, etc.)
- **APIs** (`src/apis/`) - Non-component Raycast APIs for functionality:
  - Storage APIs: `cache`, `localstorage`, `preferences`
  - System APIs: `clipboard`, `environment`, `window`
  - Integration APIs: `oauth`, `ai`
  - Notification: `toast`

**Descendants Pattern** (`src/descendants.tsx`)

- Manages parent-child relationships (List.Item, Form.TextField)
- Enables keyboard navigation across dynamic children
- Access `map.current` only in event handlers, never during render

**Focus Management** (`src/internal/focus-context.tsx`)

- Essential for keyboard handling in terminal environment
- Always check `useIsInFocus()` before handling keyboard events

**Navigation** (`src/internal/navigation.tsx`)

- Stack-based navigation similar to Raycast
- Use `push()` to show new views, `pop()` to go back

**Extensions**

- **Store** (`src/extensions/store.tsx`) - Browse and install from Raycast store
- **Home** (`src/extensions/home.tsx`) - Default screen showing installed extensions
- **Dev** (`src/extensions/dev.tsx`) - Development mode for local extensions

## Development Workflow

### Creating Components

1. Read Raycast API docs:

```bash
curl -s https://developers.raycast.com/api-reference/user-interface/list.md
```

2. Read OpenTUI docs (required):

```bash
curl -s https://raw.githubusercontent.com/sst/opentui/refs/heads/main/packages/react/README.md
```

3. Create component matching Raycast API
4. Add example in `src/examples/`
5. Test with `pnpm e2e`

### Testing

```bash
# Unit tests
bun test

# E2E tests
pnpm e2e                                    # Run all
pnpm e2e src/examples/list.vitest.tsx -u   # Update snapshots

# Type checking
pnpm run tsc
```

### Code Style

- Always use `termcast` imports (not relative paths)
- Use `.tsx` extension for all files
- No `console.log` - use `logger.log` instead
- Prefer object arguments for functions with 2+ parameters
- Minimize `useEffect` - prefer event handlers

## Common Commands

```bash
# Development
termcast dev <path>              # Develop extension locally
termcast build <path>            # Build extension
termcast install <path>          # Install to local store

# Usage
termcast                         # Open home screen
termcast store                   # Browse extension store
```

Happy contributing! 🚀
