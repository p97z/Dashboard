# Contract: localStorage dashboard-layout-v2

**Type**: Browser storage schema
**Key**: `dashboard-layout-v2`
**Consumer**: `useDashboardConfig` hook
**Breaking change from**: `dashboard-layout-v1`

---

## Schema

```typescript
interface CardConfig {
  id:        string;
  title:     string;
  metrics:   string[];           // MetricKey[]
  showGraph: boolean;
  chartType: 'area' | 'donut';  // required, no longer optional
}

interface DashboardLayout {
  cards: CardConfig[];           // order = render order
}
```

## Rules

- `chartType` MUST be present on every card. Absent field treated as `'area'` defensively.
- `cards` array order is canonical render order.
- Unknown `MetricKey` values in `metrics` are silently skipped at render time (no crash).
- If key is absent or unparseable, `buildDefaultLayout()` generates a fresh v2 layout.
