# List Component Implementation

Full implementation guide for the List component using custom renderables.

## Component Hierarchy

```
<List>                          → ListRenderable
  <List.Section>                → ListSectionRenderable
    <List.Item>                 → ListItemRenderable
      <List.Item.Detail>        → ListItemDetailRenderable
      <ActionPanel>             → ActionPanelRenderable
        <ActionPanel.Section>   → ActionPanelSectionRenderable
        <Action>                → ActionRenderable
```

## JSX Intrinsic Elements

First, declare the custom JSX elements:

```typescript
// types/jsx.d.ts
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'list': ListRenderableProps
      'list-item': ListItemRenderableProps
      'list-section': ListSectionRenderableProps
      'list-item-detail': ListItemDetailRenderableProps
      'action-panel': ActionPanelRenderableProps
      'action-panel-section': ActionPanelSectionRenderableProps
      'action': ActionRenderableProps
    }
  }
}
```

## React Components (Thin Wrappers)

```tsx
// components/list.tsx
import type { ReactNode } from 'react'

interface ListProps {
  children?: ReactNode
  isLoading?: boolean
  filtering?: boolean
  searchBarPlaceholder?: string
  onSearchTextChange?: (text: string) => void
  onSelectionChange?: (id: string | null) => void
}

interface ListType {
  (props: ListProps): any
  Item: typeof ListItem
  Section: typeof ListSection
}

export const List: ListType = (props) => {
  return (
    <list
      isLoading={props.isLoading}
      filtering={props.filtering}
      searchBarPlaceholder={props.searchBarPlaceholder}
      onSearchTextChange={props.onSearchTextChange}
      onSelectionChange={props.onSelectionChange}
    >
      {props.children}
    </list>
  )
}

interface ListItemProps {
  id?: string
  title: string
  subtitle?: string
  icon?: ImageLike
  keywords?: string[]
  accessories?: ListItemAccessory[]
  detail?: ReactNode
  actions?: ReactNode
}

function ListItem(props: ListItemProps) {
  return (
    <list-item
      id={props.id}
      title={props.title}
      subtitle={props.subtitle}
      icon={props.icon}
      keywords={props.keywords}
      accessories={props.accessories}
    >
      {props.detail}
      {props.actions}
    </list-item>
  )
}

interface ListSectionProps {
  title?: string
  subtitle?: string
  children?: ReactNode
}

function ListSection(props: ListSectionProps) {
  return (
    <list-section title={props.title} subtitle={props.subtitle}>
      {props.children}
    </list-section>
  )
}

List.Item = ListItem
List.Section = ListSection
```

## ListRenderable (Full Implementation)

