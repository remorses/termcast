/**
 * Custom Renderable List Example
 * 
 * This example uses opentui's extend() to register custom renderables
 * that handle filtering, navigation, and selection imperatively.
 */

import {
  Renderable,
  BoxRenderable,
  TextRenderable,
  ScrollBoxRenderable,
  TextareaRenderable,
  type RenderContext,
  type BoxOptions,
} from '@opentui/core'
import { extend, useKeyboard } from '@opentui/react'
import { useIsInFocus } from 'termcast/src/internal/focus-context'
import React, { useRef, useEffect } from 'react'
import { renderWithProviders } from '../../utils'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface ListItemData {
  id: string
  itemTitle: string
  itemSubtitle?: string
  keywords?: string[]
  sectionTitle?: string
}

interface CustomListItemOptions extends BoxOptions {
  itemTitle: string
  itemSubtitle?: string
  keywords?: string[]
}

interface CustomListOptions extends BoxOptions {
  placeholder?: string
}

// ─────────────────────────────────────────────────────────────────────────────
// CustomListSectionRenderable - Groups items with a header
// ─────────────────────────────────────────────────────────────────────────────

interface CustomListSectionOptions extends BoxOptions {
  sectionTitle?: string
}

class CustomListSectionRenderable extends BoxRenderable {
  public sectionTitle?: string

