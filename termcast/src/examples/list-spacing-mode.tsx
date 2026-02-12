/**
 * Example demonstrating List spacingMode prop.
 *
 * - 'default': Single-line items with title and subtitle on same row
 * - 'relaxed': Two-line items with title on first row, subtitle below aligned with title start
 *
 * Use Action to toggle between modes and see the difference.
 */

import { useState } from 'react'
import {
  List,
  ActionPanel,
  Action,
  Icon,
  Color,
  renderWithProviders,
  type ListSpacingMode,
} from 'termcast'

function ListSpacingModeExample() {
  const [spacingMode, setSpacingMode] = useState<ListSpacingMode>('relaxed')

  const toggleMode = () => {
    setSpacingMode((prev) => (prev === 'default' ? 'relaxed' : 'default'))
  }

  return (
    <List
      navigationTitle={`Spacing Mode: ${spacingMode}`}
      spacingMode={spacingMode}
    >
      <List.Section title="With Icons" subtitle="Items have icon, title, subtitle">
        <List.Item
          icon={Icon.Document}
          title="Quarterly Report"
          subtitle="Q4 2024 financial summary and projections"
          accessories={[{ tag: { value: 'Draft', color: Color.Yellow } }]}
          actions={
            <ActionPanel>
              <Action title="Toggle Spacing Mode" onAction={toggleMode} />
            </ActionPanel>
          }
        />
        <List.Item
          icon={Icon.Code}
          title="API Documentation"
          subtitle="REST endpoints and authentication guide"
          accessories={[
            { text: 'v2.1' },
            { date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
          ]}
          actions={
            <ActionPanel>
              <Action title="Toggle Spacing Mode" onAction={toggleMode} />
            </ActionPanel>
          }
        />
        <List.Item
          icon={Icon.Gear}
          title="Configuration"
          subtitle="System settings and preferences"
          accessories={[{ tag: { value: 'Active', color: Color.Green } }]}
          actions={
            <ActionPanel>
              <Action title="Toggle Spacing Mode" onAction={toggleMode} />
            </ActionPanel>
          }
        />
      </List.Section>

      <List.Section title="Without Icons" subtitle="Plain text items">
        <List.Item
          title="Meeting Notes"
          subtitle="Weekly standup discussion points"
          accessories={[{ date: new Date(Date.now() - 60 * 60 * 1000) }]}
          actions={
            <ActionPanel>
              <Action title="Toggle Spacing Mode" onAction={toggleMode} />
            </ActionPanel>
          }
        />
        <List.Item
          title="Project Timeline"
          subtitle="Milestones and deadlines for Q1"
          accessories={[{ text: { value: 'Important', color: Color.Red } }]}
          actions={
            <ActionPanel>
              <Action title="Toggle Spacing Mode" onAction={toggleMode} />
            </ActionPanel>
          }
        />
      </List.Section>

      <List.Section title="No Subtitle" subtitle="Title only items">
        <List.Item
          icon={Icon.Star}
          title="Favorites"
          accessories={[{ tag: '12 items' }]}
          actions={
            <ActionPanel>
              <Action title="Toggle Spacing Mode" onAction={toggleMode} />
            </ActionPanel>
          }
        />
        <List.Item
          title="Recent"
          accessories={[{ date: new Date() }]}
          actions={
            <ActionPanel>
              <Action title="Toggle Spacing Mode" onAction={toggleMode} />
            </ActionPanel>
          }
        />
      </List.Section>

      <List.Section title="Long Content" subtitle="Testing overflow behavior">
        <List.Item
          icon={Icon.Text}
          title="Very Long Title That Might Need Truncation"
          subtitle="This is a particularly verbose subtitle that describes the item in great detail"
          accessories={[
            { tag: { value: 'Beta', color: Color.Blue } },
            { text: 'Updated' },
          ]}
          actions={
            <ActionPanel>
              <Action title="Toggle Spacing Mode" onAction={toggleMode} />
            </ActionPanel>
          }
        />
      </List.Section>
    </List>
  )
}

await renderWithProviders(<ListSpacingModeExample />)
