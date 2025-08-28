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
import { logger } from '@termcast/api/src/logger'
import { Theme } from '@termcast/api/src/theme'
import { Action, ActionPanel } from '@termcast/api/src/components/actions'
import { InFocus, useIsInFocus } from '@termcast/api/src/internal/focus-context'
import { CommonProps } from '@termcast/api/src/utils'
import { useStore } from '@termcast/api/src/state'
import { useDialog } from '@termcast/api/src/internal/dialog'
import { createDescendants } from '@termcast/api/src/descendants'

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
}

const ListContext = createContext<ListContextValue | undefined>(undefined)

// Create descendants for List items
interface ListItemDescendant {
    id?: string
    title: string
    actions?: ReactNode
    hidden?: boolean
}

const { DescendantsProvider: ListDescendantsProvider, useDescendants: useListDescendants, useDescendant: useListItemDescendant } = createDescendants<ListItemDescendant>()

// Create descendants for Dropdown items
interface DropdownItemDescendant {
    value: string
    title: string
    section?: string
    hidden?: boolean
}

const { DescendantsProvider: DropdownDescendantsProvider, useDescendants: useDropdownDescendants, useDescendant: useDropdownItemDescendant } = createDescendants<DropdownItemDescendant>()

// Dropdown context for passing data to dropdown items
interface DropdownContextValue {
    searchText: string
    filtering?: boolean | { keepSectionOrder: boolean }
    currentSection?: string
    selectedIndex?: number
    currentValue?: string
}

const DropdownContext = createContext<DropdownContextValue | undefined>(
    undefined,
)

// Dropdown dialog component
interface ListDropdownDialogProps extends DropdownProps {
    items: { value: string; title: string; icon?: any; section?: string }[] // Legacy, not used
    onCancel: () => void
    children?: ReactNode
}

