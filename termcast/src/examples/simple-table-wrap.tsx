// Example: Table component with wrapText enabled for long prose content.
// Demonstrates that cells can wrap to multiple lines when wrapText is true,
// versus the default single-line truncation.

import { renderWithProviders } from '../utils'
import { Table } from 'termcast/src/components/table'

function SimpleTableWrap() {
  return (
    <box flexDirection="column" paddingTop={1} paddingLeft={2} paddingRight={2}>
      <text>Wrapping Table</text>
      <box height={1} />
      <Table
        wrapText
        headers={['Feature', 'Description']}
        rows={[
          [
            'OAuth Proxy',
            'Handles the full OAuth authorization code flow including PKCE verification, token exchange, and refresh. The proxy keeps client secrets server-side so CLI tools never need to store them locally.',
          ],
          [
            'Hot Reload',
            'Watches source files for changes and rebuilds the extension bundle automatically. The TUI updates in place without losing navigation state or scroll position.',
          ],
          [
            'Compiled Mode',
            'Extensions can be compiled into standalone binaries that embed the package.json and all command components. No filesystem paths are hardcoded, making the binary fully portable.',
          ],
        ]}
      />
      <box height={1} />
      <text>Non-wrapping Table (default)</text>
      <box height={1} />
      <Table
        headers={['Feature', 'Description']}
        rows={[
          [
            'OAuth Proxy',
            'Handles the full OAuth authorization code flow including PKCE verification, token exchange, and refresh. The proxy keeps client secrets server-side so CLI tools never need to store them locally.',
          ],
          [
            'Hot Reload',
            'Watches source files for changes and rebuilds the extension bundle automatically. The TUI updates in place without losing navigation state or scroll position.',
          ],
          [
            'Compiled Mode',
            'Extensions can be compiled into standalone binaries that embed the package.json and all command components. No filesystem paths are hardcoded, making the binary fully portable.',
          ],
        ]}
      />
    </box>
  )
}

renderWithProviders(<SimpleTableWrap />)
