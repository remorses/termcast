// E2E tests for Detail view with markdown tables.
// Verifies our custom TableRenderable renders borderless tables
// with header background and alternating row stripes.
// Also tests two tables side by side in a Row component.

import { test, expect, afterEach, beforeEach } from 'vitest'
import { launchTerminal, Session } from 'tuistory/src'

let session: Session

beforeEach(async () => {
  session = await launchTerminal({
    command: 'bun',
    args: ['src/examples/simple-detail-table.tsx'],
    cols: 80,
    rows: 50,
  })
})

afterEach(() => {
  session?.close()
})

test('markdown tables render with borderless layout', async () => {
  const text = await session.text({
    waitFor: (text) => {
      return text.includes('Server Status') && text.includes('API Gateway') && text.includes('max_connections')
    },
    timeout: 10000,
  })

  expect(text).toMatchInlineSnapshot(`
    "




      Server Status

      Active Services

      Service      Status   Uptime  Memory
      API Gateway  Running  14d 3h  256MB
      Auth Server  Running  14d 3h  128MB
      Worker Pool  Running  7d 12h  512MB
      Cache Layer  Stopped  -       0MB

      Configuration

      Key              Value      Description
      max_connections  1000       Maximum concurrent connections
      timeout_ms       5000       Request timeout in ms
      retry_count      3          Number of retry attempts
      log_level        info       Logging verbosity
      region           us-east-1  Deployment region

      The system is operating normally.

      Region      Latency                  Endpoint     RPS
      us-east-1   12ms                     /api/auth    1200
      eu-west-1   45ms                     /api/data    3400
      ap-south-1  89ms                     /api/health  500


















      esc go back   ^k actions                             powered by termcast.app

    "
  `)

  // Headers
  expect(text).toContain('Server Status')
  expect(text).toContain('Active Services')
  expect(text).toContain('Configuration')
  // Table header cells
  expect(text).toContain('Service')
  expect(text).toContain('Status')
  expect(text).toContain('Uptime')
  // Table data cells
  expect(text).toContain('API Gateway')
  expect(text).toContain('Running')
  expect(text).toContain('Worker Pool')
  expect(text).toContain('Cache Layer')
  // Second table
  expect(text).toContain('max_connections')
  expect(text).toContain('timeout_ms')
  expect(text).toContain('us-east-1')
  // Prose below tables
  expect(text).toContain('operating normally')
}, 30000)

test('table headers have distinct background color', async () => {
  await session.text({
    waitFor: (text) => text.includes('Service') && text.includes('API Gateway'),
    timeout: 10000,
  })

  // Header cells should use inverted heading colors (heading fg becomes bg)
  // The termcast theme heading fg is orange (#e86500), so header bg should be orange
  const headerBgText = await session.text({
    only: { background: '#e86500' },
    timeout: 5000,
  })

  expect(headerBgText).toContain('Service')
  expect(headerBgText).toContain('Status')
}, 30000)

test('two tables render side by side in a Row', async () => {
  const text = await session.text({
    waitFor: (text) => {
      return text.includes('us-east-1') && text.includes('/api/auth')
    },
    timeout: 10000,
  })

  expect(text).toMatchInlineSnapshot(`
    "




      Server Status

      Active Services

      Service      Status   Uptime  Memory
      API Gateway  Running  14d 3h  256MB
      Auth Server  Running  14d 3h  128MB
      Worker Pool  Running  7d 12h  512MB
      Cache Layer  Stopped  -       0MB

      Configuration

      Key              Value      Description
      max_connections  1000       Maximum concurrent connections
      timeout_ms       5000       Request timeout in ms
      retry_count      3          Number of retry attempts
      log_level        info       Logging verbosity
      region           us-east-1  Deployment region

      The system is operating normally.

      Region      Latency                  Endpoint     RPS
      us-east-1   12ms                     /api/auth    1200
      eu-west-1   45ms                     /api/data    3400
      ap-south-1  89ms                     /api/health  500


      esc go back   ^k actions                             powered by termcast.app

















    "
  `)

  // Left table
  expect(text).toContain('Region')
  expect(text).toContain('Latency')
  expect(text).toContain('us-east-1')
  expect(text).toContain('12ms')
  // Right table
  expect(text).toContain('Endpoint')
  expect(text).toContain('RPS')
  expect(text).toContain('/api/auth')
  expect(text).toContain('3400')
}, 30000)
