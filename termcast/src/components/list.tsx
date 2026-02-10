import {
  BoxRenderable,
  ScrollBoxRenderable,
  TextAttributes,
  TextareaRenderable,
} from '@opentui/core'
import { useKeyboard, flushSync } from '@opentui/react'
import React, {
    ReactElement,
    ReactNode,
    createContext,
    useCallback,
    useContext,
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState
} from 'react'
import { LoadingBar } from 'termcast/src/components/loading-bar'
import { LoadingText } from 'termcast/src/components/loading-text'
import { Footer } from 'termcast/src/components/footer'
import { createDescendants } from 'termcast/src/descendants'
import { useStore } from 'termcast/src/state'
import { useDialog } from 'termcast/src/internal/dialog'
import { useIsInFocus } from 'termcast/src/internal/focus-context'
import { useNavigationPending } from 'termcast/src/internal/navigation'
import { Offscreen } from 'termcast/src/internal/offscreen'
import { ScrollBox } from 'termcast/src/internal/scrollbox'

import { Color, resolveColor } from 'termcast/src/colors'
import { getIconEmoji, getIconValue } from 'termcast/src/components/icon'
import { ActionPanel } from 'termcast/src/components/actions'
import { useTheme, markdownSyntaxStyle } from 'termcast/src/theme'
import { CommonProps } from 'termcast/src/utils'

export { Color }

function formatRelativeDate(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)
  const diffWeek = Math.floor(diffDay / 7)
  const diffMonth = Math.floor(diffDay / 30)
  const diffYear = Math.floor(diffDay / 365)

  if (diffSec < 60) {
    return 'now'
  }
  if (diffMin < 60) {
    return `${diffMin}m`
  }
  if (diffHour < 24) {
    return `${diffHour}h`
  }
  if (diffDay < 7) {
    return `${diffDay}d`
  }
  if (diffWeek < 4) {
    return `${diffWeek}w`
  }
  if (diffMonth < 12) {
    return `${diffMonth}mo`
  }
  return `${diffYear}y`
}

interface ActionsInterface {
  actions?: ReactNode
}

function ListFooter(): any {
  const theme = useTheme()
  const firstActionTitle = useStore((s) => s.firstActionTitle)
  const hasToast = useStore((s) => s.toast !== null)
  const listContext = useContext(ListContext)
  const isShowingDetail = listContext?.isShowingDetail ?? false
  const hasDropdown = listContext?.hasDropdown ?? false

  const content = hasToast ? null : (
    <box style={{ flexDirection: 'row', gap: 3, flexShrink: 0 }}>
      {firstActionTitle && (
        <box style={{ flexDirection: 'row', gap: 1, flexShrink: 0 }}>
          <text flexShrink={0} fg={theme.text} attributes={TextAttributes.BOLD}>
            ↵
          </text>
          <text flexShrink={0} fg={theme.textMuted}>{firstActionTitle.toLowerCase()}</text>
        </box>
      )}
      <box style={{ flexDirection: 'row', gap: 1, flexShrink: 0 }}>
        <text flexShrink={0} fg={theme.text} attributes={TextAttributes.BOLD}>
          ↑↓
        </text>
        <text flexShrink={0} fg={theme.textMuted}>navigate</text>
      </box>
      {hasDropdown && (
        <box style={{ flexDirection: 'row', gap: 1, flexShrink: 0 }}>
          <text flexShrink={0} fg={theme.text} attributes={TextAttributes.BOLD}>
            ^p
          </text>
          <text flexShrink={0} fg={theme.textMuted}>dropdown</text>
        </box>
      )}
      <box style={{ flexDirection: 'row', gap: 1, flexShrink: 0 }}>
        <text flexShrink={0} fg={theme.text} attributes={TextAttributes.BOLD}>
          ^k
        </text>
        <text flexShrink={0} fg={theme.textMuted}>actions</text>
      </box>
    </box>
  )

  return <Footer hidePoweredBy={isShowingDetail}>{content}</Footer>
}

/**
 * Component that subscribes to descendants changes and renders current item's
 * actions offscreen. This ensures actions are captured even when items register
 * after the initial render (preserving context via closures).
 */
function CurrentItemActionsOffscreen(props: {
  selectedIndex: number
  fallbackActions?: ReactNode
}): any {
  // Subscribe to descendants changes - this hook triggers re-render when items register
  const descendantsMap = useListDescendantsRerender()

  // Get current item's actions
  const items = Object.values(descendantsMap)
    .filter((item) => item.index !== -1)
    .sort((a, b) => a.index - b.index)

  const currentItem = items.find((item) => item.index === props.selectedIndex)
  const actions = currentItem?.props?.actions ?? props.fallbackActions ?? null

  // Clear first action title when there are no actions
  useLayoutEffect(() => {
    if (!actions) {
      useStore.setState({ firstActionTitle: '' })
    }
  }, [actions])

  if (!actions) return null

  return <Offscreen>{actions}</Offscreen>
}

interface NavigationChildInterface {
  navigationTitle?: string
  isLoading?: boolean
}

interface SearchBarInterface {
  filtering?: boolean | { keepSectionOrder: boolean }
  isLoading?: boolean
  onSearchTextChange?: (newValue: string) => void
  searchBarPlaceholder?: string
  throttle?: boolean
}

interface PaginationInterface {
  pagination?: {
    pageSize: number
    hasMore: boolean
    onLoadMore: () => void
  }
}

export namespace Image {
  export type ImageLike = string | { source: string; tintColor?: string; mask?: ImageMask }
  export enum ImageMask {
    Circle = 'circle',
    RoundedRectangle = 'roundedRectangle',
  }
}

export type ItemAccessory =
  | {
      text?:
        | string
        | null
        | {
            value: string | null
            color?: Color.ColorLike
          }
    }
  | {
      date?:
        | Date
        | null
        | {
            value: Date | null
            color?: Color.ColorLike
          }
    }
  | {
      tag?:
        | string
        | {
            value: string
            color?: Color.ColorLike
          }
    }
  | {
      icon?: Image.ImageLike | null
      text?: string | null
      tooltip?: string | null
    }

export interface ItemProps extends ActionsInterface, CommonProps {
  id?: string
  title:
    | string
    | {
        value: string
        tooltip?: string | null
      }
  subtitle?:
    | string
    | {
        value?: string | null
        tooltip?: string | null
      }
  keywords?: string[]
  icon?:
    | Image.ImageLike
    | {
        value: Image.ImageLike | null
        tooltip: string
      }
  accessories?: ItemAccessory[]
  detail?: ReactNode
}

export interface DetailProps extends CommonProps {
  isLoading?: boolean
  markdown?: string
  metadata?: ReactNode
}

export interface MetadataProps extends CommonProps {
  children?: ReactNode
}

export interface DropdownItemProps extends CommonProps {
  value: string
  title: string
  icon?: Image.ImageLike | null
  keywords?: string[]
}

export interface DropdownSectionProps extends CommonProps {
  children?: ReactNode
  title?: string
}

export interface DropdownProps extends SearchBarInterface, CommonProps {
  id?: string
  tooltip: string
  placeholder?: string
  storeValue?: boolean
  value?: string
  defaultValue?: string
  onChange?: (newValue: string) => void
  children?: ReactNode
}

export interface SectionProps extends CommonProps {
  children?: ReactNode
  id?: string
  title?: string
  subtitle?: string
}

