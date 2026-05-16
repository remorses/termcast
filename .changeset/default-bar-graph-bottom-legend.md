---
'termcast': patch
---

Make `BarGraph` render legends as a compact bottom row by default and add `legendPosition="right"` for charts that need a side legend.

```tsx
<BarGraph labels={['Mon', 'Tue', 'Wed']}>
  <BarGraph.Series data={[40, 30, 25]} title="Direct" />
  <BarGraph.Series data={[30, 35, 15]} title="Organic" />
</BarGraph>

<BarGraph labels={['Mon', 'Tue', 'Wed']} legendPosition="right">
  <BarGraph.Series data={[40, 30, 25]} title="Direct" />
  <BarGraph.Series data={[30, 35, 15]} title="Organic" />
</BarGraph>
```

The bottom legend keeps the chart compact for normal usage, while the right-side legend remains available for dashboards with more vertical space.
