# Contract: GET /api/containers

**Endpoint**: `GET /api/containers` (local) / `GET /api/machines/:id/containers` (remote)
**Change**: Adds `webUrl` field to each container object in the response array.

## Response Schema (changed fields only)

```json
[
  {
    "id": "abc123...",
    "names": ["portainer"],
    "image": "portainer/portainer-ce",
    "state": "running",
    "status": "Up 3 days",
    "restartCount": 0,
    "cpuPercent": 0.5,
    "memUsed": 52428800,
    "memPercent": 2.1,
    "webUrl": "http://192.168.86.1:9000"
  }
]
```

## webUrl Field Rules

| Container state | Published ports | `dashboard.url` label | `webUrl` value                            |
|-----------------|-----------------|-----------------------|-------------------------------------------|
| running         | yes             | absent                | `http://<req.hostname>:<lowestPort>`      |
| running         | port 443        | absent                | `https://<req.hostname>`                  |
| running         | any             | set                   | label value (verbatim)                    |
| running         | none            | absent                | `null`                                    |
| stopped/paused  | any             | any                   | `null`                                    |

## Backward Compatibility

The `webUrl` field is additive. Existing consumers that ignore unknown fields are unaffected. The frontend `Container` type must be updated to declare `webUrl: string | null`.