export interface ListProps
  extends ActionsInterface,
    NavigationChildInterface,
    SearchBarInterface,
    PaginationInterface,
    CommonProps {
  actions?: ReactNode
  children?: ReactNode
  onSelectionChange?: (id: string | null) => void
  searchBarAccessory?: ReactElement<DropdownProps> | null
  searchText?: string
  enableFiltering?: boolean
  searchBarPlaceholder?: string
  selectedItemId?: string
  isShowingDetail?: boolean
}

interface ListType {
  (props: ListProps): any
  Item: ListItemType
  Section: (props: SectionProps) => any
  Dropdown: ListDropdownType
  EmptyView: (props: EmptyViewProps) => any
}

interface ListItemType {
  (props: ItemProps): any
  Detail: ListItemDetailType
}

interface ListItemDetailType {
  (props: DetailProps): any
  Metadata: ListItemDetailMetadataType
}

interface ListItemDetailMetadataType {
  (props: MetadataProps): any
  Label: (props: { title: string; text?: string; icon?: Image.ImageLike }) => any
  Separator: () => any
  Link: (props: { title: string; target: string; text: string }) => any
  TagList: ListItemDetailMetadataTagListType
}

interface ListItemDetailMetadataTagListType {
  (props: { title: string; children: ReactNode }): any
  Item: (props: { text?: string; color?: Color.ColorLike; icon?: Image.ImageLike; onAction?: () => void }) => any
}

interface ListDropdownType {
  (props: DropdownProps): any
  Item: (props: DropdownItemProps) => any
  Section: (props: DropdownSectionProps) => any
}

interface EmptyViewProps extends ActionsInterface, CommonProps {
  icon?: Image.ImageLike
  title?: string
  description?: string
}

// List context for passing data to dropdown
interface ListContextValue {
  isDropdownOpen: boolean
  setIsDropdownOpen: (value: boolean) => void
  openDropdown: () => void
  selectedIndex: number
  setSelectedIndex?: (index: number) => void
  searchText: string
  isFiltering: boolean
  setCurrentDetail?: (detail: ReactNode) => void
  isShowingDetail?: boolean
  customEmptyViewRef: React.MutableRefObject<boolean>
  isLoading?: boolean
  hasDropdown?: boolean
}

const ListContext = createContext<ListContextValue | undefined>(undefined)

// Helper function to determine if an item should be visible based on search
function shouldItemBeVisible(
  searchQuery: string,
  props: {
    title: string
    subtitle?: string
    keywords?: string[]
  },
): boolean {
  // If no search query, show all items
  if (!searchQuery.trim()) return true

  const needle = searchQuery.toLowerCase().trim()
  const searchableText = [
    props.title,
    props.subtitle,
    ...(props.keywords || []),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  return searchableText.includes(needle)
}

// Create descendants for List items
interface ListItemDescendant {
  id?: string
  title: string
  subtitle?: string
  keywords?: string[]
  actions?: ReactNode
  visible?: boolean
  detail?: ReactNode
  elementRef?: { y: number; height: number } | null
}

const {
  DescendantsProvider: ListDescendantsProvider,
  useDescendants: useListDescendants,
  useDescendant: useListItemDescendant,
  useDescendantsRerender: useListDescendantsRerender,
  useDescendantsMap: useListDescendantsMap,
} = createDescendants<ListItemDescendant>()

// Create descendants for Dropdown items
interface DropdownItemDescendant {
  value: string
  title: string
  section?: string
  visible?: boolean
}

const {
  DescendantsProvider: DropdownDescendantsProvider,
  useDescendants: useDropdownDescendants,
  useDescendant: useDropdownItemDescendant,
} = createDescendants<DropdownItemDescendant>()

// Dropdown context for passing data to dropdown items
interface DropdownContextValue {
  currentSection?: string
  selectedIndex?: number
  setSelectedIndex?: (index: number) => void
  currentValue?: string
  searchText?: string
  onChange?: (value: string) => void
  isFiltering?: boolean
}

const DropdownContext = createContext<DropdownContextValue | undefined>(
  undefined,
)

// Dropdown dialog component
interface ListDropdownDialogProps extends DropdownProps {
  onCancel: () => void
  children?: ReactNode
}

function ListDropdownDialog(props: ListDropdownDialogProps): any {
  const theme = useTheme()
  const [searchText, setSearchTextRaw] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<TextareaRenderable>(null)
  const descendantsContext = useDropdownDescendants()

  // Wrapper function that updates search text
  const setSearchText = (value: string) => {
    // Using flushSync to force descendants to update visibility before querying
    flushSync(() => {
      setSearchTextRaw(value)
    })
    const items = Object.values(descendantsContext.map.current)
      .filter((item) => item.index !== -1 && item.props?.visible !== false)
      .sort((a, b) => a.index - b.index)

    if (items.length > 0 && items[0]) {
      setSelectedIndex(items[0].index)
    }
  }


  const move = (direction: -1 | 1) => {
    // Get all visible items
    const items = Object.values(descendantsContext.map.current)
      .filter((item) => item.index !== -1 && item.props?.visible !== false)
      .sort((a, b) => a.index - b.index)

    if (items.length === 0) return

    // Find currently selected item's position in visible items
    let currentVisibleIndex = items.findIndex(
      (item) => item.index === selectedIndex,
    )
    if (currentVisibleIndex === -1) {
      // If current selection is not visible, select first visible item
      if (items[0]) {
        setSelectedIndex(items[0].index)
      }
      return
    }

    // Calculate next visible index
    let nextVisibleIndex = currentVisibleIndex + direction
    if (nextVisibleIndex < 0) nextVisibleIndex = items.length - 1
    if (nextVisibleIndex >= items.length) nextVisibleIndex = 0

    const nextItem = items[nextVisibleIndex]
    if (nextItem) {
      setSelectedIndex(nextItem.index)
    }
  }

  const inFocus = useIsInFocus()

  useKeyboard((evt) => {
    if (!inFocus) return

    if (evt.name === 'escape') {
      props.onCancel()
    }
    if (evt.name === 'up') move(-1)
    if (evt.name === 'down') move(1)
    if (evt.name === 'return') {
      const items = Object.values(descendantsContext.map.current)
        .filter((item) => item.index !== -1)
        .sort((a, b) => a.index - b.index)

      const currentItem = items.find((item) => item.index === selectedIndex)
      if (currentItem?.props) {
        props.onChange?.((currentItem.props as DropdownItemDescendant).value)
      }
    }
  })

  return (
    <DropdownDescendantsProvider value={descendantsContext}>
      <box>
        <box style={{ paddingLeft: 2, paddingRight: 2 }}>
          <box style={{ paddingLeft: 1, paddingRight: 1 }}>
            {/* Header */}
            <box
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
              }}
            >
              <text flexShrink={0} fg={theme.textMuted}>{props.tooltip}</text>
              <text flexShrink={0} fg={theme.textMuted}>esc</text>
            </box>
            <box style={{ paddingTop: 1, paddingBottom: 1, flexDirection: 'row' }}>
              <text flexShrink={0} fg={theme.textMuted}>&gt; </text>
              <textarea
                ref={inputRef}
                height={1}
                flexGrow={1}
                wrapMode='none'
                keyBindings={[
                  { name: 'return', action: 'submit' },
                  { name: 'linefeed', action: 'submit' },
                ]}
                onContentChange={() => {
                  const value = inputRef.current?.plainText || ''
                  setSearchText(value)
                }}
                placeholder={props.placeholder || 'Search...'}
                focused={inFocus}
                initialValue={searchText}
                focusedBackgroundColor={theme.backgroundPanel}
                cursorColor={theme.primary}
                focusedTextColor={theme.textMuted}
              />
            </box>
          </box>

          {/* Items list - children will render themselves */}
          <box style={{ paddingBottom: 1 }}>
            <DropdownContext.Provider
              value={{
                currentSection: undefined,
                selectedIndex,
                setSelectedIndex,
                currentValue: props.value,
                searchText,
                isFiltering: true, // Dropdown always has filtering enabled
                onChange: (value: string) => {
                  props.onChange?.(value)
                },
              }}
            >
              {props.children}
            </DropdownContext.Provider>
          </box>
          {props.isLoading && (
            <box style={{ paddingLeft: 1 }}>
              <text flexShrink={0} fg={theme.textMuted}>Loading...</text>
            </box>
          )}
        </box>

        <DropdownFooter />
      </box>
    </DropdownDescendantsProvider>
  )
}

