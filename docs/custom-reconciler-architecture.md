# Custom Reconciler Architecture for Termcast

This document outlines an alternative architecture for termcast that uses custom React reconciler renderables instead of the descendants pattern. This approach is inspired by how vicinae implements Raycast API compatibility.

## Overview

The current termcast architecture uses React components with the descendants pattern to track items, handle filtering, and manage keyboard navigation. The proposed architecture introduces a two-layer system:

```
Layer 1: React Components (Declarative)
├── Describes WHAT items exist via JSX
├── No filtering/selection logic
└── Passes item data to renderables

Layer 2: Custom Renderables (Imperative)
├── Filtering, sorting, selection
├── Keyboard navigation
├── Directly manages opentui primitives
└── Controls what actually renders to terminal
```

## Why Change?

### Problems with Descendants Pattern

1. **Complexity**: Items must register/unregister themselves, track indexes, handle edge cases
2. **Filtering requires conditional rendering**: Items render `null` when filtered, triggering React reconciliation
3. **Context drilling**: Search query, selection state passed via context
4. **map.current timing issues**: Cannot access during render, only in effects/handlers
5. **Re-render cascades**: Selection changes can trigger multiple component updates

### Benefits of Custom Renderables

1. **Simpler mental model**: React declares structure, renderables own behavior
2. **No descendants tracking**: Parent receives children directly via reconciler
3. **Filtering is just array operations**: No React reconciliation needed
4. **Keyboard nav is native**: Handled at renderable level, not React hooks
5. **Better performance**: Only rebuild display when truly needed

## Architecture Layers

### Layer 1: React Components

React components become thin wrappers that declare structure:

```tsx
// User writes standard Raycast-compatible JSX
function MyCommand() {
  return (
    <List>
      <List.Section title="Fruits">
        <List.Item title="Apple" keywords={["red", "fruit"]} />
        <List.Item title="Banana" keywords={["yellow", "fruit"]} />
      </List.Section>
    </List>
  )
}
```

These map to custom JSX intrinsic elements:

```tsx
// List component renders intrinsic element
function List({ children, ...props }: ListProps) {
  return <list {...props}>{children}</list>
}

List.Item = function ListItem({ children, ...props }: ListItemProps) {
  return <list-item {...props}>{children}</list-item>
}

List.Section = function ListSection({ children, ...props }: ListSectionProps) {
  return <list-section {...props}>{children}</list-section>
}
```

### Layer 2: Custom Renderables

Renderables are classes that extend opentui's `Renderable` base class:

```typescript
import { Renderable, BoxRenderable, TextRenderable } from '@opentui/core'
import { extend } from '@opentui/react'

class ListRenderable extends Renderable {
  // Internal state
  private items: ListItemData[] = []
  private filteredItems: ListItemData[] = []
  private selectedIndex = 0
  private searchQuery = ''
  
  // Display components (opentui primitives)
  private container: BoxRenderable
  private searchInput: InputRenderable
  private scrollBox: ScrollBoxRenderable
  private itemBoxes: Map<string, BoxRenderable> = new Map()
  
  // ... implementation
}

// Register with opentui
extend({
  'list': ListRenderable,
  'list-item': ListItemRenderable,
  'list-section': ListSectionRenderable,
})
```

## Reconciler Lifecycle

Understanding when reconciler methods are called is critical for this architecture.

### Method Call Order

```
INITIAL RENDER
═══════════════════════════════════════════════════════════

1. createInstance(type, props)
   └── Called for each JSX element, creates Renderable instance
   └── Props are available immediately on the instance

2. appendChild(parent, child)
   └── Called when child is added to parent
   └── Parent can inspect child.props here
   └── This is where parent registers/tracks children

3. finalizeInitialChildren(instance, type, props)
   └── Called after instance's children are appended
   └── Can do final setup before commit

4. resetAfterCommit(container)
   └── Called ONCE after entire tree is mounted
   └── Signal that all children are ready
   └── Trigger commitPendingChanges() here


UPDATE (props change)
═══════════════════════════════════════════════════════════

1. prepareUpdate(instance, type, oldProps, newProps)
   └── Diff props, return update payload or null

2. commitUpdate(instance, type, oldProps, newProps)
   └── Apply prop changes to instance
   └── Instance notifies parent of changes


REORDER / ADD / REMOVE
═══════════════════════════════════════════════════════════

1. removeChild(parent, child)
   └── Parent removes child from tracking

2. appendChild(parent, child) or insertBefore(parent, child, before)
   └── Parent adds/reorders child

3. resetAfterCommit(container)
   └── Rebuild after structural changes
```

