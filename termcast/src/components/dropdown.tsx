/**
 * Dropdown Component - Custom Renderable Pattern
 *
 * Uses same pattern as custom-renderable-list-v2.tsx:
 * - Custom renderables for Dropdown/DropdownItem/DropdownSection
 * - onLifecyclePass for item registration
 * - Zustand store for state sync with React
 *
 * Architecture:
 * DropdownRenderable (custom renderable)
 * ├── owns: scrollBox, searchInput, navigation logic
 * ├── children redirected to scrollBox
 * │
 * ├── DropdownSectionWrapperRenderable (thin wrapper)
 * │   ├── tracks: sectionTitle
 * │   └── React children render section header + items
 * │
 * └── DropdownItemWrapperRenderable (thin wrapper)
 *     ├── tracks: value, title, keywords, visibleIndex
 *     ├── handles: visibility (hidden when filtered out)
 *     └── React children render all UI (icon, title, label)
 */

import React, { ReactNode, useRef, useState, useEffect, useLayoutEffect } from 'react'
import {
  Renderable,
  BoxRenderable,
  TextRenderable,
  ScrollBoxRenderable,
  TextareaRenderable,
  type RenderContext,
  type BoxOptions,
  TextAttributes,
} from '@opentui/core'
import { extend, useKeyboard, flushSync } from '@opentui/react'
import { create } from 'zustand'
import { useTheme } from 'termcast/src/theme'
import { getIconValue } from 'termcast/src/components/icon'
import { logger } from 'termcast/src/logger'
import { useStore } from 'termcast/src/state'
import { useIsInFocus } from 'termcast/src/internal/focus-context'
import { useIsOffscreen } from 'termcast/src/internal/offscreen'
import { CommonProps } from 'termcast/src/utils'

// ─────────────────────────────────────────────────────────────────────────────
// Zustand Store - instance-scoped via context
// ─────────────────────────────────────────────────────────────────────────────

interface ItemState {
  visibleIndex: number
}

interface DropdownStoreState {
  selectedIndex: number
  visibleCount: number
  totalCount: number
  searchQuery: string
  currentValue: string | undefined
  // Item visibility state keyed by value - eliminates need for renderTick
  itemStates: Record<string, ItemState>
}

type DropdownStore = ReturnType<typeof createDropdownStore>

function createDropdownStore() {
  return create<DropdownStoreState>(() => ({
    selectedIndex: 0,
    visibleCount: 0,
    totalCount: 0,
    searchQuery: '',
    currentValue: undefined,
    itemStates: {},
  }))
}

// Context to provide store to children
const DropdownStoreContext = React.createContext<DropdownStore | null>(null)

function useDropdownStore<T>(selector: (state: DropdownStoreState) => T): T {
  const store = React.useContext(DropdownStoreContext)
  if (!store) {
    throw new Error('useDropdownStore must be used within a Dropdown')
  }
  return store(selector)
}

