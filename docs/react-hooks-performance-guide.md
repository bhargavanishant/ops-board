# React hooks & rendering performance — a working playbook

A reference for learning every built-in hook and the rendering/performance
problems React developers run into most, using this codebase
(`AppShell`, `Sidebar`, `Overview`, `SmallCard`) as the running example
instead of throwaway snippets. Read part 1 hook-by-hook, then part 2
pitfall-by-pitfall — part 2 is where the "why does my app feel slow"
answers live.

---

## Part 1 — every hook, what it's actually for, and where it'd show up here

### `useState` — local, synchronous UI state

Already in [`AppShell.tsx`](../src/pages/appshell/AppShell.tsx):

```tsx
const [collapsed, setCollapsed] = useState(false);
```

Rule of thumb: if the value is only ever read/written by one component (and
maybe passed one level down as a prop), it's `useState`. The moment three or
more unrelated components need to read it, that's a signal to lift it into
`useReducer` + context, not to keep threading props.

Pitfall: `setCollapsed(!collapsed)` reads `collapsed` from the render
closure. `setCollapsed((v) => !v)` — the functional form already used in
`AppShell.tsx` — reads the *latest* state instead, which matters the moment
two toggles can fire before a re-render (double-click, or a keyboard repeat).
Always prefer the functional form for updates that depend on the previous
value.

### `useEffect` — synchronizing with something outside React

Correct uses: subscribing to a browser API, writing to `localStorage`,
starting a `fetch`, wiring a WebSocket. Not a correct use: computing a value
from props/state — that's just a variable in the render body (see Part 2,
pitfall 3).

A realistic addition to this app — persist the sidebar's collapsed state
across reloads:

```tsx
useEffect(() => {
  localStorage.setItem("sidebar-collapsed", String(collapsed));
}, [collapsed]);
```

The dependency array is not optional decoration — it's the literal list of
values the effect *reads*. Leave one out and the effect closes over a stale
value from whichever render first ran it. `eslint-plugin-react-hooks`'s
`exhaustive-deps` rule exists specifically to catch this; don't disable it to
silence a warning without understanding why it fired.

### `useLayoutEffect` — like `useEffect`, but before the browser paints

Same signature as `useEffect`, but runs synchronously after DOM mutations
and before the screen updates. Use it only when you must *read* a layout
value (`getBoundingClientRect`, scroll position) and *write* something back
before the user sees a flash of the wrong state.

Where it would matter here: if the sidebar-width drag-to-resize from
[`docs/sidebar-layout-guide.md`](sidebar-layout-guide.md) is implemented,
the resizer's pointer-move handler writing `--sidebar-width` should happen
in a layout effect (or, better, an imperative ref write, see the resizer
example in that doc) — never a plain `useEffect`, which would let a frame
paint at the old width first and visibly stutter.

Default to `useEffect`. Reach for `useLayoutEffect` only when you can
name the flash of wrong content it prevents.

### `useRef` — a mutable box that survives re-renders without causing one

Two distinct jobs, don't conflate them:

1. **DOM handle.** `const navRef = useRef<HTMLElement>(null)` +
   `<nav ref={navRef}>` to imperatively call `.focus()` or read
   `.getBoundingClientRect()`.
2. **Instance variable.** Anything that needs to persist across renders but
   should *not* trigger a re-render when it changes — a `dragging` flag, a
   `previousValue` for comparison, a timer ID.

Example from the sidebar-resizer plan: `const dragging = useRef(false)`
flips on `pointerdown`/`pointerup` without re-rendering the whole shell on
every pixel of drag — that's the entire reason it's a ref and not state.

### `useMemo` — cache an expensive computed value between renders

```tsx
const activeCount = useMemo(
  () => incidents.filter((i) => i.status === "open").length,
  [incidents]
);
```

