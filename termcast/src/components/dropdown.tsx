import React, {
  ReactNode,
  useState,
  useEffect,
  useMemo,
  useRef,
  createContext,
  useContext,
} from 'react'
import { useKeyboard } from '@opentui/react'
import {
  TextAttributes,
  ScrollBoxRenderable,
  TextareaRenderable,
} from '@opentui/core'
import { Theme } from 'termcast/src/theme'
import { logger } from 'termcast/src/logger'
import { useIsInFocus } from 'termcast/src/internal/focus-context'
import { CommonProps } from 'termcast/src/utils'
import { createDescendants } from 'termcast/src/descendants'
import { ScrollBox } from 'termcast/src/internal/scrollbox'

// SearchBarInterface provides the common search bar props
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
}

export interface DropdownItemProps extends CommonProps {
  title: string
  value: string
  icon?: ReactNode

  keywords?: string[]
  label?: string
  color?: string
}

export interface DropdownSectionProps extends CommonProps {
  title?: string
  children?: ReactNode
}

// Create descendants for Dropdown items - minimal fields needed
interface DropdownItemDescendant {
  value: string
  title: string
  hidden?: boolean
  elementRef?: { y: number; height: number } | null
}

const {
  DescendantsProvider: DropdownDescendantsProvider,
  useDescendants: useDropdownDescendants,
  useDescendant: useDropdownItemDescendant,
} = createDescendants<DropdownItemDescendant>()

// Context for passing data to dropdown items
interface DropdownContextValue {
  searchText: string
  filtering?: boolean | { keepSectionOrder: boolean }
  currentSection?: string
  selectedIndex: number
  setSelectedIndex?: (index: number) => void
  currentValue?: string
  onChange?: (value: string) => void
  scrollBoxRef?: React.RefObject<ScrollBoxRenderable | null>
}

const DropdownContext = createContext<DropdownContextValue>({
  searchText: '',
  filtering: true,
  selectedIndex: 0,
})

interface DropdownType {
  (props: DropdownProps): any
  Item: (props: DropdownItemProps) => any
  Section: (props: DropdownSectionProps) => any
}

