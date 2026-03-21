# Implementation Plan: Hardware Info Panel

**Branch**: `003-hardware-info` | **Date**: 2026-03-21 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/003-hardware-info/spec.md`

## Summary

Add a "Hardware Info" button to the dashboard header. Clicking it opens a modal displaying comprehensive static hardware details for the currently selected machine (CPU, RAM, disks, OS, GPU, network, motherboard). Data is fetched on-demand via a new `/api/hardware-info` endpoint using the `systeminformation` package already installed in both the backend and agent. The feature requires no new dependencies and follows the existing modal and multi-machine routing patterns.

## Technical Context

**Language/Version**: TypeScript 5.3, Node.js v24 (NVM)
**Primary Dependencies**: `systeminformation` (existing — already installed in backend and agent), React 18, Tailwind CSS v3, lucide-react (existing)
**Storage**: None — hardware info is fetched on-demand, not persisted
**Testing**: None — no test framework configured (per constitution)
**Target Platform**: Linux x86-64 (main server) and Linux ARM (Raspberry Pi agent)
**Project Type**: Web application (Express backend + Vite/React frontend + lightweight remote agent)
**Performance Goals**: Hardware info panel loads within 3 seconds (all `systeminformation` static queries complete in <500ms)
**Constraints**: No new npm dependencies; no additional polling; reuse existing modal pattern
**Scale/Scope**: Single-user personal tool; 2 machines currently monitored

## Constitution Check

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Simplicity First | ✅ PASS | On-demand fetch, no new dependencies, reuses existing patterns (`systeminformation`, modal, multi-machine proxy) |
| II. Real-Time Observability | ✅ PASS | Static hardware data — no polling needed; `Promise.allSettled` used to avoid blocking response on partial failures |
| III. Single-Process Production | ✅ PASS | New endpoint added to existing Express process; no new processes |
| IV. TypeScript Strictness | ✅ PASS | `HardwareInfo` typed interface in `frontend/src/types.ts`; `any` only where wrapping untyped `systeminformation` return, immediately cast |
| V. User-Controlled Persistence | ✅ PASS | No new `localStorage` keys needed; hardware info is transient |

No violations. Proceed.

## Project Structure

### Documentation (this feature)

```text
specs/003-hardware-info/
├── plan.md              ✅ This file
├── research.md          ✅ Phase 0 output
├── data-model.md        ✅ Phase 1 output
├── quickstart.md        ✅ Phase 1 output
├── contracts/
│   └── hardware-api.md  ✅ Phase 1 output
└── tasks.md             (Phase 2 output — /speckit.tasks command)
```

### Source Code Changes

```text
backend/src/index.ts          — add getLocalHardwareInfo() + GET /api/hardware-info + GET /api/machines/:id/hardware-info proxy

agent/src/index.ts            — add getLocalHardwareInfo() + GET /api/hardware-info

frontend/src/types.ts         — add HardwareInfo interface

frontend/src/hooks/
└── useHardwareInfo.ts        — new on-demand fetch hook (fetch on open, clear on close)

frontend/src/components/
└── HardwareInfoModal.tsx     — new modal component (sections: CPU, Memory, Storage, OS, System, GPU, Network)

frontend/src/App.tsx          — add Hardware Info button to header + modal state
```

**Structure Decision**: Web application layout — changes span backend, agent, frontend. No new files beyond the established per-feature hook + modal + type pattern.

## Implementation Details

### Backend: `getLocalHardwareInfo()`

Calls the following `systeminformation` functions in parallel with `Promise.allSettled`:

```
si.cpu()            → brand, manufacturer, speed, cores, physicalCores
si.mem()            → total
si.diskLayout()     → device, name, type, size, vendor, interfaceType
si.osInfo()         → platform, distro, release, arch, kernel, hostname
si.system()         → manufacturer, model, virtual
si.graphics()       → controllers[].vendor, model, vram
si.networkInterfaces() → iface, mac, type, ip4 (filtered: non-internal, non-loopback)
si.baseboard()      → manufacturer, model
```

Graceful handling:
- Each `Promise.allSettled` result checked; failed queries return `null` or `[]`
- `system` and `baseboard` return `null` if query fails
- `gpu` and `network` return `[]` if query fails
- `network` filtered to exclude `iface === 'lo'` and `internal === true`

### New Routes

```
GET /api/hardware-info
  → calls getLocalHardwareInfo()
  → returns HardwareInfo JSON

GET /api/machines/:id/hardware-info
  → if machine.url is null: calls getLocalHardwareInfo()
  → else: proxyFetch(machine.url, '/api/hardware-info')
```

### Agent: Identical to Backend

Same `getLocalHardwareInfo()` function and `GET /api/hardware-info` endpoint. Agent does not have a proxy route (it IS the remote endpoint).

### Frontend: `useHardwareInfo(machineId)`

```typescript
function useHardwareInfo(machineId: string | null) {
  // null machineId = not open, no fetch
  // Fetches GET /api/machines/${machineId}/hardware-info
  // Returns { data: HardwareInfo | null, loading: boolean, error: string | null }
}
```

Fetch triggered when `machineId` becomes non-null (modal opens). Clears on modal close.

### Frontend: `HardwareInfoModal`

Sections (each hidden if data is null/empty):

1. **CPU** — model name, manufacturer, `X cores (Y threads)`, clock speed in GHz
2. **Memory** — total RAM formatted as GB
3. **Storage** — table: device path, model, type, size formatted as GB/TB
4. **Operating System** — distro + release, architecture, kernel, hostname
5. **System** (optional) — manufacturer + model, virtual badge if `virtual: true`
6. **GPU** (optional, hidden if empty) — each controller: vendor + model + VRAM
7. **Network** — each interface: name, type, MAC, IP
8. **Motherboard** (optional) — manufacturer + model

Uses existing `Dialog`/modal pattern from `UpdatesModal` / `LogsModal` (backdrop overlay, centered panel, × close button).

### Frontend: Header Button

Add `<button>` with `<Cpu size={16} />` icon and label "Hardware" to the right side of the dashboard header in `App.tsx`. Clicking sets `showHardwareInfo: true` state. The button appears on all machine tabs.

## File Changes Summary

| File | Action |
|------|--------|
| `backend/src/index.ts` | Add `getLocalHardwareInfo()` + 2 routes |
| `agent/src/index.ts` | Add `getLocalHardwareInfo()` + 1 route |
| `frontend/src/types.ts` | Add `HardwareInfo` interface |
| `frontend/src/hooks/useHardwareInfo.ts` | Create |
| `frontend/src/components/HardwareInfoModal.tsx` | Create |
| `frontend/src/App.tsx` | Add button + modal state + `<HardwareInfoModal>` |

## Verification

1. `cd backend && npm run build` — zero TypeScript errors
2. `cd frontend && npm run build` — zero TypeScript errors
3. `cd agent && npm run build` — zero TypeScript errors
4. Open dashboard → click Hardware Info button → panel opens with CPU/RAM/disk/OS data
5. Switch to Raspberry Pi tab → open panel → shows ARM CPU and RPi OS
6. Stop RPi agent → open panel → shows error state, not blank/broken
7. `systemctl --user restart home-dashboard` — production build works
