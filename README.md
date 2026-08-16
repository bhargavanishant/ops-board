# OpsBoard

A lightweight SRE/incident-management dashboard UI — track active incidents, view service health, and monitor reliability metrics at a glance.

## Why OpsBoard

- **Fast, focused UI** — built on Vite + React 19 for near-instant HMR during development and small, optimized production bundles.
- **Type-safe throughout** — TypeScript across components, pages, and state, catching integration mistakes before runtime.
- **Themeable by design** — a CSS custom-property token system (`src/index.css`) drives light/dark mode and four selectable accent themes (Blue, Green, Violet, Amber) from a single source of truth, no per-component color overrides needed.
- **Composable component library** — small, single-purpose components (`SmallCard`, `MediumCard`, `Dropdown`, `SearchBar`, `Sidebar`) that pages assemble rather than reimplement.
- **Zero backend lock-in** — pages currently run on local/mock state, so the UI layer can be wired to any API without restructuring.

## Project structure

```
src/
├── main.tsx                 # App entry point, router setup, theme bootstrap
├── index.css                # Design tokens: color, spacing, typography, theme variants
├── components/               # Reusable, presentational building blocks
│   ├── header/                # Top app bar with brand mark + global search
│   ├── sidebar/                # Primary navigation (collapsible)
│   ├── dropdown/               # Generic select/filter dropdown
│   ├── search-bar/             # Search input used in header and pages
│   ├── card-parent/            # Shared card container/layout primitive
│   ├── small-card/             # Compact stat tile (used for KPIs)
│   └── medium-card/             # Larger stat/summary card
├── pages/                     # Route-level views
│   ├── login/                   # Auth screen
│   ├── appshell/                 # Shell layout (header + sidebar + outlet)
│   ├── overview/                  # Reliability metrics dashboard
│   ├── incidents/                  # Incident list with status filtering
│   ├── services/                    # Service catalog (in progress)
│   └── settings/                     # Accent theme picker
└── theme/
    └── theme.ts               # Theme ids, persistence (localStorage), and apply logic
```

Each component/page owns its own `.css` file colocated next to its `.tsx` file — styling stays scoped and easy to find.

## Getting started

### Prerequisites

- [Node.js](https://nodejs.org/) 18+ (Vite 8 requires a recent Node LTS)
- npm (or yarn/pnpm, adjusting commands accordingly)

### Install

```bash
npm install
```

### Run the dev server

```bash
npm run dev
```

Vite will start a local server (default `http://localhost:5173`, auto-incrementing if the port is busy) with hot module reload.

### Build for production

```bash
npm run build
```

Type-checks the project (`tsc -b`) and outputs an optimized bundle to `dist/`.

### Preview the production build

```bash
npm run preview
```

### Lint

```bash
npm run lint
```

## Tech stack

- [React 19](https://react.dev/) + [React Router 8](https://reactrouter.com/)
- [TypeScript](https://www.typescriptlang.org/)
- [Vite 8](https://vite.dev/) for dev/build tooling
- [lucide-react](https://lucide.dev/) for icons
- Plain CSS with custom properties for theming (no CSS-in-JS or utility framework dependency)
