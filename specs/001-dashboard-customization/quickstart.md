# Quickstart: Dashboard Customization Feature

## Install new dependency

```bash
cd frontend
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

## Dev workflow

```bash
# Terminal 1 — backend
cd backend && npm run dev

# Terminal 2 — frontend
cd frontend && npm run dev
# Opens on http://localhost:3000 (proxies /api to :3001)
```

## Test donut gauges

1. Open dashboard → click settings gear on any card
2. Switch "Chart type" to "Donut / Gauge"
3. Save → each metric shows as a circular gauge

## Test drag and drop

1. Hover over a card header — cursor changes to grab hand
2. Click and drag the card to a new position
3. Release — card snaps into place
4. Refresh page — new order persists

## Test metric add/remove

1. Click settings gear on any card
2. Check/uncheck metrics in the grouped list
3. Save — card immediately reflects changes

## Build for production

```bash
cd frontend && npm run build
cd backend && npm run build
systemctl --user restart home-dashboard
```

## localStorage key change

The layout is now stored under `dashboard-layout-v2`. On first load after upgrade, existing layout (v1) is ignored and a fresh default layout is generated. This is expected.

To force a fresh layout at any time:
```javascript
localStorage.removeItem('dashboard-layout-v2')
// then refresh
```
