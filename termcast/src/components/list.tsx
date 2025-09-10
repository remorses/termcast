import React, {
  ReactNode,
  ReactElement,
  Children,
  isValidElement,
  useState,
  useEffect,
  useRef,
  Fragment,
  useMemo,
  useLayoutEffect,
  createContext,
  useContext,
} from 'react'
import { TextAttributes } from '@opentui/core'
import { useKeyboard } from '@opentui/react'
import { logger } from '@termcast/cli/src/logger'
import { Theme } from '@termcast/cli/src/theme'
import { Action, ActionPanel } from '@termcast/cli/src/components/actions'
import { InFocus, useIsInFocus } from '@termcast/cli/src/internal/focus-context'
import { CommonProps } from '@termcast/cli/src/utils'
import { useStore } from '@termcast/cli/src/state'
import { useDialog } from '@termcast/cli/src/internal/dialog'
import { createDescendants } from '@termcast/cli/src/descendants'
import { LoadingBar } from '@termcast/cli/src/components/loading-bar'

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
        {'   '}↑↓
      </text>
      <text fg={Theme.textMuted}> navigate</text>
      <text fg={Theme.text} attributes={TextAttributes.BOLD}>
        {'   '}^k
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
  metadata?: ReactElement<MetadataProps>
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
  Metadata: (props: MetadataProps) => any
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
  filteredIndices: number[]
  searchText: string
}

const ListContext = createContext<ListContextValue | undefined>(undefined)

// Create descendants for List items
interface ListItemDescendant {
  id?: string
  title: string
  subtitle?: string
  keywords?: string[]
  actions?: ReactNode
  hidden?: boolean
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
  hidden?: boolean
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
  filteredIndices?: number[]
  searchText?: string
  onChange?: (value: string) => void
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
  const [filteredIndices, setFilteredIndices] = useState<number[]>([])
  const inputRef = useRef<any>(null)
  const descendantsContext = useDropdownDescendants()

  // Wrapper function that updates search text and filtered indices together
  const setSearchText = (value: string) => {
    setSearchTextRaw(value)

    // Update filtered indices based on search
    if (!props.filtering || !value.trim()) {
      // Show all items when not filtering
      const allIndices = Object.values(descendantsContext.map.current)
        .filter((item) => item.index !== -1)
        .map((item) => item.index)
      setFilteredIndices(allIndices)
      return
    }

    const needle = value.toLowerCase().trim()
    const filtered = Object.values(descendantsContext.map.current)
      .filter((item) => {
        if (item.index === -1) return false
        const itemProps = item.props as DropdownItemDescendant
        const searchableText = [itemProps.title, itemProps.section]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        return searchableText.includes(needle)
      })
      .map((item) => item.index)

    setFilteredIndices(filtered)
    setSelectedIndex(0) // Reset selection when search changes
  }

  // TODO if a List.Item is added during a search, it will not be displayed. I am fine with this
  useLayoutEffect(() => {
    const allIndices = Object.values(descendantsContext.map.current)
      .filter((item) => item.index !== -1)
      .map((item) => item.index)
    setFilteredIndices(allIndices)
  }, []) // Add empty dependency array to run only once on mount