function useDropdownStoreApi(): DropdownStore {
  const store = React.useContext(DropdownStoreContext)
  if (!store) {
    throw new Error('useDropdownStoreApi must be used within a Dropdown')
  }
  return store
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper: Find parent of specific type
// ─────────────────────────────────────────────────────────────────────────────

function findParent<T>(
  node: Renderable,
  type: abstract new (...args: any[]) => T,
): T | undefined {
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
// Renderable Options
// ─────────────────────────────────────────────────────────────────────────────

interface DropdownItemWrapperOptions extends BoxOptions {
  itemValue?: string
  itemTitle?: string
  keywords?: string[]
  icon?: ReactNode
  label?: string
  color?: string
}

interface DropdownSectionWrapperOptions extends BoxOptions {
  sectionTitle?: string
}

interface DropdownOptions extends BoxOptions {
  placeholder?: string
  tooltip?: string
  defaultValue?: string
  filtering?: boolean | { keepSectionOrder: boolean }
  onSearchTextChange?: (text: string) => void
  onChange?: (value: string) => void
  onSelectionChange?: (value: string) => void
}

// ─────────────────────────────────────────────────────────────────────────────
// DropdownItemWrapperRenderable - thin wrapper for tracking/hiding
// ─────────────────────────────────────────────────────────────────────────────

class DropdownItemWrapperRenderable extends BoxRenderable {
  private parentDropdown?: DropdownRenderable

  // Props set by React - used for filtering
  public itemValue = ''
  public itemTitle = ''
  public keywords?: string[]
  public icon?: ReactNode
  public label?: string
  public color?: string

  // Set by parent during refilter
  public visibleIndex = -1
  public section?: DropdownSectionWrapperRenderable

  constructor(ctx: RenderContext, options: DropdownItemWrapperOptions) {
    super(ctx, { ...options, flexDirection: 'row', width: '100%' })
    // NO UI creation - React children provide that

    // Self-register with parent dropdown after being added to tree
    this.onLifecyclePass = () => {
      if (!this.parentDropdown) {
        this.parentDropdown = findParent(this, DropdownRenderable)
        this.section = findParent(this, DropdownSectionWrapperRenderable)
        this.parentDropdown?.registerItem(this)
      }
    }
  }

  matchesSearch(query: string): boolean {
    if (!query) return true
    const lowerQuery = query.toLowerCase()
    if (this.itemTitle.toLowerCase().includes(lowerQuery)) return true
    if (this.keywords?.some((k) => k.toLowerCase().includes(lowerQuery))) {
      return true
    }
    return false
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// DropdownSectionWrapperRenderable - thin wrapper for sections
// ─────────────────────────────────────────────────────────────────────────────

class DropdownSectionWrapperRenderable extends BoxRenderable {
  private parentDropdown?: DropdownRenderable

  // Props set by React
  public sectionTitle?: string

  constructor(ctx: RenderContext, options: DropdownSectionWrapperOptions) {
    super(ctx, { ...options, flexDirection: 'column', width: '100%' })
    // NO UI creation - React children provide that

    // Self-register with parent dropdown after being added to tree
    this.onLifecyclePass = () => {
      if (!this.parentDropdown) {
        this.parentDropdown = findParent(this, DropdownRenderable)
        this.parentDropdown?.registerSection(this)
      }
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// DropdownRenderable - parent container with filtering/navigation logic
// ─────────────────────────────────────────────────────────────────────────────
//
// STATE FLOW:
//   React props/state → zustand store → renderable reads from store
//   React component is responsible for updating the store (via useEffect or callbacks).
//   Renderable reads from store.getState() when it needs values.
//
// WHEN TO ADD A PROP TO THE CLASS:
//   Only add a prop (with getter/setter) if the RENDERABLE needs to use it in its
//   imperative logic (e.g. `filtering` is used in refilter()). If React just needs
//   the value for rendering JSX, keep it in React scope - don't pass through renderable.
//
// TEXTAREA NOTE:
//   This renderable does NOT own a TextareaRenderable for search input. The React
//   <textarea> handles both display AND input, calling setSearchQuery() directly.
//   This avoids sync issues where an internal textarea captures keystrokes but a
//   separate React textarea displays content.
//
// ─────────────────────────────────────────────────────────────────────────────

class DropdownRenderable extends ScrollBoxRenderable {
  // Registered children (they register themselves via onLifecyclePass)
  private registeredItems = new Set<DropdownItemWrapperRenderable>()
  private registeredSections = new Set<DropdownSectionWrapperRenderable>()

  // Dirty flag - refilter() runs during renderSelf() when set
  // This batches multiple item registrations into one refilter pass
  private _needsRefilter = false

  // Store reference - set by React component
  public store?: DropdownStore

  // Callbacks set by React
  public onChange?: (value: string) => void
  public onSelectionChange?: (value: string) => void
  public onSearchTextChange?: (text: string) => void

  // Props used by renderable logic - only add props here if the renderable needs them
  // for imperative operations. If React just needs the value for JSX, keep it in React.
  public filtering: boolean | { keepSectionOrder: boolean } = true

  constructor(ctx: RenderContext, options: DropdownOptions) {
    // NOTE: ScrollBox internally uses flexDirection: 'row' to place wrapper and vertical
    // scrollbar side-by-side. NEVER pass flexDirection to ScrollBox options - it will
    // break the scrollbar layout and cause incorrect thumb positioning.
    super(ctx, {
      ...options,
      flexGrow: 1,
      height: 7,
      padding: 0,
      viewportOptions: {
        flexGrow: 1,
        flexShrink: 1,
        paddingRight: 1,
      },
      contentOptions: {
        flexShrink: 0,
        minHeight: 0, // let the scrollbox shrink with content
      },
      scrollbarOptions: {
        trackOptions: {
          foregroundColor: '#868e96',
        },
      },
      horizontalScrollbarOptions: {
        visible: false,
      },
    })
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Registration - children call these via onLifecyclePass
  // ─────────────────────────────────────────────────────────────────────────

  registerItem(item: DropdownItemWrapperRenderable) {
    this.registeredItems.add(item)
    this.markNeedsRefilter()
  }

  registerSection(section: DropdownSectionWrapperRenderable) {
    this.registeredSections.add(section)
    this.markNeedsRefilter()
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Filtering
  // ─────────────────────────────────────────────────────────────────────────

  setSearchQuery(query: string) {
    const currentQuery = this.store?.getState().searchQuery ?? ''
    if (currentQuery === query) return
    this.store?.setState({ searchQuery: query })
    this.markNeedsRefilter()
    this.onSearchTextChange?.(query)
  }

  private markNeedsRefilter() {
    this._needsRefilter = true
    this.requestRender()
  }

  override renderSelf(buffer: any) {
    if (this._needsRefilter) {
      this._needsRefilter = false
      this.refilter()
    }
    return super.renderSelf(buffer)
  }

  private refilter() {
    const query = (this.store?.getState().searchQuery ?? '').toLowerCase()
    const allItems = this.getAllItems()
    let visibleIndex = 0

    // Update item visibility and visible indices
    // Build itemStates for React to subscribe to
    const itemStates: Record<string, ItemState> = {}
    for (const item of allItems) {
      const matches = !this.filtering || item.matchesSearch(query)
      item.visible = matches
      item.visibleIndex = matches ? visibleIndex++ : -1
      // Store in itemStates keyed by value
      if (item.itemValue) {
        itemStates[item.itemValue] = { visibleIndex: item.visibleIndex }
      }
    }

    // Update section visibility based on their items
    for (const section of this.registeredSections) {
      const sectionItems = allItems.filter((item) => item.section === section)
      const hasVisibleItems = sectionItems.some((item) => item.visible)
      section.visible = hasVisibleItems
    }

    // Get current selection and clamp it
    if (!this.store) return
    const { selectedIndex } = this.store.getState()
    const newSelectedIndex = Math.max(
      0,
      Math.min(selectedIndex, Math.max(0, visibleIndex - 1)),
    )

    // Update zustand store - triggers React re-render via itemStates
    this.store.setState({
      visibleCount: visibleIndex,
      totalCount: allItems.length,
      selectedIndex: visibleIndex > 0 ? newSelectedIndex : 0,
      itemStates,
    })

    // Notify selection change after refilter
    if (visibleIndex > 0) {
      this.notifySelectionChange(newSelectedIndex)
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Helpers - clean stale refs
  // ─────────────────────────────────────────────────────────────────────────

  private isConnected(node: Renderable): boolean {
    let current = node.parent
    while (current) {
      if (current === this) {
        return true
      }
      current = current.parent
    }
    return false
  }

  private getAllItems(): DropdownItemWrapperRenderable[] {
    // Clean stale refs (items no longer in tree)
    for (const item of this.registeredItems) {
      if (!this.isConnected(item)) {
        this.registeredItems.delete(item)
      }
    }
    return Array.from(this.registeredItems)
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Navigation - called by React via ref
  // ─────────────────────────────────────────────────────────────────────────

  moveSelection(delta: number) {
    if (!this.store) return
    const { selectedIndex, visibleCount } = this.store.getState()
    if (visibleCount === 0) return

    const newIndex = (selectedIndex + delta + visibleCount) % visibleCount
    this.store.setState({ selectedIndex: newIndex })
    this.scrollToIndex(newIndex)
    this.notifySelectionChange(newIndex)
  }

  private scrollToIndex(index: number) {
    const item = this.getAllItems().find((i) => i.visibleIndex === index)
    if (!item) return

    const itemY = item.y
    const scrollBoxY = this.content?.y || 0
    const viewportHeight = this.viewport?.height || 10

    const relativeY = itemY - scrollBoxY
    const targetScrollTop = relativeY - Math.floor(viewportHeight / 2)
    this.scrollTop = Math.max(0, targetScrollTop)
  }

  private notifySelectionChange(index: number) {
    const item = this.getAllItems().find((i) => i.visibleIndex === index)
    if (item && this.onSelectionChange) {
      this.onSelectionChange(item.itemValue)
    }
  }

  selectCurrent() {
    if (!this.store) return
    const { selectedIndex } = this.store.getState()
    const item = this.getAllItems().find(
      (i) => i.visibleIndex === selectedIndex,
    )
    if (item) {
      this.store.setState({ currentValue: item.itemValue })
      this.onChange?.(item.itemValue)
    }
  }

  // Get selected item's title - for display
  getSelectedItemTitle(): string | undefined {
    if (!this.store) return undefined
    const { selectedIndex } = this.store.getState()
    const item = this.getAllItems().find(
      (i) => i.visibleIndex === selectedIndex,
    )
    return item?.itemTitle
  }

  // Get current value's title - for display
  getCurrentValueTitle(): string | undefined {
    if (!this.store) return undefined
    const { currentValue } = this.store.getState()
    if (!currentValue) return undefined
    const item = this.getAllItems().find((i) => i.itemValue === currentValue)
    return item?.itemTitle
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Register with opentui
// ─────────────────────────────────────────────────────────────────────────────

extend({
  'termcast-dropdown': DropdownRenderable,
  'termcast-dropdown-item-wrapper': DropdownItemWrapperRenderable,
  'termcast-dropdown-section-wrapper': DropdownSectionWrapperRenderable,
})

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'termcast-dropdown': DropdownOptions & {
        ref?: React.Ref<DropdownRenderable>
        children?: React.ReactNode
      }
      'termcast-dropdown-item-wrapper': DropdownItemWrapperOptions & {
        ref?: React.Ref<DropdownItemWrapperRenderable>
        children?: React.ReactNode
      }
      'termcast-dropdown-section-wrapper': DropdownSectionWrapperOptions & {
        ref?: React.Ref<DropdownSectionWrapperRenderable>
        children?: React.ReactNode
      }
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Props Interfaces
// ─────────────────────────────────────────────────────────────────────────────

interface SearchBarInterface {
  isLoading?: boolean
  filtering?: boolean | { keepSectionOrder: boolean }
  onSearchTextChange?: (text: string) => void
  throttle?: boolean
}

export interface DropdownProps extends SearchBarInterface, CommonProps {
  id?: string
  tooltip?: string
  placeholder?: string
  storeValue?: boolean | undefined
  value?: string
  defaultValue?: string
  children?: ReactNode
  onChange?: (newValue: string) => void
  onSelectionChange?: (value: string) => void
}

export interface DropdownItemProps extends CommonProps {
  title: string
  value?: string
  icon?: ReactNode
  keywords?: string[]
  label?: string
  color?: string
}

export interface DropdownSectionProps extends CommonProps {
  title?: string
  children?: ReactNode
}

interface DropdownType {
  (props: DropdownProps): any
  Item: (props: DropdownItemProps) => any
  Section: (props: DropdownSectionProps) => any
}

// ─────────────────────────────────────────────────────────────────────────────
// ItemOption - Shared UI component for rendering items
// ─────────────────────────────────────────────────────────────────────────────

function ItemOption(props: {
  title: string
  icon?: ReactNode
  active?: boolean
  current?: boolean
  label?: string
  color?: string
  onMouseDown?: () => void
  onMouseMove?: () => void
}) {
  const theme = useTheme()
  const [isHovered, setIsHovered] = useState(false)

  // flexGrow={1} is required for justifyContent='space-between' to work.
  // Without it, the box shrinks to fit content and there's no space to distribute.
  return (
    <box
      flexDirection='row'
      flexGrow={1}
      backgroundColor={
        props.active
          ? theme.primary
          : isHovered
            ? theme.backgroundPanel
            : undefined
      }
      paddingLeft={props.active ? 0 : 1}
      paddingRight={1}
      justifyContent='space-between'
      onMouseMove={() => {
        setIsHovered(true)
        props.onMouseMove?.()
      }}
      onMouseOut={() => {
        setIsHovered(false)
      }}
      onMouseDown={props.onMouseDown}
    >
      <box flexDirection='row'>
        {props.active && (
          <text fg={theme.background} selectable={false}>
            ›
          </text>
        )}
        {props.icon && (
          <text
            fg={props.active ? theme.background : theme.text}
            selectable={false}
          >
            {getIconValue(props.icon)}{' '}
          </text>
        )}
        <text
          fg={
            props.active
              ? theme.background
              : props.color
                ? props.color
                : props.current
                  ? theme.primary
                  : theme.text
          }
          attributes={props.active ? TextAttributes.BOLD : undefined}
          selectable={false}
        >
          {props.title}
        </text>
      </box>
      {props.label && (
        <text
          fg={props.active ? theme.background : theme.textMuted}
          attributes={props.active ? TextAttributes.BOLD : undefined}
          selectable={false}
        >
          {props.label}
        </text>
      )}
    </box>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Dropdown React Component
// ─────────────────────────────────────────────────────────────────────────────

const Dropdown: DropdownType = (props) => {
  const {
    tooltip,
    onChange,
    onSelectionChange,
    value,
    defaultValue,
    children,
    placeholder = 'Search…',
    storeValue,
    isLoading,
    filtering = true,
    onSearchTextChange,
    throttle,
  } = props

  const theme = useTheme()
  const isOffscreen = useIsOffscreen()
  const inFocus = useIsInFocus()
  const dropdownRef = useRef<DropdownRenderable>(null)
  const inputRef = useRef<TextareaRenderable>(null)
  const throttleTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)

  // Create instance-scoped store
  const [store] = useState(() => createDropdownStore())

  // Subscribe to zustand for UI updates
  const selectedIndex = store((s) => s.selectedIndex)
  const searchQuery = store((s) => s.searchQuery)



  // Callbacks wrapped for throttle support
  const handleSearchTextChange = (text: string) => {
    if (onSearchTextChange) {
      if (throttle) {
        if (throttleTimeoutRef.current) {
          clearTimeout(throttleTimeoutRef.current)
        }
        throttleTimeoutRef.current = setTimeout(() => {
          onSearchTextChange(text)
        }, 300)
      } else {
        onSearchTextChange(text)
      }
    }
  }

  const handleChange = (itemValue: string) => {
    if (onChange) {
      onChange(itemValue)
    }
    if (storeValue) {
      logger.log('Storing value:', itemValue)
    }
  }

  // Sync controlled value and defaultValue to store
  // Store is source of truth - React sets it directly, renderable reads from it
  useEffect(() => {
    if (value !== undefined) {
      store.setState({ currentValue: value })
    } else if (defaultValue !== undefined) {
      store.setState({ currentValue: defaultValue })
    }
  }, [value, defaultValue, store])

  // Ref callback to register search input for ESC handling (clears search before exit)
  const searchInputRefCallback = (node: TextareaRenderable | null) => {
    inputRef.current = node
    useStore.getState().activeSearchInputRef.current = node
  }

  // Keyboard navigation
  useKeyboard((evt) => {
    if (!inFocus || !dropdownRef.current) return

    if (evt.name === 'up') {
      dropdownRef.current.moveSelection(-1)
    }
    if (evt.name === 'down') {
      dropdownRef.current.moveSelection(1)
    }
    if (evt.name === 'tab' && !evt.shift) {
      dropdownRef.current.moveSelection(1)
    }
    if (evt.name === 'tab' && evt.shift) {
      dropdownRef.current.moveSelection(-1)
    }
    if (evt.name === 'return') {
      dropdownRef.current.selectCurrent()
    }
  })

  // When offscreen, just render children to collect descendants without UI
  if (isOffscreen) {
    return (
      <DropdownStoreContext.Provider value={store}>
        <termcast-dropdown
          ref={dropdownRef}
          filtering={filtering}
          store={store}
          onChange={handleChange}
          onSelectionChange={onSelectionChange}
          onSearchTextChange={handleSearchTextChange}
        >
          {children}
        </termcast-dropdown>
      </DropdownStoreContext.Provider>
    )
  }

  return (
    <DropdownStoreContext.Provider value={store}>
      <box flexGrow={1} paddingLeft={2} paddingRight={2}>
        <box paddingLeft={1} paddingRight={1}>
          <box flexDirection='row' justifyContent='space-between'>
            <text fg={theme.textMuted}>{tooltip}</text>
            <text fg={theme.textMuted}>esc</text>
          </box>
          <box paddingTop={1} paddingBottom={1} flexDirection='row'>
            <text flexShrink={0} fg={theme.primary}>
              &gt;{' '}
            </text>
            {/* This React textarea handles BOTH display and input. It calls setSearchQuery()
                on the renderable directly via onContentChange. We intentionally don't use an
                internal TextareaRenderable in DropdownRenderable - that caused sync issues
                where keystrokes went to the internal textarea but display was on this one. */}
            <textarea
              ref={searchInputRefCallback}
              height={1}
              flexGrow={1}
              wrapMode='none'
              keyBindings={[
                { name: 'return', action: 'submit' },
                { name: 'linefeed', action: 'submit' },
              ]}
              onContentChange={() => {
                const text = inputRef.current?.plainText || ''
                dropdownRef.current?.setSearchQuery(text)
              }}
              placeholder={placeholder}
              focused={inFocus}
              initialValue=''
              focusedBackgroundColor={theme.backgroundPanel}
              cursorColor={theme.primary}
              focusedTextColor={theme.textMuted}
            />
          </box>
        </box>
        <termcast-dropdown
          ref={dropdownRef}
          filtering={filtering}
          store={store}
          onChange={handleChange}
          onSelectionChange={onSelectionChange}
          onSearchTextChange={handleSearchTextChange}
        >
          {children}
        </termcast-dropdown>
      </box>
      <box
        paddingRight={2}
        paddingLeft={3}
        paddingBottom={1}
        paddingTop={1}
        flexDirection='row'
      >
        <text fg={theme.text} attributes={TextAttributes.BOLD}>
          ↵
        </text>
        <text fg={theme.textMuted}> select</text>
        <text fg={theme.text} attributes={TextAttributes.BOLD}>
          {'   '}↑↓
        </text>
        <text fg={theme.textMuted}> navigate</text>
      </box>
    </DropdownStoreContext.Provider>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// DropdownItem React Component - all UI in JSX
// ─────────────────────────────────────────────────────────────────────────────

const DropdownItem: (props: DropdownItemProps) => any = (props) => {
  const wrapperRef = useRef<DropdownItemWrapperRenderable>(null)
  const isOffscreen = useIsOffscreen()
  const store = useDropdownStoreApi()
  const selectedIndex = store((s) => s.selectedIndex)
  const currentValue = store((s) => s.currentValue)

  // Use title as fallback for value
  const value = props.value ?? props.title

  // Subscribe to THIS item's state - React re-renders when it changes
  const itemState = store((s) => s.itemStates[value])

  // Check visibility from itemState (zustand) not wrapper ref
  const isVisible = itemState?.visibleIndex !== -1
  const isActive = itemState?.visibleIndex === selectedIndex
  const isCurrent = value === currentValue

  // Mouse handlers
  const handleMouseMove = () => {
    const wrapper = wrapperRef.current
    if (
      wrapper &&
      wrapper.visibleIndex !== -1 &&
      wrapper.visibleIndex !== selectedIndex
    ) {
      store.setState({ selectedIndex: wrapper.visibleIndex })
    }
  }

  const handleMouseDown = () => {
    const wrapper = wrapperRef.current
    if (wrapper) {
      store.setState({ currentValue: wrapper.itemValue })
      // Find parent dropdown and trigger onChange
      const dropdown = findParent(wrapper, DropdownRenderable)
      dropdown?.onChange?.(wrapper.itemValue)
    }
  }

  // Don't render UI when offscreen
  if (isOffscreen) {
    return (
      <termcast-dropdown-item-wrapper
        ref={wrapperRef}
        itemValue={value}
        itemTitle={props.title}
        keywords={props.keywords}
        icon={props.icon}
        label={props.label}
        color={props.color}
      />
    )
  }

  return (
    <termcast-dropdown-item-wrapper
      ref={wrapperRef}
      itemValue={value}
      itemTitle={props.title}
      keywords={props.keywords}
      icon={props.icon}
      label={props.label}
      color={props.color}
      flexShrink={0}
    >
      <ItemOption
        title={props.title}
        icon={props.icon}
        active={isActive}
        current={isCurrent}
        label={props.label}
        color={props.color}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
      />
    </termcast-dropdown-item-wrapper>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// DropdownSection React Component - all UI in JSX
// ─────────────────────────────────────────────────────────────────────────────

const DropdownSection: (props: DropdownSectionProps) => any = (props) => {
  const theme = useTheme()
  const isOffscreen = useIsOffscreen()
  const store = useDropdownStoreApi()
  const searchQuery = store((s) => s.searchQuery)

  // Hide section titles when there's search text
  const hideTitle = searchQuery.trim().length > 0

  // When offscreen, just render children without section title UI
  if (isOffscreen) {
    return (
      <termcast-dropdown-section-wrapper sectionTitle={props.title}>
        {props.children}
      </termcast-dropdown-section-wrapper>
    )
  }

  return (
    <termcast-dropdown-section-wrapper
      sectionTitle={props.title}
      flexShrink={0}
      flexGrow={1}
    >
      {props.title && !hideTitle && (
        <box paddingTop={1} paddingLeft={1}>
          <text fg={theme.accent} attributes={TextAttributes.BOLD}>
            {props.title}
          </text>
        </box>
      )}
      {props.children}
    </termcast-dropdown-section-wrapper>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Compound Component
// ─────────────────────────────────────────────────────────────────────────────

Dropdown.Item = DropdownItem
Dropdown.Section = DropdownSection

// ─────────────────────────────────────────────────────────────────────────────
// Exports
// ─────────────────────────────────────────────────────────────────────────────

export default Dropdown
export { Dropdown, useDropdownStore, DropdownRenderable }
