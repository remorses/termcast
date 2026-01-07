# Sections, Grouping, and Child Components

How compound components and grouping work in the custom reconciler architecture.

## List Sections

### The Component Hierarchy

```tsx
<List>
  <List.Item title="Orphan Item" />          {/* No section */}
  <List.Section title="Fruits">
    <List.Item title="Apple" />
    <List.Item title="Banana" />
  </List.Section>
  <List.Section title="Vegetables">
    <List.Item title="Carrot" />
  </List.Section>
</List>
```

### ListSectionRenderable

```typescript
interface ListSectionRenderableProps extends RenderableOptions {
  title?: string
  subtitle?: string
}

export class ListSectionRenderable extends Renderable {
  props: ListSectionRenderableProps
  items: ListItemRenderable[] = []
  parentList?: ListRenderable
  
  constructor(ctx: RenderContext, props: ListSectionRenderableProps) {
    super(ctx, props)
    this.props = props
  }
  
  // Called by reconciler when child is added
  add(child: Renderable) {
    super.add(child)
    
    if (child instanceof ListItemRenderable) {
      // Set up parent references
      child.parentSection = this
      child.parentList = this.parentList
      this.items.push(child)
      
      // Notify parent list
      this.parentList?.onSectionItemAdded(this, child)
    }
  }
  
  // Called by reconciler when child is removed
  remove(childId: string) {
    const index = this.items.findIndex(i => i.id === childId)
    if (index !== -1) {
      const item = this.items[index]
      this.items.splice(index, 1)
      this.parentList?.onSectionItemRemoved(this, item)
    }
    super.remove(childId)
  }
  
  // Called when props change
  updateProps(newProps: ListSectionRenderableProps) {
    const oldProps = this.props
    this.props = newProps
    
    // Notify list if title/subtitle changed (affects display)
    if (oldProps.title !== newProps.title || 
        oldProps.subtitle !== newProps.subtitle) {
      this.parentList?.onSectionUpdated(this)
    }
  }
}
```

### How Sections Register with List

```
Reconciler Timeline:
═══════════════════════════════════════════════════════════

1. createInstance('list', props)
   └── ListRenderable created
   
2. createInstance('list-section', {title: "Fruits"})
   └── ListSectionRenderable created
   
3. createInstance('list-item', {title: "Apple"})
   └── ListItemRenderable created
   
4. createInstance('list-item', {title: "Banana"})
   └── ListItemRenderable created
   
5. appendChild(section, appleItem)
   └── section.add(appleItem)
       └── section.items.push(appleItem)
       └── appleItem.parentSection = section
       └── list.onSectionItemAdded(section, appleItem)
           └── list.needsCommit = true
   
6. appendChild(section, bananaItem)
   └── (same as above)
   
7. appendChild(list, section)
   └── list.add(section)
       └── section.parentList = list
       └── list.sections.push(section)
       └── list.needsCommit = true
       └── // NOW section's items get parentList reference
           for (item of section.items) {
             item.parentList = list
           }
   
8. resetAfterCommit()
   └── list.commitPendingChanges()
       └── buildItemList()
       └── refilter()
       └── rebuildDisplay()
```

### The Timing Issue

Notice that when items are added to a section (step 5-6), the section doesn't have a `parentList` yet. The list is added later (step 7).

Solution: When section is added to list, propagate `parentList` to existing items:

```typescript
class ListRenderable extends Renderable {
  add(child: Renderable) {
    super.add(child)
    
    if (child instanceof ListSectionRenderable) {
      child.parentList = this
      this.sections.push(child)
      
      // Propagate to existing items in this section
      for (const item of child.items) {
        item.parentList = this
      }
      
      this.needsCommit = true
    }
  }
}
```

## Flat Entry Model

Sections are rendered as a flat list with headers interspersed:

