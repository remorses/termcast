/**
 * Custom Renderable List V2 - Wrapper Pattern
 *
 * This example uses opentui's extend() to register thin wrapper renderables
 * that handle tracking and visibility, while React handles all UI rendering.
 *
 * ## Architecture
 *
 * CustomListRenderable (custom renderable)
 * ├── owns: filtering logic, navigation, scrolling
 * ├── children redirected to scrollBox
 * │
 * └── CustomListItemWrapperRenderable (thin wrapper)
 *     ├── tracks: keywords, onAction, section, visibleIndex
 *     ├── handles: visibility (height: 0 when hidden)
 *     └── React children render all UI (indicator, title, subtitle)
 *
 * ## Key Patterns
 *
 * 1. Wrapper renderables self-register via onLifecyclePass (SYNC)
 * 2. All UI in JSX - wrappers only track/hide
 * 3. Zustand store for React state (selectedIndex, visibleCount, searchQuery)
 * 4. Renderable calls zustand.setState to trigger React re-renders
 * 5. Items compare visibleIndex to selectedIndex from zustand
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
import { useStore } from 'termcast/src/state'
import React, { useRef, useLayoutEffect } from 'react'
import { renderWithProviders } from '../../utils'
import { create } from 'zustand'
import { Theme } from 'termcast/src/theme'

// ─────────────────────────────────────────────────────────────────────────────
// Zustand Store
// ─────────────────────────────────────────────────────────────────────────────

interface CustomListStoreState {
  selectedIndex: number
  visibleCount: number
  totalCount: number
  searchQuery: string
  // Incremented on each refilter to force React re-renders
  // This ensures items re-render after their visibleIndex is set
  renderTick: number
}

const useCustomListStore = create<CustomListStoreState>(() => ({
  selectedIndex: 0,
  visibleCount: 0,
  totalCount: 0,
  searchQuery: '',
  renderTick: 0,
}))

// ─────────────────────────────────────────────────────────────────────────────
// Renderable Options
// ─────────────────────────────────────────────────────────────────────────────

interface CustomListItemWrapperOptions extends BoxOptions {
  keywords?: string[]
  onAction?: () => void
  itemTitle?: string
  itemSubtitle?: string
}

interface CustomListSectionWrapperOptions extends BoxOptions {
  sectionTitle?: string
}

interface CustomListEmptyViewWrapperOptions extends BoxOptions {
  emptyTitle?: string
  emptyDescription?: string
}

interface CustomListOptions extends BoxOptions {
  placeholder?: string
  defaultSearchQuery?: string
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper: Find parent of specific type by traversing up
// ─────────────────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────────
// CustomListItemWrapperRenderable - thin wrapper for tracking/hiding
// ─────────────────────────────────────────────────────────────────────────────

class CustomListItemWrapperRenderable extends BoxRenderable {
  private parentList?: CustomListRenderable

  // Props set by React - used for filtering
  public keywords?: string[]
  public onAction?: () => void
  public itemTitle = ''
  public itemSubtitle?: string

  // Set by parent during refilter
  public visibleIndex = -1
  public section?: CustomListSectionWrapperRenderable

  constructor(ctx: RenderContext, options: CustomListItemWrapperOptions) {
    super(ctx, { ...options, flexDirection: 'row', width: '100%' })
    // NO UI creation - React children provide that

    // Self-register with parent list after being added to tree
    this.onLifecyclePass = () => {
      if (!this.parentList) {
        this.parentList = findParent(this, CustomListRenderable)
        this.section = findParent(this, CustomListSectionWrapperRenderable)
        this.parentList?.registerItem(this)
      }
    }

    // Example: register click handler directly on renderable
    this.onMouseDown = (event) => {
      console.log('CustomListItemWrapperRenderable clicked:', this.itemTitle, event)
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CustomListSectionWrapperRenderable - thin wrapper for sections
// ─────────────────────────────────────────────────────────────────────────────

class CustomListSectionWrapperRenderable extends BoxRenderable {
  private parentList?: CustomListRenderable

  // Props set by React
  public sectionTitle?: string

  constructor(ctx: RenderContext, options: CustomListSectionWrapperOptions) {
    super(ctx, { ...options, flexDirection: 'column', width: '100%' })
    // NO UI creation - React children provide that

    // Self-register with parent list after being added to tree
    this.onLifecyclePass = () => {
      if (!this.parentList) {
        this.parentList = findParent(this, CustomListRenderable)
        this.parentList?.registerSection(this)
      }
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CustomListEmptyViewWrapperRenderable - data holder for empty state
// ─────────────────────────────────────────────────────────────────────────────

class CustomListEmptyViewWrapperRenderable extends BoxRenderable {
  private parentList?: CustomListRenderable

  // Props set by React - read by parent for empty state
  public emptyTitle = 'No items'
  public emptyDescription?: string

  constructor(ctx: RenderContext, options: CustomListEmptyViewWrapperOptions) {
    // Hidden by default - this is just a data holder
    super(ctx, { ...options, visible: false })

    // Self-register with parent list after being added to tree
    this.onLifecyclePass = () => {
      if (!this.parentList) {
        this.parentList = findParent(this, CustomListRenderable)
        this.parentList?.registerEmptyView(this)
      }
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CustomListRenderable - parent container with filtering/navigation logic
// ─────────────────────────────────────────────────────────────────────────────

class CustomListRenderable extends BoxRenderable {
  // Registered children (they register themselves via onLifecyclePass)
  private registeredItems = new Set<CustomListItemWrapperRenderable>()
  private registeredSections = new Set<CustomListSectionWrapperRenderable>()
  private emptyView?: CustomListEmptyViewWrapperRenderable

  // Internal state
  private searchQuery = ''

  // UI components owned by renderable
  private scrollBox: ScrollBoxRenderable
  private searchInput: TextareaRenderable
  private statusText: TextRenderable

  // Prop with setter - updates search input placeholder
  private _placeholder = 'Search...'
  get placeholder() {
    return this._placeholder
  }
  set placeholder(value: string) {
    this._placeholder = value
    this.searchInput.placeholder = value
  }

  // Prop with setter - sets initial search query
  private _defaultSearchQuery = ''
  get defaultSearchQuery() {
    return this._defaultSearchQuery
  }
  set defaultSearchQuery(value: string) {
    if (this._defaultSearchQuery === value) return
    this._defaultSearchQuery = value
    // Set search input text
    this.searchInput.editBuffer?.setText(value)
    this.searchQuery = value
    // Refilter will be called after items register
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

    // Subscribe to zustand store for defaultSearchQuery sync
    // When React sets defaultSearchQuery prop, we need to refilter
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Child Management - redirect to scrollBox
  // ─────────────────────────────────────────────────────────────────────────

  add(child: Renderable, index?: number): number {
    return this.scrollBox.add(child, index)
  }

  insertBefore(child: unknown, anchor?: unknown): number {
    return this.scrollBox.insertBefore(child, anchor)
  }

  remove(id: string): void {
    this.scrollBox.remove(id)
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Registration - children call these via onLifecyclePass
  // ─────────────────────────────────────────────────────────────────────────

  registerItem(item: CustomListItemWrapperRenderable) {
    this.registeredItems.add(item)
    this.refilter()
  }

  registerSection(section: CustomListSectionWrapperRenderable) {
    this.registeredSections.add(section)
  }

  registerEmptyView(emptyView: CustomListEmptyViewWrapperRenderable) {
    this.emptyView = emptyView
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Filtering
  // ─────────────────────────────────────────────────────────────────────────

  setSearchQuery(query: string) {
    if (this.searchQuery === query) return
    this.searchQuery = query
    this.refilter()
  }

  private refilter() {
    const query = this.searchQuery.toLowerCase()
    const allItems = this.getAllItems()
    let visibleIndex = 0

    // Update item visibility and visible indices
    // We use the `visible` prop instead of conditional rendering to keep elements
    // in the tree - this preserves registration order and visibleIndex for navigation
    for (const item of allItems) {
      const matches = !query || this.scoreItem(item, query) > 0
      item.visible = matches
      item.visibleIndex = matches ? visibleIndex++ : -1
    }

    // Update section visibility based on their items
    for (const section of this.registeredSections) {
      const sectionItems = allItems.filter((item) => item.section === section)
      const hasVisibleItems = sectionItems.some((item) => item.visible)
      section.visible = hasVisibleItems
    }

    // Get current selection and clamp it
    const { selectedIndex, renderTick } = useCustomListStore.getState()
    const newSelectedIndex = Math.max(0, Math.min(selectedIndex, Math.max(0, visibleIndex - 1)))

    // Update zustand store - triggers React re-render
    // Increment renderTick to ensure items re-render after visibleIndex is set
    useCustomListStore.setState({
      searchQuery: this.searchQuery,
      visibleCount: visibleIndex,
      totalCount: allItems.length,
      selectedIndex: visibleIndex > 0 ? newSelectedIndex : 0,
      renderTick: renderTick + 1,
    })

    // Update status text (owned by renderable, not React)
    this.updateStatusText(visibleIndex, allItems.length, this.searchQuery)
  }

  private scoreItem(item: CustomListItemWrapperRenderable, query: string): number {
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
  // Helpers - clean stale refs
  // ─────────────────────────────────────────────────────────────────────────

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

  private getAllItems(): CustomListItemWrapperRenderable[] {
    // Clean stale refs (items no longer in tree)
    for (const item of this.registeredItems) {
      if (!this.isConnected(item)) {
        this.registeredItems.delete(item)
      }
    }
    return Array.from(this.registeredItems)
  }


  private updateStatusText(visibleCount: number, totalCount: number, searchQuery: string) {
    this.statusText.content = searchQuery
      ? `${visibleCount} of ${totalCount} items • Searching: "${searchQuery}"`
      : `${visibleCount} of ${totalCount} items`
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Navigation - called by React via ref
  // ─────────────────────────────────────────────────────────────────────────

  moveSelection(delta: number) {
    const { selectedIndex, visibleCount } = useCustomListStore.getState()
    if (visibleCount === 0) return

    const newIndex = (selectedIndex + delta + visibleCount) % visibleCount
    useCustomListStore.setState({ selectedIndex: newIndex })
    this.scrollToIndex(newIndex)
  }

  private scrollToIndex(index: number) {
    const item = this.getAllItems().find((i) => i.visibleIndex === index)
    if (!item) return

    const itemY = item.y
    const scrollBoxY = this.scrollBox.content.y
    const viewportHeight = this.scrollBox.viewport?.height || 10

    const relativeY = itemY - scrollBoxY
    const targetScrollTop = relativeY - Math.floor(viewportHeight / 2)
    this.scrollBox.scrollTop = Math.max(0, targetScrollTop)
  }

  activateSelected() {
    const { selectedIndex } = useCustomListStore.getState()
    const item = this.getAllItems().find((i) => i.visibleIndex === selectedIndex)
    item?.onAction?.()
  }

  // Get selected item's title - for dialog display
  getSelectedItemTitle(): string | undefined {
    const { selectedIndex } = useCustomListStore.getState()
    const item = this.getAllItems().find((i) => i.visibleIndex === selectedIndex)
    return item?.itemTitle
  }

  // Get empty view data - for React to render
  getEmptyViewData(): { title: string; description?: string } | undefined {
    if (!this.emptyView) return undefined
    return {
      title: this.emptyView.emptyTitle,
      description: this.emptyView.emptyDescription,
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Register with opentui
// ─────────────────────────────────────────────────────────────────────────────

extend({
  'custom-list-v2': CustomListRenderable,
  'custom-list-item-wrapper-v2': CustomListItemWrapperRenderable,
  'custom-list-section-wrapper-v2': CustomListSectionWrapperRenderable,
  'custom-list-empty-view-wrapper-v2': CustomListEmptyViewWrapperRenderable,
})

// ─────────────────────────────────────────────────────────────────────────────
// React Components
// ─────────────────────────────────────────────────────────────────────────────

// Action Dialog - same as v1
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

// ─────────────────────────────────────────────────────────────────────────────
// CustomList React Component
// ─────────────────────────────────────────────────────────────────────────────

interface ListProps {
  children?: React.ReactNode
  placeholder?: string
  defaultSearchQuery?: string
}

function CustomList({ children, placeholder, defaultSearchQuery }: ListProps): any {
  const listRef = useRef<CustomListRenderable>(null)
  const inFocus = useIsInFocus()

  // Subscribe to zustand for UI updates
  const visibleCount = useCustomListStore((s) => s.visibleCount)
  const totalCount = useCustomListStore((s) => s.totalCount)
  const searchQuery = useCustomListStore((s) => s.searchQuery)

  // Get empty view data from renderable
  const emptyViewData = listRef.current?.getEmptyViewData()

  // Keyboard navigation
  useKeyboard((evt) => {
    if (!inFocus || !listRef.current) return
    if (evt.name === 'up') listRef.current.moveSelection(-1)
    if (evt.name === 'down') listRef.current.moveSelection(1)
    if (evt.name === 'return') listRef.current.activateSelected()
    if (evt.name === 'k' && evt.ctrl) {
      const selectedItemTitle = listRef.current.getSelectedItemTitle()
      const state = useStore.getState()
      useStore.setState({
        dialogStack: [
          ...state.dialogStack,
          {
            element: <ActionDialog itemTitle={selectedItemTitle} />,
            position: 'center',
          },
        ],
      })
    }
  })

  return (
    <custom-list-v2 ref={listRef} flexGrow={1} placeholder={placeholder} defaultSearchQuery={defaultSearchQuery}>
      {children}
      {/* Empty view - rendered by React based on zustand state */}
      {visibleCount === 0 && totalCount > 0 && (
        <box padding={1} flexDirection="column">
          <text>{emptyViewData?.title || `No results for "${searchQuery}"`}</text>
          {emptyViewData?.description && <text>{emptyViewData.description}</text>}
        </box>
      )}
      {/* Status text is rendered by the renderable outside the scrollbox */}
    </custom-list-v2>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// CustomListItem React Component - all UI in JSX