  const move = (direction: -1 | 1) => {
    if (filteredIndices.length === 0) return
    let next = selectedIndex + direction
    if (next < 0) next = filteredIndices.length - 1
    if (next >= filteredIndices.length) next = 0
    setSelectedIndex(next)
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
      if (
        filteredIndices.length > 0 &&
        selectedIndex < filteredIndices.length
      ) {
        const currentIndex = filteredIndices[selectedIndex]
        const items = Object.values(descendantsContext.map.current).filter(
          (item) => item.index === currentIndex,
        )
        const currentItem = items[0]
        if (currentItem?.props) {
          props.onChange?.((currentItem.props as DropdownItemDescendant).value)
        }
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
              <input
                ref={inputRef}
                onInput={setSearchText}
                placeholder={props.placeholder || 'Search...'}
                focused={inFocus}
                value={searchText}
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
                filteredIndices,
                searchText,
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
}) {
  const { title, subtitle, accessories, active } = props
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
      }}
      border={false}
      onMouseMove={() => setIsHovered(true)}
      onMouseOut={() => setIsHovered(false)}
      onMouseDown={props.onMouseDown}
    >
      <box style={{ flexDirection: 'row', flexGrow: 1, flexShrink: 1 }}>
        {active && (
          <text fg={Theme.textMuted} selectable={false}>
            ›
          </text>
        )}
        <text
          fg={active ? Theme.background : Theme.text}
          attributes={active ? TextAttributes.BOLD : undefined}
          selectable={false}
        >
          {title}
        </text>
        {subtitle && (
          <text
            fg={active ? Theme.background : Theme.textMuted}
            selectable={false}
          >
            {' '}
            {subtitle}
          </text>
        )}
      </box>
      {accessoryElements.length > 0 && (
        <box style={{ flexDirection: 'row' }}>
          {accessoryElements.map((elem, i) => (
            <box key={i} style={{ flexDirection: 'row' }}>
              {i > 0 && <text> </text>}
              {elem}
            </box>
          ))}
        </box>
      )}
      {/*{active && <text fg={Theme.textMuted}>‹</text>}*/}
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
  const [filteredIndices, setFilteredIndices] = useState<number[]>([])
  const inputRef = useRef<any>(null)
  const descendantsContext = useListDescendants()

  const searchText =
    controlledSearchText !== undefined
      ? controlledSearchText
      : internalSearchText

  const openDropdown = () => {
    setIsDropdownOpen(true)
  }

  // Wrapper function that updates search text and filtered indices together
  const setInternalSearchText = (value: string) => {
    setInternalSearchTextRaw(value)

    // Update filtered indices based on search
    if (!filtering || !value.trim()) {
      // Show all items when not filtering
      const allIndices = Object.values(descendantsContext.map.current)
        .filter((item) => item.index !== -1)
        .map((item) => item.index)
      setFilteredIndices(allIndices)
      return
    }

    const needle = value.toLowerCase().trim()
    const filtered = Object.values(descendantsContext.map.current)
      .filter((item) => {
        if (item.index === -1) return false
        const props = item.props as ListItemDescendant
        const searchableText = [
          props.title,
          props.subtitle,
          ...(props.keywords || []),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        return searchableText.includes(needle)
      })
      .map((item) => item.index)

    setFilteredIndices(filtered)
    setSelectedIndex(0) // Reset selection when search changes
  }

  // Initialize filtered indices when descendants change
  useLayoutEffect(() => {
    const allIndices = Object.values(descendantsContext.map.current)
      .filter((item) => item.index !== -1)
      .map((item) => item.index)
    setFilteredIndices(allIndices)
  }, [])

  const listContextValue = useMemo<ListContextValue>(
    () => ({
      isDropdownOpen,
      setIsDropdownOpen,
      openDropdown,
      selectedIndex,
      setSelectedIndex,
      filteredIndices,
      searchText,
    }),
    [isDropdownOpen, selectedIndex, filteredIndices, searchText],
  )

  // Reset selected index when items change or selectedItemId changes
  useEffect(() => {
    const items = Object.values(descendantsContext.map.current)
      .filter((item) => item.index !== -1)
      .sort((a, b) => a.index - b.index)

    if (selectedItemId) {
      const index = items.findIndex((item) => item.props?.id === selectedItemId)
      if (index !== -1) {
        setSelectedIndex(index)
        return
      }
    }
    setSelectedIndex(0)
  }, [children, selectedItemId])

  const move = (direction: -1 | 1) => {
    if (filteredIndices.length === 0) return

    let next = selectedIndex + direction
    if (next < 0) next = filteredIndices.length - 1
    if (next >= filteredIndices.length) next = 0
    setSelectedIndex(next)
  }

  // Handle keyboard navigation
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
      if (
        filteredIndices.length > 0 &&
        selectedIndex < filteredIndices.length
      ) {
        const currentIndex = filteredIndices[selectedIndex]
        const items = Object.values(descendantsContext.map.current).filter(
          (item) => item.index === currentIndex,
        )
        const currentItem = items[0]

        // Show current item's actions if available
        if (currentItem?.props?.actions) {
          dialog.push(currentItem.props.actions, 'bottom-right')
        }
        // Otherwise show List's own actions
        else if (props.actions) {
          dialog.push(props.actions, 'bottom-right')
        }
      } else if (props.actions) {
        dialog.push(props.actions, 'bottom-right')
      }
      return
    }

    if (evt.name === 'up') move(-1)
    if (evt.name === 'down') move(1)
    if (evt.name === 'return') {
      if (
        filteredIndices.length > 0 &&
        selectedIndex < filteredIndices.length
      ) {
        const currentIndex = filteredIndices[selectedIndex]
        const items = Object.values(descendantsContext.map.current).filter(
          (item) => item.index === currentIndex,
        )
        const currentItem = items[0]
        if (!currentItem?.props) return

        if (currentItem?.props?.actions) {
          dialog.push(currentItem.props.actions, 'bottom-right')
        }
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
    } else {
      // For controlled search, we need to update filtered indices here too

      // Update filtered indices based on controlled search text
      if (!filtering || !newValue.trim()) {
        const allIndices = Object.values(descendantsContext.map.current)
          .filter((item) => item.index !== -1)
          .map((item) => item.index)
        setFilteredIndices(allIndices)
      } else {
        const needle = newValue.toLowerCase().trim()
        const filtered = Object.values(descendantsContext.map.current)
          .filter((item) => {
            if (item.index === -1) return false
            const props = item.props as ListItemDescendant
            const searchableText = [
              props.title,
              props.subtitle,
              ...(props.keywords || []),
            ]
              .filter(Boolean)
              .join(' ')
              .toLowerCase()
            return searchableText.includes(needle)
          })
          .map((item) => item.index)

        setFilteredIndices(filtered)
        setSelectedIndex(0)
      }
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
              <LoadingBar title={navigationTitle} isLoading={isLoading} />
            </box>
          )}

          {/* Search bar with optional dropdown accessory */}
          <box>
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
                <input
                  ref={inputRef}
                  placeholder={searchBarPlaceholder}
                  focused={inFocus && !isDropdownOpen}
                  value={searchText}
                  onInput={handleSearchChange}
                  focusedBackgroundColor={Theme.backgroundPanel}
                  cursorColor={Theme.primary}
                  focusedTextColor={Theme.text}
                />
              </box>
              {searchBarAccessory}
            </box>
          </box>

          {/* List content - render children which will register themselves */}
          <box style={{ marginTop: 1 }}>
            <>
              {/* Render children - they will register as descendants */}
              <ListItemsRenderer>{children}</ListItemsRenderer>

              {/* Footer with keyboard shortcuts or toast */}
              <ListFooter />
            </>
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

  // Extract text values for descendant registration
  const titleText =
    typeof props.title === 'string' ? props.title : props.title.value
  const subtitleText = props.subtitle
    ? typeof props.subtitle === 'string'
      ? props.subtitle
      : props.subtitle.value || ''
    : undefined

  // Register as descendant with all searchable data
  const index = useListItemDescendant({
    id: props.id,
    title: titleText,
    subtitle: subtitleText,
    keywords: [...(props.keywords || []), sectionTitle].filter(
      Boolean,
    ) as string[],
    actions: props.actions,
    hidden: false,
  })

  // Check if this item is visible based on filtered indices
  const isVisible = listContext?.filteredIndices?.includes(index) ?? true
  if (!isVisible) return null

  // Get selected index from parent List context
  const selectedIndex = listContext?.selectedIndex ?? 0
  const filteredIndices = listContext?.filteredIndices ?? []
  const isActive = filteredIndices[selectedIndex] === index

  // Handle mouse click on item
  const handleMouseDown = () => {
    if (listContext && index !== -1) {
      // Find position in filtered indices
      const filteredPosition = listContext.filteredIndices.indexOf(index)
      if (filteredPosition !== -1) {
        // If clicking on already selected item, show actions (like pressing Enter)
        if (isActive && props.actions) {
          dialog.push(props.actions, 'bottom-right')
        } else if (listContext.setSelectedIndex) {
          // Otherwise just select the item
          listContext.setSelectedIndex(filteredPosition)
        }
      }
    }
  }

  // Render the item row directly
  return (
    <ListItemRow
      title={titleText}
      subtitle={subtitleText}
      accessories={props.accessories}
      active={isActive}
      isShowingDetail={props.detail !== undefined}
      onMouseDown={handleMouseDown}
      index={index}
    />
  )
}