### Key Timing Insight

When `appendChild(parent, child)` is called:
- The child instance already exists with all its props
- The child's children may not be added yet
- More siblings may be coming

When `resetAfterCommit()` is called:
- ALL children have been added
- ALL props are finalized
- Safe to build the display tree

## Converting Descendants Pattern

### Before: Descendants Pattern

```tsx
// Parent component
function List({ children, onSelectionChange }) {
  const { DescendantsProvider, useDescendants } = createDescendants()
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  
  // Can't access map.current during render!
  const context = useDescendants()
  
  useKeyboard((evt) => {
    // Must access map.current in handler
    const items = Object.values(context.map.current)
      .filter(item => item.index !== -1)
      .sort((a, b) => a.index - b.index)
    
    if (evt.name === 'down') {
      setSelectedIndex(i => Math.min(i + 1, items.length - 1))
    }
  })
  
  return (
    <DescendantsProvider>
      <SearchContext.Provider value={searchQuery}>
        <SelectionContext.Provider value={selectedIndex}>
          {children}
        </SelectionContext.Provider>
      </SearchContext.Provider>
    </DescendantsProvider>
  )
}

// Child component
function ListItem({ title, keywords }) {
  const searchQuery = useContext(SearchContext)
  const selectedIndex = useContext(SelectionContext)
  const { index } = useDescendant({ title, keywords })
  
  // Filter by returning null - triggers React reconciliation!
  const matches = matchesFilter(title, keywords, searchQuery)
  if (!matches) return null
  
  const isSelected = index === selectedIndex
  
  return (
    <box backgroundColor={isSelected ? 'blue' : 'transparent'}>
      <text>{title}</text>
    </box>
  )
}
```

### After: Custom Renderables

```typescript
// ListRenderable handles everything internally
class ListRenderable extends Renderable {
  private items: ListItemRenderable[] = []
  private filteredItems: ListItemData[] = []
  private selectedIndex = 0
  private searchQuery = ''
  private needsCommit = false
  
  // Called by reconciler when child is added
  add(child: Renderable) {
    super.add(child)
    
    if (child instanceof ListItemRenderable) {
      child.parentList = this
      this.items.push(child)
      this.needsCommit = true
    } else if (child instanceof ListSectionRenderable) {
      child.parentList = this
      // section will register its items with us
      this.needsCommit = true
    }
  }
  
  // Called after all children are added
  commitPendingChanges() {
    if (!this.needsCommit) return
    this.needsCommit = false
    
    this.refilter()
    this.rebuildDisplay()
  }
  
  // Pure array filtering - no React!
  private refilter() {
    if (!this.searchQuery) {
      this.filteredItems = this.items.map(item => ({
        id: item.id,
        title: item.props.title,
        subtitle: item.props.subtitle,
        keywords: item.props.keywords,
        renderable: item,
      }))
      return
    }
    
    this.filteredItems = this.items
      .map(item => ({
        data: { id: item.id, ...item.props, renderable: item },
        score: fuzzyScore(item.props.title, this.searchQuery)
      }))
      .filter(x => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(x => x.data)
    
    this.selectedIndex = Math.min(
      this.selectedIndex,
      Math.max(0, this.filteredItems.length - 1)
    )
  }
  
  // Keyboard handling at renderable level
  private setupKeyboard() {
    this.onKeyboard((evt) => {
      if (evt.name === 'up') this.moveSelection(-1)
      if (evt.name === 'down') this.moveSelection(1)
      if (evt.name === 'return') this.activateSelected()
    })
  }
  
  private moveSelection(delta: number) {
    const newIndex = this.selectedIndex + delta
    if (newIndex < 0 || newIndex >= this.filteredItems.length) return
    
    // Update display directly - no React state!
    this.updateSelectionDisplay(this.selectedIndex, newIndex)
    this.selectedIndex = newIndex
    
    // Scroll to selected
    const item = this.filteredItems[newIndex]
    const box = this.itemBoxes.get(item.id)
    if (box) this.scrollBox.scrollToChild(box)
  }
}

// ListItemRenderable is just a data holder
class ListItemRenderable extends Renderable {
  props: ListItemProps
  parentList?: ListRenderable
  actionPanel?: ActionPanelRenderable
  
  add(child: Renderable) {
    super.add(child)
    if (child instanceof ActionPanelRenderable) {
      this.actionPanel = child
    }
  }
  
  // Called when props change
  updateProps(newProps: ListItemProps) {
    const oldProps = this.props
    this.props = newProps
    this.parentList?.onItemUpdated(this, oldProps, newProps)
  }
}
```

