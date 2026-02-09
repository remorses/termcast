---
title: Debugging and Fixing UI Flash Issues
description: |
  How to identify, reproduce, and fix visual flashes in termcast's
  React/opentui TUI components. Covers the useEffect vs useLayoutEffect
  distinction, flushSync pitfalls, and the descendants pattern interaction.
prompt: |
  Created after fixing search selection flash in List component.
  Read termcast/src/components/list.tsx (setInternalSearchText, the
  useLayoutEffect for selection sync, and the useEffect→useLayoutEffect
  conversions). Also read termcast/src/descendants.tsx for how the
  descendants pattern registers items in useLayoutEffect and why
  map.current is only available after layout effects run.
  See commit d836403 for the full diff.
---

# Debugging and Fixing UI Flash Issues

## What is a flash

A "flash" is a single painted frame where the UI shows stale or
inconsistent state before correcting itself on the next frame. Common
symptoms:

- Selection marker (›) disappears for one frame during search
- Detail panel shows the previous item's content briefly after navigating
- Dropdown label shows old value before snapping to the new one
- Footer renders in the wrong position then jumps

## Root cause: useEffect vs useLayoutEffect

```
useEffect    → runs AFTER paint (browser/terminal draws, THEN effect runs)
useLayoutEffect → runs BEFORE paint (effect runs, THEN terminal draws)
```

Any `useEffect` that calls `setState` for **visible UI state** causes two
painted frames: one with the old state, one with the new. If the effect
drives something the user sees (selected index, detail content, dialog
open state), it must be `useLayoutEffect`.

### When to use which

| Situation | Use |
|-----------|-----|
| Updating visible UI (selection, detail panel, dialog) | `useLayoutEffect` |
| Side effects / callbacks (`onSelectionChange`) | `useEffect` |
| Logging, analytics, non-visual bookkeeping | `useEffect` |

## The flushSync trap

`flushSync` forces a **synchronous render + commit**. If you call
`flushSync(() => setA(x))` then `setB(y)` afterward, there are two
separate paints:

```
flushSync(() => setA(x))  // → render → commit → PAINT (stale B)
setB(y)                   // → render → commit → PAINT (correct)
```

Between them, the terminal draws a frame where A is updated but B is
stale.

### Fix: replace flushSync with useLayoutEffect

Instead of using flushSync to force descendants to register so you can
read `map.current` in the same event handler, let React handle the
sequencing:

```tsx
// BAD: two separate paints
const setSearchText = (value: string) => {
  flushSync(() => setSearchTextRaw(value))
  const items = readDescendantsMap()
  setSelectedIndex(items[0].index) // second paint
}

// GOOD: single paint via useLayoutEffect
const [searchText, setSearchText] = useState('')

const prevRef = useRef(searchText)
useLayoutEffect(() => {
  if (prevRef.current === searchText) return
  prevRef.current = searchText

  const items = Object.values(descendantsContext.map.current)
    .filter((item) => item.index !== -1 && item.props?.visible !== false)
    .sort((a, b) => a.index - b.index)

  if (items.length > 0 && items[0]) {
    setSelectedIndex(items[0].index)
  }
})
```

The useLayoutEffect runs after children's layout effects (descendants are
registered in map.current) but before paint. Calling `setSelectedIndex`
inside useLayoutEffect triggers a synchronous re-render that also
completes before paint. Result: zero intermediate frames.

## Interaction with the descendants pattern

The descendants system (src/descendants.tsx) works like this every render
cycle:

```
1. DescendantsProvider.render() calls reset() → clears map + counter
2. Each child's useLayoutEffect calls getIndexForId() → populates map
3. Provider's useLayoutEffect calls updateSnapshot()
4. Parent's useLayoutEffect runs → map.current is now populated
```

Key point: **map.current is only reliable inside useLayoutEffect or event
handlers**, never during render (it's cleared by reset() at the start of
each render).

React layout effect ordering guarantees that children's effects fire
before parent's effects. So a useLayoutEffect in the List component can
safely read map.current — all items have already registered.

## Controlled vs uncontrolled searchText

The List component supports both:

- **Uncontrolled**: List manages its own `internalSearchText` state
- **Controlled**: Parent passes `searchText` prop + `onSearchTextChange`

The selection sync useLayoutEffect must work for both. It watches the
derived `searchText` value (which is `controlledSearchText ?? internalSearchText`),
so it fires regardless of which mode is active.

Before this fix, controlled mode had NO selection sync at all — the
`selectedIndex` was never reset when filtering changed, causing the
selection marker to disappear entirely.

## How to reproduce flash issues in tests

1. Create/use a `.vitest.tsx` e2e test with tuistory
2. Navigate to a non-default item (press down several times)
3. Type search text that filters the list
4. Capture immediately with `session.text()` (no `waitFor`)
5. Assert the selection marker is on the correct item

Single-frame flashes may not always be catchable in e2e tests (both
renders happen within the same JS frame). For persistent bugs (like
the controlled searchText case where selection is never reset), the
test will reliably fail.

See `src/examples/list-controlled-search.vitest.tsx` for a concrete
example.

## Checklist for fixing flash bugs

1. Identify the `useEffect` that updates visible state
2. Convert it to `useLayoutEffect`
3. If it depends on descendants map, ensure it runs after children's
   layout effects (parent useLayoutEffect naturally does)
4. If using `flushSync` + separate `setState`, replace with a single
   useLayoutEffect that reads map.current and sets state
5. Write a test: navigate to non-default state, trigger the change,
   capture immediately, assert consistency
6. Run existing tests to check for snapshot changes — snapshot diffs
   where footer/content shifts by one line are typically positive
   (eliminated an intermediate flash frame)
