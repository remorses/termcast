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
} from 'react'
import { TextAttributes } from '@opentui/core'
import { useKeyboard } from '@opentui/react'
import { logger } from './logger'
import { Theme } from './theme'
import { Action, ActionPanel } from './actions'
import { InFocus, useIsInFocus } from '@termcast/api/src/internal/focus-context'
import { CommonProps } from '@termcast/api/src/utils'
import { useStore } from '@termcast/api/src/state'

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
                {"   "}↑↓
            </text>
            <text fg={Theme.textMuted}> navigate</text>
            <text fg={Theme.text} attributes={TextAttributes.BOLD}>
                {"   "}^k
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

// Process list item to extract searchable and displayable data
interface ProcessedItem extends ItemProps {
    originalIndex: number
    sectionTitle?: string
    titleText: string
    subtitleText?: string
    originalElement?: ReactElement
}

// Extract and process items from children
function extractItems(children: ReactNode): ProcessedItem[] {
    const items: ProcessedItem[] = []
    let index = 0

    const processChildren = (nodes: ReactNode, currentSection?: string) => {
        Children.forEach(nodes, (child) => {
            if (!isValidElement(child)) return

            if (child.type === ListItem) {
                const props = child.props as ItemProps
                const titleText = typeof props.title === 'string' ? props.title : props.title.value
                const subtitleText = props.subtitle
                    ? typeof props.subtitle === 'string'
                        ? props.subtitle
                        : props.subtitle.value || ''
                    : undefined

                items.push({
                    ...props,
                    originalIndex: index++,
                    sectionTitle: currentSection,
                    titleText,
                    subtitleText,
                    originalElement: child,
                })
            } else if (child.type === ListSection) {
                const props = child.props as SectionProps
                processChildren(props.children, props.title)
            }
        })
    }

    processChildren(children)
    return items
}

// Group items by section
function groupBySection(items: ProcessedItem[]): [string, ProcessedItem[]][] {
    const grouped: Record<string, ProcessedItem[]> = {}

    items.forEach(item => {
        const section = item.sectionTitle || ''
        if (!grouped[section]) {
            grouped[section] = []
        }
        grouped[section].push(item)
    })

    return Object.entries(grouped)
}

