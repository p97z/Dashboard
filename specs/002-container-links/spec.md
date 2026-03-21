# Feature Specification: Docker Container Hyperlinks

**Feature Branch**: `002-container-links`
**Created**: 2026-03-21
**Status**: Draft
**Input**: User description: "I want to add a new feature to the docker containers card. The feature is to make the name into a hyperlink that will open the corresponding web page in a new browser tab."

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Click Container Name to Open Web UI (Priority: P1)

The home lab operator is viewing the Docker containers section of the dashboard. They see a running container (e.g. Portainer, Home Assistant, Grafana) and want to open its web interface without having to remember or type the URL. They click the container name and the web page opens instantly in a new browser tab.

**Why this priority**: This is the core interaction — the entire value of the feature. Everything else is secondary to this.

**Independent Test**: Visit the containers table. Click the hyperlinked name of any running container that has a published port. Verify a new tab opens at the correct URL.

**Acceptance Scenarios**:

1. **Given** a running container with at least one published port, **When** the user clicks the container name, **Then** a new browser tab opens at the container's web address.
2. **Given** a container with no published ports, **When** the user views the containers table, **Then** the container name is displayed as plain non-clickable text.
3. **Given** a stopped container, **When** the user views the containers table, **Then** the container name is displayed as plain non-clickable text regardless of port configuration.

---

### User Story 2 — Custom URL via Docker Label (Priority: P2)

Some containers expose multiple ports or use non-standard schemes where the auto-detected URL is wrong. The operator wants to pin a specific URL to a container by setting a Docker label so that clicking the name always goes to the right place.

**Why this priority**: Auto-detection covers most cases; custom overrides prevent frustration when the wrong port or protocol is selected.

**Independent Test**: Set a `dashboard.url` label on a container. Verify clicking the name navigates to the label URL, not the auto-detected one.

**Acceptance Scenarios**:

1. **Given** a container with a `dashboard.url` Docker label, **When** the user clicks the container name, **Then** the browser opens the label's URL in a new tab.
2. **Given** a container with both a published port and a `dashboard.url` label, **When** the user clicks the container name, **Then** the label URL takes precedence over the auto-detected URL.

---

### Edge Cases

- Container has multiple published ports: use the lowest numbered host port as the default URL.
- Container publishes a port on all interfaces (`0.0.0.0`): construct the link using the dashboard's current page hostname.
- Published port is 443: use `https://` scheme; all other ports use `http://`.
- Container has no published ports and no `dashboard.url` label: name is plain text, no link.
- Container is stopped: name is always plain text, no link.
- `dashboard.url` label contains a full URL including scheme: use it exactly as provided.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST display the container name as a clickable hyperlink for any running container that has at least one published port or a `dashboard.url` Docker label.
- **FR-002**: Clicking a container name hyperlink MUST open the target URL in a new browser tab without navigating away from the dashboard.
- **FR-003**: The system MUST auto-detect the container URL from published port bindings, using the lowest host port number when multiple ports are published.
- **FR-004**: The system MUST use `https://` when the auto-detected host port is 443; all other ports MUST use `http://`.
- **FR-005**: The system MUST support a `dashboard.url` Docker label per container; when present, this label URL MUST override the auto-detected URL.
- **FR-006**: Container names that have no resolvable URL MUST be displayed as plain, non-clickable text.
- **FR-007**: Clickable container names MUST be visually distinguishable from non-clickable names (e.g. hover underline or colour change).
- **FR-008**: The feature MUST work on both the main server machine tab and the Raspberry Pi machine tab.

### Key Entities

- **Container**: A Docker container with a name, running state, zero or more published port bindings (host port → container port), and optional Docker labels.
- **Container URL**: The resolved address for the hyperlink, determined in priority order: (1) `dashboard.url` Docker label value, (2) auto-detected from the lowest published host port.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of running containers with published ports or a `dashboard.url` label display their name as a clickable link.
- **SC-002**: 100% of stopped containers and containers with no published ports and no label display plain non-linked names.
- **SC-003**: When a `dashboard.url` label is present, the link navigates to that URL in 100% of cases, regardless of published ports.
- **SC-004**: Clicking a container name link opens a new browser tab within 1 second.
- **SC-005**: The feature works correctly on both the main server and Raspberry Pi machine tabs.

## Assumptions

- The dashboard is accessed from the same network as the Docker host, so the host's address is reachable from the user's browser.
- When a port is bound to `0.0.0.0`, the URL is constructed using the hostname of the page the dashboard is running on (e.g. `nasty.local` or `192.168.86.43`).
- The Docker label key for custom URLs is `dashboard.url` (example value: `http://192.168.1.10:9000`).
- Port 443 implies HTTPS; all other auto-detected ports imply HTTP. Protocol overrides for non-standard ports are handled via the `dashboard.url` label.
- Both the desktop table view and the mobile card view of the containers section must show the hyperlink.

## Out of Scope

- Editing or saving container URLs from within the dashboard UI; URLs are read-only, sourced from Docker labels or port bindings.
- Health-checking or verifying that the container URL is reachable before rendering the link.
- Support for containers running on Docker hosts not already configured as machines in the dashboard.