```typescript
type FlatEntry =
  | { type: 'section-header'; section: SectionData }
  | { type: 'item'; item: ListItemData; isSelected: boolean }

class ListRenderable extends Renderable {
  private flatEntries: FlatEntry[] = []
  private selectableIndexes: number[] = []  // Indexes of items (not headers)
  
  private buildUnfilteredEntries() {
    this.flatEntries = []
    this.selectableIndexes = []
    
    // Orphan items first (items added directly to List, not in sections)
    for (const item of this.orphanItems) {
      this.selectableIndexes.push(this.flatEntries.length)
      this.flatEntries.push({
        type: 'item',
        item: this.extractItemData(item),
        isSelected: false,
      })
    }
    
    // Then sections with headers
    for (const section of this.sections) {
      // Skip empty sections
      if (section.items.length === 0) continue
      
      // Add section header (not selectable)
      this.flatEntries.push({
        type: 'section-header',
        section: {
          id: section.id,
          title: section.props.title,
          subtitle: section.props.subtitle,
          renderable: section,
        },
      })
      
      // Add section items (selectable)
      for (const item of section.items) {
        this.selectableIndexes.push(this.flatEntries.length)
        this.flatEntries.push({
          type: 'item',
          item: this.extractItemData(item, section.id),
          isSelected: false,
        })
      }
    }
  }
}
```

### Selection Navigation

Selection skips headers automatically because we track `selectableIndexes`:

```typescript
private moveSelection(delta: number) {
  // selectableIndexes only contains indexes of items, not headers
  const newIndex = this.selectedIndex + delta
  if (newIndex < 0 || newIndex >= this.selectableIndexes.length) return
  
  this.selectedIndex = newIndex
  
  // Get the actual flatEntries index
  const flatIndex = this.selectableIndexes[this.selectedIndex]
  const entry = this.flatEntries[flatIndex]
  
  // entry is guaranteed to be an item, not a header
  // ...
}
```

## Filtering with Sections

When filtering, sections are preserved but may be reordered by best match:

```typescript
private buildFilteredEntries() {
  // Score all items
  const scored = this.allItems
    .map(item => ({ item, score: this.scoreItem(item) }))
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score)
  
  // Group by section, track best score per section
  const orphanMatches: ListItemData[] = []
  const sectionMatches = new Map<string, {
    section: ListSectionRenderable
    items: ListItemData[]
    bestScore: number
  }>()
  
  for (const { item, score } of scored) {
    if (!item.sectionId) {
      orphanMatches.push(item)
    } else {
      const section = this.sections.find(s => s.id === item.sectionId)!
      const existing = sectionMatches.get(item.sectionId)
      
      if (existing) {
        existing.items.push(item)
        existing.bestScore = Math.max(existing.bestScore, score)
      } else {
        sectionMatches.set(item.sectionId, {
          section,
          items: [item],
          bestScore: score,
        })
      }
    }
  }
  
  // Sort sections by best score (sections with better matches first)
  const sortedSections = [...sectionMatches.values()]
    .sort((a, b) => b.bestScore - a.bestScore)
  
  // Build flat list
  this.flatEntries = []
  this.selectableIndexes = []
  
  // Orphan matches first
  for (const item of orphanMatches) {
    this.selectableIndexes.push(this.flatEntries.length)
    this.flatEntries.push({ type: 'item', item, isSelected: false })
  }
  
  // Then sections (already sorted by relevance)
  for (const { section, items } of sortedSections) {
    this.flatEntries.push({
      type: 'section-header',
      section: {
        id: section.id,
        title: section.props.title,
        subtitle: section.props.subtitle,
        renderable: section,
      },
    })
    
    // Items within section are already sorted by score
    for (const item of items) {
      this.selectableIndexes.push(this.flatEntries.length)
      this.flatEntries.push({ type: 'item', item, isSelected: false })
    }
  }
}
```

## Form Fields

Forms use a similar pattern but with different semantics:

```tsx
<Form>
  <Form.TextField id="name" title="Name" />
  <Form.Dropdown id="category" title="Category">
    <Form.Dropdown.Item value="a" title="Option A" />
    <Form.Dropdown.Item value="b" title="Option B" />
  </Form.Dropdown>
  <Form.Checkbox id="agree" title="I agree" />
</Form>
```

### FormRenderable

