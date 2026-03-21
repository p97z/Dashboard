# Data Model: Dashboard Customization

**Feature**: 001-dashboard-customization
**Date**: 2026-03-21

---

## Updated Type: CardConfig

```
CardConfig {
  id:        string          — stable unique identifier (UUID or slug)
  title:     string          — display name shown in card header
  metrics:   MetricKey[]     — ordered list of metrics to display; may be empty
  showGraph: boolean         — whether to show the time-series area chart (ignored in donut mode)
  chartType: 'area' | 'donut'  — visualization mode (was optional, now required; default 'area')
}
```

**Changes from v1**:
- `chartType` promoted from `optional` to `required` with default `'area'`
- Rename: `'pie'` → `'donut'` in the union (was `'area' | 'pie'` in prior code, now `'area' | 'donut'`)

---

## Unchanged Type: DashboardLayout

```
DashboardLayout {
  cards: CardConfig[]   — ordered array; array index = render order on screen
}
```

Card order is already expressed by array position. Drag-and-drop reorders this array and persists it.

---

## localStorage Schema: v2

**Key**: `dashboard-layout-v2`
**Format**: JSON-serialized `DashboardLayout`

```json
{
  "cards": [
    {
      "id": "system",
      "title": "System",
      "metrics": ["cpu_usage", "cpu_temp", "memory"],
      "showGraph": false,
      "chartType": "donut"
    },
    {
      "id": "network",
      "title": "Network",
      "metrics": ["net_rx:eth0", "net_tx:eth0"],
      "showGraph": true,
      "chartType": "area"
    }
  ]
}
```

**Migration**: None. On first load with v2 key absent, `buildDefaultLayout()` generates a fresh default layout with `chartType: 'area'` on all cards.

---

## MetricKey (unchanged)

String-based key convention, unchanged from v1:

| Pattern | Example | Bounded? |
|---|---|---|
| `cpu_usage` | — | Yes (0–100%) |
| `cpu_temp` | — | Yes (0–100°C) |
| `memory` | — | Yes (0–100%) |
| `swap` | — | Yes (0–100%) |
| `disk:{mount}` | `disk:/` | Yes (0–100%) |
| `gpu_util:{n}` | `gpu_util:0` | Yes (0–100%) |
| `gpu_temp:{n}` | `gpu_temp:0` | Yes (0–100°C) |
| `load_1`, `load_5`, `load_15` | — | No (full ring) |
| `net_rx:{iface}` | `net_rx:eth0` | No (full ring) |
| `net_tx:{iface}` | `net_tx:eth0` | No (full ring) |
| `disk_io_read` | — | No (full ring) |
| `disk_io_write` | — | No (full ring) |
| `net_connections` | — | No (full ring) |
| `uptime` | — | No (full ring) |
| `fan:{n}` | `fan:0` | No (full ring) |

---

## Gauge Fill Logic

```
fillPercent(key, value):
  if value is null → 0 (empty ring, show "N/A")
  if isPercentMetric(key) → value          (0–100)
  if key is 'cpu_temp' or 'gpu_temp:*' → min(value, 100)   (0–100°C max)
  else → 100                                (full ring, unbounded)
```
