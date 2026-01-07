/**
 * Custom Renderable List Example
 * 
 * This example uses opentui's extend() to register custom renderables
 * that handle filtering, navigation, and selection imperatively.
 * 
 * Uses unified ItemState/SectionState model for simplified state management.
 * 
 * ## How React Props Work with opentui Renderables
 * 
 * React props are applied via direct property assignment, NOT just constructor:
 * 
 * 1. `createInstance()` - constructor called (props passed in options)
 * 2. `setInitialProperties()` - iterates props, does `instance[propKey] = propValue`
 * 3. `commitUpdate()` - on re-render, applies changed props via `instance[propKey] = propValue`
 * 
 * This means:
 * - Props don't need to be read from constructor options - React sets them after
 * - Simple props (just stored/read later) can be public fields
 * - Props that need side effects on change require setters
 * - Constructor should just create the renderable structure
 * 
 * Example:
 * ```typescript
 * class MyRenderable extends BoxRenderable {
 *   // Simple prop - no setter needed, React assigns directly
 *   public myLabel = ''
 * 
 *   // Prop that needs action on change - use setter
 *   private _activeIndex = 0
 *   get activeIndex() { return this._activeIndex }
 *   set activeIndex(value: number) {
 *     if (this._activeIndex === value) return
 *     this._activeIndex = value
 *     this.updateHighlight()  // side effect
 *     this.requestRender()
 *   }
 * }
 * ```
 */

import {
  Renderable,
  BoxRenderable,
  TextRenderable,
  ScrollBoxRenderable,
  TextareaRenderable,
  OptimizedBuffer,
  type RenderContext,
  type BoxOptions,
} from '@opentui/core'
import { extend, useKeyboard } from '@opentui/react'
import { useIsInFocus } from 'termcast/src/internal/focus-context'
import { useStore } from 'termcast/src/state'
import React, { useRef } from 'react'
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
  defaultSearchQuery?: string
}

// ─────────────────────────────────────────────────────────────────────────────
// Renderables
// - Section/Item: self-rendering (create their own child TextRenderables)
// - EmptyView: data holder (height:0, parent creates emptyBox from its data)
// ─────────────────────────────────────────────────────────────────────────────

// Generic helper to find parent of specific type by traversing up
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function findParent<T>(node: Renderable, type: abstract new (...args: any[]) => T): T | undefined {
  let current: Renderable | null = node.parent
  while (current) {
    if (current instanceof type) {
      return current
    }
    current = current.parent
  }
  return undefined
}

class CustomListSectionRenderable extends BoxRenderable {
  private headerText: TextRenderable
  private parentList?: CustomListRenderable

  // Prop with setter - updates header text when changed
  private _sectionTitle = ''
  get sectionTitle() { return this._sectionTitle }
  set sectionTitle(value: string) {
    this._sectionTitle = value
    this.headerText.content = value ? `── ${value} ──` : ''
    this.headerText.height = value ? 'auto' : 0
    this.headerText.paddingTop = value ? 1 : 0
  }

  constructor(ctx: RenderContext, options: CustomListSectionOptions) {
    super(ctx, { ...options, flexDirection: 'column', width: '100%' })
    // Create header - React will set sectionTitle prop after constructor
    this.headerText = new TextRenderable(ctx, { 
      content: '',
      paddingTop: 1,
      paddingLeft: 1,
    })
    super.add(this.headerText)

    // Register with parent list after being added to tree
    this.onLifecyclePass = () => {
      if (!this.parentList) {
        this.parentList = findParent(this, CustomListRenderable)
        this.parentList?.registerSection(this)
      }
    }
  }

}

class CustomListEmptyViewRenderable extends BoxRenderable {
  // Simple props - just stored, read by parent list. No setter needed.
  public emptyTitle = 'No items'
  public emptyDescription?: string

  private parentList?: CustomListRenderable

  constructor(ctx: RenderContext, options: CustomListEmptyViewOptions) {
    super(ctx, { ...options, visible: false })
    // React will set emptyTitle/emptyDescription props after constructor

    // Self-register with parent list after being added to tree
    this.onLifecyclePass = () => {
      if (!this.parentList) {
        this.parentList = findParent(this, CustomListRenderable)
        this.parentList?.registerEmptyView(this)
      }
    }
  }
}

class CustomListItemRenderable extends BoxRenderable {
  // Simple props - just stored/read for filtering. No setter needed.
  public keywords?: string[]
  public onAction?: () => void
  public section?: CustomListSectionRenderable

  private isSelected = false
  private indicatorText: TextRenderable
  private titleText: TextRenderable
  private subtitleText: TextRenderable
  private parentList?: CustomListRenderable