// Filter items based on search query
function filterItems(items: ProcessedItem[], query: string): ProcessedItem[] {
    if (!query.trim()) return items

    const needle = query.toLowerCase().trim()

    return items.filter(item => {
        const searchableText = [
            item.titleText,
            item.subtitleText,
            item.sectionTitle,
            ...(item.keywords || []),
        ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()

        return searchableText.includes(needle)
    })
}

// Render a single list item row
function ListItemRow(props: {
    item: ProcessedItem
    active?: boolean
    isShowingDetail?: boolean
}) {
    const { item, active } = props

    // Format accessories for display
    const accessoryElements: ReactNode[] = []
    if (item.accessories) {
        item.accessories.forEach((accessory) => {
            if ('text' in accessory && accessory.text) {
                const textValue = typeof accessory.text === 'string'
                    ? accessory.text
                    : accessory.text?.value
                if (textValue) {
                    accessoryElements.push(
                        <text key={`text-${textValue}`} fg={active ? Theme.background : Theme.info}>
                            {textValue}
                        </text>
                    )
                }
            }
            if ('tag' in accessory && accessory.tag) {
                const tagValue = typeof accessory.tag === 'string'
                    ? accessory.tag
                    : accessory.tag?.value
                if (tagValue) {
                    accessoryElements.push(
                        <text key={`tag-${tagValue}`} fg={active ? Theme.background : Theme.warning}>
                            [{tagValue}]
                        </text>
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
                    {item.titleText}
                </text>
                {item.subtitleText && (
                    <text fg={active ? Theme.background : Theme.textMuted}>
                        {' '}{item.subtitleText}
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
        ...otherProps
    } = props

    const [internalSearchText, setInternalSearchText] = useState('')
    const [selectedIndex, setSelectedIndex] = useState(0)
    const inputRef = useRef<any>(null)

    const searchText =
        controlledSearchText !== undefined
            ? controlledSearchText
            : internalSearchText

    // Extract and process items from children
    const allItems = useMemo(() => extractItems(children), [children])

    // Apply filtering
    const filteredItems = useMemo(() => {
        if (!filtering) return allItems
        return filterItems(allItems, searchText)
    }, [allItems, searchText, filtering])

    // Group filtered items by section
    const grouped = useMemo(
        () => groupBySection(filteredItems),
        [filteredItems]
    )

    // Calculate flat list for keyboard navigation
    const flat = useMemo(() => filteredItems, [filteredItems])

    // Mount the focused item's actions
    const focusedActions = useMemo(() => {
        const currentItem = flat[selectedIndex]
        if (!currentItem || !currentItem.actions) return null
        return currentItem.actions
    }, [flat, selectedIndex])

    // Reset selected index when items change
    useEffect(() => {
        if (selectedItemId) {
            const index = flat.findIndex(item => item.id === selectedItemId)
            if (index !== -1) {
                setSelectedIndex(index)
                return
            }
        }
        setSelectedIndex(0)
    }, [flat, selectedItemId])

    const move = (direction: -1 | 1) => {
        let next = selectedIndex + direction
        if (next < 0) next = flat.length - 1
        if (next >= flat.length) next = 0
        setSelectedIndex(next)

        // Don't trigger onSelectionChange when just moving - only on Enter
    }

    // Handle keyboard navigation
    const inFocus = useIsInFocus()
    useKeyboard((evt) => {
        if (!inFocus) return

        if (evt.name === 'up') move(-1)
        if (evt.name === 'down') move(1)
        if (evt.name === 'return' && flat[selectedIndex]) {
            const item = flat[selectedIndex]

            // If item has no actions, fallback to onSelectionChange
            if (!item.actions && onSelectionChange) {
                onSelectionChange(item.id || item.titleText)
            }
            // Actions will handle Enter key themselves when focused
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

    return (
        <group style={{ flexDirection: 'column', flexGrow: 1 }}>
            {/* Mount focused actions (invisible but handles keyboard) */}
            {focusedActions && (
                <InFocus inFocus={true}>
                    {focusedActions}
                </InFocus>
            )}

            {/* Navigation title */}
            {navigationTitle && (
                <box border={false} style={{ paddingLeft: 1, paddingRight: 1, paddingBottom: 1 }}>
                    <text fg={Theme.text} attributes={TextAttributes.BOLD}>
                        {navigationTitle}
                    </text>
                </box>
            )}

            {/* Search bar */}
            <box
                border={false}
                style={{
                    paddingLeft: 1,
                    paddingRight: 1,
                    marginTop: 1,
                    marginBottom: 1,
                }}
            >
                <input
                    ref={inputRef}
                    placeholder={searchBarPlaceholder}
                    focused={inFocus}
                    value={searchText}
                    onInput={handleSearchChange}
                    focusedBackgroundColor={Theme.backgroundPanel}
                    cursorColor={Theme.primary}
                    focusedTextColor={Theme.text}
                />
            </box>

            {/* List content */}
            <group style={{ marginTop: 1 }}>
                {isLoading ? (
                    <box border={false} style={{ padding: 2 }}>
                        <text fg={Theme.textMuted}>Loading...</text>
                    </box>
                ) : flat.length === 0 ? (
                    <box border={false} style={{ padding: 2 }}>
                        <text fg={Theme.textMuted}>No results found</text>
                    </box>
                ) : (
                    <>
                        <group>
                            {grouped.map(([sectionTitle, items], groupIndex) => (
                                <group key={`section-${groupIndex}`} style={{ flexShrink: 0 }}>
                                    {sectionTitle && (
                                        <box border={false} style={{ paddingLeft: 1, paddingTop: groupIndex > 0 ? 1 : 0 }}>
                                            <text fg={Theme.accent} attributes={TextAttributes.BOLD}>
                                                {sectionTitle}
                                            </text>
                                        </box>
                                    )}
                                    {items.map((item) => (
                                        <ListItemRow
                                            item={item}
                                            active={flat[selectedIndex] === item}
                                            isShowingDetail={isShowingDetail}
                                        />
                                    ))}
                                </group>
                            ))}
                        </group>

                        {/* Footer with keyboard shortcuts or toast */}
                        <ListFooter />
                    </>
                )}
            </group>
        </group>
    )
}

const ListItem: ListItemType = (props) => {
    // List.Item components are processed by their parent List component
    // They don't render anything directly in the TUI context
    // TODO: Support detail view rendering
    return null
}

const ListItemDetail: ListItemDetailType = (props) => {
    return null
}

ListItemDetail.Metadata = (props) => {
    return null
}

ListItem.Detail = ListItemDetail

const ListDropdown: ListDropdownType = (props) => {
    return null
}

ListDropdown.Item = (props) => {
    return null
}

ListDropdown.Section = (props) => {
    return null
}

List.Item = ListItem
const ListSection = (props: SectionProps) => {
    // List.Section components are processed by their parent List component
    return null
}

List.Section = ListSection
List.Dropdown = ListDropdown
List.EmptyView = (props) => {
    return null
}

export default List
