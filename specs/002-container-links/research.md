# Research: Docker Container Hyperlinks

## Decision 1: URL Source Priority

**Decision**: Two-source priority — `dashboard.url` Docker label overrides auto-detected port URL.

**Rationale**: Labels are explicit and deterministic; port-based auto-detection is a useful default but wrong when containers expose multiple ports or non-HTTP services. Label override gives the operator full control without modifying dashboard code.

**Alternatives considered**:
- Port-only auto-detection: simple but wrong for multi-port containers (e.g. Portainer exposes 9000 and 8000).
- UI-based URL config stored in localStorage: more complex, breaks on container rename; label approach keeps config close to the container definition.

---

## Decision 2: Auto-Detection Strategy

**Decision**: Use the **lowest published host TCP port** from the container's port bindings.

**Rationale**: Most containers expose a single web port; when multiple ports exist the primary UI port is typically the lowest numbered one (e.g. Portainer 9000, Home Assistant 8123). The `dashboard.url` label handles edge cases.

**Alternatives considered**:
- Highest port: no clear convention.
- User picks port from a list: adds UI complexity not justified for a home lab tool.
- Use container image metadata: unreliable; not standardised.

---

## Decision 3: Hostname in Constructed URL

**Decision**: Use `req.hostname` from the incoming HTTP request on the backend/agent to populate the hostname in the constructed URL.

**Rationale**: Express's `req.hostname` returns exactly the hostname the browser used to reach the backend. For local containers it will be `localhost` or the machine's LAN hostname. For the Raspberry Pi (nasty), the proxy forwards requests to `http://192.168.86.43:3002`, so the agent sees `req.hostname = '192.168.86.43'` — the correct routable address from the browser's perspective.

**Alternatives considered**:
- `os.hostname()`: returns the system hostname (e.g. `junk`, `nasty`) which may not be DNS-resolvable from the browser.
- Frontend constructs URL from raw port data: requires the frontend to know the machine's hostname separately, adding coupling.
- Return port data only and let the frontend use `window.location.hostname`: works for local but breaks for remote machines (frontend would use its own hostname, not the RPi's).

---

## Decision 4: HTTP vs HTTPS Scheme

**Decision**: Port 443 → `https://` with no port suffix; all other ports → `http://` with explicit port suffix.

**Rationale**: Port 443 is the HTTPS default; omitting it produces cleaner URLs. All other ports are non-standard for HTTPS, so HTTP is the safe default. Custom scheme overrides are handled via the `dashboard.url` label.

**Alternatives considered**:
- Heuristic list of HTTPS ports (8443, 9443, etc.): too speculative; label covers this case.

---

## Decision 5: Stopped Containers

**Decision**: `webUrl` is always `null` for stopped containers, regardless of port configuration or labels.

**Rationale**: A stopped container's web service is not running; linking to it would result in a browser error. Plain text is the correct UX for a non-reachable service.