Only worth it when the computation is actually expensive (filtering/sorting
hundreds+ of rows, building a derived data structure) or when the *identity*
of the result matters (see pitfall 1 — passing a stable array/object to a
memoized child). Wrapping `title.toUpperCase()` in `useMemo` is pure
overhead: the memoization bookkeeping costs more than the work it's saving.

### `useCallback` — cache a function's identity between renders

```tsx
const onToggle = useCallback(() => setCollapsed((v) => !v), []);
```

`AppShell.tsx` currently defines `onToggle` inline:
`onToggle={() => setCollapsed((v) => !v)}`. That's fine today because
`Sidebar` isn't wrapped in `React.memo` — a new function identity every
render doesn't cost anything extra. The moment `Sidebar` *is* wrapped in
`React.memo` (worth doing — see Part 2, pitfall 5), that inline arrow
defeats the memo on every `AppShell` render, and `useCallback` becomes the
fix, not a nice-to-have.

Rule of thumb: `useCallback`/`useMemo` are not "make it fast" — they're
"make this value's *identity* stable so something downstream
(`React.memo`, a `useEffect` dependency, `useMemo` elsewhere) can rely on
it." No memoized/effect-dependent consumer downstream → no reason to reach
for either.

### `useContext` — read a value provided higher in the tree

Not in this codebase yet, but the natural next step once something needs to
be read in three-plus places without prop-drilling — e.g. the current user
or an org-wide feature flag. Sketch:

```tsx
const SidebarCollapsedContext = createContext<{
  collapsed: boolean;
  toggle: () => void;
} | null>(null);

export function useSidebarCollapsed() {
  const ctx = useContext(SidebarCollapsedContext);
  if (!ctx) throw new Error("useSidebarCollapsed must be used inside AppShell");
  return ctx;
}
```

See Part 2, pitfall 4, before reaching for this — context has its own
re-render trap.

### `useReducer` — state transitions with more than one moving part

`useState` gets awkward once a single interaction updates several related
fields together, or the update logic itself has branches worth naming. If
`Overview` grows filters (status, team, date range) that all interact:

```tsx
type FilterState = { status: string; team: string; range: string };
type FilterAction =
  | { type: "set-status"; status: string }
  | { type: "set-team"; team: string }
  | { type: "reset" };

function filterReducer(state: FilterState, action: FilterAction): FilterState {
  switch (action.type) {
    case "set-status": return { ...state, status: action.status };
    case "set-team": return { ...state, team: action.team };
    case "reset": return initialFilterState;
  }
}
```

The tell: if you're calling three `setXxx` functions in a row inside one
event handler, that's an implicit state machine that `useReducer` would make
explicit and testable in isolation (the reducer is a pure function — test it
with no React involved at all).

### `useImperativeHandle` — expose a controlled imperative API from a child

Pairs with `forwardRef`. Rare, and usually a sign to reconsider the design
first — but legitimate for things like "parent needs to call `.focus()` or
`.scrollIntoView()` on a child it doesn't otherwise control." Not something
this app needs yet; mentioned for completeness because it's the one hook
most guides skip.

### `useTransition` — mark a state update as low-priority

```tsx
const [isPending, startTransition] = useTransition();

function onFilterChange(next: string) {
  startTransition(() => setFilter(next));
}
```

Use when a state update triggers expensive re-rendering (e.g. re-filtering a
long incident list) and you don't want it to block the input field from
feeling instant while it happens. React renders the update in the
background and keeps the previous UI interactive (and paintable) until it's
ready; `isPending` lets you show a subtle "updating…" indicator instead of
freezing.

### `useDeferredValue` — the read-side twin of `useTransition`

```tsx
const deferredQuery = useDeferredValue(searchQuery);
const results = useMemo(() => filterIncidents(deferredQuery), [deferredQuery]);
```

Difference from `useTransition`: you don't control the *setter* here (maybe
the value comes from a parent, or a controlled `<input>` you can't wrap).
Instead you defer *reading* it for the expensive part of the tree, so typing
stays responsive even while `filterIncidents` is slow.

