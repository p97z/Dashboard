# Tasks: Docker Container Hyperlinks

**Input**: Design documents from `/specs/002-container-links/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

**Tests**: Not requested — personal tool, no test framework configured (per constitution).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Update the shared `Container` type before any story work begins.

- [x] T001 Update `frontend/src/types.ts` — add `webUrl: string | null` field to the `Container` interface

**Checkpoint**: Type compiles clean — story work can begin.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Add the `getContainerWebUrl()` helper to the backend. Both US1 and US2 depend on this function.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T002 Add `getContainerWebUrl(hostname: string, container: Docker.ContainerInfo): string | null` helper function to `backend/src/index.ts` — implement priority logic: (1) check `container.Labels['dashboard.url']` label, (2) find lowest TCP `PublicPort` from `container.Ports`, (3) return `https://hostname` for port 443 or `http://hostname:port` for others, (4) return `null` if stopped or no ports
- [x] T003 Add same `getContainerWebUrl()` helper to `agent/src/index.ts` with identical logic

**Checkpoint**: Foundation ready — both story phases can now be implemented.

---

## Phase 3: User Story 1 — Auto-Detected URL from Published Ports (Priority: P1) 🎯 MVP

**Goal**: Running containers with published ports display their name as a clickable link using the auto-detected URL.

**Independent Test**: Start a container with a published port (e.g. `docker run -d -p 9000:9000 portainer/portainer-ce`). Open the dashboard containers table. Verify the container name is a clickable link that opens `http://localhost:9000` in a new tab.

### Implementation for User Story 1

- [x] T004 [US1] Call `getContainerWebUrl(req.hostname, c)` inside `getLocalContainers()` in `backend/src/index.ts` and include `webUrl` in the returned container object
- [x] T005 [P] [US1] Call `getContainerWebUrl(req.hostname, c)` inside the containers endpoint in `agent/src/index.ts` and include `webUrl` in the returned container object
- [x] T006 [US1] Update `frontend/src/components/ContainersTable.tsx` — in the desktop table row, wrap the container name in `<a href={container.webUrl} target="_blank" rel="noopener noreferrer">` when `webUrl` is set; render plain text when `webUrl` is null
- [x] T007 [US1] Update `frontend/src/components/ContainersTable.tsx` — apply the same link/plain-text logic to the mobile card view's container name field
- [x] T008 [US1] Add hover styling to container name links in `frontend/src/components/ContainersTable.tsx` — use `hover:underline text-blue-500 dark:text-blue-400` classes to visually distinguish links from plain text

**Checkpoint**: US1 fully functional — running containers with published ports show clickable names.

---

## Phase 4: User Story 2 — Custom URL via Docker Label (Priority: P2)

**Goal**: Containers with a `dashboard.url` Docker label use that URL instead of the auto-detected one.

**Independent Test**: Run a container with `--label dashboard.url=http://192.168.1.10:9000`. Open the dashboard. Verify the container name links to `http://192.168.1.10:9000`, not the auto-detected port URL.

### Implementation for User Story 2

*Note: The `dashboard.url` label logic is already implemented inside `getContainerWebUrl()` from Phase 2 (T002, T003). US2 requires no additional backend code — the label check is the first priority in the helper.*

- [x] T009 [US2] Verify label priority in `backend/src/index.ts` — confirm `getContainerWebUrl()` checks `container.Labels?.['dashboard.url']` before port detection, and returns the label value verbatim if non-empty
- [x] T010 [US2] Verify label priority in `agent/src/index.ts` — same confirmation for the agent's implementation

**Checkpoint**: US2 complete — `dashboard.url` label overrides auto-detection in all cases.

---

## Phase 5: Polish & Cross-Cutting Concerns

- [x] T011 [P] Build and verify `backend`: `cd backend && npm run build` — confirm zero TypeScript errors
- [x] T012 [P] Build and verify `frontend`: `cd frontend && npm run build` — confirm zero TypeScript errors
- [x] T013 Deploy: `systemctl --user restart home-dashboard` and spot-check both local and Raspberry Pi machine tabs

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 (T001 must compile before T002/T003)
- **User Story 1 (Phase 3)**: Depends on Phase 2 — T004/T005 require `getContainerWebUrl()` from T002/T003
- **User Story 2 (Phase 4)**: Depends on Phase 2 — label logic lives inside `getContainerWebUrl()`; no additional code needed beyond verification
- **Polish (Phase 5)**: Depends on all story phases complete

### User Story Dependencies

- **US1 (P1)**: Can start after Phase 2 — no dependency on US2
- **US2 (P2)**: Can start after Phase 2 — label logic already in `getContainerWebUrl()`; T009/T010 are read-only verification tasks

### Parallel Opportunities

- T004 (backend) and T005 (agent) can run in parallel — different files
- T006 and T007 can run in parallel — same file but different sections (desktop vs mobile)
- T011 and T012 can run in parallel — different projects

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: T001 — update type
2. Complete Phase 2: T002, T003 — add helper to backend and agent
3. Complete Phase 3: T004–T008 — wire into containers response and UI
4. **STOP and VALIDATE**: Click a container name — verify new tab opens at correct URL
5. Proceed to US2 verification (T009, T010) and polish (T011–T013)

### Incremental Delivery

1. T001 → T002 + T003 → T004 + T005 → T006 + T007 + T008 → validate US1
2. T009 + T010 → validate US2 (label override)
3. T011 + T012 + T013 → production deploy

---

## Notes

- [P] tasks operate on different files and have no inter-dependency — safe to implement simultaneously
- T009 and T010 are verification-only tasks — the label logic is implemented in T002/T003
- Both desktop table and mobile card views must be updated (T006 and T007)
- `rel="noopener noreferrer"` is required on `target="_blank"` links as a security best practice
