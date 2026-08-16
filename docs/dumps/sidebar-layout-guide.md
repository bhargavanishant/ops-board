# Dashboard shell: sidebar navigation + resizable width

Guide for turning the dashboard into an app shell — a persistent sidebar that
holds all navigation, with a content area next to it — where the sidebar's
width can be dragged wider/narrower and remembers the user's choice.

This is a plan to implement against the current stack: React 19,
`react-router` 8 (already wired in [`src/main.tsx`](../src/main.tsx)), and the
plain-CSS token system in [`src/index.css`](../src/index.css) (no CSS
framework). No code has been changed yet — this is the design doc to build
from.

## 1. Why a layout route, not a component wrapped per-page

Right now `main.tsx` maps `/dashboard` straight to `<Dashboard />`. If a
sidebar gets built into `Dashboard.tsx` itself, every new page
(`/incidents`, `/services`, `/settings`, …) has to re-import and re-render
it, and React remounts the whole shell — sidebar included — on every
navigation between those pages.

`react-router` solves this with **layout routes**: a parent route renders the
shell once and an `<Outlet />` swaps only the inner page. The sidebar and its
state (width, scroll position, open/closed groups) survive navigation.

```
<Routes>
  <Route path="/" element={<Navigate to="/login" replace />} />
  <Route path="/login" element={<Login />} />

  <Route element={<AppShell />}>          {/* layout route, no path */}
    <Route path="/dashboard" element={<Dashboard />} />
    <Route path="/incidents" element={<Incidents />} />
    <Route path="/services" element={<Services />} />
  </Route>
</Routes>
```

`AppShell` renders the sidebar + `<Outlet />` and nothing else needs to know
the shell exists.

## 2. File layout to create

```
src/
  layouts/
    AppShell.tsx
    AppShell.css
  components/
    sidebar/
      Sidebar.tsx
      Sidebar.css
      SidebarResizer.tsx      # the drag handle
      nav-items.ts            # the list of links shown in the sidebar
  pages/
    dashboard/
      Dashboard.tsx            # unchanged in shape — just renders inside <Outlet/>
```

Keep `Sidebar` and `AppShell` as separate components: `AppShell` owns layout
(grid columns, the resize state), `Sidebar` only renders nav content. That
split is what lets the resizer live in the shell instead of being duplicated
per page.

## 3. The shell layout: CSS Grid + a CSS variable for width

Use a two-column grid on `AppShell`, and drive the sidebar's column width
from a CSS custom property instead of a fixed class. That's what makes "drag
to resize" cheap: the resizer only ever needs to update one variable, not
restructure the DOM.

```css
/* AppShell.css */
.app-shell {
  --sidebar-width: 260px; /* JS updates this inline on drag */
  display: grid;
  grid-template-columns: var(--sidebar-width) 1fr;
  min-height: 100svh;
}

.app-shell-main {
  overflow: auto;
  background: var(--bg);
}
```

```tsx
// AppShell.tsx
import { Outlet } from "react-router";
import Sidebar from "../components/sidebar/Sidebar";
import "./AppShell.css";

export default function AppShell() {
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="app-shell-main">
        <Outlet />
      </main>
    </div>
  );
}
```

## 4. Sidebar content: one source of truth for nav items

Don't hardcode `<NavLink>` elements inline in JSX for every section — define
the nav items as data, so adding a page later is a one-line change instead of
touching layout markup.

```ts
// nav-items.ts
export interface NavItem {
  label: string;
  to: string;
  icon?: string; // key into an icon map, or inline SVG component
}

export const navItems: NavItem[] = [
  { label: "Dashboard", to: "/dashboard" },
  { label: "Incidents", to: "/incidents" },
  { label: "Services", to: "/services" },
  { label: "Settings", to: "/settings" },
];
```

```tsx
// Sidebar.tsx
import { NavLink } from "react-router";
import { navItems } from "./nav-items";
import "./Sidebar.css";

export default function Sidebar() {
  return (
    <nav className="sidebar" aria-label="Primary">
      <div className="sidebar-brand">OpsBoard</div>
      <ul className="sidebar-nav">
        {navItems.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              className={({ isActive }) => (isActive ? "active" : undefined)}
            >
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
```

`NavLink`'s `isActive` gives you the current-page highlight for free — no
manual `useLocation` comparison needed.

## 5. Making the width resizable

The resizer is a thin vertical strip between sidebar and content. On
pointer-down it starts tracking `pointermove`; on move it computes the new
width from the cursor's X position and writes it straight to the CSS
variable via a ref (not React state) so dragging doesn't re-render the whole
tree on every pixel.