  // Prop with setter - updates title text when changed
  private _itemTitle = ''
  get itemTitle() { return this._itemTitle }
  set itemTitle(value: string) {
    this._itemTitle = value
    this.titleText.content = value
  }

  // Prop with setter - updates subtitle text when changed
  private _itemSubtitle?: string
  get itemSubtitle() { return this._itemSubtitle }
  set itemSubtitle(value: string | undefined) {
    this._itemSubtitle = value
    this.subtitleText.content = value ? ` ${value}` : ''
  }

  constructor(ctx: RenderContext, options: CustomListItemOptions) {
    super(ctx, { ...options, flexDirection: 'row', width: '100%' })
    // Create text renderables - React will set itemTitle/itemSubtitle props after constructor
    this.indicatorText = new TextRenderable(ctx, { content: '  ' })
    this.titleText = new TextRenderable(ctx, { content: '' })
    this.subtitleText = new TextRenderable(ctx, { content: '' })
    super.add(this.indicatorText)
    super.add(this.titleText)
    super.add(this.subtitleText)

    // Register with parent list after being added to tree
    this.onLifecyclePass = () => {
      if (!this.parentList) {
        this.parentList = findParent(this, CustomListRenderable)
        this.section = findParent(this, CustomListSectionRenderable)
        this.parentList?.registerItem(this)
      }
    }

    // Example: register click handler directly on renderable
    this.onMouseDown = (event) => {
      console.log('CustomListItemRenderable clicked:', this.itemTitle, event)
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

}

// ─────────────────────────────────────────────────────────────────────────────
// CustomListRenderable
// ─────────────────────────────────────────────────────────────────────────────

class CustomListRenderable extends BoxRenderable {
  private emptyView?: CustomListEmptyViewRenderable
  private selectedIndex = 0
  private searchQuery = ''

  // Registered items/sections (they register themselves)
  readonly registeredItems = new Set<CustomListItemRenderable>()
  readonly registeredSections = new Set<CustomListSectionRenderable>()

  // Display components
  private searchInput: TextareaRenderable
  private scrollBox: ScrollBoxRenderable
  private statusText: TextRenderable
  private emptyBox?: BoxRenderable

  // Prop with setter - updates search input placeholder
  private _placeholder = 'Search...'
  get placeholder() { return this._placeholder }
  set placeholder(value: string) {
    this._placeholder = value
    this.searchInput.placeholder = value
  }

  // Prop with setter - updates search input text and triggers refilter
  get defaultSearchQuery() { return this.searchQuery }
  set defaultSearchQuery(value: string) {
    if (this.searchQuery === value) return
    this.searchQuery = value
    this.searchInput.editBuffer?.setText(value)
    this.dirty = true
    this.requestRender()
  }

  constructor(ctx: RenderContext, options: CustomListOptions) {
    super(ctx, { ...options, flexDirection: 'column' })
    // Create search input - React will set placeholder/defaultSearchQuery props after constructor
    this.searchInput = new TextareaRenderable(ctx, {
      placeholder: 'Search...',
      height: 1,
      width: '100%',
      keyBindings: [
        { name: 'return', action: 'submit' },
        { name: 'linefeed', action: 'submit' },
      ],
    })
    this.searchInput.onContentChange = () => {
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

    // Example: register key handler directly on renderable (logs all key presses)
    this.onKeyDown = (key) => {
      console.log('CustomListRenderable received key:', key.name, key)
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Child Management
  // 
  // All React children are redirected to scrollBox for proper scrolling.
  // Children self-register with the list via onLifecyclePass callback:
  //
  //   1. React calls list.add(child) for sections/items/emptyView
  //   2. We forward to scrollBox.add(child), which sets child.parent
  //   3. opentui calls child.onLifecyclePass() after parent is set
  //   4. Child traverses up via findParent() to find this list
  //   5. Child calls registerItem/Section/EmptyView to add itself to sets
  //   6. scheduleUpdate() debounces and triggers refilter/selection
  //
  // This avoids the list needing to traverse the tree to find children.
  // Stale refs are cleaned lazily in getAllItems/Sections by checking
  // if items are still connected to the tree via parent chain.
  // ─────────────────────────────────────────────────────────────────────────

  add(child: Renderable, index?: number): number {
    return this.scrollBox.add(child, index)
  }

  registerItem(item: CustomListItemRenderable) {
    this.registeredItems.add(item)
    this.dirty = true
    this.requestRender()
  }

  registerSection(section: CustomListSectionRenderable) {
    this.registeredSections.add(section)
    this.dirty = true
    this.requestRender()
  }

  registerEmptyView(emptyView: CustomListEmptyViewRenderable) {
    this.emptyView = emptyView
  }

  // Single dirty flag - checked in render() to run all updates
  private dirty = false

  render(buffer: OptimizedBuffer, deltaTime: number) {
    if (this.dirty) {
      this.dirty = false
      this.refilter()
      this.updateEmptyState()
      this.updateStatus()

      // Select first visible item if none selected
      const visibleItems = this.getVisibleItems()
      if (visibleItems.length > 0 && !visibleItems.some(i => i.selected)) {
        this.selectedIndex = 0
        visibleItems[0].selected = true
      }
    }
    super.render(buffer, deltaTime)
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Helpers - use registered sets, clean stale refs
  // ─────────────────────────────────────────────────────────────────────────

  // Check if a renderable is still connected to this list
  private isConnected(node: Renderable): boolean {
    let current = node.parent
    while (current) {
      if (current === this.scrollBox || current === this) {
        return true
      }
      current = current.parent
    }
    return false
  }

  private getAllItems(): CustomListItemRenderable[] {
    // Clean stale refs (items no longer in tree)
    for (const item of this.registeredItems) {
      if (!this.isConnected(item)) {
        this.registeredItems.delete(item)
      }
    }
    return Array.from(this.registeredItems)
  }

  private getVisibleItems(): CustomListItemRenderable[] {
    return this.getAllItems().filter(item => item.visible)
  }

  private getAllSections(): CustomListSectionRenderable[] {
    // Clean stale refs
    for (const section of this.registeredSections) {
      if (!this.isConnected(section)) {
        this.registeredSections.delete(section)
      }
    }
    return Array.from(this.registeredSections)
  }



  // ─────────────────────────────────────────────────────────────────────────
  // Filtering
  // ─────────────────────────────────────────────────────────────────────────

  setSearchQuery(query: string) {
    if (this.searchQuery === query) return
    
    // Deselect current before query change
    const oldVisible = this.getVisibleItems()
    if (oldVisible[this.selectedIndex]) {
      oldVisible[this.selectedIndex].selected = false
    }
    
    this.searchQuery = query
    this.selectedIndex = 0  // Reset to first item on query change
    this.dirty = true
    this.requestRender()
  }

  private refilter() {
    const query = this.searchQuery.toLowerCase()
    const allItems = this.getAllItems()
    const allSections = this.getAllSections()

    // Fast path: no query means all visible
    if (!query) {
      for (const item of allItems) {
        item.visible = true
      }
      for (const section of allSections) {
        section.visible = true
      }
      return
    }

    // Update item visibility
    for (const item of allItems) {
      item.visible = this.scoreItem(item, query) > 0
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
    const itemY = item.y
    const scrollBoxY = this.scrollBox.content.y
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

function ActionDialog({ itemTitle }: { itemTitle?: string }): any {
  const inFocus = useIsInFocus()

  useKeyboard((evt) => {
    if (!inFocus) return
    if (evt.name === 'escape') {
      const state = useStore.getState()
      useStore.setState({
        dialogStack: state.dialogStack.slice(0, -1),
      })
    }
  })

  return (
    <box flexDirection="column" padding={1}>
      <text>Actions for: {itemTitle || 'No item selected'}</text>
      <text marginTop={1}>Press ESC to close</text>
    </box>
  )
}

interface ListProps {
  children?: React.ReactNode
  placeholder?: string
  defaultSearchQuery?: string
}

function CustomList({ children, placeholder, defaultSearchQuery }: ListProps) {
  const listRef = useRef<CustomListRenderable>(null)
  const inFocus = useIsInFocus()



  useKeyboard((evt) => {
    if (!inFocus || !listRef.current) return
    if (evt.name === 'up') listRef.current.moveSelection(-1)
    if (evt.name === 'down') listRef.current.moveSelection(1)
    if (evt.name === 'return') listRef.current.activateSelected()
    if (evt.name === 'k' && evt.ctrl) {
      const selectedItem = listRef.current.getSelectedItem()
      const state = useStore.getState()
      useStore.setState({
        dialogStack: [
          ...state.dialogStack,
          {
            element: <ActionDialog itemTitle={selectedItem?.itemTitle} />,
            position: 'center',
          },
        ],
      })
    }
  })

  return (
    <custom-list ref={listRef} flexGrow={1} placeholder={placeholder} defaultSearchQuery={defaultSearchQuery}>
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

if (import.meta.main) {
  renderWithProviders(<Example />)
}

export { CustomList, CustomListItem, Example }
