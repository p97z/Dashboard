# Data Model: Hardware Info Panel

## Entities

### HardwareInfo (API response root)

The complete hardware report for one machine, returned by `GET /api/hardware-info`.

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| `cpu` | `CpuInfo` | no | Processor details |
| `memory` | `MemoryInfo` | no | Installed RAM |
| `disks` | `DiskInfo[]` | no | Physical storage devices (may be empty array) |
| `os` | `OsInfo` | no | Operating system details |
| `system` | `SystemInfo \| null` | yes | Machine/board model (null if unavailable) |
| `gpu` | `GpuInfo[]` | no | GPU controllers (empty array if none/unavailable) |
| `network` | `NetworkInfo[]` | no | Network interfaces (filtered to non-internal) |
| `baseboard` | `BaseboardInfo \| null` | yes | Motherboard details (null if unavailable) |

---

### CpuInfo

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| `brand` | `string` | no | Full CPU name (e.g., "Intel Core i7-12700K") |
| `manufacturer` | `string` | no | CPU vendor (e.g., "Intel", "AMD", "ARM") |
| `speed` | `number` | no | Base clock speed in GHz |
| `cores` | `number` | no | Logical core / thread count |
| `physicalCores` | `number` | no | Physical core count |

---

### MemoryInfo

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| `total` | `number` | no | Total installed RAM in bytes |

---

### DiskInfo

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| `device` | `string` | no | Device path (e.g., "/dev/sda") |
| `name` | `string` | no | Model name (may be empty string on SD cards) |
| `type` | `string` | no | Drive type: "SSD", "HDD", "NVMe", "SD", "Unknown" |
| `size` | `number` | no | Total capacity in bytes |
| `vendor` | `string` | no | Manufacturer (may be empty) |
| `interfaceType` | `string` | no | Interface: "SATA", "NVMe", "USB", "SD", etc. |

---

### OsInfo

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| `platform` | `string` | no | Platform: "linux", "win32", "darwin" |
| `distro` | `string` | no | Distro name (e.g., "Ubuntu", "Raspberry Pi OS") |
| `release` | `string` | no | OS version string |
| `arch` | `string` | no | Architecture: "x64", "aarch64", "arm" |
| `kernel` | `string` | no | Kernel version string |
| `hostname` | `string` | no | Machine hostname |

---

### SystemInfo

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| `manufacturer` | `string` | no | System/board manufacturer |
| `model` | `string` | no | System/board model name |
| `virtual` | `boolean` | no | True if running in a virtual machine |

---

### GpuInfo

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| `vendor` | `string` | no | GPU vendor (e.g., "NVIDIA", "AMD", "Intel") |
| `model` | `string` | no | GPU model name |
| `vram` | `number \| null` | yes | VRAM in MB (null if unknown) |

---

### NetworkInfo

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| `iface` | `string` | no | Interface name (e.g., "eth0", "wlan0") |
| `mac` | `string` | no | MAC address |
| `type` | `string` | no | Connection type: "wired", "wireless", "virtual" |
| `ip4` | `string` | no | IPv4 address (empty string if unassigned) |

---

### BaseboardInfo

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| `manufacturer` | `string` | no | Motherboard manufacturer |
| `model` | `string` | no | Motherboard model |

---

## TypeScript Interface (shared shape in `frontend/src/types.ts`)

```typescript
export interface HardwareInfo {
  cpu: {
    brand: string;
    manufacturer: string;
    speed: number;
    cores: number;
    physicalCores: number;
  };
  memory: {
    total: number;
  };
  disks: Array<{
    device: string;
    name: string;
    type: string;
    size: number;
    vendor: string;
    interfaceType: string;
  }>;
  os: {
    platform: string;
    distro: string;
    release: string;
    arch: string;
    kernel: string;
    hostname: string;
  };
  system: {
    manufacturer: string;
    model: string;
    virtual: boolean;
  } | null;
  gpu: Array<{
    vendor: string;
    model: string;
    vram: number | null;
  }>;
  network: Array<{
    iface: string;
    mac: string;
    type: string;
    ip4: string;
  }>;
  baseboard: {
    manufacturer: string;
    model: string;
  } | null;
}
```
