// Example: Detail view with markdown tables rendered by our custom TableRenderable.
// Shows borderless tables with header background and alternating row stripes
// instead of ASCII box-drawing borders.
// Also demonstrates two tables side by side using the Row component.

import { Detail } from 'termcast'
import { TextAttributes } from '@opentui/core'
import { renderWithProviders } from '../utils'
import { Table } from 'termcast/src/components/table'

import { Row } from 'termcast/src/components/row'

const markdown = `# Server Status

## Active Services

| Service     | Status  | Uptime   | Memory |
|-------------|---------|----------|--------|
| API Gateway | Running | 14d 3h   | 256MB  |
| Auth Server | Running | 14d 3h   | 128MB  |
| Worker Pool | Running | 7d 12h   | 512MB  |
| Cache Layer | Stopped | -        | 0MB    |

## Configuration

| Key              | Value          | Description                    |
|------------------|----------------|--------------------------------|
| max_connections  | 1000           | Maximum concurrent connections |
| timeout_ms       | 5000           | Request timeout in ms          |
| retry_count      | 3              | Number of retry attempts       |
| log_level        | info           | Logging verbosity              |
| region           | us-east-1      | Deployment region              |

The system is operating normally.
`

function SimpleDetailTable() {
  return (
    <Detail
      markdown={markdown}
      metadata={
        <Row paddingTop={1}>
          <Table
            headers={['Region', 'Latency']}
            rows={[
              ['us-east-1','12ms'],
              ['eu-west-1', '45ms'],
              ['ap-south-1', '89ms'],
            ]}
          />
          <Table
            headers={['Endpoint', 'RPS']}
            rows={[
              ['/api/auth', '1200'],
              ['/api/data', '3400'],
              ['/api/health', '500'],
            ]}
          />
        </Row>
      }
    />
  )
}

renderWithProviders(<SimpleDetailTable />)
