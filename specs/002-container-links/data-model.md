# Data Model: Docker Container Hyperlinks

## Updated Entity: Container

The `Container` interface in `frontend/src/types.ts` gains one new field:

```
Container {
  id:           string          // Docker container ID
  names:        string[]        // Container names (leading slash stripped)
  image:        string          // Image name
  state:        string          // 'running' | 'exited' | 'paused' | ...
  status:       string          // Human-readable status string
  restartCount: number          // Total restart count from inspect
  cpuPercent:   number | null   // CPU usage % (null if stopped)
  memUsed:      number | null   // Memory used in bytes (null if stopped)
  memPercent:   number | null   // Memory usage % (null if stopped)
  webUrl:       string | null   // NEW: resolved clickable URL, or null
}
```

## URL Derivation Logic

Computed on the backend/agent at request time. Never stored.

```
function getContainerWebUrl(requestHostname, containerInfo):
  if containerInfo.State != 'running':
    return null

  labelUrl = containerInfo.Labels['dashboard.url']
  if labelUrl exists:
    return labelUrl                          // label always wins

  tcpPorts = containerInfo.Ports
    .filter(p => p.Type == 'tcp' AND p.PublicPort > 0)
    .sortAscending(p => p.PublicPort)

  if tcpPorts is empty:
    return null

  port = tcpPorts[0].PublicPort
  host = requestHostname                    // from req.hostname

  if port == 443:
    return 'https://' + host               // omit default HTTPS port
  else:
    return 'http://' + host + ':' + port
```

## Docker Label Contract

| Label key       | Example value                    | Effect                                          |
|-----------------|----------------------------------|-------------------------------------------------|
| `dashboard.url` | `http://192.168.1.10:9000`       | Overrides auto-detected URL for this container  |
| `dashboard.url` | `https://grafana.internal`       | Full custom URL including scheme and path       |

- Label value is used exactly as provided — no normalisation or validation.
- If the label value is an empty string, it is treated as absent (fall through to port detection).
