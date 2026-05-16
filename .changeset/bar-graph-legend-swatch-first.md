---
'termcast': patch
---

Show `BarGraph` bottom legend color swatches before their labels.

```tsx
<BarGraph labels={['Mon', 'Tue', 'Wed']}>
  <BarGraph.Series data={[40, 30, 25]} title="Direct" />
  <BarGraph.Series data={[30, 35, 15]} title="Organic" />
</BarGraph>
```

The bottom legend now renders entries like `■ Direct`, matching common chart legend ordering.