function ListDropdownDialog(props: ListDropdownDialogProps): any {
    const [searchText, setSearchText] = useState('')
    const [selectedIndex, setSelectedIndex] = useState(0)
    const inputRef = useRef<any>(null)
    const descendantsContext = useDropdownDescendants()

    const move = (direction: -1 | 1) => {
        const items = Object.values(descendantsContext.map.current)
            .filter((item: any) => item.index !== -1)
            .sort((a: any, b: any) => a.index - b.index)

        if (items.length === 0) return
        let next = selectedIndex + direction
        if (next < 0) next = items.length - 1
        if (next >= items.length) next = 0
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
            const items = Object.values(descendantsContext.map.current)
                .filter((item: any) => item.index !== -1)
                .sort((a: any, b: any) => a.index - b.index)
            const currentItem = items[selectedIndex]
            if (currentItem?.props) {
                props.onChange?.((currentItem.props as DropdownItemDescendant).value)
            }
        }
    })

    return (
        <DropdownDescendantsProvider value={descendantsContext}>
            <group>
                <group style={{ paddingLeft: 2, paddingRight: 2 }}>
                    <group style={{ paddingLeft: 1, paddingRight: 1 }}>
                        {/* Header */}
                        <group
                            style={{
                                flexDirection: 'row',
                                justifyContent: 'space-between',
                            }}
                        >
                            <text attributes={TextAttributes.BOLD}>
                                {props.tooltip}
                            </text>
                            <text fg={Theme.textMuted}>esc</text>
                        </group>
                        <group style={{ paddingTop: 1, paddingBottom: 1 }}>
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
                        </group>
                    </group>

                {/* Items list - children will render themselves */}
                <group style={{ paddingBottom: 1 }}>
                    <DropdownContext.Provider value={{
                        searchText,
                        filtering: props.filtering,
                        currentSection: undefined,
                        selectedIndex,
                        currentValue: props.value,
                    }}>
                        {props.children}
                    </DropdownContext.Provider>
                </group>
                {props.isLoading && (
                    <group style={{ paddingLeft: 1 }}>
                        <text fg={Theme.textMuted}>Loading...</text>
                    </group>
                )}
            </group>

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
        </group>
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
}) {
    const { title, subtitle, accessories, active } = props

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
                backgroundColor: active ? Theme.primary : undefined,
                paddingLeft: 1,
                paddingRight: 1,
            }}
            border={false}
        >
            <group style={{ flexDirection: 'row', flexGrow: 1, flexShrink: 1 }}>
                <text
                    fg={active ? Theme.background : Theme.text}
                    attributes={active ? TextAttributes.BOLD : undefined}
                >
                    {title}
                </text>
                {subtitle && (
                    <text fg={active ? Theme.background : Theme.textMuted}>
                        {' '}
                        {subtitle}
                    </text>
                )}
            </group>
            {accessoryElements.length > 0 && (
                <group style={{ flexDirection: 'row' }}>
                    {accessoryElements.map((elem, i) => (
                        <group key={i} style={{ flexDirection: 'row' }}>
                            {i > 0 && <text> </text>}
                            {elem}
                        </group>
                    ))}
                </group>
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

    const [internalSearchText, setInternalSearchText] = useState('')
    const [selectedIndex, setSelectedIndex] = useState(0)
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)
    const inputRef = useRef<any>(null)
    const descendantsContext = useListDescendants()

    const searchText =
        controlledSearchText !== undefined
            ? controlledSearchText
            : internalSearchText

    const openDropdown = () => {
        setIsDropdownOpen(true)
    }

    const listContextValue = useMemo<ListContextValue>(
        () => ({
            isDropdownOpen,
            setIsDropdownOpen,
            openDropdown,
            selectedIndex,
        }),
        [isDropdownOpen, selectedIndex],
    )

    // Reset selected index when items change or selectedItemId changes
    useEffect(() => {
        const items = Object.values(descendantsContext.map.current)
            .filter(item => item.index !== -1)
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
        const items = Object.values(descendantsContext.map.current)
            .filter(item => item.index !== -1)
            .sort((a, b) => a.index - b.index)

        if (items.length === 0) return

        let next = selectedIndex + direction
        if (next < 0) next = items.length - 1
        if (next >= items.length) next = 0
        setSelectedIndex(next)
    }

    // Handle keyboard navigation
    const inFocus = useIsInFocus()
    const dialog = useDialog()

    useKeyboard((evt) => {
        if (!inFocus) return

        // Handle Ctrl+P for dropdown
        if (
            evt.ctrl &&
            evt.name === 'p' &&
            searchBarAccessory &&
            !isDropdownOpen
        ) {
            openDropdown()
            return
        }

        // Handle Ctrl+K to show actions
        if (evt.name === 'k' && evt.ctrl) {
            const items = Object.values(descendantsContext.map.current)
                .filter(item => item.index !== -1)
                .sort((a, b) => a.index - b.index)

            const currentItem = items[selectedIndex]

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
                .filter(item => item.index !== -1)
                .sort((a, b) => a.index - b.index)

            const currentItem = items[selectedIndex]
            if (!currentItem?.props) return

            if (currentItem?.props?.actions) {
                dialog.push(currentItem.props.actions, 'bottom-right')
            }

        }
    })

    const handleSearchChange = (newValue: string) => {
        if (!inFocus) return

        if (controlledSearchText === undefined) {
            setInternalSearchText(newValue)
        }
        if (onSearchTextChange) {
            onSearchTextChange(newValue)
        }
    }

    // Cannot get focused actions during render - descendants are not accessible here

    return (
        <ListContext.Provider value={listContextValue}>
            <ListDescendantsProvider value={descendantsContext}>
                <group style={{ flexDirection: 'column', flexGrow: 1 }}>
                    {/* Cannot mount focused actions here - would need to be handled differently */}

                {/* Navigation title */}
                {navigationTitle && (
                    <box
                        border={false}
                        style={{
                            paddingLeft: 1,
                            paddingRight: 1,
                            paddingBottom: 1,
                        }}
                    >
                        <text fg={Theme.text} attributes={TextAttributes.BOLD}>
                            {navigationTitle}
                        </text>
                    </box>
                )}

                {/* Search bar with optional dropdown accessory */}
                <box
                    border={false}
                    style={{
                        paddingLeft: 1,
                        paddingRight: 1,
                        // marginTop: 1,
                        marginBottom: 1,
                        flexDirection: 'row',
                        justifyContent: 'space-between',

                        alignItems: 'center',
                    }}
                >
                    <box style={{ flexGrow: 1, flexShrink: 1 }}>
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

                {/* List content - render children which will register themselves */}
                <group style={{ marginTop: 1 }}>
                    {isLoading ? (
                        <box border={false} style={{ padding: 2 }}>
                            <text fg={Theme.textMuted}>Loading...</text>
                        </box>
                    ) : (
                        <>
                            {/* Render children - they will register as descendants */}
                            <ListItemsRenderer selectedIndex={selectedIndex} searchText={searchText} filtering={filtering} isShowingDetail={isShowingDetail}>
                                {children}
                            </ListItemsRenderer>

                            {/* Footer with keyboard shortcuts or toast */}
                            <ListFooter />
                        </>
                    )}
                </group>
                </group>
            </ListDescendantsProvider>
        </ListContext.Provider>
    )
}

// Component to render list items and sections
function ListItemsRenderer(props: {
    children?: ReactNode
    selectedIndex: number
    searchText: string
    filtering?: boolean | { keepSectionOrder: boolean }
    isShowingDetail?: boolean
}): any {
    const { children, selectedIndex, searchText, filtering, isShowingDetail } = props

    // Simply render children - they handle their own registration and rendering
    return (
        <ListSectionContext.Provider value={{ searchText, filtering }}>
            {children}
        </ListSectionContext.Provider>
    )
}

// Context for passing search/filter state to items
interface ListSectionContextValue {
    searchText: string
    filtering?: boolean | { keepSectionOrder: boolean }
    sectionTitle?: string
}

const ListSectionContext = createContext<ListSectionContextValue>({
    searchText: '',
    filtering: true,
})

const ListItem: ListItemType = (props) => {
    const listSectionContext = useContext(ListSectionContext)
    const { searchText, filtering, sectionTitle } = listSectionContext
    const listContext = useContext(ListContext)

    // Extract text values for filtering
    const titleText = typeof props.title === 'string' ? props.title : props.title.value
    const subtitleText = props.subtitle
        ? typeof props.subtitle === 'string'
            ? props.subtitle
            : props.subtitle.value || ''
        : undefined

    // Apply filtering logic here
    const shouldHide = (() => {
        if (!filtering || !searchText.trim()) return false

        const needle = searchText.toLowerCase().trim()
        const searchableText = [
            titleText,
            subtitleText,
            sectionTitle,
            ...(props.keywords || []),
        ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()

        return !searchableText.includes(needle)
    })()

    // Register as descendant
    const index = useListItemDescendant({
        id: props.id,
        title: titleText,
        actions: props.actions,
        hidden: shouldHide,
    })

    // Don't render if hidden
    if (shouldHide) return null

    // Get selected index from parent List context
    const selectedIndex = listContext?.selectedIndex ?? 0
    const isActive = index === selectedIndex

    // Render the item row directly
    return (
        <ListItemRow
            title={titleText}
            subtitle={subtitleText}
            accessories={props.accessories}
            active={isActive}
            isShowingDetail={props.detail !== undefined}
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

    // If not inside a List, just render nothing (for type safety)
    if (!listContext) {
        return null
    }

    const { isDropdownOpen, setIsDropdownOpen } = listContext
    const [dropdownValue, setDropdownValue] = useState(
        props.value || props.defaultValue || '',
    )
    const descendantsContext = useDropdownDescendants()
    const dialog = useDialog()
    const inFocus = useIsInFocus()

    // Update controlled value
    useEffect(() => {
        if (props.value !== undefined) {
            setDropdownValue(props.value)
        }
    }, [props.value])

    const dropdownContextValue = useMemo<DropdownContextValue>(
        () => ({
            searchText: '',
            filtering: props.filtering,
            currentSection: undefined,
        }),
        [props.filtering],
    )

    // Open dropdown dialog when triggered
    useEffect(() => {
        if (isDropdownOpen && !dialog.stack.length) {
            // Pass the children to the dialog to render them there
            dialog.push(
                <ListDropdownDialog
                    {...props}
                    items={[]} // Not used anymore
                    value={dropdownValue}
                    onChange={(newValue) => {
                        setDropdownValue(newValue)
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

    // Cannot get current item during render - just use dropdownValue
    const value = dropdownValue || 'All'
    return (
        <DropdownDescendantsProvider value={descendantsContext}>
            <DropdownContext.Provider value={dropdownContextValue}>
                {/* Render children to collect items - they return null anyway */}
                {props.children}
                {/* Render dropdown UI */}
                <box
                    key={value}
                    style={{
                        paddingTop: 2,
                        paddingLeft: 2,
                        // minWidth: value.length + 4,
                        flexDirection: 'row',
                        flexShrink: 0,
                    }}
                >
                    {/*<text >^p </text>*/}
                    <text fg={Theme.textMuted}>{value}</text>
                    <text fg={Theme.textMuted}> ▾</text>
                </box>
            </DropdownContext.Provider>
        </DropdownDescendantsProvider>
    )
}

ListDropdown.Item = (props) => {
    const dropdownContext = useContext(DropdownContext)

    // If not inside a Dropdown, just render nothing
    if (!dropdownContext) {
        return null
    }

    const { searchText, filtering, currentSection, selectedIndex, currentValue } = dropdownContext

    // Apply filtering logic
    const shouldHide = (() => {
        if (!filtering || !searchText.trim()) return false
        const needle = searchText.toLowerCase()
        return !props.title.toLowerCase().includes(needle)
    })()

    // Register as descendant
    const index = useDropdownItemDescendant({
        value: props.value,
        title: props.title,
        section: currentSection,
        hidden: shouldHide,
    })

    // Don't render if hidden
    if (shouldHide) return null

    // If we're in the dialog, render the item
    if (selectedIndex !== undefined) {
        const isActive = index === selectedIndex
        const isCurrent = props.value === currentValue

        return (
            <box
                style={{
                    flexDirection: 'row',
                    backgroundColor: isActive ? Theme.primary : undefined,
                    paddingLeft: 1,
                    paddingRight: 1,
                    justifyContent: 'space-between',
                }}
                border={false}
            >
                <group style={{ flexDirection: 'row' }}>
                    <text
                        fg={
                            isActive
                                ? Theme.background
                                : isCurrent
                                  ? Theme.primary
                                  : Theme.text
                        }
                        attributes={
                            isActive
                                ? TextAttributes.BOLD
                                : undefined
                        }
                    >
                        {props.title}
                    </text>
                </group>
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

    return (
        <>
            {/* Render section title if we're in the dialog */}
            {parentContext.selectedIndex !== undefined && props.title && (
                <group style={{ paddingTop: 1, paddingLeft: 1 }}>
                    <text
                        fg={Theme.accent}
                        attributes={TextAttributes.BOLD}
                    >
                        {props.title}
                    </text>
                </group>
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

    // Create new context with section title
    const sectionContextValue = useMemo(() => ({
        ...parentContext,
        sectionTitle: props.title,
    }), [parentContext, props.title])

    return (
        <>
            {/* Render section title if provided */}
            {props.title && (
                <box
                    border={false}
                    style={{
                        paddingLeft: 1,
                        paddingTop: 1,
                    }}
                >
                    <text
                        fg={Theme.accent}
                        attributes={TextAttributes.BOLD}
                    >
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