const ListItemDetail: ListItemDetailType = (props) => {
  return null
}

ListItemDetail.Metadata = (props) => {
  return null
}

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
          items={[]} // Not used anymore
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
    filteredIndices,
    setSelectedIndex,
    onChange,
  } = dropdownContext

  // Register as descendant
  const index = useDropdownItemDescendant({
    value: props.value,
    title: props.title,
    section: currentSection,
    hidden: false,
  })

  // Check if this item is visible based on filtered indices
  const isVisible = filteredIndices?.includes(index) ?? true
  if (!isVisible) return null

  // If we're in the dialog, render the item
  if (selectedIndex !== undefined && filteredIndices) {
    const isActive = filteredIndices[selectedIndex] === index
    const isCurrent = props.value === currentValue

    const handleMouseMove = () => {
      setIsHovered(true)
      // Update selected index on hover
      if (setSelectedIndex) {
        const position = filteredIndices.indexOf(index)
        if (position !== -1 && position !== selectedIndex) {
          setSelectedIndex(position)
        }
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
          paddingLeft: 1,
          paddingRight: 1,
          justifyContent: 'space-between',
        }}
        border={false}
        onMouseMove={handleMouseMove}
        onMouseOut={() => setIsHovered(false)}
        onMouseDown={handleMouseDown}
      >
        <box style={{ flexDirection: 'row' }}>
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
    <>
      {/* Render section title if provided and not searching */}
      {showTitle && (
        <box
          border={false}
          style={{
            paddingLeft: 1,
            paddingTop: 1,
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
    </>
  )
}

List.Section = ListSection
List.Dropdown = ListDropdown
List.EmptyView = (props) => {
  return null
}

export default List
