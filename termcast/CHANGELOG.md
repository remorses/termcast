# Changelog

## 1.3.11

### Patch Changes

- Center Form content horizontally using flexbox layout
- Center Form content vertically using scrollbox contentOptions
- Add maxWidth constraint to Form description and scrollbox for consistent width
- Fix flaky password field test to use regex match instead of exact value

## 1.3.10

### Patch Changes

- export from dist

## 0.3.8

### Patch Changes

- fix auto install

## 0.3.7

### Patch Changes

- fix \_jsx

## 0.3.6

### Patch Changes

- auto update, log unhandled errors

## 0.3.6

### Patch Changes

- Auto-update support: CLI checks for updates on startup and runs the install script
  - Shows toast notification when a new version is available
  - Updates installed in background using existing install script

## 0.3.5

### Patch Changes

- remove problematic dep

## 0.3.4

### Patch Changes

- fix addons?

## 0.3.3

### Patch Changes

- fix binary

## 0.3.2

### Patch Changes

- fix binaries

## 0.3.1

### Patch Changes

- fix import

## 0.3.0

### Minor Changes

-

## 0.2.0

### Minor Changes

- Many improvements

## 0.1.0

### Minor Changes

- improvements

## 0.0.3

### Patch Changes

- use bun sqlite

## 0.0.2

### Patch Changes

- nn

## 0.0.1

### Patch Changes

- Release binaries

## 2025-01-28 14:17

- Replaced `better-sqlite3` with `@farjs/better-sqlite3-wrapper` for cross-runtime compatibility
- Updated database initialization to use `prepare().run()` instead of `exec()` in cache.tsx and localstorage.tsx
- Fixed ActionPanel component by adding proper context providers and removing legacy code

## 2025-08-26 21:00

- Implement Clipboard API from @raycast/api
  - Support for copy/paste/clear/read operations
  - Cross-platform support (macOS, Linux, Windows)
  - Concealed copy option for sensitive data
  - Read clipboard content as text or file
  - **File copy support** - copy files to clipboard on all platforms
  - Detect files in clipboard when reading
  - Reuses existing action-utils for text operations

## 2025-08-26 20:42

- Set up Vitest testing framework with comprehensive test suites
- Switch from sqlite3 to better-sqlite3 for synchronous database operations
- Add 50 unit tests covering Cache and LocalStorage APIs
  - Test edge cases including unicode, special characters, and capacity management
  - Test LRU eviction and subscriber patterns
  - Test type conversions for number and boolean values

## 2025-08-26 17:00

- Implement Cache API from @raycast/api
  - Support for synchronous get/set/remove operations
  - LRU eviction when capacity exceeded
  - Namespace support for command-specific caching
  - Subscriber pattern for cache updates
- Implement LocalStorage API from @raycast/api
  - Async methods for getItem/setItem/removeItem
  - Support for string, number, and boolean values
  - allItems() method to retrieve all stored values
  - clear() method to remove all values
- Both APIs use SQLite for persistent storage in ~/.termcast.db and ~/.termcast-cache.db