  constructor(ctx: RenderContext, options: CustomListSectionOptions) {
    // Invisible wrapper - parent traverses into us
    super(ctx, { ...options, height: 0, overflow: 'hidden' })
    this.sectionTitle = options.sectionTitle
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CustomListEmptyViewRenderable - Shown when no items match filter
// ─────────────────────────────────────────────────────────────────────────────

interface CustomListEmptyViewOptions extends BoxOptions {
  emptyTitle?: string
  emptyDescription?: string
}

class CustomListEmptyViewRenderable extends BoxRenderable {
  public emptyTitle: string
  public emptyDescription?: string

  constructor(ctx: RenderContext, options: CustomListEmptyViewOptions) {
    super(ctx, { ...options, height: 0, overflow: 'hidden' })
    this.emptyTitle = options.emptyTitle || 'No Results'
    this.emptyDescription = options.emptyDescription
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CustomListItemRenderable - Data holder, parent registers us
// ─────────────────────────────────────────────────────────────────────────────

class CustomListItemRenderable extends BoxRenderable {
  public itemTitle: string
  public itemSubtitle?: string
  public keywords?: string[]
  public parentList?: CustomListRenderable
  public sectionTitle?: string  // populated from parent section

  constructor(ctx: RenderContext, options: CustomListItemOptions) {
    // Make invisible - parent renders us
    super(ctx, { ...options, height: 0, overflow: 'hidden' })
    this.itemTitle = options.itemTitle
    this.itemSubtitle = options.itemSubtitle
    this.keywords = options.keywords
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CustomListRenderable - Manages items, filtering, selection, display
// ─────────────────────────────────────────────────────────────────────────────

interface SectionData {
  title: string
  items: ListItemData[]
}

class CustomListRenderable extends BoxRenderable {
  // Data model
  private items: CustomListItemRenderable[] = []
  private sections: Map<string, CustomListSectionRenderable> = new Map()
  private emptyView?: CustomListEmptyViewRenderable
  private filteredItems: ListItemData[] = []
  private filteredSections: SectionData[] = []
  private selectedIndex = 0
  private searchQuery = ''

  // Display components
  private searchInput: TextareaRenderable
  private scrollBox: ScrollBoxRenderable
  private statusText: TextRenderable
  private displayBoxes: Map<string, BoxRenderable> = new Map()

  constructor(ctx: RenderContext, options: CustomListOptions) {
    super(ctx, { ...options, flexDirection: 'column' })

    // Create search input - wire up callback directly on renderable
    this.searchInput = new TextareaRenderable(ctx, {
      placeholder: options.placeholder || 'Search...',
      height: 1,
      width: '100%',
    })
    // Wire up content change callback directly (like reconciler does)
    ;(this.searchInput as any).onContentChange = () => {
      const value = this.searchInput.editBuffer?.getText() || ''
      this.setSearchQuery(value)
    }
    this.searchInput.focus()

    // Create scroll container for items
    this.scrollBox = new ScrollBoxRenderable(ctx, {
      flexGrow: 1,
      flexDirection: 'column',
    })

    // Create status text
    this.statusText = new TextRenderable(ctx, {
      content: '0 items',
    })

    // Add display components to our layout
    super.add(this.searchInput)
    super.add(this.scrollBox)
    super.add(this.statusText)
  }

  // Recursively find all items, sections, and emptyView
  private collectItems(node: Renderable, currentSection?: string): CustomListItemRenderable[] {
    const items: CustomListItemRenderable[] = []
    const children = (node as any)._childrenInLayoutOrder || []
    
    for (const child of children) {
      if (child instanceof CustomListEmptyViewRenderable) {
        this.emptyView = child
      } else if (child instanceof CustomListSectionRenderable) {
        // Track section and recurse into it
        this.sections.set(child.id, child)
        items.push(...this.collectItems(child, child.sectionTitle))
      } else if (child instanceof CustomListItemRenderable) {
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
  
  // Called after every React commit (via useEffect)
  commitPendingChanges() {
    // Reset collections
    this.sections.clear()
    this.emptyView = undefined
    
    // Traverse and collect
    this.items = this.collectItems(this)
    this.refilter()
    this.rebuildDisplay()
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Filtering
  // ─────────────────────────────────────────────────────────────────────────

  setSearchQuery(query: string) {
    if (this.searchQuery === query) return
    this.searchQuery = query
    this.refilter()
    this.rebuildDisplay()
  }

  private refilter() {
    const toItemData = (item: CustomListItemRenderable): ListItemData => ({
      id: item.id,
      itemTitle: item.itemTitle,
      itemSubtitle: item.itemSubtitle,
      keywords: item.keywords,
      sectionTitle: item.sectionTitle,
    })

    if (!this.searchQuery) {
      this.filteredItems = this.items.map(toItemData)
    } else {
      const query = this.searchQuery.toLowerCase()
      this.filteredItems = this.items
        .map(item => ({
          data: toItemData(item),
          score: this.scoreItem(item, query),
        }))
        .filter(x => x.score > 0)
        .sort((a, b) => b.score - a.score)
        .map(x => x.data)
    }

    // Group by section
    this.filteredSections = []
    const sectionMap = new Map<string, ListItemData[]>()
    const noSection: ListItemData[] = []
    
    for (const item of this.filteredItems) {
      if (item.sectionTitle) {
        const existing = sectionMap.get(item.sectionTitle)
        if (existing) {
          existing.push(item)
        } else {
          sectionMap.set(item.sectionTitle, [item])
        }
      } else {
        noSection.push(item)
      }
    }
    
    // No-section items first
    if (noSection.length > 0) {
      this.filteredSections.push({ title: '', items: noSection })
    }
    // Then sections in order
    for (const [title, items] of sectionMap) {
      this.filteredSections.push({ title, items })
    }

    // Clamp selection
    this.selectedIndex = Math.min(
      Math.max(0, this.selectedIndex),
      Math.max(0, this.filteredItems.length - 1)
    )
  }

  private scoreItem(item: CustomListItemRenderable, query: string): number {
    let score = 0
    const title = item.itemTitle.toLowerCase()
    if (title.includes(query)) {
      score += title.startsWith(query) ? 2 : 1
    }
    if (item.itemSubtitle?.toLowerCase().includes(query)) {
      score += 0.6
    }
    for (const kw of item.keywords || []) {
      if (kw.toLowerCase().includes(query)) {
        score += 0.3
      }
    }
    return score
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Display
  // ─────────────────────────────────────────────────────────────────────────

  private rebuildDisplay() {
    // Clear old display boxes
    for (const box of this.displayBoxes.values()) {
      this.scrollBox.remove(box.id)
    }
    this.displayBoxes.clear()

    // Update status
    const statusContent = this.searchQuery
      ? `${this.filteredItems.length} of ${this.items.length} items • Searching: "${this.searchQuery}"`
      : `${this.filteredItems.length} of ${this.items.length} items`
    this.statusText.content = statusContent

    if (this.filteredItems.length === 0) {
      // Show custom emptyView or default
      const emptyBox = new BoxRenderable(this.ctx, { padding: 1, flexDirection: 'column' })
      
      if (this.emptyView) {
        const titleText = new TextRenderable(this.ctx, {
          content: this.emptyView.emptyTitle,
        })
        emptyBox.add(titleText)
        
        if (this.emptyView.emptyDescription) {
          const descText = new TextRenderable(this.ctx, {
            content: this.emptyView.emptyDescription,
          })
          emptyBox.add(descText)
        }
      } else {
        const emptyText = new TextRenderable(this.ctx, {
          content: this.searchQuery
            ? `No results for "${this.searchQuery}"`
            : 'No items',
        })
        emptyBox.add(emptyText)
      }
      
      this.scrollBox.add(emptyBox)
      this.displayBoxes.set('__empty__', emptyBox)
    } else {
      // Render sections with headers
      let itemIndex = 0
      for (const section of this.filteredSections) {
        // Section header (if has title)
        if (section.title) {
          const headerBox = new BoxRenderable(this.ctx, { 
            paddingTop: 1,
            paddingLeft: 1,
          })
          const headerText = new TextRenderable(this.ctx, {
            content: `── ${section.title} ──`,
          })
          headerBox.add(headerText)
          this.scrollBox.add(headerBox)
          this.displayBoxes.set(`__section_${section.title}__`, headerBox)
        }
        
        // Section items
        for (const item of section.items) {
          const isSelected = itemIndex === this.selectedIndex
          const box = this.createItemBox(item, isSelected)
          this.displayBoxes.set(item.id, box)
          this.scrollBox.add(box)
          itemIndex++
        }
      }
    }

    this.requestRender()
  }

  private createItemBox(item: ListItemData, isSelected: boolean): BoxRenderable {
    const box = new BoxRenderable(this.ctx, {
      flexDirection: 'row',
      width: '100%',
    })
    if (isSelected) {
      box.backgroundColor = '#0066cc'
    }

    // Selection indicator
    const indicator = new TextRenderable(this.ctx, {
      content: isSelected ? '› ' : '  ',
    })
    box.add(indicator)

    // Title
    const titleText = new TextRenderable(this.ctx, {
      content: item.itemTitle,
    })
    box.add(titleText)

    // Subtitle
    if (item.itemSubtitle) {
      const subtitleText = new TextRenderable(this.ctx, {
        content: ` ${item.itemSubtitle}`,
      })
      box.add(subtitleText)
    }

    return box
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Navigation (called externally)
  // ─────────────────────────────────────────────────────────────────────────

  moveSelection(delta: number) {
    if (this.filteredItems.length === 0) return

    let newIndex = this.selectedIndex + delta
    // Wrap around
    if (newIndex < 0) newIndex = this.filteredItems.length - 1
    if (newIndex >= this.filteredItems.length) newIndex = 0
    if (newIndex === this.selectedIndex) return

    this.selectedIndex = newIndex
    this.rebuildDisplay()
    this.scrollToSelected()
  }

  private scrollToSelected() {
    // Calculate position based on index - each item is 1 row, section headers add 2 rows
    let itemRow = 0
    let currentIndex = 0
    
    for (const section of this.filteredSections) {
      // Section header takes 2 rows (padding + text)
      if (section.title) {
        itemRow += 2
      }
      
      for (const item of section.items) {
        if (currentIndex === this.selectedIndex) {
          // Found the selected item
          const viewportHeight = this.scrollBox.viewport?.height || 10
          const targetScrollTop = itemRow - Math.floor(viewportHeight / 2)
          this.scrollBox.scrollTop = Math.max(0, targetScrollTop)
          return
        }
        itemRow += 1
        currentIndex++
      }
    }
  }

  getSelectedItem(): ListItemData | undefined {
    return this.filteredItems[this.selectedIndex]
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Register with opentui
// ─────────────────────────────────────────────────────────────────────────────

extend({
  'custom-list': CustomListRenderable,
  'custom-list-item': CustomListItemRenderable,
  'custom-list-section': CustomListSectionRenderable,
  'custom-list-empty-view': CustomListEmptyViewRenderable,
})

// ─────────────────────────────────────────────────────────────────────────────
// React Components
// ─────────────────────────────────────────────────────────────────────────────

interface ListProps {
  children?: React.ReactNode
  placeholder?: string
}

function CustomList({ children, placeholder }: ListProps) {
  const listRef = useRef<CustomListRenderable>(null)
  const inFocus = useIsInFocus()

  // Commit after children mount
  useEffect(() => {
    queueMicrotask(() => {
      listRef.current?.commitPendingChanges()
    })
  })

  // Keyboard navigation
  useKeyboard((evt) => {
    if (!inFocus || !listRef.current) return
    if (evt.name === 'up') listRef.current.moveSelection(-1)
    if (evt.name === 'down') listRef.current.moveSelection(1)
  })

  return (
    <custom-list ref={listRef} flexGrow={1} placeholder={placeholder}>
      {children}
    </custom-list>
  )
}

interface ListItemProps {
  title: string
  subtitle?: string
  keywords?: string[]
}

function CustomListItem({ title, subtitle, keywords }: ListItemProps) {
  return (
    <custom-list-item
      itemTitle={title}
      itemSubtitle={subtitle}
      keywords={keywords}
    />
  )
}

interface ListSectionProps {
  title: string
  children?: React.ReactNode
}

function CustomListSection({ title, children }: ListSectionProps) {
  return (
    <custom-list-section sectionTitle={title}>
      {children}
    </custom-list-section>
  )
}

interface ListEmptyViewProps {
  title?: string
  description?: string
}

function CustomListEmptyView({ title, description }: ListEmptyViewProps) {
  return (
    <custom-list-empty-view
      emptyTitle={title}
      emptyDescription={description}
    />
  )
}

CustomList.Item = CustomListItem
CustomList.Section = CustomListSection
CustomList.EmptyView = CustomListEmptyView

// ─────────────────────────────────────────────────────────────────────────────
// Example
// ─────────────────────────────────────────────────────────────────────────────

const FRUITS = [
  { title: 'Apple', subtitle: 'A red fruit', keywords: ['red'] },
  { title: 'Banana', subtitle: 'A yellow fruit', keywords: ['yellow'] },
  { title: 'Date', subtitle: 'A sweet fruit', keywords: ['sweet'] },
  { title: 'Fig', subtitle: 'A small fruit', keywords: ['small'] },
  { title: 'Grape', subtitle: 'A vine fruit', keywords: ['vine'] },
  { title: 'Lemon', subtitle: 'A citrus fruit', keywords: ['citrus'] },
]

const VEGETABLES = [
  { title: 'Carrot', subtitle: 'An orange vegetable', keywords: ['orange'] },
  { title: 'Eggplant', subtitle: 'A purple vegetable', keywords: ['purple'] },
  { title: 'Jalapeno', subtitle: 'A spicy pepper', keywords: ['spicy'] },
  { title: 'Kale', subtitle: 'A superfood', keywords: ['healthy'] },
]

// Wrapper component to test tree traversal
function ItemWrapper({ children }: { children: React.ReactNode }) {
  return <box>{children}</box>
}

function Example() {
  return (
    <box flexDirection="column" padding={1} flexGrow={1}>
      <text marginBottom={1}>Custom Renderable List (using extend)</text>
      <CustomList placeholder="Search items...">
        <CustomList.EmptyView 
          title="Nothing found" 
          description="Try a different search term"
        />
        <CustomList.Section title="Fruits">
          {FRUITS.map((item) => (
            <ItemWrapper key={item.title}>
              <CustomList.Item
                title={item.title}
                subtitle={item.subtitle}
                keywords={item.keywords}
              />
            </ItemWrapper>
          ))}
        </CustomList.Section>
        <CustomList.Section title="Vegetables">
          {VEGETABLES.map((item) => (
            <CustomList.Item
              key={item.title}
              title={item.title}
              subtitle={item.subtitle}
              keywords={item.keywords}
            />
          ))}
        </CustomList.Section>
      </CustomList>
    </box>
  )
}

renderWithProviders(<Example />)

export { CustomList, CustomListItem, Example }
