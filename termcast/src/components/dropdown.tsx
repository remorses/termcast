/**
 * Dropdown Component - Using descendants-v2 pattern
 *
 * STATE FLOW:
 *   Items register via onLifecyclePass → React state (items array)
 *   Filtering/selection/navigation all in React
 *   Scrollbox ref for imperative scrolling
 *
 * Architecture:
 *   - createDescendantsV2('dropdown') provides Root/Item components
 *   - Items self-register, React owns the list in state
 *   - All logic in React closures, renderables are thin wrappers
 */

import React, { ReactNode, useRef, useState, useEffect, useMemo } from 'react'
import {
  ScrollBoxRenderable,
  TextareaRenderable,
  TextAttributes,
} from '@opentui/core'
import { useKeyboard, flushSync } from '@opentui/react'
import { useTheme } from 'termcast/src/theme'
import { getIconValue } from 'termcast/src/components/icon'
import { logger } from 'termcast/src/logger'
import { useStore } from 'termcast/src/state'
import { useIsInFocus } from 'termcast/src/internal/focus-context'
import { useIsOffscreen } from 'termcast/src/internal/offscreen'
import { CommonProps } from 'termcast/src/utils'
import {
  createDescendantsV2,
  DescendantItemRenderable,
  DescendantsRootRenderable,
} from 'termcast/src/descendants-v2'

// ─────────────────────────────────────────────────────────────────────────────
// Create descendants for dropdown - unique element names
// ─────────────────────────────────────────────────────────────────────────────

interface DropdownItemData {
  value: string
  title: string
  keywords?: string[]
  icon?: ReactNode
  label?: string
  color?: string
  sectionId?: string  // Track which section this item belongs to
}

const {
  Root: DropdownRoot,
  Item: DropdownItemWrapper,
  ItemRenderable,
} = createDescendantsV2<DropdownItemData>('dropdown')

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
// Context for passing state to children
// ─────────────────────────────────────────────────────────────────────────────

interface DropdownContextValue {
  selectedIndex: number
  currentValue: string | undefined
  visibleSections: Set<string>
  searchQuery: string
  setSelectedIndex: (index: number) => void
  setCurrentValue: (value: string) => void
  getVisibleIndex: (value: string) => number
  onItemSelect: (value: string) => void
}

const DropdownContext = React.createContext<DropdownContextValue | null>(null)
const SectionContext = React.createContext<string | null>(null)