```typescript
// renderables/list-renderable.ts
import {
  Renderable,
  BoxRenderable,
  TextRenderable,
  InputRenderable,
  ScrollBoxRenderable,
  type RenderContext,
  type RenderableOptions,
} from '@opentui/core'

interface ListItemData {
  id: string
  title: string
  subtitle?: string
  icon?: ImageLike
  keywords?: string[]
  accessories?: ListItemAccessory[]
  renderable: ListItemRenderable
  sectionId?: string
}

interface SectionData {
  id: string
  title?: string
  subtitle?: string
  renderable: ListSectionRenderable
}

type FlatEntry =
  | { type: 'section-header'; section: SectionData }
  | { type: 'item'; item: ListItemData; isSelected: boolean }

interface ListRenderableOptions extends RenderableOptions {
  isLoading?: boolean
  filtering?: boolean
  searchBarPlaceholder?: string
  onSearchTextChange?: (text: string) => void
  onSelectionChange?: (id: string | null) => void
}

export class ListRenderable extends Renderable {
  // Configuration
  private filtering: boolean
  private onSearchTextChange?: (text: string) => void
  private onSelectionChange?: (id: string | null) => void
  
  // Data model
  private sections: ListSectionRenderable[] = []
  private orphanItems: ListItemRenderable[] = []
  private allItems: ListItemData[] = []
  private flatEntries: FlatEntry[] = []
  private selectableIndexes: number[] = []  // indexes into flatEntries that are items
  
  // State
  private selectedIndex = 0  // index into selectableIndexes
  private searchQuery = ''
  private needsCommit = false
  private isShowingDetail = false
  private isShowingActionPanel = false
  
  // Display components
  private container: BoxRenderable
  private searchInput: InputRenderable
  private mainArea: BoxRenderable
  private listScrollBox: ScrollBoxRenderable
  private detailPanel?: BoxRenderable
  private actionPanelOverlay?: BoxRenderable
  private entryBoxes: Map<string, BoxRenderable> = new Map()
  
  constructor(ctx: RenderContext, options: ListRenderableOptions) {
    super(ctx, options)
    
    this.filtering = options.filtering ?? true
    this.onSearchTextChange = options.onSearchTextChange
    this.onSelectionChange = options.onSelectionChange
    
    this.buildLayout()
    this.setupKeyboard()
  }
  
  // ─────────────────────────────────────────────────────────────
  // Layout Setup
  // ─────────────────────────────────────────────────────────────
  
  private buildLayout() {
    this.container = new BoxRenderable(this.ctx, {
      flexDirection: 'column',
      width: '100%',
      height: '100%',
    })
    
    // Search bar
    this.searchInput = new InputRenderable(this.ctx, {
      placeholder: this.options.searchBarPlaceholder || 'Search...',
      onInput: (value: string) => {
        this.setSearchQuery(value)
      },
    })
    
    // Main content area (list + optional detail)
    this.mainArea = new BoxRenderable(this.ctx, {
      flexDirection: 'row',
      flexGrow: 1,
    })
    
    // Scrollable list
    this.listScrollBox = new ScrollBoxRenderable(this.ctx, {
      flexGrow: 1,
      flexShrink: 1,
    })
    
    this.mainArea.add(this.listScrollBox)
    this.container.add(this.searchInput)
    this.container.add(this.mainArea)
    this.add(this.container)
  }
  
  // ─────────────────────────────────────────────────────────────
  // Child Registration (called by reconciler)
  // ─────────────────────────────────────────────────────────────
  
  add(child: Renderable) {
    // Don't call super.add() for data children - they don't render directly
    
    if (child instanceof ListSectionRenderable) {
      child.parentList = this
      this.sections.push(child)
      this.needsCommit = true
    } else if (child instanceof ListItemRenderable) {
      child.parentList = this
      this.orphanItems.push(child)
      this.needsCommit = true
    } else {
      // Layout children (container, etc.) go to actual tree
      super.add(child)
    }
  }
  
  remove(childId: string) {
    // Check if it's a section
    const sectionIndex = this.sections.findIndex(s => s.id === childId)
    if (sectionIndex !== -1) {
      this.sections.splice(sectionIndex, 1)
      this.needsCommit = true
      return
    }
    
    // Check if it's an orphan item
    const itemIndex = this.orphanItems.findIndex(i => i.id === childId)
    if (itemIndex !== -1) {
      this.orphanItems.splice(itemIndex, 1)
      this.needsCommit = true
      return
    }
    
    super.remove(childId)
  }
  
  // Called by sections when they receive items
  onSectionItemAdded(section: ListSectionRenderable, item: ListItemRenderable) {
    this.needsCommit = true
  }
  
  onSectionItemRemoved(section: ListSectionRenderable, item: ListItemRenderable) {
    this.needsCommit = true
  }
  
  // Called when an item's props change
  onItemUpdated(item: ListItemRenderable, oldProps: any, newProps: any) {
    // Check if filter-relevant props changed
    const filterPropsChanged =
      oldProps.title !== newProps.title ||
      oldProps.subtitle !== newProps.subtitle ||
      oldProps.keywords !== newProps.keywords
    
    if (filterPropsChanged && this.searchQuery) {
      // Need to re-filter
      this.refilter()
      this.rebuildDisplay()
    } else {
      // Just update the display for this item
      this.updateItemDisplay(item)
    }
  }
  
  // ─────────────────────────────────────────────────────────────
  // Commit Phase (called after tree is complete)
  // ─────────────────────────────────────────────────────────────
  
  commitPendingChanges() {
    if (!this.needsCommit) return
    this.needsCommit = false
    
    this.buildItemList()
    this.refilter()
    this.rebuildDisplay()
    
    // Notify of initial selection
    const selected = this.getSelectedItem()
    this.onSelectionChange?.(selected?.id ?? null)
  }
  
  private buildItemList() {
    this.allItems = []
    
    // Orphan items first
    for (const item of this.orphanItems) {
      this.allItems.push(this.extractItemData(item))
    }
    
    // Then items from sections
    for (const section of this.sections) {
      for (const item of section.items) {
        this.allItems.push(this.extractItemData(item, section.id))
      }
    }
  }
  
  private extractItemData(item: ListItemRenderable, sectionId?: string): ListItemData {
    return {
      id: item.id,
      title: item.props.title,
      subtitle: item.props.subtitle,
      icon: item.props.icon,
      keywords: item.props.keywords,
      accessories: item.props.accessories,
      renderable: item,
      sectionId,
    }
  }
  
  // ─────────────────────────────────────────────────────────────
  // Filtering
  // ─────────────────────────────────────────────────────────────
  
  private setSearchQuery(query: string) {
    if (this.searchQuery === query) return
    
    this.searchQuery = query
    this.onSearchTextChange?.(query)
    
    if (this.filtering) {
      this.refilter()
      this.rebuildDisplay()
    }
  }
  
  private refilter() {
    // Build flat entries with section headers
    this.flatEntries = []
    this.selectableIndexes = []
    
    if (!this.searchQuery || !this.filtering) {
      // No filtering - show all with sections
      this.buildUnfilteredEntries()
    } else {
      // Filter and score items
      this.buildFilteredEntries()
    }
    
    // Clamp selection
    if (this.selectableIndexes.length === 0) {
      this.selectedIndex = 0
    } else {
      this.selectedIndex = Math.min(
        this.selectedIndex,
        this.selectableIndexes.length - 1
      )
    }
  }
  
  private buildUnfilteredEntries() {
    // Orphan items first
    for (const item of this.orphanItems) {
      const data = this.allItems.find(i => i.id === item.id)!
      this.selectableIndexes.push(this.flatEntries.length)
      this.flatEntries.push({
        type: 'item',
        item: data,
        isSelected: false,
      })
    }
    
    // Sections with headers
    for (const section of this.sections) {
      if (section.items.length === 0) continue
      
      // Section header
      this.flatEntries.push({
        type: 'section-header',
        section: {
          id: section.id,
          title: section.props.title,
          subtitle: section.props.subtitle,
          renderable: section,
        },
      })
      
      // Section items
      for (const item of section.items) {
        const data = this.allItems.find(i => i.id === item.id)!
        this.selectableIndexes.push(this.flatEntries.length)
        this.flatEntries.push({
          type: 'item',
          item: data,
          isSelected: false,
        })
      }
    }
  }
  
  private buildFilteredEntries() {
    // Score all items
    const scored = this.allItems
      .map(item => ({
        item,
        score: this.scoreItem(item),
      }))
      .filter(x => x.score > 0)
      .sort((a, b) => b.score - a.score)
    
    // Group by section
    const orphanMatches: ListItemData[] = []
    const sectionMatches = new Map<string, { items: ListItemData[]; bestScore: number }>()
    
    for (const { item, score } of scored) {
      if (!item.sectionId) {
        orphanMatches.push(item)
      } else {
        const existing = sectionMatches.get(item.sectionId)
        if (existing) {
          existing.items.push(item)
          existing.bestScore = Math.max(existing.bestScore, score)
        } else {
          sectionMatches.set(item.sectionId, { items: [item], bestScore: score })
        }
      }
    }
    
    // Sort sections by best score
    const sortedSections = [...sectionMatches.entries()]
      .sort((a, b) => b[1].bestScore - a[1].bestScore)
    
    // Build flat list: orphans first, then sections
    for (const item of orphanMatches) {
      this.selectableIndexes.push(this.flatEntries.length)
      this.flatEntries.push({ type: 'item', item, isSelected: false })
    }
    
    for (const [sectionId, { items }] of sortedSections) {
      const section = this.sections.find(s => s.id === sectionId)!
      
      this.flatEntries.push({
        type: 'section-header',
        section: {
          id: section.id,
          title: section.props.title,
          subtitle: section.props.subtitle,
          renderable: section,
        },
      })
      
      for (const item of items) {
        this.selectableIndexes.push(this.flatEntries.length)
        this.flatEntries.push({ type: 'item', item, isSelected: false })
      }
    }
  }
  
  private scoreItem(item: ListItemData): number {
    const TITLE_WEIGHT = 1.0
    const SUBTITLE_WEIGHT = 0.6
    const KEYWORD_WEIGHT = 0.3
    
    const query = this.searchQuery.toLowerCase()
    let score = 0
    
    score += this.fuzzyScore(item.title, query) * TITLE_WEIGHT
    
    if (item.subtitle) {
      score += this.fuzzyScore(item.subtitle, query) * SUBTITLE_WEIGHT
    }
    
    if (item.keywords) {
      for (const keyword of item.keywords) {
        score += this.fuzzyScore(keyword, query) * KEYWORD_WEIGHT
      }
    }
    
    return score
  }
  
  private fuzzyScore(text: string, query: string): number {
    // Simple substring match - replace with fzf for better results
    const lower = text.toLowerCase()
    if (lower.includes(query)) {
      // Bonus for starting with query
      if (lower.startsWith(query)) return 2
      return 1
    }
    return 0
  }
  
  // ─────────────────────────────────────────────────────────────
  // Display Building
  // ─────────────────────────────────────────────────────────────
  
  private rebuildDisplay() {
    this.listScrollBox.clearChildren()
    this.entryBoxes.clear()
    
    // Mark selected
    const selectedFlatIndex = this.selectableIndexes[this.selectedIndex]
    
    for (let i = 0; i < this.flatEntries.length; i++) {
      const entry = this.flatEntries[i]
      
      if (entry.type === 'section-header') {
        const headerBox = this.createSectionHeaderBox(entry.section)
        this.listScrollBox.add(headerBox)
      } else {
        entry.isSelected = i === selectedFlatIndex
        const itemBox = this.createItemBox(entry.item, entry.isSelected)
        this.entryBoxes.set(entry.item.id, itemBox)
        this.listScrollBox.add(itemBox)
      }
    }
    
    // Update detail panel if showing
    if (this.isShowingDetail) {
      this.updateDetailPanel()
    }
    
    this.requestRender()
  }
  
  private createSectionHeaderBox(section: SectionData): BoxRenderable {
    const box = new BoxRenderable(this.ctx, {
      paddingTop: 1,
      paddingBottom: 0,
      paddingLeft: 1,
    })
    
    const titleText = new TextRenderable(this.ctx, {
      content: section.title || '',
      color: '#888888',
      bold: true,
    })
    box.add(titleText)
    
    if (section.subtitle) {
      const subtitleText = new TextRenderable(this.ctx, {
        content: ` ${section.subtitle}`,
        color: '#666666',
      })
      box.add(subtitleText)
    }
    
    return box
  }
  
  private createItemBox(item: ListItemData, isSelected: boolean): BoxRenderable {
    const box = new BoxRenderable(this.ctx, {
      flexDirection: 'row',
      width: '100%',
      paddingLeft: 2,
      paddingRight: 2,
      backgroundColor: isSelected ? '#0066cc' : 'transparent',
    })
    
    // Selection indicator
    const indicator = new TextRenderable(this.ctx, {
      content: isSelected ? '› ' : '  ',
      color: isSelected ? '#ffffff' : 'transparent',
    })
    box.add(indicator)
    
    // Icon (if any)
    if (item.icon) {
      const iconText = new TextRenderable(this.ctx, {
        content: this.renderIcon(item.icon) + ' ',
      })
      box.add(iconText)
    }
    
    // Title
    const titleText = new TextRenderable(this.ctx, {
      content: item.title,
      color: isSelected ? '#ffffff' : '#cccccc',
    })
    box.add(titleText)
    
    // Subtitle
    if (item.subtitle) {
      const subtitleText = new TextRenderable(this.ctx, {
        content: ` ${item.subtitle}`,
        color: '#888888',
      })
      box.add(subtitleText)
    }
    
    // Accessories (right-aligned)
    if (item.accessories?.length) {
      const spacer = new BoxRenderable(this.ctx, { flexGrow: 1 })
      box.add(spacer)
      
      for (const accessory of item.accessories) {
        const accText = new TextRenderable(this.ctx, {
          content: ` ${accessory.text || accessory.date?.toLocaleDateString() || ''}`,
          color: '#666666',
        })
        box.add(accText)
      }
    }
    
    return box
  }
  
  private renderIcon(icon: ImageLike): string {
    // Simplified icon rendering
    if (typeof icon === 'string') return icon
    if ('source' in icon) return '◆'
    return '•'
  }
  
  private updateItemDisplay(item: ListItemRenderable) {
    const box = this.entryBoxes.get(item.id)
    if (!box) return
    
    // Find if this item is selected
    const selectedItem = this.getSelectedItem()
    const isSelected = selectedItem?.id === item.id
    
    // Rebuild this box's content
    box.clearChildren()
    const data = this.extractItemData(item)
    
    // Recreate contents (same as createItemBox but reusing the box)
    // ... abbreviated for clarity
    
    this.requestRender()
  }
  
  // ─────────────────────────────────────────────────────────────
  // Selection & Navigation
  // ─────────────────────────────────────────────────────────────
  
  private getSelectedItem(): ListItemData | undefined {
    if (this.selectableIndexes.length === 0) return undefined
    const flatIndex = this.selectableIndexes[this.selectedIndex]
    const entry = this.flatEntries[flatIndex]
    return entry?.type === 'item' ? entry.item : undefined
  }
  
  private moveSelection(delta: number) {
    if (this.selectableIndexes.length === 0) return
    
    const newIndex = this.selectedIndex + delta
    if (newIndex < 0 || newIndex >= this.selectableIndexes.length) return
    
    const oldItem = this.getSelectedItem()
    this.selectedIndex = newIndex
    const newItem = this.getSelectedItem()
    
    // Update old item display
    if (oldItem) {
      const oldBox = this.entryBoxes.get(oldItem.id)
      if (oldBox) {
        oldBox.backgroundColor = 'transparent'
        // Update text colors...
      }
    }
    
    // Update new item display
    if (newItem) {
      const newBox = this.entryBoxes.get(newItem.id)
      if (newBox) {
        newBox.backgroundColor = '#0066cc'
        this.listScrollBox.scrollToChild(newBox)
      }
    }
    
    // Update detail panel
    if (this.isShowingDetail) {
      this.updateDetailPanel()
    }
    
    // Notify
    this.onSelectionChange?.(newItem?.id ?? null)
    this.requestRender()
  }
  
  // ─────────────────────────────────────────────────────────────
  // Keyboard Handling
  // ─────────────────────────────────────────────────────────────
  
  private setupKeyboard() {
    this.onKeyboard((evt) => {
      // Action panel takes priority when visible
      if (this.isShowingActionPanel) {
        this.handleActionPanelKey(evt)
        return
      }
      
      // Check for action shortcuts
      if (this.handleActionShortcut(evt)) return
      
      // Navigation
      switch (evt.name) {
        case 'up':
          this.moveSelection(-1)
          break
        case 'down':
          this.moveSelection(1)
          break
        case 'return':
          this.activateSelected()
          break
        case 'escape':
          if (this.isShowingDetail) {
            this.hideDetail()
          }
          break
      }
      
      // Cmd+K or Ctrl+K for action panel
      if (evt.key === 'k' && (evt.meta || evt.ctrl)) {
        this.showActionPanel()
      }
    })
  }
  
  private activateSelected() {
    const item = this.getSelectedItem()
    if (!item) return
    
    const primaryAction = item.renderable.getPrimaryAction()
    primaryAction?.trigger()
  }
  
  // See custom-reconciler-events.md for action handling details
}
```

