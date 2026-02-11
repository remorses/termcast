// Example: Detail view with markdown content including a diagram code block.
// Tests that the <markdown> element properly renders headings, prose,
// code blocks, and diagram content.

import { Detail } from 'termcast'
import { renderWithProviders } from '../utils'

const markdown = `# Architecture Overview

This document describes the system architecture.

## Components

The system has three main components:

- **Client** - handles user interaction
- **Server** - processes requests
- **Database** - stores data

## Links

Check out the [GitHub repository](https://github.com/remorses/termcast) for the source code.

See the [API documentation](https://developers.raycast.com/api-reference) for more details.

A paragraph with [multiple](https://example.com/one) links [inline](https://example.com/two) here.

Nested formatting: **bold with [link inside](https://example.com/bold)** and *italic with [link](https://example.com/italic)*.

## Configuration Table

| Setting | Default | Description |
|---------|---------|-------------|
| Host | localhost | Database host address |
| Port | 5432 | Database port number |
| SSL | false | Enable TLS encryption |
| Pool Size | 10 | Max connections |

## Flow Diagram

\`\`\`diagram
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Client    │────▶│   Server    │────▶│  Database   │
└─────────────┘     └─────────────┘     └─────────────┘
\`\`\`

## Vertical Flow

\`\`\`diagram
     ┌─────────┐
     │  Start  │
     └────┬────┘
          │
          ▼
     ┌─────────┐
     │ Process │
     └────┬────┘
          │
          ▼
     ┌─────────┐
     │   End   │
     └─────────┘
\`\`\`

## Code Example

\`\`\`typescript
interface Config {
  host: string
  port: number
  ssl: boolean
}

async function connect(config: Config): Promise<Connection> {
  const validated = validate(config)
  return db.connect(validated)
}
\`\`\`

## Task List

- [x] Design system architecture
- [x] Implement core components
- [ ] Add monitoring
- [ ] Deploy to production

> **Note:** All connections use TLS encryption in production.

The system handles ~10k requests/second. For more info visit [the docs](https://termcast.app).
`

function SimpleDetailMarkdown() {
  return <Detail markdown={markdown} />
}

renderWithProviders(<SimpleDetailMarkdown />)
