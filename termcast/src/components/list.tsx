import {
  BoxRenderable,
  ScrollBoxRenderable,
  TextAttributes,
  TextareaRenderable,
} from '@opentui/core'
import { useKeyboard } from '@opentui/react'
import React, {
    ReactElement,
    ReactNode,
    createContext,
    useContext,
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState
} from 'react'
import { LoadingBar } from 'termcast/src/components/loading-bar'
import { createDescendants } from 'termcast/src/descendants'
import { useDialog } from 'termcast/src/internal/dialog'
import { useIsInFocus } from 'termcast/src/internal/focus-context'
import { useNavigationPending } from 'termcast/src/internal/navigation'
import { ScrollBox } from 'termcast/src/internal/scrollbox'
import { useStore } from 'termcast/src/state'
import { Theme, markdownSyntaxStyle } from 'termcast/src/theme'
import { CommonProps } from 'termcast/src/utils'

interface ActionsInterface {
  actions?: ReactNode
}

function ListFooter(): any {
  const toast = useStore((state) => state.toast)

  if (toast) {
    return (
      <box
        border={false}
        style={{
          paddingLeft: 1,
          paddingRight: 1,
          paddingTop: 1,
          marginTop: 1,
        }}
      >
        {toast}
      </box>
    )
  }

  return (
    <box
      border={false}
      style={{
        paddingLeft: 1,
        flexShrink: 0,
        paddingRight: 1,
        paddingTop: 1,
        marginTop: 1,
        flexDirection: 'row',
      }}
    >
      <text fg={Theme.text} attributes={TextAttributes.BOLD}>
        ↵
      </text>
      <text fg={Theme.textMuted}> select</text>
      <text fg={Theme.text} attributes={TextAttributes.BOLD}>
        {'  '}↑↓
      </text>
      <text fg={Theme.textMuted}> navigate</text>
      <text fg={Theme.text} attributes={TextAttributes.BOLD}>
        {'  '}^k
      </text>
      <text fg={Theme.textMuted}> actions</text>
    </box>
  )
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

export type Color = string

export namespace Image {
  export type ImageLike = string
}

export type ItemAccessory =
  | {
      text?:
        | string
        | null
        | {
            value: string | null
            color?: Color
          }
    }
  | {
      date?:
        | Date
        | null
        | {
            value: Date | null
            color?: Color
          }
    }
  | {
      tag?:
        | string
        | {
            value: string
            color?: Color
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
  detail?: ReactElement<DetailProps>
}

export interface DetailProps extends CommonProps {
  isLoading?: boolean
  markdown?: string
  metadata?: ReactElement<MetadataProps> | null
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
  Item: (props: { text?: string; color?: Color; icon?: Image.ImageLike; onAction?: () => void }) => any
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
  const [searchText, setSearchTextRaw] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<TextareaRenderable>(null)
  const descendantsContext = useDropdownDescendants()

  // Wrapper function that updates search text
  const setSearchText = (value: string) => {
    setSearchTextRaw(value)
    setSelectedIndex(0) // Reset selection when search changes
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
              <text attributes={TextAttributes.BOLD}>{props.tooltip}</text>
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
                  setSearchText(value)
                }}
                placeholder={props.placeholder || 'Search...'}
                focused={inFocus}
                initialValue={searchText}
                focusedBackgroundColor={Theme.backgroundPanel}
                cursorColor={Theme.primary}
                focusedTextColor={Theme.textMuted}
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
              <text fg={Theme.textMuted}>Loading...</text>
            </box>
          )}
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
    </DropdownDescendantsProvider>
  )
}

