import {
    ReactNode,
    Children,
    isValidElement,
    useState,
    useEffect,
    useMemo,
    useRef,
    Fragment,
} from 'react'
import { useKeyboard } from '@opentui/react'
import { TextAttributes } from '@opentui/core'
import { Theme } from '@termcast/api/src/theme'
import { logger } from '@termcast/api/src/logger'

// SearchBarInterface provides the common search bar props
interface SearchBarInterface {
    isLoading?: boolean
    filtering?: boolean | { keepSectionOrder: boolean }
    onSearchTextChange?: (text: string) => void
    throttle?: boolean
}

export interface DropdownProps extends SearchBarInterface {
    id?: string
    tooltip: string
    placeholder?: string
    storeValue?: boolean | undefined
    value?: string
    defaultValue?: string
    children?: ReactNode
    onChange?: (newValue: string) => void
}

export interface DropdownItemProps {
    title: string
    value: string
    icon?: ReactNode
    keywords?: string[]
}

export interface DropdownSectionProps {
    title?: string
    children?: ReactNode
}

interface ProcessedItem extends DropdownItemProps {
    originalIndex: number
    section?: string
}

// Helper function to extract items from children
function extractItems(children: ReactNode): ProcessedItem[] {
    const items: ProcessedItem[] = []
    let index = 0

    const processChildren = (nodes: ReactNode, currentSection?: string) => {
        Children.forEach(nodes, (child) => {
            if (!isValidElement(child)) return

            if (child.type === DropdownItem) {
                const props = child.props as DropdownItemProps
                items.push({
                    ...props,
                    section: currentSection,
                    originalIndex: index++,
                })
            } else if (child.type === DropdownSection) {
                const props = child.props as DropdownSectionProps
                processChildren(props.children, props.title)
            }
        })
    }

    processChildren(children)
    return items
}

// Group items by section
function groupBySection(items: ProcessedItem[]): [string | undefined, ProcessedItem[]][] {
    const grouped: Map<string | undefined, ProcessedItem[]> = new Map()
    
    items.forEach(item => {
        const section = item.section
        if (!grouped.has(section)) {
            grouped.set(section, [])
        }
        grouped.get(section)!.push(item)
    })

    return Array.from(grouped.entries())
}

// Filter items based on search query
function filterItems(items: ProcessedItem[], query: string, filtering?: boolean | { keepSectionOrder: boolean }): ProcessedItem[] {
    if (!query.trim() || filtering === false) return items

    const needle = query.toLowerCase().trim()
    
    return items.filter(item => {
        const searchableText = [
            item.title,
            ...(item.keywords || []),
        ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()

        return searchableText.includes(needle)
    })
}

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
        placeholder = "Search…",
        storeValue,
        isLoading,
        filtering,
        onSearchTextChange,
        throttle
    } = props

    const [selected, setSelected] = useState(0)
    const [searchText, setSearchText] = useState('')
    const [currentValue, setCurrentValue] = useState<string | undefined>(value || defaultValue)
    const inputRef = useRef<any>(null)
    const lastSearchTextRef = useRef('')
    const throttleTimeoutRef = useRef<NodeJS.Timeout>()

    // Extract and process items from children
    const allItems = useMemo(() => extractItems(children), [children])
    
    // Filter items based on search
    const filteredItems = useMemo(
        () => filterItems(allItems, searchText, filtering),
        [allItems, searchText, filtering]
    )
    
    // Group filtered items by section
    const grouped = useMemo(
        () => groupBySection(filteredItems),
        [filteredItems]
    )

    // Update controlled value
    useEffect(() => {
        if (value !== undefined) {
            setCurrentValue(value)
        }
    }, [value])

    // Reset selected index when search changes
    useEffect(() => {
        setSelected(0)
    }, [searchText])

    // Handle search text change with throttling
    const handleSearchTextChange = (text: string) => {
        setSearchText(text)

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

    // Calculate flat list for keyboard navigation
    const flat = useMemo(() => filteredItems, [filteredItems])

    const move = (direction: -1 | 1) => {
        let next = selected + direction
        if (next < 0) next = flat.length - 1
        if (next >= flat.length) next = 0
        setSelected(next)
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

    // Handle keyboard navigation
    useKeyboard((evt) => {
        if (evt.name === 'up') {
            move(-1)
        }
        if (evt.name === 'down') {
            move(1)
        }
        if (evt.name === 'return' && flat[selected]) {
            selectItem(flat[selected].value)
        }
    })

    return (
        <group>
            <group style={{ paddingLeft: 2, paddingRight: 2 }}>
                <group style={{ paddingLeft: 1, paddingRight: 1 }}>
                    <group style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <text attributes={TextAttributes.BOLD}>{tooltip}</text>
                        <text fg={Theme.textMuted}>esc</text>
                    </group>
                    <group style={{ paddingTop: 1, paddingBottom: 1 }}>
                        <input
                            ref={inputRef}
                            onInput={(value) => handleSearchTextChange(value)}
                            placeholder={placeholder}
                            focused={true}
                            value={searchText}
                            focusedBackgroundColor={Theme.backgroundPanel}
                            cursorColor={Theme.primary}
                            focusedTextColor={Theme.textMuted}
                        />
                    </group>
                </group>
                <group style={{ paddingBottom: 1 }}>
                    {grouped.map(([section, items], groupIndex) => (
                        <group key={`group-${groupIndex}`} style={{ paddingTop: 1, flexShrink: 0 }}>
                            {section && (
                                <group style={{ paddingLeft: 1 }}>
                                    <text fg={Theme.accent} attributes={TextAttributes.BOLD}>
                                        {section}
                                    </text>
                                </group>
                            )}
                            {items.map((item) => (
                                <Fragment key={item.value}>
                                    <ItemOption
                                        title={item.title}
                                        icon={item.icon}
                                        active={flat[selected]?.value === item.value}
                                        current={item.value === currentValue}
                                    />
                                </Fragment>
                            ))}
                        </group>
                    ))}
                </group>
                {isLoading && (
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
                    {"   "}↑↓
                </text>
                <text fg={Theme.textMuted}> navigate</text>
            </box>
        </group>
    )
}

function ItemOption(props: {
    title: string
    icon?: ReactNode
    active?: boolean
    current?: boolean
}) {
    return (
        <box
            style={{
                flexDirection: 'row',
                backgroundColor: props.active ? Theme.primary : undefined,
                paddingLeft: 1,
                paddingRight: 1,
            }}
            border={false}
        >
            {props.icon && (
                <text
                    fg={props.active ? Theme.background : Theme.text}
                >
                    {props.icon}{' '}
                </text>
            )}
            <text
                fg={props.active ? Theme.background : props.current ? Theme.primary : Theme.text}
                attributes={props.active ? TextAttributes.BOLD : undefined}
            >
                {props.title}
            </text>
        </box>
    )
}

const DropdownItem: (props: DropdownItemProps) => any = () => {
    // This component doesn't render anything directly
    // It's processed by the parent Dropdown component
    return null
}

const DropdownSection: (props: DropdownSectionProps) => any = () => {
    // This component doesn't render anything directly
    // It's processed by the parent Dropdown component  
    return null
}

Dropdown.Item = DropdownItem
Dropdown.Section = DropdownSection

export default Dropdown
export { Dropdown }