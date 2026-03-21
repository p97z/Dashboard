# Research: Hardware Info Panel

## Decision 1: Data Source

**Decision**: Use `systeminformation` npm package already installed in both `backend` and `agent`.

**Rationale**: `systeminformation` is already imported and used for CPU load, memory, disk usage, GPU utilization, network stats, and process info. The static hardware queries (`si.cpu()`, `si.diskLayout()`, `si.osInfo()`, `si.system()`, `si.baseboard()`, `si.networkInterfaces()`) are part of the same package and require zero additional dependencies.

**Alternatives considered**:
- Parsing `/proc/cpuinfo` and `/sys/` directly — more work, less portable, already abstracted by `systeminformation`
- A separate hardware-info library (e.g., `cpu-features`) — unnecessary given `systeminformation` already covers everything

---

## Decision 2: Available Hardware Fields

The following `systeminformation` functions and fields will be used:

| Category | Function | Key Fields |
|----------|----------|------------|
| CPU | `si.cpu()` | `brand`, `manufacturer`, `speed` (GHz), `cores` (logical), `physicalCores` |
| Memory | `si.mem()` | `total` (already polled live) |
| Storage | `si.diskLayout()` | `device`, `name` (model), `type` (SSD/HDD), `size`, `vendor`, `interfaceType` |
| OS | `si.osInfo()` | `distro`, `release`, `arch`, `kernel`, `hostname`, `platform` |
| System | `si.system()` | `manufacturer`, `model` (machine/board name), `virtual` |
| GPU | `si.graphics()` | `controllers[].vendor`, `controllers[].model`, `controllers[].vram` |
| Network | `si.networkInterfaces()` | `iface`, `mac`, `type`, `ip4` — filter to non-internal, non-virtual |
| Motherboard | `si.baseboard()` | `manufacturer`, `model` |

**Note**: `si.graphics()` is already imported and called in the backend for live GPU utilisation. The `controllers` sub-array contains static model info.

---

## Decision 3: Fetch Strategy

**Decision**: On-demand fetch when the modal opens. No polling. No caching.

**Rationale**: Hardware specs are static data (CPU model, disk layout, OS version do not change during a session). Polling would waste resources with no benefit. The fetch is fast (all `systeminformation` hardware calls complete in <500ms on typical hardware).

**Alternatives considered**:
- Cache result in memory for the session — adds complexity for negligible gain on a single-user tool
- Include in the main metrics poll — bloats the metrics payload with static data on every tick

---

## Decision 4: API Endpoint Shape

**Decision**: New endpoint `GET /api/hardware-info` (local) with per-machine proxy at `GET /api/machines/:id/hardware-info`.

**Rationale**: Follows the exact same pattern as the existing `/api/metrics` and `/api/info` endpoints. The backend already has `getLocalMetrics()` and `getLocalInfo()` functions that are called directly for local and proxied for remote machines. The hardware info endpoint reuses this established routing pattern.

---

## Decision 5: Modal vs. Slide-Over Panel

**Decision**: Use a modal (overlay dialog) consistent with the existing `UpdatesModal`, `LogsModal`, and `CardConfigModal` patterns already in the codebase.

**Rationale**: The project already has 3+ modals with a consistent open/close pattern (state in parent, `onClose` callback). Reusing this pattern keeps the code consistent and avoids introducing a new UI primitive.

---

## Decision 6: Agent Compatibility

**Decision**: Add the same `getLocalHardwareInfo()` function and `/api/hardware-info` endpoint to `agent/src/index.ts`.

**Rationale**: The agent already uses `systeminformation` for all its metrics. Hardware info queries are a subset of what the package provides. The Raspberry Pi will return ARM-specific data (e.g., `aarch64` architecture, SD card or USB storage) which is exactly the value of per-machine hardware info.

**Note**: `si.diskLayout()` may return limited info on RPi (SD cards often lack model strings). The response should handle empty/null fields gracefully.
