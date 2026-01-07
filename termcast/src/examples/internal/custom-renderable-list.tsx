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
  private headerText?: TextRenderable

  constructor(ctx: RenderContext, options: CustomListSectionOptions) {
    super(ctx, { ...options, flexDirection: 'column', width: '100%' })
    this.sectionTitle = options.sectionTitle

    // Render own header
    if (this.sectionTitle) {
      this.headerText = new TextRenderable(ctx, { 
        content: `── ${this.sectionTitle} ──`,
        paddingTop: 1,
        paddingLeft: 1,
      })
      super.add(this.headerText)
    }
  }

  private isVisible = true
  get visible() { return this.isVisible }
  set visible(value: boolean) {
    if (this.isVisible !== value) {
      this.isVisible = value
      // Hide both section and header
      this.height = value ? undefined : 0
      this.overflow = value ? undefined : 'hidden'
      if (this.headerText) {
        this.headerText.height = value ? undefined : 0
        this.headerText.paddingTop = value ? 1 : 0
      }
    }
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
  public section?: CustomListSectionRenderable

  private isSelected = false
  private isVisible = true
  private indicatorText: TextRenderable

  constructor(ctx: RenderContext, options: CustomListItemOptions) {
    super(ctx, { ...options, flexDirection: 'row', width: '100%' })
    this.itemTitle = options.itemTitle
    this.itemSubtitle = options.itemSubtitle
    this.keywords = options.keywords
    this.onAction = options.onAction

    // Render own content
    this.indicatorText = new TextRenderable(ctx, { content: '  ' })
    super.add(this.indicatorText)
    super.add(new TextRenderable(ctx, { content: this.itemTitle }))
    if (this.itemSubtitle) {
      super.add(new TextRenderable(ctx, { content: ` ${this.itemSubtitle}` }))
    }
  }

  get selected() { return this.isSelected }
  set selected(value: boolean) {
    if (this.isSelected !== value) {
      this.isSelected = value
      this.backgroundColor = value ? '#0066cc' : 'transparent'
      this.indicatorText.content = value ? '› ' : '  '
    }
  }

  get visible() { return this.isVisible }
  set visible(value: boolean) {
    if (this.isVisible !== value) {
      this.isVisible = value
      this.height = value ? undefined : 0
      this.overflow = value ? undefined : 'hidden'
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CustomListRenderable
// ─────────────────────────────────────────────────────────────────────────────

class CustomListRenderable extends BoxRenderable {
  private emptyView?: CustomListEmptyViewRenderable
  private selectedIndex = 0
  private searchQuery = ''

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

  // Override add() so React children go into scrollBox
  add(child: Renderable, index?: number): number {
    if (child instanceof CustomListEmptyViewRenderable) {
      this.emptyView = child
      // Don't add to DOM - just store reference
      return -1
    } else {
      // All React children go into scrollBox
      return this.scrollBox.add(child, index)
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Helpers - traverse scrollBox children
  // ─────────────────────────────────────────────────────────────────────────

  private getScrollBoxChildren(): Renderable[] {
    return (this.scrollBox as any)._childrenInLayoutOrder || []
  }

  private getAllItems(): CustomListItemRenderable[] {
    const items: CustomListItemRenderable[] = []
    const findItems = (node: Renderable) => {
      if (node instanceof CustomListItemRenderable) {
        items.push(node)
      }
      const children = (node as any)._childrenInLayoutOrder || []
      for (const child of children) {
        findItems(child)
      }
    }
    for (const child of this.getScrollBoxChildren()) {
      findItems(child)
    }
    return items
  }

  private getVisibleItems(): CustomListItemRenderable[] {
    return this.getAllItems().filter(item => item.visible)
  }

  private getAllSections(): CustomListSectionRenderable[] {
    const sections: CustomListSectionRenderable[] = []
    const findSections = (node: Renderable) => {
      if (node instanceof CustomListSectionRenderable) {
        sections.push(node)
      }
      const children = (node as any)._childrenInLayoutOrder || []
      for (const child of children) {
        findSections(child)
      }
    }
    for (const child of this.getScrollBoxChildren()) {
      findSections(child)
    }
    return sections
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Collection - link items to their sections
  // ─────────────────────────────────────────────────────────────────────────

  commitPendingChanges() {
    // Link items to their parent sections
    for (const section of this.getAllSections()) {
      const sectionChildren = (section as any)._childrenInLayoutOrder || []
      const linkItems = (node: Renderable) => {
        if (node instanceof CustomListItemRenderable) {
          node.section = section
        }
        const children = (node as any)._childrenInLayoutOrder || []
        for (const child of children) {
          linkItems(child)
        }
      }
      for (const child of sectionChildren) {
        linkItems(child)
      }
    }

    this.refilter()
    this.updateEmptyState()
    
    // Select first visible item
    const visibleItems = this.getVisibleItems()
    if (visibleItems.length > 0) {
      this.selectedIndex = 0
      visibleItems[0].selected = true
    }
    
    this.updateStatus()
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Filtering
  // ─────────────────────────────────────────────────────────────────────────

  setSearchQuery(query: string) {
    if (this.searchQuery === query) return
    
    // Deselect current
    const oldVisible = this.getVisibleItems()
    if (oldVisible[this.selectedIndex]) {
      oldVisible[this.selectedIndex].selected = false
    }
    
    this.searchQuery = query
    this.refilter()
    this.updateEmptyState()
    
    // Select first visible item
    const newVisible = this.getVisibleItems()
    if (newVisible.length > 0) {
      this.selectedIndex = 0
      newVisible[0].selected = true
    }
    
    this.updateStatus()
  }

  private refilter() {
    const query = this.searchQuery.toLowerCase()
    const allItems = this.getAllItems()
    const allSections = this.getAllSections()

    // Update item visibility
    for (const item of allItems) {
      const matches = !query || this.scoreItem(item, query) > 0
      item.visible = matches
    }

    // Update section visibility
    for (const section of allSections) {
      const sectionItems = allItems.filter(item => item.section === section)
      const hasVisibleItems = sectionItems.some(item => item.visible)
      section.visible = hasVisibleItems
    }

    // Clamp selection
    const visibleCount = this.getVisibleItems().length
    this.selectedIndex = Math.min(
      Math.max(0, this.selectedIndex),
      Math.max(0, visibleCount - 1)
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

  private updateStatus() {
    const visibleCount = this.getVisibleItems().length
    const totalCount = this.getAllItems().length
    this.statusText.content = this.searchQuery
      ? `${visibleCount} of ${totalCount} items • Searching: "${this.searchQuery}"`
      : `${visibleCount} of ${totalCount} items`
  }

  private updateEmptyState() {
    const showEmpty = this.getVisibleItems().length === 0
    
    if (showEmpty && !this.emptyBox) {
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
    } else if (!showEmpty && this.emptyBox) {
      this.scrollBox.remove(this.emptyBox.id)
      this.emptyBox = undefined
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Navigation
  // ─────────────────────────────────────────────────────────────────────────

  moveSelection(delta: number) {
    const visibleItems = this.getVisibleItems()
    if (visibleItems.length === 0) return

    let newIndex = this.selectedIndex + delta
    if (newIndex < 0) newIndex = visibleItems.length - 1
    if (newIndex >= visibleItems.length) newIndex = 0
    if (newIndex === this.selectedIndex) return

    // O(1) update: just change 2 items' selected state
    visibleItems[this.selectedIndex].selected = false
    visibleItems[newIndex].selected = true
    
    this.selectedIndex = newIndex
    this.scrollToSelected()
  }

  private scrollToSelected() {
    const visibleItems = this.getVisibleItems()
    const item = visibleItems[this.selectedIndex]
    if (!item) return

    // Use item's position for scrolling
    const itemY = (item as any).y || 0
    const scrollBoxY = (this.scrollBox as any).content?.y || 0
    const viewportHeight = this.scrollBox.viewport?.height || 10
    
    const relativeY = itemY - scrollBoxY
    const targetScrollTop = relativeY - Math.floor(viewportHeight / 2)
    this.scrollBox.scrollTop = Math.max(0, targetScrollTop)
  }

  activateSelected() {
    const visibleItems = this.getVisibleItems()
    visibleItems[this.selectedIndex]?.onAction?.()
  }

  getSelectedItem(): CustomListItemRenderable | undefined {
    return this.getVisibleItems()[this.selectedIndex]
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
                onAction={() => console.log(`Selected: ${item.title}`)}
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
              onAction={() => console.log(`Selected: ${item.title}`)}
            />
          ))}
        </CustomList.Section>
      </CustomList>
    </box>
  )
}

renderWithProviders(<Example />)

export { CustomList, CustomListItem, Example }