const Dropdown: DropdownType = (props) => {
  const {
    tooltip,
    onChange,
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

  const [selected, setSelected] = useState(0)
  const [searchText, setSearchTextState] = useState('')
  const [currentValue, setCurrentValue] = useState<string | undefined>(
    value || defaultValue,
  )
  const inputRef = useRef<TextareaRenderable>(null)
  const lastSearchTextRef = useRef('')
  const throttleTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const scrollBoxRef = useRef<ScrollBoxRenderable>(null)
  const descendantsContext = useDropdownDescendants()

  // Update textarea and reset selection - single source of truth is the ref
  const setSearchText = (text: string) => {
    inputRef.current?.setText(text)
    setSearchTextState(text)
    setSelected(0)
  }

  const scrollToItem = (item: { props?: DropdownItemDescendant }) => {
    const scrollBox = scrollBoxRef.current
    const elementRef = item.props?.elementRef
    if (!scrollBox || !elementRef) return

    const contentY = scrollBox.content?.y || 0
    const viewportHeight = scrollBox.viewport?.height || 10

    // Calculate item position relative to content
    const itemTop = elementRef.y - contentY

    // Scroll so the top of the item is centered in the viewport
    const targetScrollTop = itemTop - viewportHeight / 2
    scrollBox.scrollTo(Math.max(0, targetScrollTop))
  }

  // Create context value for children
  const contextValue = useMemo<DropdownContextValue>(
    () => ({
      searchText,
      filtering,
      currentSection: undefined,
      selectedIndex: selected,
      setSelectedIndex: setSelected,
      currentValue,
      onChange: (value: string) => selectItem(value),
      scrollBoxRef,
    }),
    [searchText, filtering, selected, currentValue],
  )

  // Update controlled value
  useEffect(() => {
    if (value !== undefined) {
      setCurrentValue(value)
    }
  }, [value])

  // Handle search text change from textarea - called by onContentChange
  const handleSearchTextChange = (text: string) => {
    if (!inFocus) return

    // Update state for context and reset selection
    setSearchTextState(text)
    setSelected(0)

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

  const move = (direction: -1 | 1) => {
    const items = Object.values(descendantsContext.map.current)
      .filter((item: any) => item.index !== -1 && !item.props?.hidden)
      .sort((a: any, b: any) => a.index - b.index)

    if (items.length === 0) return

    let currentVisibleIndex = items.findIndex(
      (item) => item.index === selected,
    )
    if (currentVisibleIndex === -1) {
      if (items[0]) {
        setSelected(items[0].index)
        scrollToItem(items[0])
      }
      return
    }

    let nextVisibleIndex = currentVisibleIndex + direction
    if (nextVisibleIndex < 0) nextVisibleIndex = items.length - 1
    if (nextVisibleIndex >= items.length) nextVisibleIndex = 0

    const nextItem = items[nextVisibleIndex]
    if (nextItem) {
      setSelected(nextItem.index)
      scrollToItem(nextItem)
    }
  }

  const selectItem = (itemValue: string) => {
    setCurrentValue(itemValue)
    if (onChange) {
      onChange(itemValue)
    }
    if (storeValue) {
      // In a real implementation, this would persist the value
      logger.log('Storing value:', itemValue)
    }
  }

  // Get focus state
  const inFocus = useIsInFocus()

  // Handle keyboard navigation
  useKeyboard((evt) => {
    if (!inFocus) return

    if (evt.name === 'up') {
      move(-1)
    }
    if (evt.name === 'down') {
      move(1)
    }
    if (evt.name === 'return') {
      const items = Object.values(descendantsContext.map.current)
        .filter((item: any) => item.index !== -1)
        .sort((a: any, b: any) => a.index - b.index)

      const currentItem = items[selected]
      if (currentItem?.props) {
        selectItem((currentItem.props as DropdownItemDescendant).value)
      }
    }
  })

  return (
    <DropdownDescendantsProvider value={descendantsContext}>
      <DropdownContext.Provider value={contextValue}>
        <box>
          <box style={{ paddingLeft: 2, paddingRight: 2 }}>
            <box style={{ paddingLeft: 1, paddingRight: 1 }}>
              <box
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                }}
              >
                <text attributes={TextAttributes.BOLD}>{tooltip}</text>
                <text fg={Theme.textMuted}>esc</text>
              </box>
              <box style={{ paddingTop: 1, paddingBottom: 1 }}>
                <textarea
                  ref={inputRef}
                  height={1}
                  keyBindings={[
                    { name: 'return', action: 'submit' },
                    { name: 'linefeed', action: 'submit' },
                  ]}
                  onContentChange={() => {
                    const value = inputRef.current?.plainText || ''
                    handleSearchTextChange(value)
                  }}
                  placeholder={placeholder}
                  focused={inFocus}
                  initialValue=""
                  focusedBackgroundColor={Theme.backgroundPanel}
                  cursorColor={Theme.primary}
                  focusedTextColor={Theme.textMuted}
                />
              </box>
            </box>
            <ScrollBox
              ref={scrollBoxRef}
              focused={false}
              flexGrow={1}
              flexShrink={1}
              style={{
                rootOptions: {
                  backgroundColor: undefined,
                  maxHeight: 10,
                },
                scrollbarOptions: {

                  showArrows: false,

                },
              }}
            >
              {/* Render children - they will register as descendants and render themselves */}
              {children}
            </ScrollBox>
          </box>
          <box
            border={false}
            style={{
              paddingRight: 2,
              paddingLeft: 3,
              paddingBottom: 1,
              paddingTop: 1,
              flexDirection: 'row',
            }}
          >
            <text fg={Theme.text} attributes={TextAttributes.BOLD}>
              ↵
            </text>
            <text fg={Theme.textMuted}> select</text>
            <text fg={Theme.text} attributes={TextAttributes.BOLD}>
              {'   '}↑↓
            </text>
            <text fg={Theme.textMuted}> navigate</text>
          </box>
        </box>
      </DropdownContext.Provider>
    </DropdownDescendantsProvider>
  )
}

