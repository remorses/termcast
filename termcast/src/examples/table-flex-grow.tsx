// Example: Table with flexGrow to fill available width.
// Uses wrapText mode so columns distribute evenly across the full table width,
// making it visually obvious whether flexGrow stretches the table or not.
// The header background also reveals the actual table width.

import { renderWithProviders } from '../utils'
import { Table } from 'termcast/src/components/table'

function TableFlexGrow() {
  const headers = ['Key', 'Value']
  const rows = [
    ['version', '2.1.0'],
    ['license', 'MIT'],
    ['author', 'termcast'],
  ]

  return (
    <box flexDirection="column" paddingTop={1} paddingLeft={2} paddingRight={2}>
      <text>With flexGrow=1 + wrapText (fills remaining space)</text>
      <box height={1} />
      <box flexDirection="row" width="100%">
        <box width={12} flexShrink={0}>
          <text>Config:</text>
        </box>
        <Table headers={headers} rows={rows} flexGrow={1} wrapText />
      </box>

      <box height={2} />

      <text>Width=auto + wrapText (content-sized, no stretch)</text>
      <box height={1} />
      <box flexDirection="row" width="100%">
        <box width={12} flexShrink={0}>
          <text>Config:</text>
        </box>
        <Table headers={headers} rows={rows} width="auto" wrapText />
      </box>

      <box height={2} />

      <text>With flexGrow=1 no wrapText (column-based)</text>
      <box height={1} />
      <box flexDirection="row" width="100%">
        <box width={12} flexShrink={0}>
          <text>Config:</text>
        </box>
        <Table headers={headers} rows={rows} flexGrow={1} />
      </box>
    </box>
  )
}

renderWithProviders(<TableFlexGrow />)
