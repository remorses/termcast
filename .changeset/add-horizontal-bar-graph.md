---
'termcast': patch
---

Add `HorizontalBarGraph` for horizontal stacked multi-series bar charts with a compact right-side legend, and update the shared chart palette to use the cooler Histogram showcase colors by default.

```tsx
import { HorizontalBarGraph } from 'termcast'

<HorizontalBarGraph labels={['Mon', 'Tue', 'Wed']}>
  <HorizontalBarGraph.Series data={[40, 30, 25]} title="Direct" />
  <HorizontalBarGraph.Series data={[30, 35, 15]} title="Organic" />
  <HorizontalBarGraph.Series data={[20, 25, 10]} title="Referral" />
</HorizontalBarGraph>
```

Each row shows the category label on the left and a single horizontal stacked bar using the same default bar character as `Histogram`. The chart area grows to fill available space, while the legend only takes the width needed for colored series labels and percentages. Header labels align with the same category, distribution, and legend columns as the data rows, and can be customized with `categoryTitle`, `distributionTitle`, and `legendTitle`. Legend rows are sorted by highest percentage first. Chart components that use the shared default palette now start with orange, gray, cyan, purple, yellow, green, and blue for categorical data.
