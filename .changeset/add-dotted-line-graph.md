---
'termcast': minor
---

Add `DottedLineGraph` for metric dashboards that need thin dotted lines instead of filled area charts.

```tsx
import { DottedLineGraph, Color } from 'termcast'

<DottedLineGraph
  height={12}
  xLabels={['7:28 AM', '7:43 AM', '7:58 AM', '8:13 AM', '8:28 AM']}
  yRange={[0, 100]}
  yFormat={(value) => `${value.toFixed(0)}%`}
>
  <DottedLineGraph.Series data={cpu} color={Color.Blue} title="CPU" />
  <DottedLineGraph.Series data={memory} color={Color.Purple} title="Memory" />
</DottedLineGraph>
```

The graph uses braille subcells for 2×4 movement inside each terminal cell, so diagonal and step-like changes can move smoothly while staying text-only.
