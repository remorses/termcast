---
'termcast': patch
---

Move `BarGraph` legends to a compact right-side column and add axis/layout controls for dense charts.

```tsx
<BarGraph
  labels={['Mon', 'Tue', 'Wed']}
  barWidth={1}
  barGap={1}
  yTicks={5}
  yFormat={(value) => `${value.toFixed(0)} users`}
>
  <BarGraph.Series data={[40, 30, 25]} title="Direct" />
  <BarGraph.Series data={[30, 35, 15]} title="Organic" />
  <BarGraph.Series data={[20, 25, 10]} title="Referral" />
</BarGraph>
```

The plot area now shows Y-axis tick labels by default. `barWidth` and `barGap` let dense charts use one terminal column per bar, while the legend only takes the width needed for the colored series labels.
