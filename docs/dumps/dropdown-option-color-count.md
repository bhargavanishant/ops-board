# Dropdown: per-option color bar, right-aligned value, and a real "reset" row

Design doc for extending [`Dropdown`](../../src/components/dropdown/Dropdown.tsx)
to match the target design: each option gets a colored indicator bar on the
left and a right-aligned count, the `filler` ("Any") becomes a real,
selectable row instead of just placeholder text in the button, and the
currently selected row keeps its tick. No code has been changed yet — this is
the plan to build from.

```
STATUS  Any status  ▾
┌─────────────────────────────┐
│ Any                         │   ← filler, now a real option
│ ▍ Critical               4  │
│ ▍ High                   7  │
│ ▍ Medium                7 ✓ │   ← selected: color bar + count + tick
│ ▍ Low                    6  │
└─────────────────────────────┘
```

## 1. Extend the option shape

`Dropdown` currently types `options` as `any[]` and only reads
`option.label`/`option.value`. Give it a real shape with two new *optional*
fields — optional so existing call sites (`Priority`, `Env`, `Assignee` in
[`Incidents.tsx`](../../src/pages/incidents/Incidents.tsx)) that don't need a
color or count keep working unmodified:

```ts
// Dropdown.tsx
export interface DropdownOption {
  value: string;
  label: string;
  color?: string;  // CSS color (token or hex) for the left indicator bar
  count?: number;   // right-aligned value; omit to hide the column entirely
}
```

## 2. Where `color` and `count` come from

`Dropdown` doesn't know what "Critical" or "Medium" means, and it shouldn't —
no built-in status/severity map lives inside the component or anywhere under
`src/components/dropdown/`. Every option is fully-formed data by the time it
reaches `Dropdown`: **the parent supplies `color` and `count` directly**, the
same way it already supplies `label` and `value`.

```ts
// Incidents.tsx — parent owns the mapping, inline with its own data
const priorityOptions = [
  { value: "critical", label: "Critical", color: "var(--crit)", count: 4 },
  { value: "high", label: "High", color: "#b45309", count: 7 },
  { value: "medium", label: "Medium", color: "#4338ca", count: 7 },
  { value: "low", label: "Low", color: "var(--ink-30)", count: 6 },
];

<Dropdown label="Priority" filler="Any" options={priorityOptions} />
```

If several pages need the same severity→color mapping later, that's a
`pages/incidents/` (or a shared, app-level `src/lib/` — not
`components/dropdown/`) concern to dedupe when it actually duplicates, not
something `Dropdown` pre-empts by owning the palette. Keeping the mapping out
of the component is what makes `color` and `count` genuinely "provided by the
parent": any consumer can wire it to whatever data source it wants — a static
list here, a live aggregation elsewhere — without touching `Dropdown` or
reaching into a shared lookup table it doesn't control.

`count`, in particular, was already meant to be caller-supplied — if a page
needs it derived (e.g. "how many open incidents are Critical"), that
aggregation happens where the incident list already lives:

```ts
// Incidents.tsx
const priorityOptions = ["Critical", "High", "Medium", "Low"].map((label) => ({
  value: label.toLowerCase(),
  label,
  color: PRIORITY_COLOR[label.toLowerCase()], // local to this file
  count: incidents.filter((i) => i.priority === label.toLowerCase()).length,
}));
```

Either way, `Dropdown` stays a dumb renderer: it reads `option.color` /
`option.count` if present and renders them, and reaches into no app data or
shared color table of its own.

## 3. Render the color bar + count in the list item

```tsx
// Dropdown.tsx — inside options.map
<li
  key={option.value ?? index}
  className="dropdown-item"
  role="option"
  aria-selected={index === selectedIndex}
  onClick={() => handleSelection(option, index)}
>
  <span className="dropdown-item-left">
    {option.color && (
      <span className="dropdown-item-swatch" style={{ background: option.color }} />
    )}
    <span>{option.label ?? option}</span>
  </span>
  <span className="dropdown-item-right">
    {option.count !== undefined && (
      <span className="dropdown-item-count">{option.count}</span>
    )}
    {index === selectedIndex && (
      <Check className="dropdown-item-tick" size={15} strokeWidth={2.5} aria-hidden="true" />
    )}
  </span>
</li>
```