### `useId` — stable, SSR-safe unique IDs for accessibility wiring

```tsx
const labelId = useId();
// <label id={labelId}>Team</label>
// <select aria-labelledby={labelId}>
```

Not "a unique key for a list" (that's a data ID, e.g. `item.to` in
[`Sidebar.tsx`](../src/components/sidebar/Sidebar.tsx)) — `useId` is
specifically for `id`/`aria-*` attribute pairs, and guarantees the ID
matches between server and client render so hydration doesn't mismatch.

### `useSyncExternalStore` — subscribe to state that lives outside React

The hook that makes reading `window.matchMedia`, a browser storage event, or
a non-React state library (Zustand, Redux without bindings) render-safe
under concurrent rendering. Example — reacting to the OS light/dark toggle
that `index.css` already keys off of via `prefers-color-scheme`:

```tsx
function subscribe(callback: () => void) {
  const mql = window.matchMedia("(prefers-color-scheme: dark)");
  mql.addEventListener("change", callback);
  return () => mql.removeEventListener("change", callback);
}

function useIsDarkMode() {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia("(prefers-color-scheme: dark)").matches
  );
}
```

You'd reach for this over a `useEffect` + `useState` pair specifically
because it's torn-render-safe — `useEffect`-based subscriptions can show a
stale value for one frame under concurrent features; this hook can't.

### `useDebugValue` — label a custom hook's value in React DevTools

Zero runtime effect on your users; purely a DevTools label for whoever's
debugging your custom hooks later:

```tsx
function useSidebarCollapsed() {
  const ctx = useContext(SidebarCollapsedContext);
  useDebugValue(ctx?.collapsed ? "collapsed" : "expanded");
  return ctx;
}
```

### `use` (React 19) — read a promise or context, conditionally, mid-component

Unlike every other hook, `use` can be called inside conditionals/loops. Its
main job is reading a promise thrown by a Suspense-integrated data source
directly in render:

```tsx
function IncidentDetail({ incidentPromise }: { incidentPromise: Promise<Incident> }) {
  const incident = use(incidentPromise); // suspends until resolved
  return <div>{incident.title}</div>;
}
```

Needs a `<Suspense>` boundary above it in the tree. This is the modern
replacement for the "fetch in `useEffect`, track `loading`/`error`/`data`
state by hand" pattern — see Part 2, pitfall 8.

### `useOptimistic` (React 19) — show the expected result before the server confirms it

```tsx
const [optimisticIncidents, addOptimisticIncident] = useOptimistic(
  incidents,
  (state, newIncident: Incident) => [...state, newIncident]
);
```

Where this fits: an "Acknowledge incident" button on the Incidents page that
flips the row's status instantly, then reconciles with the real server
response (or rolls back on error). Purely a UX tool — the source of truth is
still the server state; this only smooths the gap while a mutation is in
flight.

### `useActionState` (React 19) — form submission state without hand-rolled booleans

```tsx
const [state, formAction, isPending] = useActionState(submitIncidentNote, null);
// <form action={formAction}>
```

Replaces the usual `useState` trio (`pending`, `error`, `result`) around a
form submit handler with one hook wired straight to a `<form action>`.

### Custom hooks — the actual scaling mechanism

Every hook above composes. The moment `AppShell`'s collapse logic needs to
be reused (say, a mobile drawer variant), extract it:

```tsx
// use-sidebar-collapsed.ts
export function useSidebarCollapsed(defaultValue = false) {
  const [collapsed, setCollapsed] = useState(defaultValue);

  useEffect(() => {
    const saved = localStorage.getItem("sidebar-collapsed");
    if (saved !== null) setCollapsed(saved === "true");
  }, []);

  const toggle = useCallback(() => {
    setCollapsed((v) => {
      localStorage.setItem("sidebar-collapsed", String(!v));
      return !v;
    });
  }, []);

  return { collapsed, toggle };
}
```