## Registration

```typescript
// renderables/index.ts
import { extend } from '@opentui/react'
import { ListRenderable } from './list-renderable'
import { ListItemRenderable } from './list-item-renderable'
import { ListSectionRenderable } from './list-section-renderable'
import { ActionPanelRenderable } from './action-panel-renderable'
import { ActionRenderable } from './action-renderable'

export function registerRaycastComponents() {
  extend({
    'list': ListRenderable,
    'list-item': ListItemRenderable,
    'list-section': ListSectionRenderable,
    'action-panel': ActionPanelRenderable,
    'action': ActionRenderable,
    // ... more components
  })
}
```

## Hook into Reconciler Commit

To trigger `commitPendingChanges()` after the tree is ready:

```typescript
// Modify resetAfterCommit in host-config
resetAfterCommit(containerInfo: Container) {
  // Walk tree and commit any pending changes
  const commitPending = (node: Renderable) => {
    if ('commitPendingChanges' in node) {
      (node as any).commitPendingChanges()
    }
    for (const child of node.getChildren()) {
      commitPending(child)
    }
  }
  
  commitPending(containerInfo)
  containerInfo.requestRender()
}
```

## Scrolling: Index-Based Calculation

**Critical: You cannot read element `.y` positions immediately after creating them.**

Layout is calculated by Yoga during the render pass, AFTER your code runs. If you try to read `itemBox.y` right after creating a BoxRenderable, it will be 0 or undefined.