```css
/* Dropdown.css */
.dropdown-item-left {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.dropdown-item-swatch {
  width: 3px;
  height: 14px;
  border-radius: 2px;
  flex: none;
}

.dropdown-item-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: none;
}

.dropdown-item-count {
  font-size: 12px;
  color: var(--ink-50);
  font-variant-numeric: tabular-nums;
}
```

`.dropdown-item` is already `display: flex; justify-content: space-between`
(see current [`Dropdown.css`](../../src/components/dropdown/Dropdown.css)), so
`-left`/`-right` just need to be the two flex children — no change to the
outer rule.

## 4. Make `filler` a real, selectable row

Right now `filler` only ever appears as button placeholder text
(`selectedOption` is seeded from it, but there's no matching `<li>`). To match
the screenshot's "Any" row, render it as an unstyled, colorless, count-less
option pinned above the real list, selecting it resets back to the filler
state:

```tsx
{isOpen && (
  <ul className="dropdown-menu" role="listbox" style={{ top: coords.top, left: coords.left }}>
    {filler && (
      <li
        className="dropdown-item dropdown-item-reset"
        role="option"
        aria-selected={selectedIndex === null}
        onClick={() => handleSelection({ label: filler }, null)}
      >
        <span>{filler}</span>
        {selectedIndex === null && (
          <Check className="dropdown-item-tick" size={15} strokeWidth={2.5} aria-hidden="true" />
        )}
      </li>
    )}
    {options.map((option, index) => (/* unchanged from §3 */ null))}
  </ul>
)}
```

`handleSelection`'s `index` param becomes `number | null` to allow the reset
case:

```ts
function handleSelection(option: any, index: number | null) {
  setSelectedOption(option);
  setSelectedIndex(index);
  setIsOpen(false);
}
```

`.dropdown-item-reset` gets a bottom border to visually separate it from the
colored rows, matching the screenshot's divider:

```css
.dropdown-item-reset {
  color: var(--ink-65);
  border-bottom: 1px solid var(--line);
  border-radius: 0;
  margin-bottom: 4px;
  padding-bottom: 10px;
}
```

## 5. Build checklist

1. Add `color`/`count` to the option type (`DropdownOption`), keep both
   optional.
2. In `Incidents.tsx`, add `color`/`count` directly onto each page's own
   `priorityOptions`/`statusOptions` arrays (or a `PRIORITY_COLOR` map local
   to that file) — no shared color utility inside `components/dropdown/`.
3. Split each `<li>` into `.dropdown-item-left` (swatch + label) /
   `.dropdown-item-right` (count + tick); add the swatch/count CSS.
4. Promote `filler` into a real `<li>` pinned above `options.map`; widen
   `selectedIndex` to `number | null`; add `.dropdown-item-reset` styling.
5. Re-check every existing `<Dropdown>` call site (`Status`, `Priority`,
   `Service`, `Env`, `Assignee` in `Incidents.tsx`) still renders correctly
   with no `color`/`count` supplied — the two columns should simply not
   appear, not leave gaps.

## 6. Custom labels via a utility method

> "How can a child have a custom label based on a utility method?"

Right now each `<li>` reads `option.label ?? option` directly — the label is
whatever static string sits on the data. To let a *consumer* of `Dropdown`
compute the label instead of hardcoding it (e.g. formatting, i18n, deriving
text from `option.value`), accept an optional label-resolver prop and run
every option through it:

```tsx
// Dropdown.tsx
type GetOptionLabel = (option: any) => React.ReactNode;

const defaultGetOptionLabel: GetOptionLabel = (option) => option.label ?? option;

export default function Dropdown({
  label,
  filler,
  options,
  getOptionLabel = defaultGetOptionLabel,
}: {
  label?: string;
  filler?: string;
  options: any[];
  getOptionLabel?: GetOptionLabel;
}) {
  // ...
  <span>{getOptionLabel(option)}</span>
  // ...
}
```

The "child" (each option row) never owns label logic itself — it just calls
whatever function it was handed, falling back to `option.label` when the
caller doesn't pass one. A consumer can then plug in a custom utility without
touching `Dropdown` internals:

```tsx
// e.g. title-case a raw status code
<Dropdown
  label="Status"
  filler="Any status"
  options={statusOptions}
  getOptionLabel={(o) => titleCase(o.value)}
/>
```

This is the same shape as passing a formatter/render-prop anywhere else in
React — the component stays a dumb renderer, and label logic (a "utility
method") lives with whoever has the domain knowledge to compute it.
