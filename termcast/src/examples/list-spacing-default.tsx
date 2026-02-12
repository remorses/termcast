/**
 * Test file for List with spacingMode="default" (single-line items)
 */

import { List, Icon, Color, renderWithProviders } from 'termcast'

function ListSpacingDefault() {
  return (
    <List navigationTitle="Default Mode" spacingMode="default">
      <List.Section title="With Icons">
        <List.Item
          icon={Icon.Document}
          title="Report"
          subtitle="Q4 financial summary"
          accessories={[{ tag: { value: 'Draft', color: Color.Yellow } }]}
        />
        <List.Item
          icon={Icon.Code}
          title="API Docs"
          subtitle="REST endpoints guide"
          accessories={[{ text: 'v2.1' }]}
        />
      </List.Section>
      <List.Section title="Without Icons">
        <List.Item
          title="Meeting Notes"
          subtitle="Weekly standup points"
          accessories={[{ tag: 'Important' }]}
        />
      </List.Section>
      <List.Section title="No Subtitle">
        <List.Item icon={Icon.Star} title="Favorites" />
      </List.Section>
    </List>
  )
}

await renderWithProviders(<ListSpacingDefault />)
