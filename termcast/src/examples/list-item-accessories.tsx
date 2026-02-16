/**
 * Example: List.Item with all inline display features.
 *
 * Demonstrates every property that renders inline in a list row:
 * - icon (emoji before title)
 * - title (main text)
 * - subtitle (muted text after title)
 * - accessories: text, text with color, tag, tag with color, date, date with color, icon+text combo
 */
import { renderWithProviders, Icon, Color } from 'termcast'
import List from 'termcast'

function ListItemAccessoriesExample() {
  const yesterday = new Date(Date.now() - 86400_000)
  const lastWeek = new Date(Date.now() - 7 * 86400_000)

  return (
    <List navigationTitle="List Item Accessories">
      {/* 1. Title only */}
      <List.Item id="title-only" title="Title Only" />

      {/* 2. Title + subtitle */}
      <List.Item id="with-subtitle" title="With Subtitle" subtitle="a subtitle" />

      {/* 3. Icon + title */}
      <List.Item id="with-icon" title="With Icon" icon={Icon.Star} />

      {/* 4. Icon + title + subtitle */}
      <List.Item
        id="icon-subtitle"
        title="Icon and Subtitle"
        subtitle="description"
        icon={Icon.Bookmark}
      />

      {/* 5. Text accessory (plain string) */}
      <List.Item
        id="text-accessory"
        title="Text Accessory"
        accessories={[{ text: 'info' }]}
      />

      {/* 6. Text accessory with color */}
      <List.Item
        id="colored-text"
        title="Colored Text"
        accessories={[{ text: { value: 'orange', color: Color.Orange } }]}
      />

      {/* 7. Tag accessory (plain string) */}
      <List.Item
        id="tag-accessory"
        title="Tag Accessory"
        accessories={[{ tag: 'beta' }]}
      />

      {/* 8. Tag accessory with color */}
      <List.Item
        id="colored-tag"
        title="Colored Tag"
        accessories={[{ tag: { value: 'v2', color: Color.Green } }]}
      />

      {/* 9. Date accessory */}
      <List.Item
        id="date-accessory"
        title="Date Accessory"
        accessories={[{ date: yesterday }]}
      />

      {/* 10. Date accessory with color */}
      <List.Item
        id="colored-date"
        title="Colored Date"
        accessories={[{ date: { value: lastWeek, color: Color.Purple } }]}
      />

      {/* 11. Multiple accessories combined */}
      <List.Item
        id="multiple"
        title="Multiple Accessories"
        subtitle="all types"
        icon={Icon.Hammer}
        accessories={[
          { text: 'note' },
          { tag: 'new' },
          { date: yesterday },
        ]}
      />

      {/* 12. All colored accessories */}
      <List.Item
        id="all-colored"
        title="All Colored"
        icon={Icon.CircleFilled}
        accessories={[
          { text: { value: 'red', color: Color.Red } },
          { tag: { value: 'blue', color: Color.Blue } },
          { date: { value: lastWeek, color: Color.Magenta } },
        ]}
      />
    </List>
  )
}

await renderWithProviders(<ListItemAccessoriesExample />)
