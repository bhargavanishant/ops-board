# Login → App Shell navigation: keeping `AppShell` off the URL

Strategy for wiring a successful login to land inside the app shell, without
`AppShell` ever being a directly addressable route. Builds on the layout-route
pattern from [`sidebar-layout-guide.md`](sidebar-layout-guide.md) §1 — read
that first if the "pathless layout route" idea is new.

## 1. The rule

`AppShell` must never get a `path` prop, and nothing should ever call
`navigate("/appshell")`. There is no `/appshell` URL — full stop. The shell
only ever appears on screen as a side effect of the router matching one of
**its children's** paths (`/incidents`, `/dashboard`, `/services`, …).

```tsx
<Route element={<AppShell />}>          {/* no path prop — this is the whole trick */}
  <Route path="/incidents" element={<Incidents />} />
</Route>
```

If `AppShell` ever gets a `path`, or a `<Route path="/appshell" .../>` gets
added anywhere, that invariant is broken — someone could type it into the
address bar and land on a bare shell with nothing in the `<Outlet />`. Treat
adding a path to that route as a bug, not a feature.

## 2. What "navigate to the app shell" actually means

Since the shell has no path of its own, "send the user to the app shell"
really means **navigate to whichever child route is the default landing
page**. The router renders `AppShell` automatically as the parent of that
match — you never target the shell directly, you target a page inside it.

## 3. The bug this repo has today

[`Login.tsx:42`](../src/pages/login/Login.tsx#L42) navigates to `"/"` on
successful sign-in:

```tsx
if (email === VALID_EMAIL && password === VALID_PASSWORD) {
  navigate("/", { replace: true });   // ❌
  return;
}
```

But [`main.tsx:13`](../src/main.tsx#L13) maps `/` straight back to `/login`:

```tsx
<Route path="/" element={<Navigate to="/login" replace />} />
```

Net effect: a correct email/password currently redirects the user right back
to the login page. It never reaches `AppShell` at all — the loop just isn't
visible because it lands on the same screen.

## 4. The fix: navigate to a real child route

Point `navigate()` at one of `AppShell`'s actual children — today that's
`/incidents`, the only one wired into `main.tsx`:

```tsx
// Login.tsx
if (email === VALID_EMAIL && password === VALID_PASSWORD) {
  navigate("/incidents", { replace: true });
  return;
}
```

`replace: true` is already correct here and worth keeping — it drops
`/login` from history so the back button doesn't return to the sign-in form
after a successful session starts.

## 5. Don't hardcode the destination in two places

`/incidents` will stop being "the" default page the moment a real dashboard
lands (per §7 of the layout guide, `/dashboard` is the intended long-term
home). Hardcoding the string in `Login.tsx` means remembering to update it
there too. Centralize it once:

```ts
// src/routes.ts
export const DEFAULT_AUTHENTICATED_ROUTE = "/incidents";
```

```tsx
// Login.tsx
import { DEFAULT_AUTHENTICATED_ROUTE } from "../../routes";
...
navigate(DEFAULT_AUTHENTICATED_ROUTE, { replace: true });
```

Anything else that needs "where does a signed-in user belong" (a redirect
after session restore, a logout-then-back-in flow, a 404 fallback) imports
the same constant instead of repeating the string.

## 6. Route table stays minimal — resist adding a shell route

```tsx
<Routes>
  <Route path="/" element={<Navigate to="/login" replace />} />
  <Route path="/login" element={<Login />} />

  <Route element={<AppShell />}>                 {/* pathless — never a URL */}
    <Route path="/incidents" element={<Incidents />} />
  </Route>
</Routes>
```

No index/default route is added under `AppShell` either — there's no URL
that matches "just the parent" for a pathless route, so there's nothing to
default. Every entry into the shell is explicit: a real child path.

## 7. Two unrelated bugs noticed in `AppShell.tsx` while reviewing this

Not part of the navigation strategy, but worth a separate fix — flagging so
they don't get mistaken for intentional:

- [`AppShell.tsx`](../src/pages/appshell/AppShell.tsx) renders `<Sidebar />`
  twice (once outside `.app-shell`, once inside).
- `<Header />` and the first `<Sidebar />` are rendered *outside* the
  `.app-shell` grid container, which breaks the two-column CSS grid defined
  in the layout guide (§3) — grid columns only apply to direct children of
  `.app-shell`.

## 8. Out of scope here, flagged for later: unauthenticated deep-links

Fixing the navigate target closes the login → shell loop, but nothing today
stops a signed-out user from typing `/incidents` directly into the address
bar — there's no session token or route guard, since `Login.tsx` doesn't
persist anything on success. That's a separate piece of work (a protected
route wrapper checking auth state before rendering `AppShell`'s children) —
worth doing before this ships, but a different strategy doc from "keep
`AppShell` off the URL."

## Checklist

1. Change `Login.tsx`'s success branch to `navigate("/incidents", { replace: true })`
   (or the centralized constant from §5).
2. Do **not** add a `path` to the `AppShell` route, and don't add a
   `/appshell` route anywhere.
3. Fix the duplicate `<Sidebar />` / mis-placed `<Header />` in
   `AppShell.tsx` (§7).
4. When `/dashboard` replaces `/incidents` as the real landing page, update
   only the one constant from §5.
5. Separately: add a route guard before this goes live (§8).
