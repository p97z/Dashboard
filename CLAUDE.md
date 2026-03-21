# dashboard Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-03-21

## Active Technologies
- TypeScript 5.3, React 18, Node.js v24 (NVM) + dockerode (existing — already reads container port bindings) (002-container-links)
- None — URLs are derived at request time from Docker state (002-container-links)
- TypeScript 5.3, Node.js v24 (NVM) + `systeminformation` (existing — already installed in backend and agent), React 18, Tailwind CSS v3, lucide-react (existing) (003-hardware-info)
- None — hardware info is fetched on-demand, not persisted (003-hardware-info)

- TypeScript 5.3, React 18, Node.js v24 (NVM) + recharts (existing — donut gauges), @dnd-kit/core + @dnd-kit/sortable (new — drag and drop), Tailwind CSS v3, lucide-react (001-dashboard-customization)

## Project Structure

```text
src/
tests/
```

## Commands

npm test && npm run lint

## Code Style

TypeScript 5.3, React 18, Node.js v24 (NVM): Follow standard conventions

## Recent Changes
- 003-hardware-info: Added TypeScript 5.3, Node.js v24 (NVM) + `systeminformation` (existing — already installed in backend and agent), React 18, Tailwind CSS v3, lucide-react (existing)
- 002-container-links: Added TypeScript 5.3, React 18, Node.js v24 (NVM) + dockerode (existing — already reads container port bindings)

- 001-dashboard-customization: Added TypeScript 5.3, React 18, Node.js v24 (NVM) + recharts (existing — donut gauges), @dnd-kit/core + @dnd-kit/sortable (new — drag and drop), Tailwind CSS v3, lucide-react

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
