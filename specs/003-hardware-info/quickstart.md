# Quickstart: Hardware Info Panel

## Development Setup

```bash
# Terminal 1 — backend
cd backend && npm run dev

# Terminal 2 — frontend
cd frontend && npm run dev
# Open http://localhost:3000
```

## Manual Test Scenarios

### Test 1: Open Hardware Info panel (main machine)

1. Open the dashboard.
2. Locate the **Hardware Info** button in the header (chip/server icon).
3. Click it.
4. **Expected**: A modal opens showing at least:
   - CPU section: model name, physical cores, logical threads, clock speed
   - Memory section: total installed RAM (formatted as GB)
   - Storage section: at least one disk with model and capacity
   - OS section: distro name, version, kernel, architecture
5. Close the modal with the × button or by clicking outside.
6. **Expected**: Modal closes, dashboard is unchanged.

### Test 2: Loading state

1. Throttle the network in DevTools (or add a temporary delay in the backend endpoint).
2. Click the Hardware Info button.
3. **Expected**: A loading spinner/indicator is shown while data is being fetched.

### Test 3: Raspberry Pi hardware info

1. Switch to the **Raspberry Pi** machine tab.
2. Click the Hardware Info button.
3. **Expected**: CPU shows ARM/AArch64 architecture, not the main server's Intel/AMD CPU.
4. **Expected**: OS shows "Raspberry Pi OS" (or Debian), arch shows `aarch64` or `armv7l`.

### Test 4: Missing GPU section

1. Open the Hardware Info panel for a machine with no discrete GPU (e.g., the Raspberry Pi).
2. **Expected**: GPU section is either hidden or shows "Not available" — not an empty broken layout.

### Test 5: Disk layout

1. Open the Hardware Info panel for the main machine.
2. **Expected**: Each physical disk appears once with device path, model name, capacity, and type (SSD/HDD/NVMe).

### Test 6: Remote agent unreachable

1. Stop the agent on the Raspberry Pi (`systemctl --user stop homelab-agent` on the RPi).
2. Switch to the Raspberry Pi tab in the dashboard.
3. Click the Hardware Info button.
4. **Expected**: An error state is shown explaining that hardware info could not be retrieved.

## Production Deploy

```bash
cd backend  && npm run build
cd frontend && npm run build
systemctl --user restart home-dashboard
```
