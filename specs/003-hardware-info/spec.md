# Feature Specification: Hardware Info Panel

**Feature Branch**: `003-hardware-info`
**Created**: 2026-03-21
**Status**: Draft
**Input**: User description: "add details about processor hard drives and system information. Add a button to the top of the page so when the user clicks it, it will display all possible hardware information"

## User Scenarios & Testing *(mandatory)*

### User Story 1 — View Hardware Details Panel (Priority: P1)

A user wants to know the full hardware specification of a monitored machine. They click a "Hardware Info" button in the dashboard header and a panel (or modal) opens showing comprehensive details: CPU model and core count, disk drive models and capacities, total RAM, operating system version, and any other hardware information the system can provide. The panel can be dismissed by closing it.

**Why this priority**: This is the core request — surfacing hardware detail not visible on the main dashboard cards. Delivers immediate value with a single button and panel.

**Independent Test**: Open the dashboard, click the Hardware Info button, and verify the panel shows CPU, disk, memory, and OS details for the currently selected machine.

**Acceptance Scenarios**:

1. **Given** the dashboard is showing any machine, **When** the user clicks the Hardware Info button, **Then** a panel opens displaying at minimum: CPU model/core count, total installed RAM, disk drive list with model and capacity, and operating system name and version.
2. **Given** the Hardware Info panel is open, **When** the user clicks the close/dismiss control, **Then** the panel closes and the dashboard returns to its normal view.
3. **Given** the hardware information is still loading, **When** the panel is open, **Then** a loading indicator is displayed until the data arrives.

---

### User Story 2 — Hardware Info Per Machine (Priority: P2)

A user who monitors multiple machines (e.g., main server and Raspberry Pi) wants to see the hardware specification for whichever machine tab is currently selected. Switching to a different machine and opening the panel shows that machine's hardware, not the local machine's.

**Why this priority**: The dashboard already supports multiple machines. Hardware info that ignores machine selection would be confusing and misleading.

**Independent Test**: Switch to the Raspberry Pi machine tab, open the Hardware Info panel, and verify the CPU shows ARM architecture details rather than the local machine's processor.

**Acceptance Scenarios**:

1. **Given** the user has the Raspberry Pi machine tab selected, **When** they open the Hardware Info panel, **Then** the panel shows hardware details for the Raspberry Pi, not the main server.
2. **Given** the Hardware Info panel is open for Machine A, **When** the user closes the panel, switches machine tabs, and reopens the panel, **Then** the panel shows hardware details for the newly selected machine.

---

### User Story 3 — Handle Unavailable or Partial Hardware Data (Priority: P3)

Some hardware details may not be available on all machines (e.g., a Raspberry Pi may not expose GPU or fan sensor data). The panel should display whatever information is available and clearly indicate when a category has no data, rather than showing an empty or broken layout.

**Why this priority**: Graceful degradation ensures the feature works reliably across all supported machines, preventing confusion from blank sections.

**Independent Test**: Open the Hardware Info panel for a machine where GPU information is unavailable, and verify the panel shows a clear "not available" indication rather than an error or blank space.

**Acceptance Scenarios**:

1. **Given** a machine has no GPU, **When** the Hardware Info panel is opened, **Then** the GPU section is either hidden or shows a clear "Not available" message.
2. **Given** the agent on a remote machine cannot be reached, **When** the Hardware Info panel is opened, **Then** an error message is displayed explaining that hardware information could not be retrieved.

---

### Edge Cases

- What happens when the hardware query takes longer than expected? A loading state covers this; after a timeout the error state is shown.
- What if a disk appears under multiple identifiers? De-duplicate by device path so each physical drive appears once.
- What if a field value is unknown or a sensor is not present? Show "Unknown" or hide the row entirely.
- What does the panel show for virtual machines where hardware info is limited? Show whatever is reported; no special handling needed.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The dashboard header MUST include a "Hardware Info" button visible on every machine tab.
- **FR-002**: Clicking the Hardware Info button MUST open a panel or modal displaying hardware details for the currently selected machine.
- **FR-003**: The Hardware Info panel MUST display, at minimum: CPU model name, physical core count, logical thread count, and base clock speed; total installed RAM; a list of storage devices with device name, model, and total capacity; and operating system name and version.
- **FR-004**: The Hardware Info panel MUST additionally display, when the data is available: motherboard/system model, GPU model(s) with VRAM, network interface names, and kernel/architecture details.
- **FR-005**: The Hardware Info panel MUST reflect the currently selected machine — opening the panel after switching machine tabs MUST show the new machine's data, not a cached version from a different machine.
- **FR-006**: The Hardware Info panel MUST show a loading indicator while data is being fetched.
- **FR-007**: The Hardware Info panel MUST show an error state if hardware data cannot be retrieved, with a human-readable explanation.
- **FR-008**: Hardware categories with no available data MUST either be hidden or display a clear "Not available" label rather than showing blank content.
- **FR-009**: The panel MUST be dismissible without navigating away from the dashboard.

### Key Entities

- **HardwareReport**: A snapshot of all available hardware information for a single machine at the time of the query. Contains sub-sections for CPU, memory, storage, OS, network, and optionally GPU/motherboard.
- **StorageDevice**: One physical or logical drive — identified by device path, with model name and total capacity.
- **CpuInfo**: Processor details — model name, physical cores, logical threads, base clock speed.
- **OsInfo**: Operating system name, version, kernel version, and architecture.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Hardware details are displayed within 3 seconds of clicking the button on a normally responding machine.
- **SC-002**: The panel displays at least 4 distinct hardware categories (CPU, RAM, storage, OS) for every machine that responds successfully.
- **SC-003**: Every hardware field visible in the panel has a human-readable label — users never see a raw number without context.
- **SC-004**: When a hardware category is unavailable, 100% of available sections remain readable and usable.
- **SC-005**: The feature works for all machines already supported by the dashboard (local and remote agents) without requiring manual configuration.

## Assumptions

- The monitoring agents already use a system stats library that can expose static hardware info (CPU model, disk models, OS version) without additional dependencies.
- Hardware info is fetched on-demand when the panel opens, not polled continuously — it is static or slowly changing data.
- The feature is available to all users of the dashboard (no access control needed — this is a personal homelab tool).
- "All possible hardware information" is interpreted as: everything the system info library can expose, grouped into human-readable categories.
- Per-machine scope means the hardware info endpoint will be proxied through the same multi-machine routing already in place.
