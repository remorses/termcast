/**
 * Example demonstrating Image.Mask usage for shaping icons/avatars
 *
 * Image.Mask.Circle - Makes images circular (common for avatars)
 * Image.Mask.RoundedRectangle - Applies rounded corners to images
 */

import { List, Image } from 'termcast'

export function SimpleImageMask() {
  return (
    <List>
      <List.Section title="Circle Masks (Avatars)">
        <List.Item
          title="Alice Johnson"
          subtitle="Engineering"
          icon={{ source: '👩', mask: Image.Mask.Circle }}
        />
        <List.Item
          title="Bob Smith"
          subtitle="Design"
          icon={{ source: '👨', mask: Image.Mask.Circle }}
        />
        <List.Item
          title="Carol Williams"
          subtitle="Product"
          icon={{ source: '👩‍💼', mask: Image.Mask.Circle }}
        />
      </List.Section>

      <List.Section title="Rounded Rectangle Masks (Apps)">
        <List.Item
          title="Notes App"
          subtitle="Productivity"
          icon={{ source: '📝', mask: Image.Mask.RoundedRectangle }}
        />
        <List.Item
          title="Calendar"
          subtitle="Utilities"
          icon={{ source: '📅', mask: Image.Mask.RoundedRectangle }}
        />
        <List.Item
          title="Settings"
          subtitle="System"
          icon={{ source: '⚙️', mask: Image.Mask.RoundedRectangle }}
        />
      </List.Section>

      <List.Section title="No Mask (Default)">
        <List.Item
          title="Document"
          subtitle="No mask applied"
          icon={{ source: '📄' }}
        />
      </List.Section>
    </List>
  )
}