// Render a single list item row
function ListItemRow(props: {
  title: string
  subtitle?: string
  accessories?: ItemAccessory[]
  active?: boolean
  isShowingDetail?: boolean
  onMouseDown?: () => void
  index?: number
  ref?: React.Ref<BoxRenderable>
}) {
  const { title, subtitle, accessories, active, ref } = props
  const [isHovered, setIsHovered] = useState(false)

  // Format accessories for display
  const accessoryElements: ReactNode[] = []
  if (accessories) {
    accessories.forEach((accessory) => {
        if ('text' in accessory && accessory.text) {
          const textValue =
            typeof accessory.text === 'string'
              ? accessory.text
              : accessory.text?.value
          if (textValue) {
            accessoryElements.push(
              <text
                key={`text-${textValue}`}
                fg={active ? Theme.background : Theme.info}
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
          if (tagValue) {
            accessoryElements.push(
              <text
                key={`tag-${tagValue}`}
                fg={active ? Theme.background : Theme.warning}
                wrapMode="none"
              >
                [{tagValue}]
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
          ? Theme.primary
          : isHovered
            ? Theme.backgroundPanel
            : undefined,
        paddingLeft: active ? 0 : 1,
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

        <text
          fg={active ? Theme.background : Theme.text}
          attributes={active ? TextAttributes.BOLD : undefined}
          selectable={false}
          wrapMode="none"
          flexShrink={0}
        >
          {active ? '›' : ''}
          {title}
        </text>
        {subtitle && (
          <text
            fg={active ? Theme.background : Theme.textMuted}
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
              {i > 0 && <text> </text>}
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
    filtering = true,
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

  const [internalSearchText, setInternalSearchTextRaw] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [currentDetail, setCurrentDetail] = useState<ReactNode>(null)
  const inputRef = useRef<TextareaRenderable>(null)
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
    if (textarea && textarea.plainText !== controlledSearchText) {
      textarea.setText(controlledSearchText)
    }
  }, [controlledSearchText])

  // Determine if filtering is enabled
  // List filters automatically when:
  // - filtering is not specified (defaults to true) OR filtering is explicitly true
  // List does NOT filter automatically when:
  // - When filtering={false}
  // - When onSearchTextChange is provided (implicitly sets filtering to false)
  // - Unless you explicitly set filtering={true} alongside onSearchTextChange
  const isFilteringEnabled = (() => {
    if (filtering === false) return false
    if (filtering === true) return true
    // filtering is undefined/not specified
    return !onSearchTextChange // defaults to true unless onSearchTextChange is provided
  })()

  const openDropdown = () => {
    setIsDropdownOpen(true)
  }

  // Wrapper function that updates search text
  const setInternalSearchText = (value: string) => {
    setInternalSearchTextRaw(value)
    // Reset to 0 when search changes - this is expected UX behavior
    setSelectedIndex(0)
  }

  const listContextValue = useMemo<ListContextValue>(
    () => ({
      isDropdownOpen,
      setIsDropdownOpen,
      openDropdown,
      selectedIndex,
      setSelectedIndex,
      searchText,
      isFiltering: isFilteringEnabled,
      setCurrentDetail,
      isShowingDetail,
    }),
    [isDropdownOpen, selectedIndex, searchText, isFilteringEnabled, isShowingDetail],
  )

  // Clear detail when detail view is hidden
  useEffect(() => {
    if (!isShowingDetail) {
      setCurrentDetail(null)
    }
  }, [isShowingDetail])

  // Handle selectedItemId prop changes
  useEffect(() => {
    // Only update selection if selectedItemId is explicitly provided
    if (selectedItemId !== undefined) {
      const items = Object.values(descendantsContext.map.current)
        .filter((item) => item.index !== -1)
        .sort((a, b) => a.index - b.index)

      const index = items.findIndex((item) => item.props?.id === selectedItemId)
      if (index !== -1) {
        setSelectedIndex(index)
      }
    }
  }, [selectedItemId])

  const scrollToItem = (item: { props?: ListItemDescendant }) => {
    const scrollBox = scrollBoxRef.current
    const elementRef = item.props?.elementRef
    if (!scrollBox || !elementRef) return

    const contentY = scrollBox.content?.y || 0
    const viewportHeight = scrollBox.viewport?.height || 10
    const currentScrollTop = scrollBox.scrollTop || 0

    const itemTop = elementRef.y - contentY
    const itemBottom = itemTop + elementRef.height

    const visibleTop = currentScrollTop
    const visibleBottom = currentScrollTop + viewportHeight

    if (itemTop < visibleTop) {
      scrollBox.scrollTo(itemTop)
    } else if (itemBottom > visibleBottom) {
      scrollBox.scrollTo(itemBottom - viewportHeight)
    }
  }

  const move = (direction: -1 | 1) => {
    const items = Object.values(descendantsContext.map.current)
      .filter((item) => item.index !== -1 && item.props?.visible !== false)
      .sort((a, b) => a.index - b.index)

    if (items.length === 0) return


    let currentVisibleIndex = items.findIndex(
      (item) => item.index === selectedIndex,
    )
    if (currentVisibleIndex === -1) {
      // If current selection is not visible, select first visible item
      if (items[0]) {
        setSelectedIndex(items[0].index)
        scrollToItem(items[0])
      }
      return
    }

    let nextVisibleIndex = currentVisibleIndex + direction
    if (nextVisibleIndex < 0) nextVisibleIndex = items.length - 1
    if (nextVisibleIndex >= items.length) nextVisibleIndex = 0

    const nextItem = items[nextVisibleIndex]
    if (nextItem) {
      setSelectedIndex(nextItem.index)
      scrollToItem(nextItem)
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

    // Handle Ctrl+K to show actions
    if (evt.name === 'k' && evt.ctrl) {
      const items = Object.values(descendantsContext.map.current)
        .filter((item) => item.index !== -1)
        .sort((a, b) => a.index - b.index)

      const currentItem = items.find((item) => item.index === selectedIndex)

      // Show current item's actions if available
      if (currentItem?.props?.actions) {
        dialog.push(currentItem.props.actions, 'bottom-right')
      }
      // Otherwise show List's own actions
      else if (props.actions) {
        dialog.push(props.actions, 'bottom-right')
      }
      return
    }

    if (evt.name === 'up') move(-1)
    if (evt.name === 'down') move(1)
    if (evt.name === 'return') {
      const items = Object.values(descendantsContext.map.current)
        .filter((item) => item.index !== -1)
        .sort((a, b) => a.index - b.index)

      const currentItem = items.find((item) => item.index === selectedIndex)
      if (!currentItem?.props) return

      if (currentItem.props.actions) {
        dialog.push(currentItem.props.actions, 'bottom-right')
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
                flexGrow: 1,
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
                  flexDirection: 'column',
                  flexShrink: 1,
                }}
              >
                <textarea
                  ref={inputRef}
                  height={1}
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
                  focusedBackgroundColor={Theme.backgroundPanel}
                  cursorColor={Theme.primary}
                  focusedTextColor={Theme.text}
                />
              </box>
              {searchBarAccessory}
            </box>
          </box>

          {/* Main content area with optional detail view */}
          <box style={{ flexDirection: 'row', flexGrow: 1, flexShrink: 1 }}>
            {/* List content - render children which will register themselves */}
            <box style={{ width: isShowingDetail ? '50%' : '100%', flexGrow: isShowingDetail ? 0 : 1, flexShrink: 1, flexDirection: 'column' }}>
              {/* Scrollable list items */}
              <ScrollBox
                ref={scrollBoxRef}
                focused={false}
                flexGrow={1}
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
                {/* Render children - they will register as descendants */}
                <ListItemsRenderer>{children}</ListItemsRenderer>
              </ScrollBox>

              {/* Footer with keyboard shortcuts or toast */}
              <ListFooter />
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
                borderColor={Theme.border}
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

// Component to render list items and sections
function ListItemsRenderer(props: { children?: ReactNode }): any {
  const { children } = props
  const listContext = useContext(ListContext)
  const searchText = listContext?.searchText || ''

  // Pass search text down via context
  return (
    <ListSectionContext.Provider value={{ searchText }}>
      {children}
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

  // Get selected index from parent List context
  const selectedIndex = listContext?.selectedIndex ?? 0
  const isActive = index === selectedIndex

  // Update detail when this item becomes active or detail prop changes
  useEffect(() => {
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
      if (isActive && props.actions) {
        dialog.push(props.actions, 'bottom-right')
      } else if (listContext.setSelectedIndex) {
        // Otherwise just select the item
        listContext.setSelectedIndex(index)
      }
    }
  }

  // Don't show accessories if we're showing detail
  const showAccessories = !props.detail && props.accessories

  // Render the item row directly
  return (
    <ListItemRow
      title={titleText}
      subtitle={subtitleText}
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
  const { isLoading, markdown, metadata } = props

  return (
    <box style={{ flexDirection: 'column', flexGrow: 1 }}>
      {isLoading && (
        <box style={{ paddingBottom: 1 }}>
          <text fg={Theme.textMuted}>Loading...</text>
        </box>
      )}

      <ScrollBox
        focused={false}
        flexGrow={1}
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
        <box style={{ flexDirection: 'column' }}>
          {markdown && (
            <code content={markdown} filetype="markdown" syntaxStyle={markdownSyntaxStyle} drawUnstyledText={false} />
          )}
          {metadata && (
            <box
              style={{ paddingTop: 1 }}
              border={['top']}
              borderStyle='single'
              borderColor={Theme.border}
            >
              {metadata}
            </box>
          )}
        </box>
      </ScrollBox>
    </box>
  )
}

const ListItemDetailMetadata = (props: MetadataProps) => {
  return (
    <box style={{ flexDirection: 'column' }}>
      {props.children}
    </box>
  )
}

const ListItemDetailMetadataLabel = (props: { title: string; text?: string; icon?: Image.ImageLike }) => {
  return (
    <box style={{ flexDirection: 'row', paddingBottom: 0.5 }}>
      <text fg={Theme.textMuted} style={{ minWidth: 15 }}>{props.title}:</text>
      {props.text && <text fg={Theme.text}>{props.text}</text>}
    </box>
  )
}

const ListItemDetailMetadataSeparator = () => {
  return (
    <box style={{ paddingBottom: 0.5 }}>
      <text fg={Theme.border}>─────────────────</text>
    </box>
  )
}

const ListItemDetailMetadataLink = (props: { title: string; target: string; text: string }) => {
  return (
    <box style={{ flexDirection: 'row', paddingBottom: 0.5 }}>
      <text fg={Theme.textMuted} style={{ minWidth: 15 }}>{props.title}:</text>
      <text fg={Theme.link}>{props.text}</text>
    </box>
  )
}

const ListItemDetailMetadataTagList = (props: { title: string; children: ReactNode }) => {
  return (
    <box style={{ flexDirection: 'column', paddingBottom: 0.5 }}>
      <text fg={Theme.textMuted}>{props.title}:</text>
      <box style={{ flexDirection: 'row', paddingLeft: 1 }}>
        {props.children}
      </box>
    </box>
  )
}

const ListItemDetailMetadataTagListItem = (props: { text?: string; color?: Color; icon?: Image.ImageLike; onAction?: () => void }) => {
  return (
    <box style={{ paddingRight: 1 }}>
      <text fg={props.color || Theme.accent}>[{props.text}]</text>
    </box>
  )
}

ListItemDetail.Metadata = ListItemDetailMetadata as any
ListItemDetailMetadata.Label = ListItemDetailMetadataLabel as any
ListItemDetailMetadata.Separator = ListItemDetailMetadataSeparator as any
ListItemDetailMetadata.Link = ListItemDetailMetadataLink as any
ListItemDetailMetadata.TagList = ListItemDetailMetadataTagList as any
ListItemDetailMetadataTagList.Item = ListItemDetailMetadataTagListItem as any

ListItem.Detail = ListItemDetail

const ListDropdown: ListDropdownType = (props) => {
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

  // Open dropdown dialog when triggered
  useEffect(() => {
    if (isDropdownOpen && !dialog.stack.length) {
      // Pass the children to the dialog to render them there
      dialog.push(
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
        </ListDropdownDialog>,
        'top-right',
      )
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
            backgroundColor: isHovered ? Theme.backgroundPanel : undefined,
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
          <text
            fg={isHovered ? Theme.text : Theme.textMuted}
            selectable={false}
          >
            {displayValue}
          </text>
          <text
            fg={isHovered ? Theme.text : Theme.textMuted}
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
            ? Theme.primary
            : isHovered
              ? Theme.backgroundPanel
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
            <text fg={Theme.background} selectable={false}>
              ›{''}
            </text>
          )}
          <text
            fg={
              isActive
                ? Theme.background
                : isCurrent
                  ? Theme.primary
                  : Theme.text
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
          <text fg={Theme.accent} attributes={TextAttributes.BOLD}>
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
  const parentContext = useContext(ListSectionContext)
  const listContext = useContext(ListContext)
  const searchText = listContext?.searchText || ''

  // Don't render empty sections
  if (React.Children.count(props.children) === 0) {
    return null
  }

  // Create new context with section title and search text
  const sectionContextValue = useMemo(
    () => ({
      ...parentContext,
      sectionTitle: props.title,
      searchText,
    }),
    [parentContext, props.title, searchText],
  )

  // Hide section title when searching
  const showTitle = props.title && !searchText.trim()

  return (
    <box style={{ marginBottom: 1 }}>
      {/* Render section title if provided and not searching */}
      {showTitle && (
        <box
          border={false}
          style={{
            paddingLeft: 1,
          }}
        >
          <text fg={Theme.accent} attributes={TextAttributes.BOLD}>
            {props.title}
          </text>
        </box>
      )}
      {/* Render children with section context */}
      <ListSectionContext.Provider value={sectionContextValue}>
        {props.children}
      </ListSectionContext.Provider>
    </box>
  )
}

List.Section = ListSection
List.Dropdown = ListDropdown
List.EmptyView = (props) => {
  return null
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
  const imageValue = typeof content === 'string' ? content : content?.value
  const imageTooltip =
    typeof content === 'object' ? content?.tooltip : undefined

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