// ─────────────────────────────────────────────────────────────────────────────

interface ListItemProps {
  title: string
  subtitle?: string
  keywords?: string[]
  onAction?: () => void
}

function CustomListItem({ title, subtitle, keywords, onAction }: ListItemProps): any {
  const wrapperRef = useRef<CustomListItemWrapperRenderable>(null)
  const selectedIndex = useCustomListStore((s) => s.selectedIndex)
  // Subscribe to renderTick to force re-render after visibleIndex is set
  useCustomListStore((s) => s.renderTick)

  // Compare visibleIndex to selectedIndex
  const isSelected = wrapperRef.current?.visibleIndex === selectedIndex

  return (
    <custom-list-item-wrapper-v2
      ref={wrapperRef}
      keywords={keywords}
      onAction={onAction}
      itemTitle={title}
      itemSubtitle={subtitle}
      backgroundColor={isSelected ? '#0066cc' : undefined}
      flexShrink={0}
    >
      {/* All UI in JSX */}
      <text flexShrink={0}>{isSelected ? '› ' : '  '}</text>
      <text flexShrink={0}>{title}</text>
      {subtitle && <text flexShrink={0} fg={Theme.textMuted}> {subtitle}</text>}
    </custom-list-item-wrapper-v2>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// CustomListSection React Component - all UI in JSX
// ─────────────────────────────────────────────────────────────────────────────

interface ListSectionProps {
  title?: string
  children?: React.ReactNode
}

function CustomListSection({ title, children }: ListSectionProps): any {
  return (
    <custom-list-section-wrapper-v2 sectionTitle={title} flexShrink={0}>
      {/* Section header in JSX */}
      {title && (
        <text paddingTop={1} paddingLeft={1} flexShrink={0}>
          ── {title} ──
        </text>
      )}
      {children}
    </custom-list-section-wrapper-v2>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// CustomListEmptyView React Component - data holder
// ─────────────────────────────────────────────────────────────────────────────

interface ListEmptyViewProps {
  title?: string
  description?: string
}

function CustomListEmptyView({ title, description }: ListEmptyViewProps): any {
  return <custom-list-empty-view-wrapper-v2 emptyTitle={title} emptyDescription={description} />
}

// ─────────────────────────────────────────────────────────────────────────────
// Compound Component
// ─────────────────────────────────────────────────────────────────────────────

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

// Wrapper component to test tree traversal (items nested in other components)
function ItemWrapper({ children }: { children: React.ReactNode }): any {
  return <box>{children}</box>
}

function Example(): any {
  return (
    <box flexDirection="column" padding={1} flexGrow={1}>
      <text marginBottom={1}>Custom Renderable List (using extend)</text>
      <CustomList placeholder="Search items...">
        <CustomList.EmptyView title="Nothing found" description="Try a different search term" />
        <CustomList.Section title="Fruits">
          {FRUITS.map((item) => (
            <ItemWrapper key={item.title}>
              <CustomList.Item
                title={item.title}
                subtitle={item.subtitle}
                keywords={item.keywords}
                onAction={() => {
                  console.log(`Selected: ${item.title}`)
                }}
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
              onAction={() => {
                console.log(`Selected: ${item.title}`)
              }}
            />
          ))}
        </CustomList.Section>
      </CustomList>
    </box>
  )
}

// Reset store when running as main (for testing isolation)
if (import.meta.main) {
  useCustomListStore.setState({
    selectedIndex: 0,
    visibleCount: 0,
    totalCount: 0,
    searchQuery: '',
    renderTick: 0,
  })
  renderWithProviders(<Example />)
}

export { CustomList, CustomListItem, CustomListSection, CustomListEmptyView, Example, useCustomListStore }
