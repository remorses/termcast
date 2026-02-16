// E2E tests for Table component with wrapText.
// Verifies that long cell text wraps to multiple lines when wrapText is true
// and truncates to single lines when false (default).

import { test, expect, afterEach, beforeEach } from 'vitest'
import { launchTerminal, Session } from 'tuistory/src'

let session: Session

beforeEach(async () => {
  session = await launchTerminal({
    command: 'bun',
    args: ['src/examples/simple-table-wrap.tsx'],
    cols: 80,
    rows: 50,
  })
})

afterEach(() => {
  session?.close()
})

test('wrapText table shows full prose across multiple lines', async () => {
  const text = await session.text({
    waitFor: (text) => {
      return text.includes('Wrapping Table') && text.includes('OAuth Proxy') && text.includes('Non-wrapping')
    },
    timeout: 10000,
  })

  expect(text).toMatchInlineSnapshot(`
    "



        Wrapping Table

        Feature                             Description
        OAuth Proxy                         Handles the full OAuth
                                            authorization code flow including
                                            PKCE verification, token exchange,
                                            and refresh. The proxy keeps client
                                            secrets server-side so CLI tools
                                            never need to store them locally.

        Hot Reload                          Watches source files for changes
                                            and rebuilds the extension bundle
                                            automatically. The TUI updates in
                                            place without losing navigation
                                            state or scroll position.
        Compiled Mode                       Extensions can be compiled into
                                            standalone binaries that embed the
                                            package.json and all command
                                            components. No filesystem paths are
                                            hardcoded, making the binary fully
                                            portable.

        Non-wrapping Table (default)

        Feature      Description
        OAuth Proxy  Handles the full OAuth authorization code flow including
        Hot Reload   Watches source files for changes and rebuilds the extension
        Compiled ModeExtensions can be compiled into standalone binaries that


















    "
  `)

  // Wrapping table should show the full long text
  expect(text).toContain('OAuth Proxy')
  expect(text).toContain('PKCE verification')
  expect(text).toContain('Hot Reload')
  expect(text).toContain('Compiled Mode')
  expect(text).toContain('portable')
}, 30000)
