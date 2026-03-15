# Home Lab Dashboard

A real-time home lab monitoring dashboard with system metrics and Docker container management.

## Features

- **System Metrics**: CPU usage, CPU temperature, memory usage, disk usage
- **Network Monitoring**: Per-interface TX/RX rates
- **Docker Management**: View all containers, start/stop with one click
- **Auto-refresh**: Metrics update every 3s, containers every 5s
- **Dark theme**: Clean, professional dark UI

## Requirements

- Node.js 18+
- Docker (optional, for container management)

## Setup

### Install dependencies

```bash
npm run install:all
```

Or manually:

```bash
cd backend && npm install
cd ../frontend && npm install
```

### Run development servers

In two separate terminals:

```bash
# Terminal 1 - Backend (port 3001)
cd backend && npm run dev

# Terminal 2 - Frontend (port 3000)
cd frontend && npm run dev
```

Open http://localhost:3000 in your browser.

## Project Structure

```
dashboard/
├── backend/
│   ├── src/
│   │   └── index.ts        # Express API server
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── App.tsx
│   │   ├── types.ts
│   │   └── utils.ts
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
└── package.json
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/metrics | System metrics (CPU, memory, disk, network) |
| GET | /api/containers | List all Docker containers |
| POST | /api/containers/:id/start | Start a container |
| POST | /api/containers/:id/stop | Stop a container |

## Notes

- CPU temperature may show N/A on systems without thermal sensors (e.g., VMs)
- Docker endpoints require access to `/var/run/docker.sock`
- The frontend proxies `/api/*` requests to the backend at port 3001
