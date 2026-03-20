<!--
SYNC IMPACT REPORT
==================
Version change: N/A → 1.0.0 (initial ratification)
Added sections: Core Principles (I–V), Technology Stack, Development Workflow, Governance
Modified principles: N/A (initial)
Removed sections: N/A (initial)
Templates requiring updates:
  ✅ .specify/templates/plan-template.md — Constitution Check gates align with principles below
  ✅ .specify/templates/spec-template.md — No structural changes needed; requirements format compatible
  ✅ .specify/templates/tasks-template.md — Web app path conventions already match project structure
Deferred TODOs: None
-->

# Home Lab Dashboard Constitution

## Core Principles

### I. Simplicity First

This is a personal home lab tool, not an enterprise product. Every design decision MUST
favor the simplest solution that meets the requirement. Complexity MUST be explicitly
justified — if a simpler approach exists, it MUST be taken.

- No authentication, multi-tenancy, or user management unless explicitly requested
- No premature abstractions: three similar lines of code is better than a forced utility
- No feature flags, backwards-compatibility shims, or over-engineered configurability
- Dependencies MUST earn their place; prefer native platform APIs over third-party libs
  when the capability gap is small

### II. Real-Time Observability Is the Core Value

The dashboard's primary job is to display accurate, live system state. Data integrity and
freshness MUST never be sacrificed for cosmetic concerns.

- Backend metric collection MUST use `Promise.allSettled` so one failing source never
  blocks the entire metrics response
- API endpoints MUST return partial data with degraded indicators rather than erroring out
- Polling intervals MUST be kept short enough to feel live (≤5s for metrics, ≤10s for
  containers) without hammering the host
- All time-series history MUST be held in memory only; no persistence of metric history
  to disk

### III. Single-Process Production Deployment

The production build MUST be a single Node.js process that serves both the API and the
compiled frontend static files. No reverse proxy, no separate web server, no containers
required to run the dashboard itself.

- `backend/dist/index.js` MUST serve `frontend/dist/` via `express.static`
- The service MUST be runnable with a single `node dist/index.js` command
- Port MUST be configurable via `PORT` environment variable with a sensible default (3001)
- The systemd user service (`~/.config/systemd/user/home-dashboard.service`) is the
  canonical way to autostart; no other init systems need to be supported

### IV. TypeScript Strictness

Both frontend and backend MUST use TypeScript with strict compilation. Type safety is a
first-class concern that prevents runtime surprises in an always-on monitoring tool.

- `noUnusedLocals: true` and `strict: true` MUST be maintained in both `tsconfig.json`
  files
- Shared data shapes (API response types) MUST be defined in `frontend/src/types.ts`
  and kept in sync with backend output manually — no codegen needed at this scale
- `any` types are prohibited except when wrapping untyped third-party library calls, and
  MUST be immediately cast to a typed interface

### V. User-Controlled Persistence

Dashboard layout and user preferences MUST persist automatically across sessions using
`localStorage`. No server-side storage of preferences.

- Layout config key: `dashboard-layout-v1`
- Alert thresholds key: `alert-thresholds-v1`
- Theme preference key: `theme`
- Breaking changes to stored schemas MUST increment the key version suffix (e.g., `v1`
  → `v2`) to avoid silent data corruption on upgrade

## Technology Stack

**Frontend**: React 18, TypeScript, Vite, Tailwind CSS v3 (`darkMode: 'class'`),
Radix UI primitives, recharts (AreaChart), lucide-react icons.

**Backend**: Node.js (NVM-managed), Express, TypeScript, `systeminformation`,
`dockerode`.

**Build**: `tsc && vite build` (frontend), `tsc` (backend). Outputs to
`frontend/dist/` and `backend/dist/` respectively.

**Runtime**: Node.js via NVM at `/home/junk/.nvm/versions/node/v24.14.0/bin/node`.
The `start.sh` wrapper exports this path explicitly for the systemd service.

**No test framework is currently configured.** Tests are out of scope for this
personal tool unless explicitly requested.

## Development Workflow

- **Dev mode**: Run backend (`npm run dev` in `backend/`) and frontend Vite dev server
  (`npm run dev` in `frontend/`) separately. Frontend proxies `/api/*` to backend on
  port 3001.
- **Production mode**: Build both projects, then `systemctl --user restart
  home-dashboard` to pick up changes. The single backend process serves everything.
- **Vite cache**: Clear `frontend/node_modules/.vite/` if Tailwind dark-mode or config
  changes are not reflecting in the browser.
- **Commits**: Push to `git@github.com:p97z/Dashboard.git` on `main` branch.
- New features SHOULD follow the `/speckit.specify` → `/speckit.plan` →
  `/speckit.tasks` → `/speckit.implement` flow for any non-trivial change.

## Governance

This constitution supersedes all other informal agreements about project direction.
Amendments require updating this file, incrementing the version, and noting the change
in the Sync Impact Report header comment.

- **MAJOR** bump: removal or redefinition of a core principle.
- **MINOR** bump: new principle or section added.
- **PATCH** bump: clarifications, wording, or typo fixes.

All implementation plans MUST include a Constitution Check section verifying compliance
with Principles I–V before work begins.

**Version**: 1.0.0 | **Ratified**: 2026-03-20 | **Last Amended**: 2026-03-20