function DropdownFooter(): any {
  const theme = useTheme()
  const hasToast = useStore((s) => s.toast !== null)

  const content = hasToast ? null : (
    <box style={{ flexDirection: 'row', gap: 3 }}>
      <box style={{ flexDirection: 'row', gap: 1 }}>
        <text flexShrink={0} fg={theme.text} attributes={TextAttributes.BOLD}>
          ↵
        </text>
        <text flexShrink={0} fg={theme.textMuted}>select</text>
      </box>
      <box style={{ flexDirection: 'row', gap: 1 }}>
        <text flexShrink={0} fg={theme.text} attributes={TextAttributes.BOLD}>
          ↑↓
        </text>
        <text flexShrink={0} fg={theme.textMuted}>navigate</text>
      </box>
    </box>
  )

  return (
    <Footer paddingLeft={3} paddingRight={2} paddingBottom={1} marginTop={0}>
      {content}
    </Footer>
  )
}

// Render a single list item row
function ListItemRow(props: {
  title: string
  subtitle?: string
  icon?: string
  iconColor?: string
  accessories?: ItemAccessory[]
  active?: boolean
  isShowingDetail?: boolean
  onMouseDown?: () => void
  index?: number
  ref?: React.Ref<BoxRenderable>
}) {
  const theme = useTheme()
  const { title, subtitle, icon, iconColor, accessories, active, ref } = props
  const [isHovered, setIsHovered] = useState(false)

  const accessoryElements: ReactNode[] = []
  if (accessories) {
    accessories.forEach((accessory) => {
      if ('text' in accessory && accessory.text) {
        const textValue =
          typeof accessory.text === 'string'
            ? accessory.text
            : accessory.text?.value
        const textColor =
          typeof accessory.text === 'object' ? accessory.text?.color : undefined
        if (textValue) {
          accessoryElements.push(
            <text
              key={`text-${textValue}`}
              flexShrink={0}
              fg={active ? theme.background : resolveColor(textColor) || theme.info}
              wrapMode="none"
            >
              {textValue}
            </text>,
          )
        }
      }
      if ('tag' in accessory && accessory.tag) {
        const tagValue =
          typeof accessory.tag === 'string'
            ? accessory.tag
            : accessory.tag?.value
        const tagColor =
          typeof accessory.tag === 'object' ? accessory.tag?.color : undefined
        if (tagValue) {
          accessoryElements.push(
            <text
              key={`tag-${tagValue}`}
              flexShrink={0}
              fg={active ? theme.background : resolveColor(tagColor) || theme.warning}
              wrapMode="none"
            >
              [{tagValue}]
            </text>,
          )
        }
      }
      if ('date' in accessory && accessory.date) {
        const dateValue =
          accessory.date instanceof Date
            ? accessory.date
            : accessory.date?.value
        const dateColor =
          typeof accessory.date === 'object' && !(accessory.date instanceof Date)
            ? accessory.date?.color
            : undefined
        if (dateValue) {
          const formatted = formatRelativeDate(dateValue)
          accessoryElements.push(
            <text
              key={`date-${dateValue.getTime()}`}
              flexShrink={0}
              fg={active ? theme.background : resolveColor(dateColor) || theme.success}
              wrapMode="none"
            >
              {formatted}
            </text>,
          )
        }
      }
    })
  }

  return (
    <box
      ref={ref}
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: active
          ? theme.primary
          : isHovered
            ? theme.backgroundPanel
            : undefined,
        paddingLeft: 0,
        paddingRight: 1,
        gap: 1,
      }}
      border={false}
      onMouseMove={() => {
        setIsHovered(true)
      }}
      onMouseOut={() => {
        setIsHovered(false)
      }}
      onMouseDown={props.onMouseDown}
    >
      <box style={{ flexDirection: 'row', flexGrow: 1, flexShrink: 1, overflow: 'hidden', gap: 1 }}>
        <box style={{ flexDirection: 'row', flexShrink: 0 }}>
          <text flexShrink={0} fg={active ? theme.background : theme.text} attributes={active ? TextAttributes.BOLD : undefined} selectable={false} wrapMode="none">{active ? '›' : ' '}</text>
          {icon && <text flexShrink={0} fg={active ? theme.background : iconColor || theme.text} selectable={false} wrapMode="none">{getIconEmoji(icon)} </text>}
          <text
            flexShrink={0}
            fg={active ? theme.background : theme.text}
            attributes={active ? TextAttributes.BOLD : undefined}
            selectable={false}
            wrapMode="none"
          >
            {title}
          </text>
        </box>
        {subtitle && (
          <text
            flexShrink={0}
            fg={active ? theme.background : theme.textMuted}
            selectable={false}
            wrapMode="none"
          >
            {subtitle}
          </text>
        )}
      </box>
      {accessoryElements.length > 0 && (
        <box style={{ flexDirection: 'row', flexShrink: 0 }}>
          {accessoryElements.map((elem, i) => (
            <box key={i} style={{ flexDirection: 'row' }}>
              {i > 0 && <text flexShrink={0}> </text>}
              {elem}
            </box>
          ))}
        </box>
      )}
    </box>
  )
}

