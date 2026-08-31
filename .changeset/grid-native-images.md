---
'termcast': minor
---

Render raster images in **Grid**, **EmptyView**, and **Detail markdown**.

OpenTUI 0.5 added native `<image>` (Kitty, then Sixel, then Unicode blocks). Termcast now uses that for image-first surfaces. `List.Item icon` stays a 1-cell glyph.

**Grid** is a real wrap layout, not a List of one-line rows.

```tsx
import { Grid, Color } from 'termcast'

<Grid columns={3} aspectRatio="1" fit="contain">
  <Grid.Item title="Avatar" content="https://example.com/avatar.png" />
  <Grid.Item title="Emoji" content="🍎" />
  <Grid.Item title="Color" content={{ color: Color.Blue }} />
</Grid>
```

- **URLs, `assets/` files, and data URIs** render as pixels
- **Emoji and `Icon.*`** stay unicode
- **Left/right** move one cell. **Up/down** move by `columns`
- Detail markdown `![alt](url)` shows the image instead of the alt text

Force `OPENTUI_IMAGE_PROTOCOL=blocks` in tests. Kitty graphics do not show up in text snapshots.