```typescript
class FormRenderable extends Renderable {
  private fields: FormFieldRenderable[] = []
  private focusedIndex = 0
  
  add(child: Renderable) {
    super.add(child)
    
    if (child instanceof FormFieldRenderable) {
      child.parentForm = this
      this.fields.push(child)
      this.needsCommit = true
    }
  }
  
  // Tab moves between fields
  private setupKeyboard() {
    this.onKeyboard((evt) => {
      if (evt.name === 'tab') {
        if (evt.shift) {
          this.focusPrevious()
        } else {
          this.focusNext()
        }
      } else if (evt.key === 'return' && evt.meta) {
        this.submit()
      }
    })
  }
  
  private focusNext() {
    const newIndex = (this.focusedIndex + 1) % this.fields.length
    this.setFocusedIndex(newIndex)
  }
  
  private focusPrevious() {
    const newIndex = this.focusedIndex === 0 
      ? this.fields.length - 1 
      : this.focusedIndex - 1
    this.setFocusedIndex(newIndex)
  }
  
  private setFocusedIndex(index: number) {
    const oldField = this.fields[this.focusedIndex]
    const newField = this.fields[index]
    
    oldField?.blur()
    this.focusedIndex = index
    newField?.focus()
    
    this.requestRender()
  }
  
  getValues(): Record<string, any> {
    const values: Record<string, any> = {}
    for (const field of this.fields) {
      values[field.props.id] = field.getValue()
    }
    return values
  }
  
  private submit() {
    const values = this.getValues()
    this.options.onSubmit?.(values)
  }
}
```

### FormFieldRenderable (Base)

```typescript
abstract class FormFieldRenderable extends Renderable {
  props: FormFieldProps
  parentForm?: FormRenderable
  protected isFocused = false
  
  abstract getValue(): any
  abstract setValue(value: any): void
  
  focus() {
    this.isFocused = true
    this.onFocus()
  }
  
  blur() {
    this.isFocused = false
    this.onBlur()
  }
  
  protected onFocus() {
    // Override in subclasses
  }
  
  protected onBlur() {
    // Override in subclasses
  }
}
```

### FormDropdownRenderable

Dropdowns have their own child items:

```typescript
class FormDropdownRenderable extends FormFieldRenderable {
  private items: FormDropdownItemRenderable[] = []
  private selectedValue: string = ''
  private isOpen = false
  
  add(child: Renderable) {
    super.add(child)
    
    if (child instanceof FormDropdownItemRenderable) {
      child.parentDropdown = this
      this.items.push(child)
    }
  }
  
  getValue(): string {
    return this.selectedValue
  }
  
  setValue(value: string) {
    this.selectedValue = value
    this.updateDisplay()
  }
  
  protected onFocus() {
    // Show dropdown options
    this.isOpen = true
    this.rebuildDropdownUI()
  }
  
  protected onBlur() {
    this.isOpen = false
    this.rebuildDropdownUI()
  }
  
  private rebuildDropdownUI() {
    // Build UI showing items, highlight selected
    // Similar to action panel overlay
  }
}
```

## Grid Sections

Grids work similarly to lists but with 2D layout:

```tsx
<Grid columns={4}>
  <Grid.Section title="Recent">
    <Grid.Item title="Item 1" content={<Grid.Item.Content />} />
    <Grid.Item title="Item 2" content={<Grid.Item.Content />} />
  </Grid.Section>
</Grid>
```

### GridRenderable

```typescript
class GridRenderable extends Renderable {
  private columns: number
  private sections: GridSectionRenderable[] = []
  private orphanItems: GridItemRenderable[] = []
  
  // Selection is 2D
  private selectedRow = 0
  private selectedCol = 0
  
  private moveSelection(deltaRow: number, deltaCol: number) {
    // Calculate new position considering grid layout
    const items = this.getVisibleItems()
    const currentIndex = this.selectedRow * this.columns + this.selectedCol
    const newIndex = currentIndex + deltaRow * this.columns + deltaCol
    
    if (newIndex >= 0 && newIndex < items.length) {
      this.selectedRow = Math.floor(newIndex / this.columns)
      this.selectedCol = newIndex % this.columns
      this.updateSelectionDisplay()
    }
  }
  
  private setupKeyboard() {
    this.onKeyboard((evt) => {
      switch (evt.name) {
        case 'up':
          this.moveSelection(-1, 0)
          break
        case 'down':
          this.moveSelection(1, 0)
          break
        case 'left':
          this.moveSelection(0, -1)
          break
        case 'right':
          this.moveSelection(0, 1)
          break
      }
    })
  }
}
```

## Summary

Key patterns for compound components:

1. **Parent stores children array** - `this.items.push(child)` in `add()`
2. **Children get parent reference** - `child.parentList = this`
3. **Timing: propagate on parent add** - When section added to list, set `parentList` on section's items
4. **Flat model for rendering** - Sections become headers in flat array
5. **Selectable indexes separate** - Track which flat indexes are selectable
6. **Filtering preserves structure** - Group by section, sort sections by best score