export const List: ListType = (props) => {
  const {
    children,
    onSelectionChange,
    filtering,
    searchText: controlledSearchText,
    onSearchTextChange,
    searchBarPlaceholder = 'Search...',
    isLoading,
    navigationTitle,
    isShowingDetail,
    selectedItemId,
    searchBarAccessory,
    ...otherProps
  } = props

  const theme = useTheme()
  const currentStackSelectedListIndex = useStore((state) => {
    const stack = state.navigationStack
    const currentItem = stack[stack.length - 1]
    return currentItem?.selectedListIndex
  })
  const [internalSearchText, setInternalSearchText] = useState('')
  const [selectedIndex, setSelectedIndex] = useState<number>(() => {
    return currentStackSelectedListIndex ?? 0
  })
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [currentDetail, setCurrentDetail] = useState<ReactNode>(null)

  const inputRef = useRef<TextareaRenderable>(null)
  const customEmptyViewRef = useRef(false)

  // Ref callback that registers the textarea in global state for ESC handling
  const setInputRef = useCallback((node: TextareaRenderable | null) => {
    if (!node) return

    inputRef.current = node
    useStore.setState({ activeSearchInputRef: node })

    // React 19: return cleanup function for unmount
    return () => {
      if (useStore.getState().activeSearchInputRef === node) {
        useStore.setState({ activeSearchInputRef: null })
      }
      inputRef.current = null
    }
  }, [])
  const scrollBoxRef = useRef<ScrollBoxRenderable>(null)
  const descendantsContext = useListDescendants()
  const navigationPending = useNavigationPending()

  const searchText =
    controlledSearchText !== undefined
      ? controlledSearchText
      : internalSearchText

  // Sync controlled searchText → textarea (only when externally controlled)
  useLayoutEffect(() => {
    if (controlledSearchText === undefined) return
    const textarea = inputRef.current
    if (!textarea) return

    // Skip if textarea already has the correct value
    if (textarea.plainText === controlledSearchText) return

    // Save cursor position, set text, then restore cursor (clamped to valid range)
    const cursorOffset = textarea.cursorOffset
    textarea.setText(controlledSearchText)
    textarea.cursorOffset = Math.min(cursorOffset, controlledSearchText.length)
  }, [controlledSearchText])

  // Filtering logic (matches Raycast behavior):
  //
  // | filtering prop | onSearchTextChange | Result          |
  // |----------------|-------------------|-----------------|
  // | undefined      | undefined         | true (default)  |
  // | undefined      | provided          | false           |
  // | true           | undefined         | true            |
  // | true           | provided          | true            |
  // | false          | undefined         | false           |
  // | false          | provided          | false           |
  //
  // Summary: filtering defaults to true, but is implicitly disabled when
  // onSearchTextChange is provided (user manages filtering). Set filtering={true}
  // explicitly to use built-in filtering alongside onSearchTextChange.
  const isFilteringEnabled = (() => {
    if (filtering === false) return false
    if (filtering === true) return true
    return !onSearchTextChange
  })()

  const openDropdown = () => {
    setIsDropdownOpen(true)
  }

  const persistSelectedIndexInCurrentNavigationItem = (index: number) => {
    useStore.setState((state) => {
      const stack = state.navigationStack
      const currentIndex = stack.length - 1
      const currentItem = stack[currentIndex]
      if (!currentItem) {
        return {}
      }

      if (currentItem.selectedListIndex === index) {
        return {}
      }

      const nextStack = [...stack]
      nextStack[currentIndex] = {
        ...currentItem,
        selectedListIndex: index,
      }

      return {
        navigationStack: nextStack,
      }
    })
  }

  const setSelectedIndexWithPersistence = (index: number) => {
    setSelectedIndex(index)
    persistSelectedIndexInCurrentNavigationItem(index)
  }

  // Sync selection to the first visible item whenever searchText changes.
  // Runs after children's useLayoutEffects (descendants registered) but before paint,
  // so there is no intermediate frame with stale selection.
  // Works for both controlled and uncontrolled searchText.
  const prevSearchTextRef = useRef(searchText)
  useLayoutEffect(() => {
    if (prevSearchTextRef.current === searchText) return
    prevSearchTextRef.current = searchText

    if (!isFilteringEnabled) return

    const items = Object.values(descendantsContext.map.current)
      .filter((item) => item.index !== -1 && item.props?.visible !== false)
      .sort((a, b) => a.index - b.index)

    if (items.length > 0 && items[0]) {
      setSelectedIndexWithPersistence(items[0].index)
    }
  })

  const listContextValue = useMemo<ListContextValue>(
    () => ({
      isDropdownOpen,
      setIsDropdownOpen,
      openDropdown,
      selectedIndex,
      setSelectedIndex: setSelectedIndexWithPersistence,
      searchText,
      isFiltering: isFilteringEnabled,
      setCurrentDetail,
      isShowingDetail,
      customEmptyViewRef,
      isLoading,
      hasDropdown: !!searchBarAccessory,
    }),
    [isDropdownOpen, selectedIndex, searchText, isFilteringEnabled, isShowingDetail, isLoading, searchBarAccessory],
  )

  // Clear detail when detail view is hidden (before paint to avoid flash)
  useLayoutEffect(() => {
    if (!isShowingDetail) {
      setCurrentDetail(null)
    }
  }, [isShowingDetail])

  // Handle selectedItemId prop changes (before paint to avoid flash)
  useLayoutEffect(() => {
    // Only update selection if selectedItemId is explicitly provided
    if (selectedItemId !== undefined) {
      const items = Object.values(descendantsContext.map.current)
        .filter((item) => item.index !== -1)

      const foundItem = items.find((item) => item.props?.id === selectedItemId)
      if (foundItem) {
        setSelectedIndexWithPersistence(foundItem.index)
      }
    }
  }, [selectedItemId])

  // Call onSelectionChange when selection changes
  useEffect(() => {
    const items = Object.values(descendantsContext.map.current)
      .filter((item) => item.index !== -1)
      .sort((a, b) => a.index - b.index)

    const currentItem = items.find((item) => item.index === selectedIndex)

    // Call onSelectionChange callback if provided
    if (onSelectionChange) {
      const selectedId = currentItem?.props?.id ?? null
      onSelectionChange(selectedId)
    }
  }, [selectedIndex])

  const scrollToItem = (item: { props?: ListItemDescendant }) => {
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

  // Track whether onLoadMore has been called and we're waiting for new items.
  // Reset when item count changes (new items arrived) so we can trigger again.
  const paginationCalledRef = useRef(false)
  const prevItemCountRef = useRef(0)

  const triggerPaginationIfNeeded = (currentVisibleIndex: number, totalItems: number) => {
    if (!props.pagination?.hasMore || paginationCalledRef.current) return
    // Trigger when within 5 items of the end, matching Raycast's behavior
    const threshold = Math.min(5, Math.max(1, Math.floor(totalItems * 0.2)))
    if (totalItems - currentVisibleIndex <= threshold) {
      paginationCalledRef.current = true
      props.pagination.onLoadMore()
    }
  }

  const move = (direction: -1 | 1) => {
    // Get all visible items
    const items = Object.values(descendantsContext.map.current)
      .filter((item) => item.index !== -1 && item.props?.visible !== false)
      .sort((a, b) => a.index - b.index)

    if (items.length === 0) return

    // Reset pagination lock when new items arrive
    if (items.length !== prevItemCountRef.current) {
      prevItemCountRef.current = items.length
      paginationCalledRef.current = false
    }

    // Find currently selected item's position in visible items
    let currentVisibleIndex = items.findIndex(
      (item) => item.index === selectedIndex,
    )
    if (currentVisibleIndex === -1) {
      // If current selection is not visible, select first visible item
      if (items[0]) {
        setSelectedIndexWithPersistence(items[0].index)
      }
      return
    }

    // Calculate next visible index
    let nextVisibleIndex = currentVisibleIndex + direction

    // When navigating past the end and pagination has more, don't wrap
    if (direction === 1 && nextVisibleIndex >= items.length && props.pagination?.hasMore) {
      triggerPaginationIfNeeded(currentVisibleIndex, items.length)
      // Stay on the last item instead of wrapping
      return
    }

    if (nextVisibleIndex < 0) nextVisibleIndex = items.length - 1
    if (nextVisibleIndex >= items.length) nextVisibleIndex = 0

    const nextItem = items[nextVisibleIndex]
    if (nextItem) {
      flushSync(() => {
        setSelectedIndex(nextItem.index)
      })
      persistSelectedIndexInCurrentNavigationItem(nextItem.index)
      scrollToItem(nextItem)

      // Check if we're approaching the end and should trigger pagination
      triggerPaginationIfNeeded(nextVisibleIndex, items.length)
    }
  }

  const inFocus = useIsInFocus()
  const dialog = useDialog()

  useKeyboard((evt) => {
    if (!inFocus) return

    // Handle Ctrl+P for dropdown
    if (evt.ctrl && evt.name === 'p' && searchBarAccessory && !isDropdownOpen) {
      openDropdown()
      return
    }

    // Get current item by selectedIndex (which is a descendant index)
    const items = Object.values(descendantsContext.map.current)
      .filter((item) => item.index !== -1)
      .sort((a, b) => a.index - b.index)
    const currentItem = items.find((item) => item.index === selectedIndex)

    // Handle Ctrl+K to show actions dialog via portal
    if (evt.name === 'k' && evt.ctrl) {
      const hasActions = currentItem?.props?.actions || props.actions
      if (hasActions) {
        useStore.setState({ showActionsDialog: true })
      }
      return
    }

    if (evt.name === 'up') move(-1)
    if (evt.name === 'down') move(1)
    // Handle Enter to auto-execute first action via ActionPanel
    if (evt.name === 'return') {
      if (!currentItem?.props) return

      if (currentItem.props.actions) {
        useStore.setState({ shouldAutoExecuteFirstAction: true })
      }
    }
  })

  const handleSearchChange = (newValue: string) => {
    if (!inFocus) return

    // Always call onSearchTextChange if provided
    if (onSearchTextChange) {
      onSearchTextChange(newValue)
    }

    if (controlledSearchText === undefined) {
      setInternalSearchText(newValue)
    }
  }

  return (
    <ListContext.Provider value={listContextValue}>
      <ListDescendantsProvider value={descendantsContext}>
        <box style={{ flexDirection: 'column', flexGrow: 1 }}>
          {/* Cannot mount focused actions here - would need to be handled differently */}

          {navigationTitle && (
            <box
              border={false}
              style={{
                paddingBottom: 0,
                flexShrink: 0,
                paddingLeft: 1,
                paddingRight: 1,
                overflow: 'hidden',
              }}
            >
              <LoadingBar
                title={navigationTitle}
                isLoading={isLoading || navigationPending}
              />
            </box>
          )}

          {/* Search bar with optional dropdown accessory */}
          <box style={{ flexShrink: 0 }}>
            <box
              border={false}
              style={{
                paddingLeft: 1,
                paddingRight: 1,
                marginTop: 1,
                marginBottom: 1,
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <box
                style={{
                  flexGrow: 1,
                  flexDirection: 'row',
                  flexShrink: 1,
                }}
              >
                <text flexShrink={0} fg={theme.textMuted}>&gt; </text>
                <textarea
                  ref={setInputRef}
                  height={1}
                  flexGrow={1}
                  wrapMode='none'
                  keyBindings={[
                    { name: 'return', action: 'submit' },
                    { name: 'linefeed', action: 'submit' },
                  ]}
                  placeholder={searchBarPlaceholder}
                  focused={inFocus && !isDropdownOpen}
                  initialValue={searchText}
                  onContentChange={() => {
                    const value = inputRef.current?.plainText || ''
                    handleSearchChange(value)
                  }}
                  focusedBackgroundColor={theme.backgroundPanel}
                  cursorColor={theme.primary}
                  focusedTextColor={theme.text}
                />
              </box>
              {searchBarAccessory}
            </box>
          </box>

          {/* Main content area with optional detail view */}
          <box style={{ flexDirection: 'row', flexGrow: 1, flexShrink: 1 }}>
            {/* List content - render children which will register themselves */}
            <box style={{ width: isShowingDetail ? '50%' : '100%', flexGrow: 1, flexShrink: 1, flexDirection: 'column' }}>
              {/* Scrollable list items */}
              <ScrollBox
                ref={scrollBoxRef}
                focused={false}
                flexGrow={1}
                flexShrink={1}
                minHeight={6}
                style={{
                  rootOptions: {
                    backgroundColor: undefined,
                  },
                  viewportOptions: {
                    paddingRight: 0,
                  },
                  scrollbarOptions: {
                    visible: false,
                  },
                }}
              >
                {/* Render children - they will register as descendants */}
                <ListItemsRenderer>{children}</ListItemsRenderer>
              </ScrollBox>

              {/* Footer with keyboard shortcuts or toast */}
              <ListFooter />

              {/* Render current item's actions offscreen to capture them with context preserved */}
              <CurrentItemActionsOffscreen
                selectedIndex={selectedIndex}
                fallbackActions={props.actions}
              />
            </box>

            {/* Detail panel on the right */}
            {isShowingDetail && currentDetail && (
              <box
                style={{
                  marginTop: 1,
                  width: '50%',
                  paddingLeft: 1,
                  paddingRight: 1,
                }}
                border={['left']}
                borderStyle='single'
                borderColor={theme.border}
              >
                {currentDetail}
              </box>
            )}
          </box>
        </box>
      </ListDescendantsProvider>
    </ListContext.Provider>
  )
}


// Wrapper component that only renders children when no visible items exist
function ShowOnNoItems(props: { children: ReactNode; isCustomEmptyView?: boolean }): any {
  // Subscribe to re-render when items are added/removed
  void useListDescendantsRerender()
  // Get live map ref for reading in useLayoutEffect
  const map = useListDescendantsMap()
  const listContext = useContext(ListContext)
  const [hasVisibleItems, setHasVisibleItems] = useState(true)

  // We must check visibility in useLayoutEffect because:
  // 1. map.current is cleared by reset() during render, so it's empty if read during render
  // 2. committedMap is stale - it's a snapshot from the previous render cycle and doesn't
  //    reflect prop changes like 'visible' (only tracks which items exist, not their props)
  // 3. Items register in their own useLayoutEffect, so map.current is only populated after
  //    all items' layout effects have run
  useLayoutEffect(() => {
    const items = Object.values(map.current)
      .filter((item) => item.index !== -1 && item.props?.visible !== false)
    // For default empty view, also check if custom empty view exists
    const hasCustomEmptyView = !props.isCustomEmptyView && (listContext?.customEmptyViewRef.current ?? false)
    setHasVisibleItems(items.length > 0 || hasCustomEmptyView)
  })

  if (hasVisibleItems) return null

  return props.children
}

function DefaultEmptyView(): any {
  const theme = useTheme()
  return (
    <ShowOnNoItems>
      <box
        style={{
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          paddingTop: 2,
          paddingBottom: 2,
          paddingLeft: 2,
          paddingRight: 2,
        }}
      >
        <text flexShrink={0} fg={theme.textMuted}>
          No items found
        </text>
      </box>
    </ShowOnNoItems>
  )
}

// Component to render list items and sections
function ListItemsRenderer(props: { children?: ReactNode }): any {
  const { children } = props
  const listContext = useContext(ListContext)
  const searchText = listContext?.searchText || ''

  // Pass search text down via context
  return (
    <ListSectionContext.Provider value={{ searchText }}>
      {children}
      <DefaultEmptyView />
    </ListSectionContext.Provider>
  )
}

// Context for passing section state to items
interface ListSectionContextValue {
  sectionTitle?: string
  searchText?: string
}

const ListSectionContext = createContext<ListSectionContextValue>({})

const ListItem: ListItemType = (props) => {
  const listSectionContext = useContext(ListSectionContext)
  const { sectionTitle } = listSectionContext
  const listContext = useContext(ListContext)
  const dialog = useDialog()
  const elementRef = useRef<BoxRenderable>(null)

  // Extract text values for descendant registration
  const titleText =
    typeof props.title === 'string' ? props.title : props.title.value
  const subtitleText = props.subtitle
    ? typeof props.subtitle === 'string'
      ? props.subtitle
      : props.subtitle.value || ''
    : undefined

  // Check if this item is visible based on search
  const isFiltering = listContext?.isFiltering ?? false
  const searchText = listContext?.searchText ?? ''

  const isVisible =
    !isFiltering ||
    shouldItemBeVisible(searchText, {
      title: titleText,
      subtitle: subtitleText,
      keywords: [...(props.keywords || []), sectionTitle].filter(
        Boolean,
      ) as string[],
    })

  // Register as descendant with all searchable data
  const { index } = useListItemDescendant({
    id: props.id,
    title: titleText,
    subtitle: subtitleText,
    keywords: [...(props.keywords || []), sectionTitle].filter(
      Boolean,
    ) as string[],
    actions: props.actions,
    visible: isVisible,
    detail: props.detail,
    elementRef: elementRef.current,
  })

  // Check if this item is selected
  const selectedIndex = listContext?.selectedIndex ?? 0
  const isActive = index === selectedIndex

  // Update detail when this item becomes active or detail prop changes (before paint)
  useLayoutEffect(() => {
    if (isActive && listContext?.isShowingDetail && listContext?.setCurrentDetail) {
      listContext.setCurrentDetail(props.detail || null)
    }
  }, [isActive, props.detail, listContext?.isShowingDetail, listContext?.setCurrentDetail])

  // Don't render if not visible
  if (!isVisible) return null

  // Handle mouse click on item
  const handleMouseDown = () => {
    if (listContext && index !== -1) {
      // If clicking on already selected item, show actions (like pressing Enter)
      if (isActive) {
        // Show actions dialog via portal
        if (props.actions) {
          useStore.setState({ showActionsDialog: true })
        }
      } else if (listContext.setSelectedIndex) {
        // Otherwise just select the item
        listContext.setSelectedIndex(index)
      }
    }
  }

  // Don't show accessories if we're showing detail
  const showAccessories = !props.detail && props.accessories

  // Get icon string and color from props.icon (can be string or object with value/tintColor)
  const { iconValue, iconColor } = (() => {
    if (!props.icon) return { iconValue: undefined, iconColor: undefined }
    if (typeof props.icon === 'string') return { iconValue: props.icon, iconColor: undefined }
    const iconObj = props.icon as Record<string, unknown>
    if ('source' in iconObj && typeof iconObj.source === 'string') {
      return { iconValue: iconObj.source, iconColor: iconObj.tintColor as string | undefined }
    }
    if ('value' in iconObj && iconObj.value) {
      const val = iconObj.value
      if (typeof val === 'string') return { iconValue: val, iconColor: undefined }
      if (typeof val === 'object' && val !== null) {
        const valObj = val as Record<string, unknown>
        if ('source' in valObj && typeof valObj.source === 'string') {
          return { iconValue: valObj.source, iconColor: valObj.tintColor as string | undefined }
        }
      }
    }
    return { iconValue: undefined, iconColor: undefined }
  })()

  // Render the item row directly
  return (
    <ListItemRow
      title={titleText}
      subtitle={subtitleText}
      icon={iconValue}
      iconColor={iconColor}
      accessories={showAccessories ? props.accessories : undefined}
      active={isActive}
      isShowingDetail={props.detail !== undefined}
      onMouseDown={handleMouseDown}
      index={index}
      ref={elementRef}
    />
  )
}

const ListItemDetail: ListItemDetailType = (props) => {
  const theme = useTheme()
  const { isLoading, markdown, metadata } = props

  return (
    <box style={{ flexDirection: 'column', flexGrow: 1 }}>
      {isLoading && (
        <box style={{ paddingBottom: 1 }}>
          <text flexShrink={0} fg={theme.textMuted}>Loading...</text>
        </box>
      )}

      <ScrollBox
        focused={false}
        // flexGrow={1}
        flexShrink={1}
        style={{
          rootOptions: {
            backgroundColor: undefined,
          },
          scrollbarOptions: {

            showArrows: true,

          },
        }}
      >
        <box gap={1} style={{ flexDirection: 'column' }}>
          {markdown && (
            <code content={markdown} filetype="markdown" syntaxStyle={markdownSyntaxStyle} drawUnstyledText={false} />
          )}
          {metadata && (
            <box
              style={{ paddingTop: 1 }}
              // border={['top']}
              // borderStyle='single'
              // borderColor={theme.border}
            >
              {metadata}
            </box>
          )}
        </box>
      </ScrollBox>
    </box>
  )
}

import { Metadata, MetadataContext } from 'termcast/src/components/metadata'
import type { MetadataConfig } from 'termcast/src/components/metadata'

// List.Item.Detail.Metadata config: smaller padding for compact list detail panel
const listDetailMetadataConfig: MetadataConfig = {
  maxValueLen: 20,
  titleMinWidth: 12,
  paddingBottom: 0.5,
  separatorWidth: 17,
}

const ListItemDetailMetadata = (props: MetadataProps) => {
  return (
    <MetadataContext.Provider value={listDetailMetadataConfig}>
      <box style={{ flexDirection: 'column' }}>
        {props.children}
      </box>
    </MetadataContext.Provider>
  )
}

ListItemDetail.Metadata = ListItemDetailMetadata as any
ListItemDetailMetadata.Label = Metadata.Label as any
ListItemDetailMetadata.Separator = Metadata.Separator as any
ListItemDetailMetadata.Link = Metadata.Link as any
ListItemDetailMetadata.TagList = Metadata.TagList as any

ListItem.Detail = ListItemDetail

/**
 * A dropdown menu shown in the right-hand-side of the search bar.
 * Open it with Ctrl+P or by clicking on it.
 *
 * Note: There is no built-in "All" or reset option. If you want users to be
 * able to reset the filter, add a `List.Dropdown.Item` with title="All" and
 * value="" (or your preferred reset value) at the top of your dropdown items.
 */
const ListDropdown: ListDropdownType = (props) => {
  const theme = useTheme()
  const listContext = useContext(ListContext)
  const [isHovered, setIsHovered] = useState(false)

  // If not inside a List, just render nothing (for type safety)
  if (!listContext) {
    return null
  }

  const { isDropdownOpen, setIsDropdownOpen } = listContext
  // Store both value and title together
  const [dropdownState, setDropdownState] = useState<{
    value: string
    title: string
  }>(() => {
    const initialValue = props.value || props.defaultValue || ''
    return { value: initialValue, title: initialValue || 'All' }
  })
  const descendantsContext = useDropdownDescendants()
  const dialog = useDialog()
  const inFocus = useIsInFocus()

  // Update value and find its title
  useLayoutEffect(() => {
    const valueToUse =
      props.value !== undefined ? props.value : dropdownState.value

    // If no value is set and we have descendants, use the first item
    if (!valueToUse && !props.value && !props.defaultValue) {
      const items = Object.values(descendantsContext.map.current)
        .filter((item) => item.index !== -1)
        .sort((a, b) => a.index - b.index)

      if (items.length > 0) {
        const firstItem = items[0].props as DropdownItemDescendant
        setDropdownState({ value: firstItem.value, title: firstItem.title })
        return
      }
    }

    if (!valueToUse) return

    // Try to find the title for this value
    let title = valueToUse
    for (const item of Object.values(descendantsContext.map.current)) {
      const itemProps = item.props as DropdownItemDescendant
      if (itemProps.value === valueToUse) {
        title = itemProps.title
        break
      }
    }

    // Only update if something changed
    if (dropdownState.value !== valueToUse || dropdownState.title !== title) {
      setDropdownState({ value: valueToUse, title })
    }
  }, [props.value]) // Run when props.value changes and on mount

  const dropdownContextValue = useMemo<DropdownContextValue>(
    () => ({
      currentSection: undefined,
    }),
    [],
  )

  // Open dropdown dialog when triggered (before paint to avoid flash)
  useLayoutEffect(() => {
    if (isDropdownOpen && !dialog.stack.length) {
      // Pass the children to the dialog to render them there
      dialog.push({
        element: (
          <ListDropdownDialog
            {...props}
            value={dropdownState.value}
            onChange={(newValue) => {
              // Find the title for this value
              let title = newValue
              for (const item of Object.values(descendantsContext.map.current)) {
                const itemProps = item.props as DropdownItemDescendant
                if (itemProps.value === newValue) {
                  title = itemProps.title
                  break
                }
              }
              setDropdownState({ value: newValue, title })
              setIsDropdownOpen(false)
              dialog.clear()
              if (props.onChange) {
                props.onChange(newValue)
              }
              // TODO: Handle storeValue to persist the value
            }}
            onCancel={() => {
              setIsDropdownOpen(false)
              dialog.clear()
            }}
          >
            {props.children}
          </ListDropdownDialog>
        ),
        position: 'center',
      })
    }
  }, [isDropdownOpen, props.children])

  // Display the title from our state
  const displayValue = dropdownState.title || 'All'

  return (
    <DropdownDescendantsProvider value={descendantsContext}>
      <DropdownContext.Provider value={dropdownContextValue}>
        {/* Render children to collect items - they return null anyway */}
        {props.children}
        {/* Render dropdown UI */}
        <box
          key={dropdownState.value}
          style={{
            paddingTop: 1,
            paddingLeft: 2,
            // minWidth: value.length + 4,
            flexDirection: 'row',
            flexShrink: 0,
            backgroundColor: isHovered ? theme.backgroundPanel : undefined,
          }}
          onMouseMove={() => setIsHovered(true)}
          onMouseOut={() => setIsHovered(false)}
          onMouseDown={() => {
            // Open dropdown when clicked
            if (!isDropdownOpen) {
              listContext.openDropdown()
            }
          }}
        >
          {/*<text >^p </text>*/}
          {listContext.isLoading ? (
            <LoadingText isLoading color={isHovered ? theme.text : theme.textMuted}>
              {displayValue || 'Loading...'}
            </LoadingText>
          ) : (
            <text
              flexShrink={0}
              fg={isHovered ? theme.text : theme.textMuted}
              selectable={false}
            >
              {displayValue}
            </text>
          )}
          <text
            flexShrink={0}
            fg={isHovered ? theme.text : theme.textMuted}
            selectable={false}
          >
            {' '}
            ▾
          </text>
        </box>
      </DropdownContext.Provider>
    </DropdownDescendantsProvider>
  )
}

ListDropdown.Item = (props) => {
  const theme = useTheme()
  const dropdownContext = useContext(DropdownContext)
  const [isHovered, setIsHovered] = useState(false)

  // If not inside a Dropdown, just render nothing
  if (!dropdownContext) {
    return null
  }

  const {
    currentSection,
    selectedIndex,
    currentValue,
    setSelectedIndex,
    onChange,
    searchText,
    isFiltering,
  } = dropdownContext

  // Check if this item is visible based on search
  const isVisible =
    !isFiltering ||
    !searchText ||
    shouldItemBeVisible(searchText, {
      title: props.title,
      keywords: currentSection ? [currentSection] : [],
    })

  // Register as descendant
  const { index } = useDropdownItemDescendant({
    value: props.value,
    title: props.title,
    section: currentSection,
    visible: isVisible,
  })

  // Don't render if not visible
  if (!isVisible) return null

  // If we're in the dialog, render the item
  if (selectedIndex !== undefined) {
    const isActive = selectedIndex === index
    const isCurrent = props.value === currentValue

    const handleMouseMove = () => {
      setIsHovered(true)
      // Update selected index on hover
      if (setSelectedIndex && index !== selectedIndex) {
        setSelectedIndex(index)
      }
    }

    const handleMouseDown = () => {
      // Trigger selection on click
      if (onChange) {
        onChange(props.value)
      }
    }

    return (
      <box
        style={{
          flexDirection: 'row',
          backgroundColor: isActive
            ? theme.primary
            : isHovered
              ? theme.backgroundPanel
              : undefined,
          paddingLeft: isActive ? 0 : 1,
          paddingRight: 1,
          justifyContent: 'space-between',
        }}
        border={false}
        onMouseMove={handleMouseMove}
        onMouseOut={() => setIsHovered(false)}
        onMouseDown={handleMouseDown}
      >
        <box style={{ flexDirection: 'row' }}>
          {isActive && (
            <text flexShrink={0} fg={theme.background} selectable={false}>
              ›{''}
            </text>
          )}
          <text
            flexShrink={0}
            fg={
              isActive
                ? theme.background
                : isCurrent
                  ? theme.primary
                  : theme.text
            }
            attributes={isActive ? TextAttributes.BOLD : undefined}
            selectable={false}
          >
            {props.title}
          </text>
        </box>
      </box>
    )
  }

  return null
}

ListDropdown.Section = (props) => {
  const theme = useTheme()
  const parentContext = useContext(DropdownContext)

  // If not inside a Dropdown, just render nothing
  if (!parentContext) {
    return null
  }

  // Create a new context with the section name
  const sectionContextValue = useMemo<DropdownContextValue>(
    () => ({
      ...parentContext,
      currentSection: props.title,
    }),
    [parentContext, props.title],
  )

  // Hide section title when searching
  const showTitle =
    parentContext.selectedIndex !== undefined &&
    props.title &&
    !parentContext.searchText?.trim()

  return (
    <>
      {/* Render section title if we're in the dialog and not searching */}
      {showTitle && (
        <box style={{ paddingTop: 1, paddingLeft: 1 }}>
          <text flexShrink={0} fg={theme.accent} attributes={TextAttributes.BOLD}>
            {props.title}
          </text>
        </box>
      )}
      <DropdownContext.Provider value={sectionContextValue}>
        {props.children}
      </DropdownContext.Provider>
    </>
  )
}

List.Item = ListItem
const ListSection = (props: SectionProps) => {
  const theme = useTheme()
  const parentContext = useContext(ListSectionContext)
  const listContext = useContext(ListContext)
  const searchText = listContext?.searchText || ''

  // Create new context with section title and search text
  // NOTE: Must be called before any early returns to satisfy React hooks rules
  const sectionContextValue = useMemo(
    () => ({
      ...parentContext,
      sectionTitle: props.title,
      searchText,
    }),
    [parentContext, props.title, searchText],
  )

  // Don't render empty sections
  if (React.Children.count(props.children) === 0) {
    return null
  }

  const isSearching = searchText.trim().length > 0

  const children = (
    <ListSectionContext.Provider value={sectionContextValue}>
      {props.children}
    </ListSectionContext.Provider>
  )

  if (isSearching) {
    return children
  }

  return (
    <box style={{ marginBottom: 1 }}>
      {props.title && (
        <box
          border={false}
          style={{
            paddingLeft: 1,
          }}
        >
          <text flexShrink={0} fg={theme.accent} attributes={TextAttributes.BOLD}>
            {props.title}
          </text>
        </box>
      )}
      {children}
    </box>
  )
}

List.Section = ListSection
List.Dropdown = ListDropdown
// Inner component for EmptyView content (needs hooks at top level)
function EmptyViewContent(props: EmptyViewProps): any {
  const theme = useTheme()
  const inFocus = useIsInFocus()

  // Handle keyboard for actions
  useKeyboard((evt) => {
    if (!inFocus) return

    // Handle Ctrl+K to show actions dialog via portal
    if (evt.name === 'k' && evt.ctrl) {
      if (props.actions) {
        useStore.setState({ showActionsDialog: true })
      }
      return
    }

    // Handle Enter to auto-execute first action via ActionPanel
    if (evt.name === 'return' && props.actions) {
      useStore.setState({ shouldAutoExecuteFirstAction: true })
    }
  })

  const iconEmoji = props.icon ? getIconValue(props.icon) || null : null

  return (
    <box
      style={{
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        flexGrow: 1,
        paddingTop: 2,
        paddingBottom: 2,
        paddingLeft: 2,
        paddingRight: 2,
        gap: 1,
      }}
    >
      {iconEmoji && (
        <text flexShrink={0} fg={theme.textMuted} style={{ marginBottom: 1 }}>
          {iconEmoji}
        </text>
      )}
      {props.title && (
        <text flexShrink={0} fg={theme.text} attributes={TextAttributes.BOLD}>
          {props.title?.replace(/\bRaycast\b/g, 'Termcast').replace(/\braycast\b/g, 'termcast') || ''}
        </text>
      )}
      {props.description && (
        <text flexShrink={0} fg={theme.textMuted} wrapMode='word'>
          {props.description?.replace(/\bRaycast\b/g, 'Termcast').replace(/\braycast\b/g, 'termcast') || ''}
        </text>
      )}
      {/* Render actions offscreen to capture them */}
      {props.actions && <Offscreen>{props.actions}</Offscreen>}
    </box>
  )
}

List.EmptyView = (props: EmptyViewProps) => {
  const listContext = useContext(ListContext)

  // Register that a custom empty view exists
  useLayoutEffect(() => {
    if (listContext?.customEmptyViewRef) {
      listContext.customEmptyViewRef.current = true
      return () => {
        listContext.customEmptyViewRef.current = false
      }
    }
  }, [listContext])

  return (
    <ShowOnNoItems isCustomEmptyView>
      <EmptyViewContent {...props} />
    </ShowOnNoItems>
  )
}

export default List

// Grid Component Implementation
export interface GridInset {
  bottom?: number
  left?: number
  right?: number
  top?: number
}

export interface GridItemProps extends ActionsInterface, CommonProps {
  id?: string
  content:
    | Image.ImageLike
    | {
        value: Image.ImageLike
        tooltip?: string | null
      }
  title:
    | string
    | {
        value: string
        tooltip?: string | null
      }
  subtitle?:
    | string
    | {
        value?: string | null
        tooltip?: string | null
      }
  keywords?: string[]
  getDetailMarkdown?: () =>
    | { markdown: string; metadata?: ReactElement<MetadataProps> }
    | Promise<{ markdown: string; metadata?: ReactElement<MetadataProps> }>
}

export interface GridProps
  extends ActionsInterface,
    NavigationChildInterface,
    SearchBarInterface,
    PaginationInterface,
    CommonProps {
  actions?: ReactNode
  aspectRatio?: '1' | '3/2' | '2/3' | '4/3' | '3/4' | '16/9' | '9/16'
  children?: ReactNode
  columns?: number
  fit?: 'contain' | 'fill'
  inset?: GridInset
  navigationTitle?: string
  onSelectionChange?: (id: string | null) => void
  searchBarAccessory?: ReactElement<DropdownProps> | null
  searchText?: string
  enableFiltering?: boolean
  searchBarPlaceholder?: string
  selectedItemId?: string
}

export interface GridSectionProps extends CommonProps {
  children?: ReactNode
  id?: string
  title?: string
  subtitle?: string
  aspectRatio?: '1' | '3/2' | '2/3' | '4/3' | '3/4' | '16/9' | '9/16'
  columns?: number
  fit?: 'contain' | 'fill'
  inset?: GridInset
}

interface GridType {
  (props: GridProps): any
  Item: (props: GridItemProps) => any
  Section: (props: GridSectionProps) => any
  Dropdown: ListDropdownType
  EmptyView: (props: EmptyViewProps) => any
  Inset: {
    Small: GridInset
    Medium: GridInset
    Large: GridInset
  }
}

// Grid uses List internally with a different visual representation
export const Grid: GridType = (props) => {
  // Grid is essentially List with grid layout
  // We'll reuse the List component but with grid-specific styling
  const {
    columns = 5,
    aspectRatio = '1',
    fit = 'contain',
    inset,
    ...listProps
  } = props

  return <List {...listProps} />
}

// Grid.Item maps to List.Item but with content instead of icon
Grid.Item = (props: GridItemProps) => {
  const { content, getDetailMarkdown, ...itemProps } = props

  // Extract image value and tooltip
  const imageValue = (() => {
    if (typeof content === 'string') return content
    if (content && 'source' in content) return content
    if (content && 'value' in content) return content.value
    return undefined
  })()
  const imageTooltip =
    typeof content === 'object' && content && 'tooltip' in content ? content.tooltip : undefined

  // Convert Grid.Item props to List.Item props
  const listItemProps: ItemProps = {
    ...itemProps,
    // Grid items don't have accessories in Raycast
    accessories: undefined,
    // Use content as icon for now (in a real implementation, this would be rendered differently)
    icon: imageValue,
  }

  return <List.Item {...listItemProps} />
}

// Grid.Section maps to List.Section with grid-specific props
Grid.Section = (props: GridSectionProps) => {
  const { columns, aspectRatio, fit, inset, ...sectionProps } = props

  // Pass through to List.Section
  return <List.Section {...sectionProps} />
}

// Reuse List's Dropdown
Grid.Dropdown = List.Dropdown

// Reuse List's EmptyView
Grid.EmptyView = List.EmptyView

// Grid Inset presets
Grid.Inset = {
  Small: { top: 0, right: 0, bottom: 0, left: 0 },
  Medium: { top: 8, right: 8, bottom: 8, left: 8 },
  Large: { top: 16, right: 16, bottom: 16, left: 16 },
}
