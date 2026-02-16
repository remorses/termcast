// Example: Detail view with markdown tables rendered by our custom TableRenderable.
// Shows borderless tables with header background and alternating row stripes
// instead of ASCII box-drawing borders.

import { Detail } from 'termcast'
import { renderWithProviders } from '../utils'

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
  return <Detail markdown={markdown} />
}

renderWithProviders(<SimpleDetailTable />)
