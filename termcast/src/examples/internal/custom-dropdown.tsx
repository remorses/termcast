/**
 * Custom Dropdown Component
 *
 * Reusable dropdown with search, scroll, keyboard navigation.
 * Uses same pattern as custom-renderable-list-v2.tsx:
 * - Custom renderables for Dropdown/DropdownItem
 * - onLifecyclePass for item registration
 * - Zustand store for state sync with React
 */

import {
  Renderable,
  BoxRenderable,
  TextRenderable,
  ScrollBoxRenderable,
  type RenderContext,
  type BoxOptions,
} from '@opentui/core'
import { extend, useKeyboard } from '@opentui/react'
import React, { useRef, useState } from 'react'
import { renderWithProviders } from '../../utils'
import { create } from 'zustand'
import { Theme } from 'termcast/src/theme'


// ─────────────────────────────────────────────────────────────────────────────
// Zustand Store
// ─────────────────────────────────────────────────────────────────────────────

interface DropdownStoreState {
  selectedIndex: number
  visibleCount: number
  totalCount: number
  searchQuery: string
  renderTick: number
}

const useDropdownStore = create<DropdownStoreState>(() => ({
  selectedIndex: 0,
  visibleCount: 0,
  totalCount: 0,
  searchQuery: '',
  renderTick: 0,
}))

// ─────────────────────────────────────────────────────────────────────────────
// Helper: Find parent of specific type
// ─────────────────────────────────────────────────────────────────────────────

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
// DropdownItem Renderable
// ─────────────────────────────────────────────────────────────────────────────

interface DropdownItemOptions extends BoxOptions {
  itemTitle?: string
  itemId?: string
  keywords?: string[]
  onSelect?: () => void
}

class DropdownItemRenderable extends BoxRenderable {
  public itemTitle = ''
  public itemId?: string
  public keywords?: string[]
  public onSelect?: () => void
  public visibleIndex = -1
  private parentDropdown?: DropdownRenderable

  constructor(ctx: RenderContext, options: DropdownItemOptions) {
    super(ctx, { ...options, flexDirection: 'row', width: '100%' })

    this.onLifecyclePass = () => {
      if (!this.parentDropdown) {
        this.parentDropdown = findParent(this, DropdownRenderable)
        this.parentDropdown?.registerItem(this)
      }
    }
  }

