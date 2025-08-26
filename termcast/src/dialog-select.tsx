import {
    ReactNode,
    ReactElement,
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
import { Theme } from './theme'

export interface DialogSelectProps {
    title: string
    onSelect?: (key: string) => void
    current?: string
    children?: ReactNode
    placeholder?: string
}

export interface DialogSelectOptionProps {
    id: string
    title: string
    description?: string
    category?: string
    keywords?: string[]
}

export interface DialogSelectSectionProps {
    title?: string
    children?: ReactNode
}

interface ProcessedOption extends DialogSelectOptionProps {
    originalIndex: number
}

// Helper function to extract options from children
function extractOptions(children: ReactNode): ProcessedOption[] {
    const options: ProcessedOption[] = []
    let index = 0

    const processChildren = (nodes: ReactNode, currentCategory?: string) => {
        Children.forEach(nodes, (child) => {
            if (!isValidElement(child)) return

            if (child.type === DialogSelectOption) {
                const props = child.props as DialogSelectOptionProps
                options.push({
                    ...props,
                    category: props.category || currentCategory,
                    originalIndex: index++,
                })
            } else if (child.type === DialogSelectSection) {
                const props = child.props as DialogSelectSectionProps
                processChildren(props.children, props.title)
            }
        })
    }

    processChildren(children)
    return options
}

// Group options by category
function groupByCategory(options: ProcessedOption[]): [string, ProcessedOption[]][] {
    const grouped: Record<string, ProcessedOption[]> = {}
    
    options.forEach(option => {
        const category = option.category || ''
        if (!grouped[category]) {
            grouped[category] = []
        }
        grouped[category].push(option)
    })

    return Object.entries(grouped)
}

// Filter options based on search query
function filterOptions(options: ProcessedOption[], query: string): ProcessedOption[] {
    if (!query.trim()) return options

    const needle = query.toLowerCase().trim()
    
    return options.filter(option => {
        const searchableText = [
            option.title,
            option.description,
            option.category,
            ...(option.keywords || []),
        ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()

        return searchableText.includes(needle)
    })
}

interface DialogSelectType {
    (props: DialogSelectProps): any
    Option: (props: DialogSelectOptionProps) => any
    Section: (props: DialogSelectSectionProps) => any
}

const DialogSelect: DialogSelectType = (props) => {
    const { title, onSelect, current, children, placeholder = "Enter search term" } = props

    const [selected, setSelected] = useState(0)
    const [filter, setFilter] = useState('')
    const inputRef = useRef<any>(null)

    // Extract and process options from children
    const allOptions = useMemo(() => extractOptions(children), [children])
    
    // Filter options based on search
    const filteredOptions = useMemo(
        () => filterOptions(allOptions, filter).slice(0, 10),
        [allOptions, filter]
    )
    
    // Group filtered options by category
    const grouped = useMemo(
        () => groupByCategory(filteredOptions),
        [filteredOptions]
    )

    // Reset selected index when filter changes
    useEffect(() => {
        setSelected(0)
    }, [filter])

    // Calculate flat list for keyboard navigation
    const flat = useMemo(() => filteredOptions, [filteredOptions])

    const move = (direction: -1 | 1) => {
        let next = selected + direction
        if (next < 0) next = flat.length - 1
        if (next >= flat.length) next = 0
        setSelected(next)
    }

    // Handle keyboard navigation
    useKeyboard((evt) => {
        if (evt.name === 'up') move(-1)
        if (evt.name === 'down') move(1)
        if (evt.name === 'return' && flat[selected]) {
            if (onSelect) {
                onSelect(flat[selected].id)
            }
        }
    })

    return (
        <group>
            <group style={{ paddingLeft: 2, paddingRight: 2 }}>
                <group style={{ paddingLeft: 1, paddingRight: 1 }}>
                    <group style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <text attributes={TextAttributes.BOLD}>{title}</text>
                        <text fg={Theme.textMuted}>esc</text>
                    </group>
                    <group style={{ paddingTop: 1, paddingBottom: 1 }}>
                        <input
                            ref={inputRef}
                            onInput={(value) => setFilter(value)}
                            placeholder={placeholder}
                            focused={true}
                            value={filter}
                            focusedBackgroundColor={Theme.backgroundPanel}
                            cursorColor={Theme.primary}
                            focusedTextColor={Theme.textMuted}
                        />
                    </group>
                </group>
                <group style={{ paddingBottom: 1 }}>
                    {grouped.map(([category, options], groupIndex) => (
                        <group key={`group-${groupIndex}`} style={{ paddingTop: 1, flexShrink: 0 }}>
                            {category && (
                                <group style={{ paddingLeft: 1 }}>
                                    <text fg={Theme.accent} attributes={TextAttributes.BOLD}>
                                        {category}
                                    </text>
                                </group>
                            )}
                            {options.map((option) => (
                                <Fragment key={option.id}>
                                    <Option
                                        title={option.title}
                                        description={option.description !== category ? option.description : undefined}
                                        active={flat[selected]?.id === option.id}
                                        current={option.id === current}
                                    />
                                </Fragment>
                            ))}
                        </group>
                    ))}
                </group>
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

function Option(props: {
    title: string
    description?: string
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
            <text
                fg={props.active ? Theme.background : props.current ? Theme.primary : Theme.text}
                attributes={props.active ? TextAttributes.BOLD : undefined}
            >
                {props.title}
            </text>
            {props.description && (
                <text fg={props.active ? Theme.background : Theme.textMuted}> {props.description}</text>
            )}
        </box>
    )
}

const DialogSelectOption: (props: DialogSelectOptionProps) => any = () => {
    // This component doesn't render anything directly
    // It's processed by the parent DialogSelect component
    return null
}

const DialogSelectSection: (props: DialogSelectSectionProps) => any = () => {
    // This component doesn't render anything directly
    // It's processed by the parent DialogSelect component  
    return null
}

DialogSelect.Option = DialogSelectOption
DialogSelect.Section = DialogSelectSection

export default DialogSelect