# Feature Specification: Dashboard Customization

**Feature Branch**: `001-dashboard-customization`
**Created**: 2026-03-21
**Status**: Draft
**Input**: User description: "Doughnut / gauge charts per metric. Drag and drop cards. The ability to add and remove any metric per card."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View metrics as donut gauge charts (Priority: P1)

A user opens the dashboard and wants to see CPU usage, memory, and disk space at a glance as visual gauges rather than text rows. They switch a card to donut/gauge view and immediately see each metric rendered as an individual circular gauge with the current value displayed in the center and the arc filled proportionally.

**Why this priority**: This is the primary new visualization capability. It delivers immediate value independently and is the most visually impactful change requested.

**Independent Test**: Can be fully tested by switching a single card to donut view and verifying each metric renders a correctly filled gauge.

**Acceptance Scenarios**:

1. **Given** a card with metrics (e.g. CPU usage at 45%, memory at 70%), **When** the user selects donut/gauge chart type, **Then** each metric renders as a separate circular gauge with the arc filled to match the percentage and the formatted value shown in the center.
2. **Given** a donut gauge for a percentage metric at 85%, **When** viewing the gauge, **Then** the arc color reflects the alert threshold coloring (green/yellow/red).
3. **Given** a donut gauge for a non-percentage metric (e.g. CPU temp at 65°C), **When** viewing the gauge, **Then** the arc fills proportionally against a fixed max (100°C) and the formatted value (e.g. "65°C") is shown in the center.
4. **Given** a metric with a null/unavailable value, **When** rendering the gauge, **Then** the gauge shows an empty arc and displays "N/A" in the center.

---

### User Story 2 - Drag and drop to reorder cards (Priority: P2)

A user wants to reorganize their dashboard layout by dragging cards into a preferred order — for example, moving the Raspberry Pi system card to the top. They grab a card by its header, drag it to a new position, and release it. The new order is saved automatically and persists on next visit.

**Why this priority**: Reordering cards is a key usability improvement. It builds on existing localStorage persistence and does not depend on Story 1.

**Independent Test**: Can be fully tested by dragging a card to a new position and refreshing the page to confirm the order persisted.

**Acceptance Scenarios**:

1. **Given** multiple cards on the dashboard, **When** the user drags a card header to a new position, **Then** the card snaps into place in the new position and other cards reflow accordingly.
2. **Given** a reordered layout, **When** the user refreshes the page, **Then** cards appear in the previously saved order.
3. **Given** a user dragging a card, **When** dragging over an invalid drop target (e.g. the containers table), **Then** the card cannot be dropped there and returns to its original position.
4. **Given** the dashboard on a mobile screen, **When** attempting drag and drop, **Then** drag and drop works via touch events.

---

### User Story 3 - Add and remove metrics per card (Priority: P3)

A user wants to add the swap metric to their system card and remove load averages they don't care about. They open the card settings, check/uncheck metrics from a grouped list, and save. The card immediately reflects the updated metric set.

**Why this priority**: Metric configuration already partially exists. This story ensures all available metrics can be freely added or removed from any card.

**Independent Test**: Can be tested independently by opening card settings, toggling metrics, saving, and verifying the card shows only the selected metrics.

**Acceptance Scenarios**:

1. **Given** a card in settings mode, **When** the user views the metric list, **Then** all available metrics for the current machine are shown grouped by category (System, Storage, Network, GPU, Fans).
2. **Given** a card with 3 metrics selected, **When** the user unchecks one metric and saves, **Then** the card displays only the 2 remaining metrics.
3. **Given** a card with no metrics selected, **When** the user saves, **Then** the card displays a clear empty state message rather than crashing.
4. **Given** a new metric becoming available (e.g. a new disk mounted), **When** the user opens card settings, **Then** the new metric appears in the list and can be added.

---

### Edge Cases

- What happens when a card has only one metric in donut view? The single gauge renders centered and fills the available space.
- What happens if localStorage is full or unavailable? The layout works in-memory for the session.
- What happens when dragging on a single-card layout? Drag has no visible effect; no error thrown.
- What happens if a metric key in saved layout no longer exists (e.g. a disk was unmounted)? The metric is silently skipped; no crash.
- How does donut view handle many metrics (8+) in one card? Gauges wrap into a responsive grid with no truncation.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Each metric within a card MUST be renderable as an individual donut/gauge chart showing the current value as a filled arc and the formatted value in the center.
- **FR-002**: Gauge arc fill MUST be proportional to the metric value relative to its known maximum (100 for percentages and temperatures; full ring for unbounded metrics).
- **FR-003**: Gauge arc color MUST follow the same green/yellow/red threshold coloring used in the existing progress bars.
- **FR-004**: Users MUST be able to switch between area chart view and donut/gauge view per card via card settings.
- **FR-005**: Cards MUST be draggable by their header into any position within the card grid.
- **FR-006**: Card order MUST be persisted to `localStorage` automatically after each drag-and-drop operation.
- **FR-007**: Drag and drop MUST work on both desktop (mouse) and mobile (touch) devices.
- **FR-008**: Users MUST be able to add any available metric to a card via card settings.
- **FR-009**: Users MUST be able to remove any metric from a card via card settings, down to zero metrics.
- **FR-010**: Available metrics shown in card settings MUST reflect the live metrics for the currently selected machine.
- **FR-011**: Cards with zero metrics selected MUST display a clear empty state rather than crashing or rendering blank.
- **FR-012**: The localStorage layout key MUST be versioned (bumped from `v1`) to avoid silent data corruption from the updated schema.

### Key Entities

- **CardConfig**: Represents one dashboard card — has an id, title, ordered list of metric keys, chart type (area or donut), and collapsed state.
- **DashboardLayout**: Ordered array of CardConfigs. Array order determines render order on screen.
- **MetricKey**: String identifier for a single metric (e.g. `cpu_usage`, `disk:/`, `net_rx:eth0`). Dynamic keys are discovered from live metrics data.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can switch any card to donut/gauge view and see all metrics rendered as individual gauges within 1 second of saving the setting.
- **SC-002**: A user can drag a card to a new position and have the new order persist across a full page refresh.
- **SC-003**: All available metrics for the connected machine appear in card settings with no missing entries.
- **SC-004**: Adding or removing a metric from a card takes no more than 2 interactions (open settings → toggle → save).
- **SC-005**: The full dashboard layout (card order, chart types, selected metrics) survives a browser refresh with no data loss.

## Assumptions

- Drag and drop will use a lightweight library (e.g. `@dnd-kit/core`) rather than native HTML5 drag-and-drop to ensure reliable touch support — consistent with Principle I (simplest solution that works).
- Donut gauges for unbounded metrics (network speed, load avg, uptime, disk I/O) render as a fully filled ring in the metric's color showing only the formatted value in the center, since no meaningful max bound exists.
- The existing `CardConfigModal` remains the sole entry point for metric add/remove.
- Card deletion remains in Edit Layout mode only, unchanged.
- The `dashboard-layout-v1` schema will not be auto-migrated; users start with a fresh default layout on first load after the upgrade.
