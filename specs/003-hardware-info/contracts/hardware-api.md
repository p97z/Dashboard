# Contract: GET /api/hardware-info

**Endpoint**: `GET /api/hardware-info` (local) / `GET /api/machines/:id/hardware-info` (remote)
**Purpose**: Returns a one-time snapshot of static hardware information for the specified machine.

## Response Schema

```json
{
  "cpu": {
    "brand": "Intel(R) Core(TM) i7-12700K CPU @ 3.60GHz",
    "manufacturer": "Intel",
    "speed": 3.6,
    "cores": 20,
    "physicalCores": 12
  },
  "memory": {
    "total": 34359738368
  },
  "disks": [
    {
      "device": "/dev/sda",
      "name": "Samsung SSD 870 EVO 1TB",
      "type": "SSD",
      "size": 1000204886016,
      "vendor": "Samsung",
      "interfaceType": "SATA"
    }
  ],
  "os": {
    "platform": "linux",
    "distro": "Ubuntu",
    "release": "22.04.3 LTS",
    "arch": "x64",
    "kernel": "5.15.0-91-generic",
    "hostname": "main-server"
  },
  "system": {
    "manufacturer": "ASUS",
    "model": "ProArt Z690-Creator WiFi",
    "virtual": false
  },
  "gpu": [
    {
      "vendor": "NVIDIA",
      "model": "NVIDIA GeForce RTX 3080",
      "vram": 10240
    }
  ],
  "network": [
    {
      "iface": "eth0",
      "mac": "00:1A:2B:3C:4D:5E",
      "type": "wired",
      "ip4": "192.168.1.10"
    }
  ],
  "baseboard": {
    "manufacturer": "ASUSTeK COMPUTER INC.",
    "model": "ProArt Z690-Creator WiFi"
  }
}
```

## Field Rules

| Field | When null/empty | Behaviour |
|-------|-----------------|-----------|
| `system` | Virtual machine or unavailable | `null` |
| `baseboard` | Unavailable (common on VMs/RPi) | `null` |
| `gpu` | No discrete GPU | Empty array `[]` |
| `disks` | No physical drives detected | Empty array `[]` |
| `disk.name` | SD card or unidentified | Empty string `""` |
| `disk.vendor` | Unknown | Empty string `""` |
| `network` | All interfaces internal | Empty array `[]` (filtered: only non-internal, non-loopback) |
| `gpu[].vram` | Unknown | `null` |

## HTTP Status Codes

| Status | Condition |
|--------|-----------|
| 200 | Success — full or partial data returned |
| 503 | Machine unreachable (proxy timeout or agent down) |
| 500 | Unexpected error on local machine |

## Notes

- The endpoint always returns 200 with partial data if some queries succeed — never fails the entire response due to one unavailable field.
- `network` is filtered to exclude loopback (`lo`) and virtual interfaces to keep the list relevant.
- All `size`/`total` values are raw bytes — the frontend formats them as human-readable strings.
- The response is not cached; every request triggers a fresh query to `systeminformation`.
