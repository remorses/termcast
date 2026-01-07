/**
 * Custom Renderable List Example
 * 
 * This example uses opentui's extend() to register custom renderables
 * that handle filtering, navigation, and selection imperatively.
 * 
 * Uses unified ItemState/SectionState model for simplified state management.
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
// Renderable Options
// ─────────────────────────────────────────────────────────────────────────────

interface CustomListItemOptions extends BoxOptions {
  itemTitle: string
  itemSubtitle?: string
  keywords?: string[]
  onAction?: () => void
}

interface CustomListSectionOptions extends BoxOptions {
  sectionTitle?: string
}

interface CustomListEmptyViewOptions extends BoxOptions {
  emptyTitle?: string
  emptyDescription?: string
}

interface CustomListOptions extends BoxOptions {
  placeholder?: string
}

// ─────────────────────────────────────────────────────────────────────────────
// Renderables (data holders - invisible, parent renders them)
// ─────────────────────────────────────────────────────────────────────────────

class CustomListSectionRenderable extends BoxRenderable {
  public sectionTitle?: string

  constructor(ctx: RenderContext, options: CustomListSectionOptions) {
    super(ctx, { ...options, height: 0, overflow: 'hidden' })
    this.sectionTitle = options.sectionTitle
  }
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

class CustomListItemRenderable extends BoxRenderable {
  public itemTitle: string
  public itemSubtitle?: string
  public keywords?: string[]
  public onAction?: () => void

  constructor(ctx: RenderContext, options: CustomListItemOptions) {
    super(ctx, { ...options, height: 0, overflow: 'hidden' })
    this.itemTitle = options.itemTitle
    this.itemSubtitle = options.itemSubtitle
    this.keywords = options.keywords
    this.onAction = options.onAction
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Unified State Model
// ─────────────────────────────────────────────────────────────────────────────

interface ItemState {
  renderable: CustomListItemRenderable
  visible: boolean      // passes current filter
  rowIndex: number      // for scrolling (calculated during refilter)
  displayBox?: BoxRenderable
}

interface SectionState {
  title: string
  items: ItemState[]
  headerBox?: BoxRenderable
}

// ─────────────────────────────────────────────────────────────────────────────
// CustomListRenderable
// ─────────────────────────────────────────────────────────────────────────────

class CustomListRenderable extends BoxRenderable {
  // Unified state model
  private sections: SectionState[] = []
  private emptyView?: CustomListEmptyViewRenderable
  private selectedIndex = 0
  private searchQuery = ''
  
  // Computed from sections (for convenience)
  private visibleItems: ItemState[] = []
  private totalItemCount = 0

  // Display components
  private searchInput: TextareaRenderable
  private scrollBox: ScrollBoxRenderable
  private statusText: TextRenderable
  private emptyBox?: BoxRenderable

  constructor(ctx: RenderContext, options: CustomListOptions) {
    super(ctx, { ...options, flexDirection: 'column' })

    this.searchInput = new TextareaRenderable(ctx, {
      placeholder: options.placeholder || 'Search...',
      height: 1,
      width: '100%',
      keyBindings: [
        { name: 'return', action: 'submit' },
        { name: 'linefeed', action: 'submit' },
      ],
    })
    ;(this.searchInput as any).onContentChange = () => {
      const value = this.searchInput.editBuffer?.getText() || ''
      this.setSearchQuery(value)
    }
    this.searchInput.focus()

    this.scrollBox = new ScrollBoxRenderable(ctx, {
      flexGrow: 1,
      flexDirection: 'column',
    })

    this.statusText = new TextRenderable(ctx, {
      content: '0 items',
    })

    super.add(this.searchInput)
    super.add(this.scrollBox)
    super.add(this.statusText)
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Collection (builds unified state from tree)
  // ─────────────────────────────────────────────────────────────────────────

  commitPendingChanges() {
    this.sections = []
    this.emptyView = undefined
    this.collectFromTree(this, undefined)
    this.refilter()
    this.rebuildDisplay()
  }

  private collectFromTree(node: Renderable, currentSection: SectionState | undefined) {
    const children = (node as any)._childrenInLayoutOrder || []
    
    for (const child of children) {
      if (child instanceof CustomListEmptyViewRenderable) {
        this.emptyView = child
      } else if (child instanceof CustomListSectionRenderable) {
        const section: SectionState = {
          title: child.sectionTitle || '',
          items: [],
        }
        this.sections.push(section)
        this.collectFromTree(child, section)
      } else if (child instanceof CustomListItemRenderable) {
        const itemState: ItemState = {
          renderable: child,
          visible: true,
          rowIndex: 0,
        }
        if (currentSection) {
          currentSection.items.push(itemState)
        } else {
          // Orphan item - create/find no-title section
          let orphanSection = this.sections.find(s => s.title === '')
          if (!orphanSection) {
            orphanSection = { title: '', items: [] }
            this.sections.unshift(orphanSection)
          }
          orphanSection.items.push(itemState)
        }
      } else {
        // Recurse into wrapper components
        this.collectFromTree(child, currentSection)
      }
    }
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
    const query = this.searchQuery.toLowerCase()
    this.visibleItems = []
    this.totalItemCount = 0
    let rowIndex = 0

    for (const section of this.sections) {
      // Count header rows if section has title and will have visible items
      const sectionStartRow = rowIndex
      if (section.title) {
        rowIndex += 2  // header padding + text
      }

      let sectionHasVisible = false
      for (const item of section.items) {
        this.totalItemCount++
        
        if (!query) {
          item.visible = true
        } else {
          item.visible = this.scoreItem(item.renderable, query) > 0
        }

        if (item.visible) {
          item.rowIndex = rowIndex++
          this.visibleItems.push(item)
          sectionHasVisible = true
        }
      }

      // If section had no visible items, don't count header rows
      if (!sectionHasVisible && section.title) {
        rowIndex = sectionStartRow
      }
    }

    // Clamp selection
    this.selectedIndex = Math.min(
      Math.max(0, this.selectedIndex),
      Math.max(0, this.visibleItems.length - 1)
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
    this.clearDisplay()
    this.updateStatus()

    if (this.visibleItems.length === 0) {
      this.renderEmptyState()
    } else {
      this.renderSections()
    }

    this.requestRender()
  }

  private clearDisplay() {
    if (this.emptyBox) {
      this.scrollBox.remove(this.emptyBox.id)
      this.emptyBox = undefined
    }
    for (const section of this.sections) {
      if (section.headerBox) {
        this.scrollBox.remove(section.headerBox.id)
        section.headerBox = undefined
      }
      for (const item of section.items) {
        if (item.displayBox) {
          this.scrollBox.remove(item.displayBox.id)
          item.displayBox = undefined
        }
      }
    }
  }

  private updateStatus() {
    this.statusText.content = this.searchQuery
      ? `${this.visibleItems.length} of ${this.totalItemCount} items • Searching: "${this.searchQuery}"`
      : `${this.visibleItems.length} of ${this.totalItemCount} items`
  }

  private renderEmptyState() {
    this.emptyBox = new BoxRenderable(this.ctx, { padding: 1, flexDirection: 'column' })
    
    if (this.emptyView) {
      this.emptyBox.add(new TextRenderable(this.ctx, { content: this.emptyView.emptyTitle }))
      if (this.emptyView.emptyDescription) {
        this.emptyBox.add(new TextRenderable(this.ctx, { content: this.emptyView.emptyDescription }))
      }
    } else {
      this.emptyBox.add(new TextRenderable(this.ctx, {
        content: this.searchQuery ? `No results for "${this.searchQuery}"` : 'No items',
      }))
    }
    
    this.scrollBox.add(this.emptyBox)
  }

  private renderSections() {
    let visibleIndex = 0
    
    for (const section of this.sections) {
      const sectionHasVisible = section.items.some(i => i.visible)
      if (!sectionHasVisible) continue

      // Section header
      if (section.title) {
        section.headerBox = new BoxRenderable(this.ctx, { paddingTop: 1, paddingLeft: 1 })
        section.headerBox.add(new TextRenderable(this.ctx, { content: `── ${section.title} ──` }))
        this.scrollBox.add(section.headerBox)
      }

      // Section items
      for (const item of section.items) {
        if (!item.visible) continue
        
        const isSelected = visibleIndex === this.selectedIndex
        item.displayBox = this.createItemBox(item.renderable, isSelected)
        this.scrollBox.add(item.displayBox)
        visibleIndex++
      }
    }
  }

  private createItemBox(item: CustomListItemRenderable, isSelected: boolean): BoxRenderable {
    const box = new BoxRenderable(this.ctx, { flexDirection: 'row', width: '100%' })
    if (isSelected) {
      box.backgroundColor = '#0066cc'
    }

    box.add(new TextRenderable(this.ctx, { content: isSelected ? '› ' : '  ' }))
    box.add(new TextRenderable(this.ctx, { content: item.itemTitle }))
    if (item.itemSubtitle) {
      box.add(new TextRenderable(this.ctx, { content: ` ${item.itemSubtitle}` }))
    }

    return box
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Navigation
  // ─────────────────────────────────────────────────────────────────────────

  moveSelection(delta: number) {
    if (this.visibleItems.length === 0) return

    let newIndex = this.selectedIndex + delta
    if (newIndex < 0) newIndex = this.visibleItems.length - 1
    if (newIndex >= this.visibleItems.length) newIndex = 0
    if (newIndex === this.selectedIndex) return

    this.selectedIndex = newIndex
    this.rebuildDisplay()
    this.scrollToSelected()
  }

  private scrollToSelected() {
    const item = this.visibleItems[this.selectedIndex]
    if (!item) return

    const viewportHeight = this.scrollBox.viewport?.height || 10
    const targetScrollTop = item.rowIndex - Math.floor(viewportHeight / 2)
    this.scrollBox.scrollTop = Math.max(0, targetScrollTop)
  }

  activateSelected() {
    const item = this.visibleItems[this.selectedIndex]
    item?.renderable.onAction?.()
  }

  getSelectedItem(): CustomListItemRenderable | undefined {
    return this.visibleItems[this.selectedIndex]?.renderable
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

  useEffect(() => {
    queueMicrotask(() => {
      listRef.current?.commitPendingChanges()
    })
  })

  useKeyboard((evt) => {
    if (!inFocus || !listRef.current) return
    if (evt.name === 'up') listRef.current.moveSelection(-1)
    if (evt.name === 'down') listRef.current.moveSelection(1)
    if (evt.name === 'return') listRef.current.activateSelected()
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
  onAction?: () => void
}

function CustomListItem({ title, subtitle, keywords, onAction }: ListItemProps) {
  return (
    <custom-list-item
      itemTitle={title}
      itemSubtitle={subtitle}
      keywords={keywords}
      onAction={onAction}
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