function ItemOption(props: {
  title: string
  icon?: ReactNode
  active?: boolean
  current?: boolean
  label?: string
  color?: string
  onMouseDown?: () => void
  onMouseMove?: () => void
  elementRef?: React.Ref<any>
}) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <box
      ref={props.elementRef}
      style={{
        flexDirection: 'row',
        backgroundColor: props.active
          ? Theme.primary
          : isHovered
            ? Theme.backgroundPanel
            : undefined,
        paddingLeft: props.active ? 0 : 1,
        paddingRight: 1,
        justifyContent: 'space-between',
      }}
      border={false}
      onMouseMove={() => {
        setIsHovered(true)
        if (props.onMouseMove) props.onMouseMove()
      }}
      onMouseOut={() => setIsHovered(false)}
      onMouseDown={props.onMouseDown}
    >
      <box style={{ flexDirection: 'row' }}>
        {props.active && (
          <text fg={Theme.background} selectable={false}>
            ›{''}
          </text>
        )}
        {props.icon && (
          <text
            fg={props.active ? Theme.background : Theme.text}
            selectable={false}
          >
            {String(props.icon)}{' '}
          </text>
        )}
        <text
          fg={
            props.active
              ? Theme.background
              : props.color
                ? props.color
                : props.current
                  ? Theme.primary
                  : Theme.text
          }
          attributes={props.active ? TextAttributes.BOLD : undefined}
          selectable={false}
        >
          {props.title}
        </text>
      </box>
      {props.label && (
        <text
          fg={props.active ? Theme.background : Theme.textMuted}
          attributes={props.active ? TextAttributes.BOLD : undefined}
          selectable={false}
        >
          {props.label}
        </text>
      )}
    </box>
  )
}

const DropdownItem: (props: DropdownItemProps) => any = (props) => {
  const context = useContext(DropdownContext)
  const elementRef = useRef<{ y: number; height: number } | null>(null)
  if (!context) return null

  const { searchText, filtering, currentSection, selectedIndex, currentValue } =
    context

  // Apply filtering logic
  const shouldHide = (() => {
    if (!filtering || !searchText.trim()) return false
    const needle = searchText.toLowerCase().trim()
    const searchableText = [props.title, ...(props.keywords || [])]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
    return !searchableText.includes(needle)
  })()

  // Register as descendant
  const { index } = useDropdownItemDescendant({
    value: props.value,
    title: props.title,
    hidden: shouldHide,
    elementRef: elementRef.current,
  })

  // Don't render if hidden
  if (shouldHide) return null

  // Determine if active (index will be -1 if hidden)
  const isActive = index === selectedIndex && index !== -1
  const isCurrent = props.value === currentValue

  // Handle mouse events
  const handleMouseMove = () => {
    // Update selected index on hover
    if (
      context.setSelectedIndex &&
      context.selectedIndex !== index &&
      index !== -1
    ) {
      context.setSelectedIndex(index)
    }
  }

  const handleMouseDown = () => {
    // Trigger selection on click
    if (context.onChange && props.value) {
      context.onChange(props.value)
    }
  }

  // Render the item directly
  return (
    <ItemOption
      title={props.title}
      icon={props.icon}
      active={isActive}
      current={isCurrent}
      label={props.label}
      color={props.color}
      onMouseMove={handleMouseMove}
      onMouseDown={handleMouseDown}
      elementRef={elementRef}
    />
  )
}

const DropdownSection: (props: DropdownSectionProps) => any = (props) => {
  const parentContext = useContext(DropdownContext)
  if (!parentContext) return null

  // Create new context with section title
  const sectionContextValue = useMemo(
    () => ({
      ...parentContext,
      currentSection: props.title,
    }),
    [parentContext, props.title],
  )

  return (
    <>
      {/* Render section title if provided */}
      {props.title && (
        <box style={{ paddingTop: 1, paddingLeft: 1 }}>
          <text fg={Theme.accent} attributes={TextAttributes.BOLD}>
            {props.title}
          </text>
        </box>
      )}
      {/* Render children with section context */}
      <DropdownContext.Provider value={sectionContextValue}>
        {props.children}
      </DropdownContext.Provider>
    </>
  )
}

Dropdown.Item = DropdownItem
Dropdown.Section = DropdownSection

export default Dropdown
export { Dropdown }
