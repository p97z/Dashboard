# Tasks: Dashboard Customization

**Input**: Design documents from `/specs/001-dashboard-customization/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

**Tests**: Not requested — personal tool, no test framework configured (per constitution).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install new dependency and update shared types before any story work begins.

- [x] T001 Install `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` in `frontend/package.json`
- [x] T002 Update `frontend/src/types.ts` — promote `chartType` from optional to required `'area' | 'donut'` on `CardConfig`; remove old `'pie'` value

**Checkpoint**: Dependencies installed, types compile clean — story work can begin.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Update the dashboard config hook to v2 schema and add `reorderCards`. All stories depend on the correct layout data shape.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T003 Update `frontend/src/hooks/useDashboardConfig.ts` — change localStorage key to `dashboard-layout-v2`, set `chartType: 'area'` as default in `buildDefaultLayout()`, add `reorderCards(newOrder: CardConfig[])` method
- [x] T004 Update `frontend/src/hooks/useDashboardConfig.ts` — ensure `loadLayout()` defensively handles missing `chartType` field (default `'area'`) for forward compatibility

**Checkpoint**: Foundation ready — layout loads with v2 schema, reorderCards exists, all three story phases can now begin.

---

## Phase 3: User Story 1 — Donut / Gauge Charts per Metric (Priority: P1) 🎯 MVP

**Goal**: Each metric in a card can be displayed as an individual circular gauge with arc fill and formatted value in center.

**Independent Test**: Switch any card to "Donut / Gauge" chart type in settings. Verify each metric shows as a separate circular gauge with colored arc and value label. Verify null values show empty arc with "N/A". Verify percentage metrics show correct fill level. Verify temperature metrics fill proportionally to 100°C max.

### Implementation for User Story 1

- [x] T005 [US1] Create `frontend/src/components/MetricDonutGauge.tsx` — single metric donut gauge using recharts `PieChart` with `innerRadius`; two `Cell`s (value arc + remainder arc); absolute-positioned value label in center; props: `metricKey`, `value`, `label`
- [x] T006 [US1] Implement gauge fill logic in `MetricDonutGauge.tsx` — percentage/temperature metrics fill proportionally (0–100); unbounded metrics render as full ring; null value renders empty arc with "N/A" label
- [x] T007 [US1] Apply threshold coloring in `MetricDonutGauge.tsx` — use `getMetricStroke()` for arc color; use `getMetricValueColor()` for the center value text color
- [x] T008 [US1] Update `frontend/src/components/ConfigurableCard.tsx` — when `card.chartType === 'donut'`, render a responsive grid of `MetricDonutGauge` components instead of `MetricRow` + `MetricGraph` rows
- [x] T009 [US1] Update `frontend/src/components/CardConfigModal.tsx` — rename chart type option label from "Pie" to "Donut / Gauge"; ensure `chartType: 'donut'` is saved correctly

**Checkpoint**: Switch a card to Donut / Gauge — all metrics render as individual gauges with correct fill and value labels.

---

## Phase 4: User Story 2 — Drag and Drop Card Reordering (Priority: P2)

**Goal**: Cards can be dragged by their header to any grid position; new order persists across page refresh.

**Independent Test**: Drag a card header to a new position. Verify cards reflow. Refresh page and verify order is preserved. Test on mobile touch if available.

### Implementation for User Story 2

- [x] T010 [US2] Wrap the card grid in `frontend/src/App.tsx` with `DndContext` and `SortableContext` from `@dnd-kit/core`/`@dnd-kit/sortable`; wire `onDragEnd` to call `reorderCards()` with the new card order
- [x] T011 [US2] Update `frontend/src/components/ConfigurableCard.tsx` — wrap with `useSortable` hook from `@dnd-kit/sortable`; apply `transform` and `transition` styles from the hook; set `cursor-grab` on the card header when not in edit mode
- [x] T012 [US2] Disable drag in edit mode in `frontend/src/components/ConfigurableCard.tsx` — pass `editMode` prop through to `useSortable` and set `disabled={editMode}` to avoid conflicts with delete/settings buttons

**Checkpoint**: Cards are draggable to new positions; order persists after page refresh; cursor shows grab hand on hover.

---

## Phase 5: User Story 3 — Add / Remove Any Metric per Card (Priority: P3)

**Goal**: All available metrics for the current machine are shown in card settings and can be freely added or removed.

**Independent Test**: Open card settings modal. Verify all available metrics appear grouped by category. Toggle a metric off and save — verify it disappears from the card. Toggle a metric on and save — verify it appears. Remove all metrics and save — verify empty state shown instead of crash.

### Implementation for User Story 3

- [x] T013 [P] [US3] Update `frontend/src/components/CardConfigModal.tsx` — pass `metrics` (current live `Metrics` data) as a prop; use `getAvailableMetrics(metrics)` to populate the full grouped checkbox list regardless of current selections
- [x] T014 [US3] Update `frontend/src/components/ConfigurableCard.tsx` — pass the current `metrics` data object down to `CardConfigModal` so it can discover all available metric keys
- [x] T015 [US3] Update `frontend/src/App.tsx` — ensure `metrics` from `useMetricsHistory` is passed through to `ConfigurableCard` for propagation to `CardConfigModal`
- [x] T016 [US3] Handle empty metric state in `frontend/src/components/ConfigurableCard.tsx` — when `card.metrics.length === 0` and chart type is not donut, render a `"No metrics selected — open settings to add some"` empty state message instead of an empty card body

**Checkpoint**: All metrics appear in card settings; add/remove works freely; empty state renders cleanly with no crash.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final integration, visual consistency, and production build.

- [x] T017 [P] Verify dark/light mode styling in `MetricDonutGauge.tsx` — remainder arc uses `rgba(107,114,128,0.25)` which renders acceptably in both themes; adjust if needed
- [x] T018 [P] Verify donut gauge grid layout in `ConfigurableCard.tsx` — test with 1, 3, 5, and 8+ metrics; ensure responsive wrapping works at all card widths
- [x] T019 Rebuild frontend and backend and restart service: `cd frontend && npm run build`, `cd ../backend && npm run build`, `systemctl --user restart home-dashboard`
- [x] T020 Validate `quickstart.md` test scenarios manually — donut view, drag and drop order persistence, metric add/remove, empty state

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 (types must be correct before hook changes)
- **Phase 3 (US1 — Gauges)**: Depends on Phase 2 completion
- **Phase 4 (US2 — Drag & Drop)**: Depends on Phase 2 completion; independent of Phase 3
- **Phase 5 (US3 — Metric Config)**: Depends on Phase 2 completion; independent of Phases 3 and 4
- **Phase 6 (Polish)**: Depends on all story phases complete

### User Story Dependencies

- **US1 (P1)**: Independent after Phase 2
- **US2 (P2)**: Independent after Phase 2 — no dependency on US1
- **US3 (P3)**: Independent after Phase 2 — no dependency on US1 or US2

### Parallel Opportunities

- T005, T006, T007 within US1 are sequential (same file, building up)
- T010, T011, T012 within US2 are sequential (integrated wiring)
- T013 [P] can run alongside T014 (different files)
- T017, T018 in Phase 6 are parallel (different concerns)
- US1, US2, US3 can all start in parallel once Phase 2 is done

---

## Parallel Example: After Phase 2

```
# All three stories can proceed simultaneously:
Story 1: T005 → T006 → T007 → T008 → T009
Story 2: T010 → T011 → T012
Story 3: T013+T014 (parallel) → T015 → T016
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001, T002)
2. Complete Phase 2: Foundational (T003, T004)
3. Complete Phase 3: US1 — Donut gauges (T005–T009)
4. **STOP and VALIDATE**: Switch a card to Donut view and verify gauges render correctly
5. Ship MVP — donut gauges are independently valuable

### Incremental Delivery

1. Setup + Foundational → Types and hook ready
2. US1 → Donut gauges working → Validate → Demo
3. US2 → Drag and drop working → Validate → Demo
4. US3 → Metric add/remove polished → Validate → Demo
5. Polish → Build and deploy

---

## Notes

- No backend changes required — this is entirely a frontend feature
- `@dnd-kit` requires React 16.8+; project uses React 18 ✅
- The `dashboard-layout-v2` key means first load after upgrade will reset to default layout — this is expected per spec assumptions
- Remainder arc color `rgba(107,114,128,0.25)` is theme-neutral (works in light and dark)
- Keep `import React` removed (project uses `jsx: react-jsx` transform)