A custom hook is just a function that calls other hooks — naming it
`useXxx` is what lets the Rules of Hooks linter track it and what tells the
next reader "this has state/effects inside, don't call it conditionally."

---

## Part 2 — the rendering/performance issues that actually bite

First, the one-sentence mental model everything below hangs off of:
**a component re-renders when its own state changes, or when its parent
re-renders — props changing is not what triggers it, a parent render is.**
Whether the re-render does expensive work is a separate question from
whether it happens at all. Most "performance problems" are really "too many
components re-rendering," not "one component being slow."

### 1. Inline objects/arrays/functions defeat `React.memo`

```tsx
// Every AppShell render creates a *new* style object and a *new* function.
// If Sidebar were React.memo'd, this alone forces it to re-render anyway.
<Sidebar
  collapsed={collapsed}
  onToggle={() => setCollapsed((v) => !v)}
  style={{ padding: 8 }}
/>
```

`React.memo` does a shallow prop comparison (`Object.is` per prop). A new
object/array/function literal is never `Object.is`-equal to the previous
one, even with identical contents. Fix: `useCallback` for functions,
`useMemo` for objects/arrays, or — often simpler — move the literal outside
the component entirely if it never needs to change (e.g. the
`{ viewBox: "0 0 24 24", ... }` `base` object in
[`icons.tsx`](../src/components/sidebar/icons.tsx) is already defined at
module scope for exactly this reason: it's created once, not once per
render).

### 2. Missing/wrong `useEffect` dependencies → stale closures

```tsx
useEffect(() => {
  const id = setInterval(() => {
    console.log(collapsed); // always logs the *first* render's value
  }, 1000);
  return () => clearInterval(id);
}, []); // collapsed used inside, not listed
```

The closure captures `collapsed` from whichever render created it; an empty
array means that's the initial `false`, forever. Two fixes depending on
intent: add `collapsed` to the deps (interval resets each toggle), or use
the functional/ref form if you want the interval to persist but always see
fresh state (`useRef` mirroring the latest value). Never fix this by adding
the value to the effect body's closure without also declaring it — that's
treating the linter warning as noise instead of a real bug report.

### 3. Using `useEffect` to compute derived state

```tsx
// Unnecessary — and causes an extra render every time.
const [activeCount, setActiveCount] = useState(0);
useEffect(() => {
  setActiveCount(incidents.filter((i) => i.status === "open").length);
}, [incidents]);
```

```tsx
// Just compute it. No extra state, no extra render, no effect to get wrong.
const activeCount = incidents.filter((i) => i.status === "open").length;
// or, if the list is large enough to matter: useMemo(..., [incidents])
```

If a value can be computed from existing props/state during render, it
should be a plain variable (or `useMemo` if the computation is expensive) —
never a second `useState` synced via effect. That pattern is directly called
out in the React docs as an anti-pattern ("You Might Not Need an Effect")
because it produces a render with stale data followed immediately by a
second render with correct data — a visible flicker for free.

### 4. Context re-renders every consumer on every value change

```tsx
<AppStateContext.Provider value={{ user, theme, sidebarCollapsed, incidents }}>
```

Any consumer of `AppStateContext` re-renders when *any* field in that object
changes — toggling the sidebar re-renders every component reading `user` or
`incidents` too, because the provider passes a new object identity every
render regardless of which field actually changed.

Fixes, in order of preference:
- Split into multiple contexts by change-frequency (`SidebarContext`,
  `UserContext`) so a toggle only re-renders sidebar consumers.
- Memoize the provider value with `useMemo` keyed on its actual inputs, so
  at least identity stays stable when nothing changed.
- For high-frequency values (scroll position, drag state), don't use
  context at all — a ref + imperative DOM update (as in the resizer
  example) sidesteps React's render cycle entirely.

### 5. Un-memoized "leaf" components re-render on unrelated sibling changes

