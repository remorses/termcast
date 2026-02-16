// Example: Comprehensive table edge cases for testing.
// Tests markdown tables with inline formatting, single column/row,
// empty cells, wide content, and various column counts.

import { Detail } from 'termcast'
import { renderWithProviders } from '../utils'

const markdown = `# Table Edge Cases

## Inline Formatting

| Feature | Syntax | Result |
|---------|--------|--------|
| Bold | **text** | bold text |
| Italic | *text* | italic text |
| Code | \`code\` | inline code |
| Link | [docs](https://example.com) | clickable link |
| Mixed | **bold** and *italic* | combined |

## Single Column

| Name |
|------|
| Alice |
| Bob |
| Charlie |

## Single Row

| A | B | C | D | E |
|---|---|---|---|---|
| 1 | 2 | 3 | 4 | 5 |

## Empty Cells

| Key | Value | Notes |
|-----|-------|-------|
| host | localhost | |
| | 8080 | default port |
| ssl | | not configured |

## Wide Table

| ID | Name | Email | Role | Department | Location |
|----|------|-------|------|------------|----------|
| 1 | Alice Johnson | alice@example.com | Engineer | Engineering | SF |
| 2 | Bob Smith | bob@example.com | Designer | Design | NYC |

## Two Columns

| Key | Value |
|-----|-------|
| version | 2.1.0 |
| license | MIT |
| author | termcast |

## Numeric Data

| Metric | Q1 | Q2 | Q3 | Q4 |
|--------|----|----|----|----|
| Revenue | 100 | 150 | 200 | 250 |
| Users | 1000 | 1500 | 2000 | 3000 |
| Churn | 5% | 4% | 3% | 2% |

Done.
`

function TableEdgeCases() {
  return <Detail markdown={markdown} />
}

renderWithProviders(<TableEdgeCases />)