```tsx
// SidebarResizer.tsx
import { useRef } from "react";

const MIN_WIDTH = 200;
const MAX_WIDTH = 420;
const STORAGE_KEY = "sidebar-width";

export default function SidebarResizer({ shellRef }: { shellRef: React.RefObject<HTMLElement> }) {
  const dragging = useRef(false);

  function onPointerDown(e: React.PointerEvent) {
    dragging.current = true;
    (e.target as Element).setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!dragging.current || !shellRef.current) return;
    const shellLeft = shellRef.current.getBoundingClientRect().left;
    const next = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, e.clientX - shellLeft));
    shellRef.current.style.setProperty("--sidebar-width", `${next}px`);
  }

  function onPointerUp() {
    if (!dragging.current || !shellRef.current) return;
    dragging.current = false;
    const width = getComputedStyle(shellRef.current).getPropertyValue("--sidebar-width");
    localStorage.setItem(STORAGE_KEY, width.trim());
  }

  return (
    <div
      className="sidebar-resizer"
      role="separator"
      aria-orientation="vertical"
      aria-label="Resize sidebar"
      tabIndex={0}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    />
  );
}
```

In `AppShell`, read the stored width back on mount so the layout persists
across reloads:

```tsx
const shellRef = useRef<HTMLDivElement>(null);

useEffect(() => {
  const saved = localStorage.getItem("sidebar-width");
  if (saved) shellRef.current?.style.setProperty("--sidebar-width", saved);
}, []);
```

Add the resizer as a sibling of `Sidebar` inside `.app-shell`, and give it a
third (thin, fixed) grid column, or absolutely position it at the sidebar's
right edge — either works; the fixed-column approach is simpler to keep
aligned:

```css
.app-shell {
  --sidebar-width: 260px;
  display: grid;
  grid-template-columns: var(--sidebar-width) 6px 1fr;
}

.sidebar-resizer {
  cursor: col-resize;
  background: transparent;
}
.sidebar-resizer:hover,
.sidebar-resizer:focus-visible {
  background: var(--line);
}
```

### Keyboard support

Since the resizer has `role="separator"` and is focusable, wire arrow keys to
nudge the width in fixed steps — this is what makes it accessible, not just
mouse-draggable:

```tsx
function onKeyDown(e: React.KeyboardEvent) {
  if (!shellRef.current) return;
  const current = parseInt(getComputedStyle(shellRef.current).getPropertyValue("--sidebar-width"));
  if (e.key === "ArrowLeft") shellRef.current.style.setProperty("--sidebar-width", `${Math.max(MIN_WIDTH, current - 16)}px`);
  if (e.key === "ArrowRight") shellRef.current.style.setProperty("--sidebar-width", `${Math.min(MAX_WIDTH, current + 16)}px`);
}
```

## 6. Tokens to add to `index.css`

The sidebar is chrome, not a one-off page — its colors belong with the rest
of the token system, not in `Sidebar.css`:

```css
:root {
  --sidebar-width-default: 260px;
  --sidebar-width-min: 200px;
  --sidebar-width-max: 420px;
}
```

Everything else the sidebar needs (background, border, active-link color)
should reuse the existing tokens (`--surface`, `--line`, `--accent`,
`--ink-75`, `--font-head`) rather than introducing sidebar-specific color
tokens — that's what keeps it visually consistent with the login page.

## 7. Wire it into `main.tsx`

```tsx
<Routes>
  <Route path="/" element={<Navigate to="/login" replace />} />
  <Route path="/login" element={<Login />} />

  <Route element={<AppShell />}>
    <Route path="/dashboard" element={<Dashboard />} />
  </Route>
</Routes>
```

Adding a new authenticated page later is just another `<Route>` inside the
`AppShell` block, plus one entry in `nav-items.ts`.

## 8. Responsive behavior

At narrow widths, dragging doesn't make sense — collapse to an off-canvas
drawer instead:

```css
@media (max-width: 720px) {
  .app-shell { grid-template-columns: 1fr; }
  .sidebar { position: fixed; inset: 0 auto 0 0; transform: translateX(-100%); }
  .sidebar.open { transform: translateX(0); }
  .sidebar-resizer { display: none; }
}
```

That needs a small bit of open/close state in `AppShell` and a toggle button
in the content area's header — out of scope for this guide's core ask, but
flagged here since it's the natural next step once the resizable desktop
layout works.

## 9. Build order / checklist

1. Create `AppShell.tsx` + `AppShell.css` with the two-column grid and a
   hardcoded `--sidebar-width`.
2. Create `Sidebar.tsx` rendering `nav-items.ts` via `NavLink`.
3. Wrap `/dashboard` in the `AppShell` layout route in `main.tsx`; confirm
   the sidebar persists and the active link highlights correctly.
4. Add `SidebarResizer.tsx`; confirm dragging updates the CSS variable live
   and clamps at `MIN_WIDTH`/`MAX_WIDTH`.
5. Persist width to `localStorage` on pointer-up; read it back on mount.
6. Add keyboard resize on the separator (`ArrowLeft`/`ArrowRight`).
7. Add the sidebar tokens to `index.css`; replace any hardcoded colors in
   `Sidebar.css` with them.
8. Add the narrow-viewport collapse behavior (optional, see §8).
9. Add the remaining nav destinations as new layout-child routes as they're
   built.