## Key Differences Summary

| Aspect | Descendants | Custom Renderables |
|--------|-------------|-------------------|
| Item tracking | useDescendant hook | parent.add(child) |
| Index management | Automatic via hook | Parent tracks array |
| Filtering | Conditional render (null) | Array.filter() |
| Selection state | React useState | Renderable property |
| Keyboard handling | useKeyboard hook + context | onKeyboard at renderable |
| Props access | Via descendant.props | Direct child.props |
| Timing concerns | map.current in effects only | Always available |
| Re-renders | Many (state changes) | Minimal (explicit rebuild) |

## Critical: Layout Timing

**You cannot read element positions immediately after creating them.**

When you create a BoxRenderable and add it to a scrollbox, its `y` position is NOT set until after Yoga calculates layout during the render pass.

```typescript
// BROKEN - y is 0 or undefined
rebuildDisplay() {
  const itemBox = new BoxRenderable(ctx, {...})
  this.scrollBox.add(itemBox)
  
  // DON'T DO THIS - layout hasn't run yet!
  console.log(itemBox.y)  // undefined or 0
  this.scrollBox.scrollTop = itemBox.y  // won't work
}

// ALSO BROKEN - queueMicrotask doesn't help
rebuildDisplay() {
  const itemBox = new BoxRenderable(ctx, {...})
  this.scrollBox.add(itemBox)
  
  queueMicrotask(() => {
    // Still broken - layout may not have run
    this.scrollBox.scrollTop = itemBox.y
  })
}
```

**Timeline:**
```
1. rebuildDisplay() creates BoxRenderables
2. You try to read itemBox.y  ← FAILS: y is 0
3. requestRender() queues render
4. Yoga calculates layout  ← y values set HERE
5. Terminal draws
```

**Solution: Calculate positions mathematically instead of reading them:**

```typescript
private scrollToSelected() {
  // Calculate position based on structure, not layout values
  let itemRow = 0
  let currentIndex = 0
  
  for (const section of this.filteredSections) {
    if (section.title) itemRow += 2  // header takes 2 rows
    
    for (const item of section.items) {
      if (currentIndex === this.selectedIndex) {
        const viewportHeight = this.scrollBox.viewport?.height || 10
        this.scrollBox.scrollTop = Math.max(0, itemRow - viewportHeight / 2)
        return
      }
      itemRow++
      currentIndex++
    }
  }
}
```

This works because you don't depend on layout values - you calculate expected positions from structure.

## Tree Traversal for Wrapper Components

If items can be wrapped in other React components, `add()` interception alone won't work:

```tsx
// Wrapper component
function ItemWrapper({ children }) {
  return <box>{children}</box>
}

<CustomList>
  <ItemWrapper>
    <CustomList.Item title="Apple" />  {/* add() on List never sees this */}
  </ItemWrapper>
</CustomList>
```

**Solution: Traverse the tree recursively in `commitPendingChanges()`:**

```typescript
commitPendingChanges() {
  this.items = this.collectItems(this)
  this.refilter()
  this.rebuildDisplay()
}

private collectItems(node: Renderable, currentSection?: string): ItemRenderable[] {
  const items: ItemRenderable[] = []
  const children = (node as any)._childrenInLayoutOrder || []
  
  for (const child of children) {
    if (child instanceof SectionRenderable) {
      items.push(...this.collectItems(child, child.sectionTitle))
    } else if (child instanceof ItemRenderable) {
      child.parentList = this
      child.sectionTitle = currentSection
      items.push(child)
    } else {
      // Recurse into wrapper components
      items.push(...this.collectItems(child, currentSection))
    }
  }
  
  return items
}
```

**When to traverse:** Always traverse in `commitPendingChanges()`. It's cheap (just walking the tree) and handles dynamic items added in child components.

## Working Example

See `termcast/src/examples/internal/custom-renderable-list.tsx` for a complete working implementation with:

- `extend()` registration of custom renderables
- Tree traversal for wrapper components
- Section support with headers
- Custom EmptyView
- Filtering with fuzzy scoring
- Keyboard navigation with wrap-around
- Scroll-to-selected using index-based calculation
- 8 vitest tests validating all features

## Next Steps

See the following documents for detailed implementation:

- [List Implementation](./custom-reconciler-list.md) - Full List component
- [Event Handling](./custom-reconciler-events.md) - Actions...
- [Sections and Grouping](./custom-reconciler-sections.md) - List.Section, Form fields