  matchesSearch(query: string): boolean {
    if (!query) return true
    const lowerQuery = query.toLowerCase()
    if (this.itemTitle.toLowerCase().includes(lowerQuery)) return true
    if (this.keywords?.some((k) => k.toLowerCase().includes(lowerQuery))) return true
    return false
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Dropdown Renderable
// ─────────────────────────────────────────────────────────────────────────────

interface DropdownOptions extends BoxOptions {
  placeholder?: string
  onSelect?: (itemId: string) => void
  onSelectionChange?: (itemId: string) => void
}

class DropdownRenderable extends BoxRenderable {
  private registeredItems: Set<DropdownItemRenderable> = new Set()
  private searchInput: TextRenderable
  private scrollBox: ScrollBoxRenderable
  private statusText: TextRenderable
  public searchQuery = ''
  public onSelect?: (itemId: string) => void
  public onSelectionChange?: (itemId: string) => void

  constructor(ctx: RenderContext, options: DropdownOptions) {
    super(ctx, { ...options, flexDirection: 'column' })

    // Search input display
    this.searchInput = new TextRenderable(ctx, {
      content: options.placeholder || 'Search...',
      fg: Theme.textMuted,
    })
    super.add(this.searchInput)

    // Scrollable content area
    this.scrollBox = new ScrollBoxRenderable(ctx, {
      flexDirection: 'column',
      flexGrow: 1,
    })
    super.add(this.scrollBox)

    // Status text
    this.statusText = new TextRenderable(ctx, {
      content: '0 items',
      fg: Theme.textMuted,
    })
    super.add(this.statusText)
  }

  add(child: Renderable, index?: number): number {
    return this.scrollBox.add(child, index)
  }

  registerItem(item: DropdownItemRenderable) {
    this.registeredItems.add(item)
    this.refilter()
  }

  private getAllItems(): DropdownItemRenderable[] {
    return Array.from(this.registeredItems)
  }

  setSearchQuery(query: string) {
    this.searchQuery = query
    this.searchInput.content = query || 'Search...'
    this.searchInput.fg = query ? Theme.text : Theme.textMuted
    useDropdownStore.setState({ searchQuery: query })
    this.refilter()
  }

  private refilter() {
    const allItems = this.getAllItems()
    let visibleIndex = 0

    for (const item of allItems) {
      const matches = item.matchesSearch(this.searchQuery)
      if (matches) {
        item.visibleIndex = visibleIndex++
        item.visible = true
      } else {
        item.visibleIndex = -1
        item.visible = false
      }
    }

    const { selectedIndex } = useDropdownStore.getState()
    const clampedIndex = Math.min(Math.max(0, selectedIndex), visibleIndex - 1)

    useDropdownStore.setState({
      visibleCount: visibleIndex,
      totalCount: allItems.length,
      selectedIndex: clampedIndex >= 0 ? clampedIndex : 0,
      renderTick: useDropdownStore.getState().renderTick + 1,
    })

    this.updateStatusText(visibleIndex, allItems.length)
    this.notifySelectionChange(clampedIndex >= 0 ? clampedIndex : 0)
  }

  private updateStatusText(visibleCount: number, totalCount: number) {
    const searchText = this.searchQuery ? ` • "${this.searchQuery}"` : ''
    this.statusText.content = `${visibleCount} of ${totalCount} items${searchText}`
  }

  moveSelection(delta: number) {
    const { selectedIndex, visibleCount } = useDropdownStore.getState()
    if (visibleCount === 0) return

    const newIndex = (selectedIndex + delta + visibleCount) % visibleCount
    useDropdownStore.setState({ selectedIndex: newIndex })
    this.scrollToIndex(newIndex)
    this.notifySelectionChange(newIndex)
  }

  private scrollToIndex(index: number) {
    const item = this.getAllItems().find((i) => i.visibleIndex === index)
    if (item && this.scrollBox) {
      // Use scrollTo method from ScrollBoxRenderable
      const itemHeight = 1 // Each item is 1 row
      const targetY = index * itemHeight
      this.scrollBox.scrollTo(targetY)
    }
  }

  private notifySelectionChange(index: number) {
    const item = this.getAllItems().find((i) => i.visibleIndex === index)
    if (item && this.onSelectionChange) {
      this.onSelectionChange(item.itemId || item.itemTitle)
    }
  }

  triggerSelect() {
    const { selectedIndex } = useDropdownStore.getState()
    const item = this.getAllItems().find((i) => i.visibleIndex === selectedIndex)
    if (item) {
      item.onSelect?.()
      this.onSelect?.(item.itemId || item.itemTitle)
    }
  }

  getFirstItemTitle(): string {
    const items = this.getAllItems().filter((i) => i.visibleIndex !== -1)
    items.sort((a, b) => a.visibleIndex - b.visibleIndex)
    return items[0]?.itemTitle ?? ''
  }

  getSelectedItemTitle(): string {
    const { selectedIndex } = useDropdownStore.getState()
    const item = this.getAllItems().find((i) => i.visibleIndex === selectedIndex)
    return item?.itemTitle ?? ''
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Register custom elements
// ─────────────────────────────────────────────────────────────────────────────

extend({
  'custom-dropdown': DropdownRenderable,
  'custom-dropdown-item': DropdownItemRenderable,
})

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'custom-dropdown': DropdownOptions & { ref?: React.Ref<DropdownRenderable> }
      'custom-dropdown-item': DropdownItemOptions & { ref?: React.Ref<DropdownItemRenderable> }
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// React Components
// ─────────────────────────────────────────────────────────────────────────────

interface DropdownProps {
  children?: React.ReactNode
  placeholder?: string
  onSelect?: (itemId: string) => void
  onSelectionChange?: (itemId: string) => void
}

function Dropdown({ children, placeholder, onSelect, onSelectionChange }: DropdownProps): any {
  const dropdownRef = useRef<DropdownRenderable>(null)
  useKeyboard((evt) => {
    const dropdown = dropdownRef.current
    if (!dropdown) return

    if (evt.name === 'up') {
      dropdown.moveSelection(-1)
      return
    }

    if (evt.name === 'down') {
      dropdown.moveSelection(1)
      return
    }

    if (evt.name === 'return') {
      const selectedTitle = dropdown.getSelectedItemTitle()
      if (selectedTitle && onSelect) {
        onSelect(selectedTitle)
      }
      dropdown.triggerSelect() // Also trigger item's onSelect
      return
    }

    if (evt.name === 'backspace') {
      const current = dropdown.searchQuery
      dropdown.setSearchQuery(current.slice(0, -1))
      return
    }

    // Typing for search
    if (evt.name.length === 1 && /^[a-zA-Z0-9]$/.test(evt.name) && !evt.ctrl && !evt.meta) {
      dropdown.setSearchQuery(dropdown.searchQuery + evt.name)
    }
  })

  return (
    <custom-dropdown
      ref={dropdownRef}
      placeholder={placeholder}
      onSelect={onSelect}
      onSelectionChange={onSelectionChange}
      flexGrow={1}
    >
      {children}
    </custom-dropdown>
  )
}

interface DropdownItemProps {
  id?: string
  title: string
  keywords?: string[]
  onSelect?: () => void
}

function DropdownItem({ id, title, keywords, onSelect }: DropdownItemProps): any {
  const itemRef = useRef<DropdownItemRenderable>(null)
  const selectedIndex = useDropdownStore((s) => s.selectedIndex)
  useDropdownStore((s) => s.renderTick)

  const isSelected = itemRef.current?.visibleIndex === selectedIndex

  return (
    <custom-dropdown-item
      ref={itemRef}
      itemTitle={title}
      itemId={id}
      keywords={keywords}
      onSelect={onSelect}
      backgroundColor={isSelected ? Theme.accent : undefined}
      flexShrink={0}
    >
      <text flexShrink={0}>{isSelected ? '› ' : '  '}</text>
      <text flexShrink={0}>{title}</text>
    </custom-dropdown-item>
  )
}

// Compound component
interface DropdownType {
  (props: DropdownProps): any
  Item: typeof DropdownItem
}

const CustomDropdown: DropdownType = Dropdown as DropdownType
CustomDropdown.Item = DropdownItem

export { CustomDropdown, Dropdown, DropdownItem, useDropdownStore, DropdownRenderable, DropdownItemRenderable }

// ─────────────────────────────────────────────────────────────────────────────
// Example
// ─────────────────────────────────────────────────────────────────────────────

function Example({ useMany = false }: { useMany?: boolean }): any {
  const [selectedItem, setSelectedItem] = useState<string | null>(null)
  const [hoverItem, setHoverItem] = useState<string | null>(null)

  const defaultItems = [
    { id: 'apple', title: 'Apple', keywords: ['fruit', 'red'] },
    { id: 'banana', title: 'Banana', keywords: ['fruit', 'yellow'] },
    { id: 'carrot', title: 'Carrot', keywords: ['vegetable', 'orange'] },
    { id: 'date', title: 'Date', keywords: ['fruit', 'sweet'] },
  ]

  // Generate many items for scroll testing
  const manyItems = Array.from({ length: 20 }, (_, i) => ({
    id: `item-${i + 1}`,
    title: `Item ${i + 1}`,
  }))

  const items = useMany ? manyItems : defaultItems

  return (
    <box flexDirection="column" padding={1} height="100%">
      <text marginBottom={1}>Custom Dropdown Example</text>

      {selectedItem && <text flexShrink={0} fg={Theme.accent}>Selected: {selectedItem}</text>}
      {hoverItem && <text flexShrink={0} fg={Theme.textMuted}>Hover: {hoverItem}</text>}

      <box marginTop={1} height={10} border={['top', 'bottom', 'left', 'right']} borderStyle="single">
        <CustomDropdown
          placeholder="Search items..."
          onSelect={(id) => {
            setSelectedItem(items.find((i) => i.id === id)?.title || id)
          }}
          onSelectionChange={(id) => {
            setHoverItem(items.find((i) => i.id === id)?.title || id)
          }}
        >
          {items.map((item) => (
            <CustomDropdown.Item
              key={item.id}
              id={item.id}
              title={item.title}
              keywords={'keywords' in item ? (item.keywords as string[]) : undefined}
            />
          ))}
        </CustomDropdown>
      </box>
    </box>
  )
}

export { Example }

if (import.meta.main) {
  useDropdownStore.setState({
    selectedIndex: 0,
    visibleCount: 0,
    totalCount: 0,
    searchQuery: '',
    renderTick: 0,
  })
  // Check for --many flag to test scrolling with many items
  const useMany = process.argv.includes('--many')
  renderWithProviders(<Example useMany={useMany} />)
}