Right now every `SmallCard` in `overview-status`
([`Overview.tsx`](../src/pages/overview/Overview.tsx)) re-renders whenever
`Overview` re-renders — fine at 6 cards, not fine if this page grows filters
and re-renders on every keystroke. The fix is `React.memo` on the leaf,
*plus* making sure its props are stable (pitfall 1) — memoizing a component
that receives a fresh inline object every render buys nothing:

```tsx
// SmallCard.tsx
export default React.memo(function SmallCard({ title, children, value }: Props) {
  ...
});
```

Rule of thumb for when it's worth it: components rendered in a list/loop, or
sitting next to something that changes often (a live-updating counter, a
search box) while they themselves don't depend on that changing value.
Wrapping *everything* in `React.memo` "just in case" adds a comparison cost
to every render for no benefit on components that only ever render once per
real prop change anyway.

### 6. Unstable list keys (index-as-key) losing component state

```tsx
{navItems.map((item, i) => <li key={i}>...</li>)}   // fragile
{navItems.map((item) => <li key={item.to}>...</li>)} // Sidebar.tsx already does this
```

`Sidebar.tsx` already keys on `item.to` — the stable route path — which is
correct. Index keys break the moment the list can reorder, filter, or have
items inserted/removed from the middle: React matches old-index to
new-index, not old-item to new-item, so a component's internal state
(focus, an open `<details>`, an in-progress text input) can end up attached
to the *wrong* row after a reorder. Rule: key by a stable ID from the data,
never by array position, unless the list is provably static and
append-only.

### 7. Expensive render-time work with no memoization

```tsx
function IncidentList({ incidents }: { incidents: Incident[] }) {
  const sorted = [...incidents].sort((a, b) => b.severity - a.severity); // every render
  return <ul>{sorted.map(...)}</ul>;
}
```

At 20 incidents this is free. At 5,000, re-sorting on every render — including
renders triggered by something unrelated, like the sidebar collapsing — is
wasted work. `useMemo(() => [...incidents].sort(...), [incidents])` fixes
the redundant work; if the list is also long enough that *rendering* all the
DOM nodes is the bottleneck (not just the sort), memoization doesn't help —
that needs virtualization (`react-window` / `@tanstack/react-virtual`):
render only the ~20 rows currently in the scroll viewport instead of all
5,000 DOM nodes at once.

### 8. Data fetching in `useEffect` without cleanup → race conditions

```tsx
useEffect(() => {
  fetch(`/api/incidents/${id}`)
    .then((r) => r.json())
    .then(setIncident); // fires even if `id` changed and this response is stale
}, [id]);
```

If `id` changes quickly (fast navigation between incident detail pages), the
first request can resolve *after* the second one, overwriting fresh data
with stale data. Fix with a cancellation flag:

```tsx
useEffect(() => {
  let cancelled = false;
  fetch(`/api/incidents/${id}`)
    .then((r) => r.json())
    .then((data) => { if (!cancelled) setIncident(data); });
  return () => { cancelled = true; };
}, [id]);
```

At any real scale, prefer a data-fetching library (TanStack Query, SWR) or
React 19's `use()` + Suspense over hand-rolling this — request
dedup/caching/race-handling is exactly the kind of thing worth not
reimplementing per component.

### 9. StrictMode's double-invoke isn't a bug you're seeing

In development, React 18/19 `StrictMode` intentionally mounts, unmounts, and
remounts every component once (and double-invokes render functions, state
initializers, and effects) to surface effects that aren't properly
cleaned up. If `console.log`s in an effect appear twice locally, that's
StrictMode working as intended, not a real double-fetch in production — but
it *is* a strong signal your effect cleanup is missing something if a
subscription/timer visibly duplicates. Don't "fix" this with a ref guard
that skips the second invocation — that hides the exact bug StrictMode is
designed to catch.

### 10. Layout thrashing — interleaved DOM reads and writes

```tsx
els.forEach((el) => {
  el.style.height = `${el.scrollHeight}px`; // write
  console.log(el.offsetTop);                 // read — forces a synchronous layout recalc
});
```