function useDropdownContext() {
  const ctx = React.useContext(DropdownContext)
  // Return default context if not available (during initial registration)
  if (!ctx) {
    return {
      selectedIndex: -1,
      currentValue: undefined,
      visibleSections: new Set<string>(),
      searchQuery: '',
      setSelectedIndex: () => {},
      setCurrentValue: () => {},
      getVisibleIndex: () => -1,
      onItemSelect: () => {},
    }
  }
  return ctx
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
  const scrollBoxRef = useRef<ScrollBoxRenderable>(null)
  const inputRef = useRef<TextareaRenderable>(null)
  const throttleTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)

  // Items in React state - populated by registration callbacks
  const [items, setItems] = useState<DescendantItemRenderable<DropdownItemData>[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [currentValue, setCurrentValue] = useState<string | undefined>(
    value ?? defaultValue
  )

  console.log('[dropdown] render, items:', items.length, 'selectedIndex:', selectedIndex)

  // ─────────────────────────────────────────────────────────────────────────
  // Filtering - computed in render
  // ─────────────────────────────────────────────────────────────────────────

  const { filteredItems, visibleSections } = useMemo(() => {
    // IMPORTANT: Sort items by y position to ensure correct visual order.
    // opentui's tree traversal order (which determines registration order) may differ
    // from React's render order, causing items to appear in wrong order.
    let filtered = [...items].sort((a, b) => (a.y ?? 0) - (b.y ?? 0))
    if (filtering && searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((item) => {
        const data = item.props
        if (data.title?.toLowerCase().includes(query)) return true
        if (data.keywords?.some((k) => k.toLowerCase().includes(query))) return true
        return false
      })
    }
    // Compute which sections have visible items
    const sections = new Set<string>()
    for (const item of filtered) {
      if (item.props.sectionId) {
        sections.add(item.props.sectionId)
      }
    }
    return { filteredItems: filtered, visibleSections: sections }
  }, [items, searchQuery, filtering])

  // Map from value to visible index for quick lookup
  const visibleIndexMap = useMemo(() => {
    const map = new Map<string, number>()
    filteredItems.forEach((item, index) => {
      map.set(item.props.value, index)
    })
    return map
  }, [filteredItems])

  const getVisibleIndex = (itemValue: string) => visibleIndexMap.get(itemValue) ?? -1

  // ─────────────────────────────────────────────────────────────────────────
  // Registration callbacks - called by descendants-v2
  // ─────────────────────────────────────────────────────────────────────────

  const handleRegisterItem = (item: DescendantItemRenderable<DropdownItemData>) => {
    setItems((prev) => [...prev, item])
  }

  const handleUnregisterItem = (item: DescendantItemRenderable<DropdownItemData>) => {
    console.log('[dropdown] handleUnregisterItem', item.props)
    setItems((prev) => prev.filter((i) => i !== item))
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Navigation - simple functions
  // ─────────────────────────────────────────────────────────────────────────

  const moveSelection = (delta: number) => {
    if (filteredItems.length === 0) return
    const newIndex = (selectedIndex + delta + filteredItems.length) % filteredItems.length
    // Use flushSync to avoid visual jumping - state update + scroll happen synchronously
    flushSync(() => {
      setSelectedIndex(newIndex)
    })
    scrollToIndex(newIndex)
    // Notify selection change
    const item = filteredItems[newIndex]
    if (item && onSelectionChange) {
      onSelectionChange(item.props.value)
    }
  }

  const scrollToIndex = (index: number) => {
    const item = filteredItems[index]
    const scrollBox = scrollBoxRef.current
    if (!item || !scrollBox) return

    const itemY = item.y
    const scrollBoxY = scrollBox.content?.y || 0
    const viewportHeight = scrollBox.viewport?.height || 10

    const relativeY = itemY - scrollBoxY
    const targetScrollTop = relativeY - Math.floor(viewportHeight / 2)
    scrollBox.scrollTop = Math.max(0, targetScrollTop)
  }

  const selectCurrent = () => {
    const item = filteredItems[selectedIndex]
    if (item) {
      const itemValue = item.props.value
      setCurrentValue(itemValue)
      onChange?.(itemValue)
      if (storeValue) {
        logger.log('Storing value:', itemValue)
      }
    }
  }

  const onItemSelect = (itemValue: string) => {
    setCurrentValue(itemValue)
    onChange?.(itemValue)
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Search text handling
  // ─────────────────────────────────────────────────────────────────────────

  const handleSearchTextChange = (text: string) => {
    setSearchQuery(text)
    // Reset selection when search changes
    setSelectedIndex(0)

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

  // ─────────────────────────────────────────────────────────────────────────
  // Sync controlled value
  // ─────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (value !== undefined) {
      setCurrentValue(value)
    }
  }, [value])

  // Clamp selectedIndex when filtered items change
  useEffect(() => {
    if (filteredItems.length > 0 && selectedIndex >= filteredItems.length) {
      setSelectedIndex(Math.max(0, filteredItems.length - 1))
    }
  }, [filteredItems.length, selectedIndex])

  // ─────────────────────────────────────────────────────────────────────────
  // ESC handling - register search input
  // ─────────────────────────────────────────────────────────────────────────

  const searchInputRefCallback = (node: TextareaRenderable | null) => {
    inputRef.current = node
    useStore.setState({ activeSearchInputRef: node })
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Keyboard navigation
  // ─────────────────────────────────────────────────────────────────────────

  useKeyboard((evt) => {
    // Don't handle keyboard when rendered offscreen (for footer title calculation)
    if (!inFocus || isOffscreen) return

    if (evt.name === 'up') {
      moveSelection(-1)
    }
    if (evt.name === 'down') {
      moveSelection(1)
    }
    if (evt.name === 'tab' && !evt.shift) {
      moveSelection(1)
    }
    if (evt.name === 'tab' && evt.shift) {
      moveSelection(-1)
    }
    if (evt.name === 'return') {
      selectCurrent()
    }
  })

  // ─────────────────────────────────────────────────────────────────────────
  // Context value
  // ─────────────────────────────────────────────────────────────────────────

  const contextValue: DropdownContextValue = {
    selectedIndex,
    currentValue,
    visibleSections,
    searchQuery,
    setSelectedIndex,
    setCurrentValue,
    getVisibleIndex,
    onItemSelect,
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  // When offscreen, just render children to collect descendants without UI
  if (isOffscreen) {
    return (
      <DropdownContext.Provider value={contextValue}>
        <DropdownRoot
          onRegisterItem={handleRegisterItem}
          onUnregisterItem={handleUnregisterItem}
        >
          {children}
        </DropdownRoot>
      </DropdownContext.Provider>
    )
  }

  return (
    <DropdownContext.Provider value={contextValue}>
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
                handleSearchTextChange(text)
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
        <DropdownRoot
          onRegisterItem={handleRegisterItem}
          onUnregisterItem={handleUnregisterItem}
        >
          <scrollbox
            ref={scrollBoxRef}
            flexGrow={1}
            height={7}
            viewportOptions={{
              flexGrow: 1,
              flexShrink: 1,
              paddingRight: 1,
            }}
            contentOptions={{
              flexShrink: 0,
              minHeight: 0,
            }}
            scrollbarOptions={{
              trackOptions: {
                foregroundColor: '#868e96',
              },
            }}
            horizontalScrollbarOptions={{
              visible: false,
            }}
          >
            {children}
          </scrollbox>
        </DropdownRoot>
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
    </DropdownContext.Provider>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// DropdownItem React Component
// ─────────────────────────────────────────────────────────────────────────────

const DropdownItem: (props: DropdownItemProps) => any = (props) => {
  const isOffscreen = useIsOffscreen()
  const ctx = useDropdownContext()

  // Use title as fallback for value
  const value = props.value ?? props.title

  // Get sectionId from parent section (if any)
  const sectionId = React.useContext(SectionContext)

  const itemData: DropdownItemData = {
    value,
    title: props.title,
    keywords: props.keywords,
    icon: props.icon,
    label: props.label,
    color: props.color,
    sectionId: sectionId ?? undefined,
  }

  // Get visibility from context
  const visibleIndex = ctx.getVisibleIndex(value)
  const isVisible = visibleIndex !== -1
  const isActive = visibleIndex === ctx.selectedIndex
  const isCurrent = value === ctx.currentValue

  console.log('[dropdown-item] render', props.title, 'visible:', isVisible, 'active:', isActive)

  // Mouse handlers
  const handleMouseMove = () => {
    if (visibleIndex !== -1 && visibleIndex !== ctx.selectedIndex) {
      ctx.setSelectedIndex(visibleIndex)
    }
  }

  const handleMouseDown = () => {
    ctx.onItemSelect(value)
  }

  // Don't render UI when offscreen - just register
  if (isOffscreen) {
    return <DropdownItemWrapper props={itemData} />
  }

  // Hide when filtered out
  if (!isVisible) {
    return <DropdownItemWrapper props={itemData} />
  }

  return (
    <DropdownItemWrapper props={itemData} flexShrink={0}>
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
    </DropdownItemWrapper>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// DropdownSection React Component
// ─────────────────────────────────────────────────────────────────────────────

const DropdownSection: (props: DropdownSectionProps) => any = (props) => {
  const theme = useTheme()
  const isOffscreen = useIsOffscreen()
  const ctx = useDropdownContext()

  // Generate section ID from title (or use explicit id if provided)
  const sectionId = props.title ?? 'untitled'

  // Hide section if no visible items
  const isVisible = ctx.visibleSections.has(sectionId)

  if (isOffscreen) {
    return (
      <SectionContext.Provider value={sectionId}>
        <box flexDirection='column'>{props.children}</box>
      </SectionContext.Provider>
    )
  }

  // Don't render if no items are visible in this section (when filtering)
  if (!isVisible && ctx.searchQuery) {
    return null
  }

  return (
    <SectionContext.Provider value={sectionId}>
      <box flexDirection='column' flexShrink={0} flexGrow={1}>
        {props.title && (
          <box paddingTop={1} paddingLeft={1}>
            <text fg={theme.accent} attributes={TextAttributes.BOLD}>
              {props.title}
            </text>
          </box>
        )}
        {props.children}
      </box>
    </SectionContext.Provider>
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
export { Dropdown, useDropdownContext }
