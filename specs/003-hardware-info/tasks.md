# Tasks: Hardware Info Panel

**Input**: Design documents from `/specs/003-hardware-info/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

**Tests**: Not requested — personal tool, no test framework configured (per constitution).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Add the shared `HardwareInfo` type before any story work begins.

- [x] T001 Add `HardwareInfo` interface to `frontend/src/types.ts` — add the full interface per `data-model.md`: `cpu { brand, manufacturer, speed, cores, physicalCores }`, `memory { total }`, `disks[]`, `os { platform, distro, release, arch, kernel, hostname }`, `system | null`, `gpu[]`, `network[]`, `baseboard | null`

**Checkpoint**: Type compiles clean — story work can begin.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Add `getLocalHardwareInfo()` to both backend and agent before any route or UI work begins.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T002 Add `async function getLocalHardwareInfo(): Promise<HardwareInfo>` to `backend/src/index.ts` — call `si.cpu()`, `si.mem()`, `si.diskLayout()`, `si.osInfo()`, `si.system()`, `si.graphics()`, `si.networkInterfaces()`, `si.baseboard()` in parallel using `Promise.allSettled`; map each settled result to the `HardwareInfo` shape (failed results return `null` for nullable fields or `[]` for array fields); filter `networkInterfaces` to exclude `internal === true` and `iface === 'lo'`
- [x] T003 [P] Add identical `async function getLocalHardwareInfo(): Promise<HardwareInfo>` to `agent/src/index.ts` — same implementation as T002; `systeminformation` is already installed in the agent

**Checkpoint**: Foundation ready — both story phases can now be implemented.

---

## Phase 3: User Story 1 — View Hardware Details Panel (Priority: P1) 🎯 MVP

**Goal**: A "Hardware" button in the dashboard header opens a modal displaying comprehensive hardware details for the local machine — CPU, RAM, storage, OS, GPU, network, and system info.

**Independent Test**: Open the dashboard, click the Hardware button, and verify the modal shows CPU model, core count, total RAM, at least one disk, and OS details. Dismiss with × or backdrop click.

### Implementation for User Story 1

- [x] T004 [US1] Add `GET /api/hardware-info` route to `backend/src/index.ts` — calls `getLocalHardwareInfo()` and returns JSON; add error handling matching the existing `/api/info` route pattern
- [x] T005 [P] [US1] Add `GET /api/hardware-info` route to `agent/src/index.ts` — calls `getLocalHardwareInfo()` and returns JSON; add error handling matching existing agent routes
- [x] T006 [US1] Create `frontend/src/hooks/useHardwareInfo.ts` — export `function useHardwareInfo(machineId: string | null)` that returns `{ data: HardwareInfo | null; loading: boolean; error: string | null }`; fetch `GET /api/machines/${machineId}/hardware-info` when `machineId` is non-null; reset state when `machineId` changes to null (modal closed); use `useEffect` with `machineId` as dependency
- [x] T007 [US1] Create `frontend/src/components/HardwareInfoModal.tsx` — modal with backdrop overlay and × close button matching the existing `UpdatesModal` / `LogsModal` pattern; render loading spinner while `loading` is true; render error message when `error` is set; render 8 labelled sections when data is available: **CPU** (brand, manufacturer, cores × physicalCores, speed in GHz), **Memory** (total formatted with `formatBytes`), **Storage** (table with device, name, type, size via `formatBytes`, vendor, interface), **Operating System** (distro + release, arch, kernel, hostname), **System** (manufacturer + model, virtual badge), **GPU** (vendor + model + VRAM per controller), **Network** (iface, type, MAC, IP per interface), **Motherboard** (manufacturer + model); accepts props `machineId: string; onClose: () => void`
- [x] T008 [US1] Update `frontend/src/App.tsx` — add `showHardwareInfo` boolean state (default `false`); add a `<button>` with `<Cpu size={16} />` icon and text "Hardware" to the dashboard header (right side, near existing controls); on click set `showHardwareInfo(true)`; render `<HardwareInfoModal machineId={selectedMachineId} onClose={() => setShowHardwareInfo(false)} />` when `showHardwareInfo` is true; import `Cpu` from `lucide-react` and `HardwareInfoModal`

**Checkpoint**: US1 fully functional — clicking Hardware button shows modal with hardware details for local machine.

---

## Phase 4: User Story 2 — Hardware Info Per Machine (Priority: P2)

**Goal**: The Hardware Info modal shows the correct machine's hardware when the user switches between machine tabs before opening it.

**Independent Test**: Switch to the Raspberry Pi machine tab, click Hardware, verify the CPU shows ARM architecture and the OS shows Raspberry Pi OS — not the main server's specs.

### Implementation for User Story 2

- [x] T009 [US2] Add `GET /api/machines/:id/hardware-info` proxy route to `backend/src/index.ts` — find machine by `req.params.id`; if `machine.url` is null call `getLocalHardwareInfo()` directly; otherwise call `proxyFetch(machine.url, '/api/hardware-info')` and forward the response or return 503 on failure; follow the exact same pattern as the existing `GET /api/machines/:id/metrics` route

**Checkpoint**: US2 complete — switching machine tabs and opening the modal shows that machine's hardware.

---

## Phase 5: User Story 3 — Graceful Degradation (Priority: P3)

**Goal**: Sections with no available data are hidden or show "Not available" — the modal never shows broken or blank sections.

**Independent Test**: Open Hardware Info for the Raspberry Pi — verify the GPU section is hidden or shows "Not available", and the remaining sections (CPU, Memory, OS) are fully readable.

### Implementation for User Story 3

- [x] T010 [US3] Update `frontend/src/components/HardwareInfoModal.tsx` — add null/empty-array guards to optional sections: hide the **System** section when `data.system` is null; hide or show "Not available" for the **GPU** section when `data.gpu` is an empty array; hide the **Motherboard** section when `data.baseboard` is null; hide any Network section row where `iface` or `mac` is empty
- [x] T011 [US3] Update `frontend/src/components/HardwareInfoModal.tsx` — handle partial disk data: when `disk.name` is empty string display only the device path; when `disk.vendor` is empty string omit the vendor cell; add a "Virtual Machine" badge next to the System section header when `data.system.virtual` is true

**Checkpoint**: US3 complete — all machines show clean output regardless of available hardware data.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [x] T012 [P] Build and verify `backend`: `cd backend && npm run build` — confirm zero TypeScript errors
- [x] T013 [P] Build and verify `frontend`: `cd frontend && npm run build` — confirm zero TypeScript errors
- [x] T014 [P] Build and verify `agent`: `cd agent && npm run build` — confirm zero TypeScript errors
- [x] T015 Deploy: `systemctl --user restart home-dashboard` and spot-check Hardware Info modal on both local and Raspberry Pi machine tabs

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 (T001 must compile before T002/T003)
- **User Story 1 (Phase 3)**: Depends on Phase 2 — T004/T005 require `getLocalHardwareInfo()` from T002/T003; T006/T007 require `HardwareInfo` type from T001
- **User Story 2 (Phase 4)**: Depends on Phase 2 — proxy route calls `getLocalHardwareInfo()`; T009 also requires the pattern established by T004
- **User Story 3 (Phase 5)**: Depends on Phase 3 (T007) — modifies the modal created there
- **Polish (Phase 6)**: Depends on all story phases complete

### User Story Dependencies

- **US1 (P1)**: Can start after Phase 2 — no dependency on US2 or US3
- **US2 (P2)**: Can start after Phase 2 — T009 is backend-only and independent of US1 UI
- **US3 (P3)**: Depends on US1 (T007) — modifies HardwareInfoModal created in US1

### Parallel Opportunities

- T002 and T003 can run in parallel — different files (backend vs. agent)
- T004 and T005 can run in parallel — different files (backend route vs. agent route)
- T006 and T007 can run in parallel — different files (hook vs. component)
- T012, T013, T014 can run in parallel — different projects

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: T001 — add type
2. Complete Phase 2: T002 + T003 — add helper functions
3. Complete Phase 3: T004–T008 — wire routes, hook, modal, button
4. **STOP and VALIDATE**: Click the Hardware button — verify modal opens with CPU/RAM/disk/OS data
5. Proceed to US2 (T009) for per-machine support, then US3 (T010–T011) for polish

### Incremental Delivery

1. T001 → T002 + T003 → T004 + T005 → T006 + T007 → T008 → validate US1 (local machine only)
2. T009 → validate US2 (switch to RPi tab, verify different CPU)
3. T010 + T011 → validate US3 (RPi shows no GPU section)
4. T012 + T013 + T014 + T015 → production deploy

---

## Notes

- T002 and T003 are [P] — safe to implement simultaneously since they are different files
- T004 and T005 are [P] — backend route and agent route are independent
- T006 and T007 are [P] — hook and component have no dependency on each other; component imports the type but not the hook
- `formatBytes` is already available in `frontend/src/utils.ts` — use it for memory and disk sizes
- The `Cpu` icon is available in `lucide-react` which is already installed
- `UpdatesModal` or `LogsModal` should be read first as a reference for the modal pattern before writing T007