Reading a layout property (`offsetTop`, `getBoundingClientRect`,
`scrollHeight`) right after a write forces the browser to synchronously
recompute layout instead of batching it — do this in a loop and it's one
forced reflow per iteration. Fix: batch all reads first, then all writes.
This is also the underlying reason `useLayoutEffect` exists as a distinct
hook from `useEffect` — it's the correct place to do a read-then-write
layout measurement synchronously, once, before paint, instead of scattering
reads and writes across a component tree's render + effect phases.

---

## Diagnosing instead of guessing

- **React DevTools → Profiler tab.** Record an interaction (toggle the
  sidebar, type in a filter), see exactly which components re-rendered and
  why (it names the changed prop/state/context). Don't optimize
  what you haven't profiled — the components you'd guess are slow rarely
  match what the profiler shows.
- **`<Profiler id="..." onRender={...}>`** — same data, programmatically, if
  you want to assert render counts in a test.
- **`why-did-you-render`** — patches React to console.log exactly which prop
  broke a `React.memo`'s shallow comparison, i.e. pitfall 1's actual proof.
- **`eslint-plugin-react-hooks`** (`exhaustive-deps` rule) — catches pitfall
  2 and 3 at write-time instead of at "why is this stale in production."
- **Chrome DevTools → Performance tab → look for purple "Recalculate Style"
  / "Layout" blocks stacked back-to-back** — the signature of pitfall 10.

## Scaling checklist for this app specifically

1. **Route-level code splitting.** `Incidents`/`Services`/`Settings` are
   currently eager-imported in [`main.tsx`](../src/main.tsx). Once they grow
   real content, switch to `React.lazy(() => import("./pages/incidents/Incidents"))`
   + a `<Suspense>` fallback around the `<Route>` tree, so visiting
   `/overview` doesn't ship the other three pages' JS.
2. **Virtualize before you need to.** The first list that can grow past a
   couple hundred rows (an incidents table, an audit log) should go straight
   to `@tanstack/react-virtual` rather than "we'll add it when it's slow" —
   retrofitting virtualization onto a component with per-row state is more
   work than starting with it.
3. **One data-fetching library, not per-component `useEffect`s.** TanStack
   Query (or React 19's `use()` + Suspense) gets you caching, dedup, and
   race-condition safety (pitfall 8) for free across every page that fetches
   incident/service data.
4. **Keep frequently-changing state out of broad context.** If a global
   `AppStateContext` gets introduced, keep `sidebarCollapsed` (changes on
   every click) out of it — see pitfall 4 — or the whole app tree re-renders
   on every sidebar toggle.
5. **Memoize leaf components once lists get data-driven.** `SmallCard` and
   any future `IncidentRow`/`ServiceRow` are exactly the shape (rendered in
   a loop, cheap individually, numerous collectively) where `React.memo`
   pays for itself — see pitfall 5.

## Practice exercises against this repo

1. Add a text filter above `overview-status` in `Overview.tsx` that filters
   `SmallCard`s by title. Implement it three ways and profile each:
   naive (`useState` + filter inline in render), memoized
   (`useMemo` keyed on `[incidents, query]`), and deferred
   (`useDeferredValue(query)`). At 6 cards you won't see a difference — the
   point is learning to *measure* that, not assume it.
2. Wrap `SmallCard` in `React.memo`, then deliberately break it by passing
   an inline `style={{}}` object from `Overview.tsx`. Watch it re-render
   anyway in the Profiler. Fix by hoisting the object or removing it — that's
   pitfall 1, self-inflicted and then fixed.
3. Extract `AppShell`'s collapse state into the `useSidebarCollapsed` custom
   hook sketched above, persisting to `localStorage` via `useEffect`. Then
   break the dependency array on purpose (`[]` instead of `[collapsed]`)
   and observe the stale-write bug — that's pitfall 2, reproduced instead of
   just read about.
