# Research: Dashboard Customization

**Feature**: 001-dashboard-customization
**Date**: 2026-03-21

---

## Decision 1: Donut/gauge chart implementation

**Decision**: Use the existing `recharts` `PieChart` component with `innerRadius` to render donut gauges. No new dependency.

**Rationale**: recharts is already installed and used for area charts. `PieChart` + `Pie` supports `innerRadius` (donut hole), `startAngle`/`endAngle` for arc direction, and `Cell` for per-slice color. Two cells per gauge (value arc + remainder arc) produces the gauge appearance. An absolutely positioned `div` overlay renders the formatted value in the center.

**Alternatives considered**:
- `react-gauge-chart` — extra dependency, no benefit over recharts which is already present (violates Principle I)
- `victory-native` — heavy dependency, overkill
- SVG drawn manually — more control but more code than recharts approach

---

## Decision 2: Drag and drop library

**Decision**: Add `@dnd-kit/core` + `@dnd-kit/sortable` (~7KB gzipped combined).

**Rationale**: `@dnd-kit/sortable` is purpose-built for sortable lists and grids in React. It has first-class touch/pointer event support (works on mobile), keyboard accessibility, and integrates cleanly with React state (no DOM mutation). It is the modern standard for React drag and drop.

**Alternatives considered**:
- `react-beautiful-dnd` — no longer actively maintained as of 2024, limited touch support
- HTML5 native Drag and Drop API — no touch support; would require a polyfill
- `react-sortable-hoc` — deprecated, class-component-based
- No library (mouse events manually) — fragile, no touch support, significant code for little gain (violates Principle I's "simplest that works")

**Complexity justification** (Constitution Principle I): This is the single simplest cross-platform solution. All pure-JS alternatives are either unmaintained or require more code.

---

## Decision 3: localStorage schema versioning

**Decision**: Bump key from `dashboard-layout-v1` to `dashboard-layout-v2`. No auto-migration.

**Rationale**: `CardConfig.chartType` is a new field and the draggable order semantics change. Per Constitution Principle V, breaking schema changes MUST increment the version suffix. Auto-migration is not worth the complexity for a personal tool — users will get a fresh default layout.

**Alternatives considered**:
- Auto-migrate v1 → v2 (add `chartType: 'area'` to each card, preserve order) — possible but adds code for one-time operation on a personal tool
- Keep v1 key, add optional field — would silently work but violates Principle V's explicit versioning rule

---

## Decision 4: Gauge rendering for unbounded metrics

**Decision**: Render a fully filled ring (100% arc) in the metric's color for metrics with no fixed maximum (network speed, load avg, uptime, disk I/O, connection count, fan RPM). Show the formatted value in the center.

**Rationale**: These metrics have no meaningful universal max to normalize against. A full ring still communicates "this metric is active" and shows the value. Attempting to infer a max would be misleading.

**Alternatives considered**:
- Exclude unbounded metrics from donut view — unhelpful; user may add them to a donut card
- Show a half-gauge (0–max estimated from history) — complex, history-dependent, would feel unstable

---

## Decision 5: Drag handle placement

**Decision**: The entire card header acts as the drag handle. A grab cursor (`cursor-grab`) is shown on hover. Dragging is only enabled when NOT in edit mode (to avoid conflict with the delete button).

**Rationale**: Card headers are the natural drag target — consistent with common dashboard UIs. Restricting drag to non-edit mode avoids accidental drags when the user is trying to click settings/delete buttons.

**Alternatives considered**:
- Dedicated drag handle icon (⠿) in header — adds visual clutter for a personal tool
- Drag always enabled including edit mode — increases accidental drag probability
