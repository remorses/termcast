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

## Flow

\`\`\`diagram
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Client    │────▶│   Server    │────▶│  Database   │
└─────────────┘     └─────────────┘     └─────────────┘
\`\`\`

## Code Example

\`\`\`typescript
function processRequest(input: string): Result {
  const validated = validate(input)
  return db.query(validated)
}
\`\`\`

> Note: All connections use TLS encryption.

The system handles ~10k requests/second.
`

function SimpleDetailMarkdown() {
  return <Detail markdown={markdown} />
}

renderWithProviders(<SimpleDetailMarkdown />)
