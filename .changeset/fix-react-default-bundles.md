---
'termcast': patch
---

Fix bundled extension commands that import React through a default import.

Extensions can now use the common Raycast pattern without crashing at runtime:

```tsx
import React from 'react'

export default function Command() {
  const [items, setItems] = React.useState([])
  return null
}
```

The dev bundle now exposes React in a shape compatible with Bun's CommonJS interop wrapper, so `React.useState` and other default-imported React APIs resolve correctly.
