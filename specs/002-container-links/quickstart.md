# Quickstart: Docker Container Hyperlinks

## Development Setup

```bash
# Terminal 1 — backend
cd backend && npm run dev

# Terminal 2 — frontend
cd frontend && npm run dev
# Open http://localhost:3000
```

## Manual Test Scenarios

### Test 1: Auto-detected URL (running container with published port)

1. Ensure at least one Docker container is running with a published port (e.g. Portainer on port 9000).
2. Open the dashboard → scroll to **Docker Containers**.
3. **Expected**: The container name appears as a blue underlined link.
4. Click the link.
5. **Expected**: A new browser tab opens at `http://localhost:9000` (or the machine's hostname).

### Test 2: Stopped container — no link

1. Stop a container: `docker stop <name>`
2. Refresh the dashboard.
3. **Expected**: The container name is plain text with no hover underline.

### Test 3: Container with no published ports — no link

1. Inspect a container that has no port mappings (internal-only containers).
2. **Expected**: Name is plain text.

### Test 4: Custom URL via Docker label

```bash
# Add the label to a running container (requires recreating it)
docker run -d \
  --label dashboard.url=http://192.168.1.10:9000 \
  --name my-app \
  my-image
```

Or in `docker-compose.yml`:

```yaml
services:
  my-app:
    image: my-image
    labels:
      - "dashboard.url=http://192.168.1.10:9000"
```

4. **Expected**: Clicking the container name navigates to `http://192.168.1.10:9000`.

### Test 5: Raspberry Pi containers

1. Switch to the **Raspberry Pi** machine tab.
2. **Expected**: Container name links use `192.168.86.43` as the hostname, not `localhost`.

## Production Deploy

```bash
cd backend  && npm run build
cd frontend && npm run build
systemctl --user restart home-dashboard
```
