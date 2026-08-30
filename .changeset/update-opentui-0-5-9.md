---
'termcast': patch
---

Update `@opentui/core` and `@opentui/react` from 0.4.5 to 0.5.9.

This release includes native image rendering, an embedded terminal, clipboard/paste improvements, and more accurate text wrapping. Termcast now raises the key-input listener limit so forms with many `useKeyboard` handlers do not emit `MaxListenersExceededWarning`.