### Broken Approach

```typescript
// DON'T DO THIS
private scrollToSelected() {
  const itemBox = this.displayBoxes.get(selectedItem.id)
  
  // itemBox.y is 0 - layout hasn't run yet!
  const itemTop = itemBox.y - contentY
  this.scrollBox.scrollTop = itemTop
}
```

### Also Broken: queueMicrotask

```typescript
// STILL BROKEN - queueMicrotask doesn't guarantee layout
private scrollToSelected() {
  queueMicrotask(() => {
    const itemBox = this.displayBoxes.get(selectedItem.id)
    this.scrollBox.scrollTop = itemBox.y  // still 0!
  })
}
```

### Working Approach: Calculate from Structure

```typescript
private scrollToSelected() {
  // Calculate row position mathematically - no layout values needed
  let itemRow = 0
  let currentIndex = 0
  
  for (const section of this.filteredSections) {
    // Section header takes 2 rows (padding + title)
    if (section.title) {
      itemRow += 2
    }
    
    for (const item of section.items) {
      if (currentIndex === this.selectedIndex) {
        // Found it - scroll to center in viewport
        const viewportHeight = this.scrollBox.viewport?.height || 10
        this.scrollBox.scrollTop = Math.max(0, itemRow - viewportHeight / 2)
        return
      }
      itemRow += 1  // each item is 1 row
      currentIndex++
    }
  }
}
```

This works because:
1. You know each item is 1 row tall
2. You know section headers are 2 rows (padding + text)
3. You calculate expected position from structure, not layout
4. No dependency on Yoga layout timing

### When CAN You Read Layout Values?

In response to user input, AFTER the initial render has completed:

```typescript
// In list.tsx - this works because it runs after layout
useKeyboard((evt) => {
  // By now, layout has been calculated
  const itemBox = itemRefs.get(selectedId)
  console.log(itemBox.y)  // valid value
})
```

The difference: user input happens after the render cycle completes. Your `rebuildDisplay()` runs during the render cycle, before layout.

## Working Example

See `termcast/src/examples/internal/custom-renderable-list.tsx` for a complete implementation with:

- Custom renderables via `extend()`
- Tree traversal for wrapper components  
- Sections with headers
- Custom EmptyView
- Index-based scroll calculation
- 8 passing vitest tests
