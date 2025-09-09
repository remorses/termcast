import React, {
    useState,
    createContext,
    useContext,
    useMemo,
    useRef,
    useLayoutEffect,
    useEffect,
    Children,
} from 'react'
import { TextAttributes } from '@opentui/core'
import { useKeyboard } from '@opentui/react'
import { useFormContext, Controller } from 'react-hook-form'
import { useFocusContext } from './index'
import { FormItemProps, FormItemRef } from './types'
import { logger } from '@termcast/cli/src/logger'
import { Theme } from '@termcast/cli/src/theme'
import { createDescendants } from '@termcast/cli/src/descendants'
import { WithLeftBorder } from './with-left-border'
import { useIsInFocus } from '@termcast/cli/src/internal/focus-context'

export interface DropdownProps extends FormItemProps<string | string[]> {
    placeholder?: string
    children?: React.ReactNode
    hasMultipleSelection?: boolean
}

export interface DropdownItemProps {
    value: string
    title: string
    icon?: string
}

export interface DropdownSectionProps {
    title?: string
    children?: React.ReactNode
}

export type DropdownRef = FormItemRef

interface DropdownType {
    (props: DropdownProps): any
    Item: (props: DropdownItemProps) => any
    Section: (props: DropdownSectionProps) => any
}

// Create descendants for form dropdown items - minimal fields
interface FormDropdownItemDescendant {
    value: string
    title: string
    icon?: string
}

const {
    DescendantsProvider: FormDropdownDescendantsProvider,
    useDescendants: useFormDropdownDescendants,
    useDescendant: useFormDropdownItemDescendant,
} = createDescendants<FormDropdownItemDescendant>()

// Context for section information
interface FormDropdownContextValue {
    currentSection?: string
}

const FormDropdownContext = createContext<FormDropdownContextValue>({})

const DropdownItem = (props: DropdownItemProps) => {
    const context = useContext(FormDropdownContext)

    // Register as descendant
    useFormDropdownItemDescendant({
        value: props.value,
        title: props.title,
        icon: props.icon,
    })

    return null
}

const DropdownSection = (props: DropdownSectionProps) => {
    const parentContext = useContext(FormDropdownContext)

    // Create new context with section title
    const sectionContextValue = useMemo(
        () => ({
            ...parentContext,
            currentSection: props.title,
        }),
        [parentContext, props.title],
    )

    return (
        <FormDropdownContext.Provider value={sectionContextValue}>
            {props.children}
        </FormDropdownContext.Provider>
    )
}

// Separate component for the dropdown content
interface DropdownContentProps {
    field: any
    fieldState: any
    props: DropdownProps
    isFocused: boolean
    setFocusedField: (field: string) => void
    getValues: () => any
    items: FormDropdownItemDescendant[]
}

const DropdownContent = ({
    field,
    fieldState,
    props,
    isFocused,
    setFocusedField,
    getValues,
    items,
}: DropdownContentProps) => {
    const descendantsContext = useFormDropdownDescendants()
    const isInFocus = useIsInFocus()
    const [selectedOptionIndex, setSelectedOptionIndex] = useState(0)
    const [windowStartIndex, setWindowStartIndex] = useState(0)
    const itemsPerPage = 4
    const [selectedValues, setSelectedValues] = useState<Set<string>>(new Set())
    const [dropdownItems, setDropdownItems] = useState<FormDropdownItemDescendant[]>([])

    const handleNavigateUp = () => {
        // Find previous field and focus it
        const fieldNames = Object.keys(getValues())
        const currentIndex = fieldNames.indexOf(props.id)
        if (currentIndex > 0) {
            setFocusedField(fieldNames[currentIndex - 1])
        } else {
            setFocusedField(fieldNames[fieldNames.length - 1])
        }
    }

    const handleNavigateDown = () => {
        // Find next field and focus it
        const fieldNames = Object.keys(getValues())
        const currentIndex = fieldNames.indexOf(props.id)
        if (currentIndex < fieldNames.length - 1) {
            setFocusedField(fieldNames[currentIndex + 1])
        } else {
            setFocusedField(fieldNames[0])
        }
    }

    // Initialize dropdown items from items prop
    useLayoutEffect(() => {
        setDropdownItems(items)

        // Initialize selected values based on field value
        if (field.value && items.length > 0) {
            if (props.hasMultipleSelection && Array.isArray(field.value)) {
                setSelectedValues(new Set(field.value))
                // Set index to first selected item
                const firstSelectedIndex = items.findIndex(item => field.value.includes(item.value))
                if (firstSelectedIndex !== -1) {
                    setSelectedOptionIndex(firstSelectedIndex)
                    const windowStart = Math.max(0, Math.min(firstSelectedIndex - 1, items.length - itemsPerPage))
                    setWindowStartIndex(windowStart)
                }
            } else if (!props.hasMultipleSelection && typeof field.value === 'string') {
                setSelectedValues(new Set([field.value]))
                const index = items.findIndex(item => item.value === field.value)
                if (index !== -1) {
                    setSelectedOptionIndex(index)
                    const windowStart = Math.max(0, Math.min(index - 1, items.length - itemsPerPage))
                    setWindowStartIndex(windowStart)
                }
            }
        }
    }, [items, field.value, props.hasMultipleSelection])

    // Update selected values when field value changes
    useEffect(() => {
        if (field.value && dropdownItems.length > 0) {
            if (props.hasMultipleSelection && Array.isArray(field.value)) {
                setSelectedValues(new Set(field.value))
            } else if (!props.hasMultipleSelection && typeof field.value === 'string') {
                setSelectedValues(new Set([field.value]))
            }
        } else {
            setSelectedValues(new Set())
        }
    }, [field.value, dropdownItems, props.hasMultipleSelection])

    const handleSelect = (value: string) => {
        if (props.hasMultipleSelection) {
            const newSelectedValues = new Set(selectedValues)
            if (newSelectedValues.has(value)) {
                newSelectedValues.delete(value)
            } else {
                newSelectedValues.add(value)
            }
            const arrayValue = Array.from(newSelectedValues)
            field.onChange(arrayValue)
            if (props.onChange) {
                props.onChange(arrayValue)
            }
        } else {
            field.onChange(value)
            if (props.onChange) {
                props.onChange(value)
            }
        }
    }

    const refreshDropdownItems = () => {
        // Access map.current ONLY in event handler
        const items = Object.values(
            descendantsContext.map.current,
        )
            .filter((item) => item.index !== -1)
            .sort((a, b) => a.index - b.index)
            .map(
                (item) => item.props as FormDropdownItemDescendant,
            )

        setDropdownItems(items)

        // Update selected values and window position
        if (field.value) {
            if (props.hasMultipleSelection && Array.isArray(field.value)) {
                setSelectedValues(new Set(field.value))
                // Set index to first selected item
                const firstSelectedIndex = items.findIndex(item => field.value.includes(item.value))
                if (firstSelectedIndex !== -1) {
                    setSelectedOptionIndex(firstSelectedIndex)
                    const windowStart = Math.max(0, Math.min(firstSelectedIndex - 1, items.length - itemsPerPage))
                    setWindowStartIndex(windowStart)
                }
            } else if (!props.hasMultipleSelection && typeof field.value === 'string') {
                setSelectedValues(new Set([field.value]))
                const index = items.findIndex(item => item.value === field.value)
                if (index !== -1) {
                    setSelectedOptionIndex(index)
                    const windowStart = Math.max(0, Math.min(index - 1, items.length - itemsPerPage))
                    setWindowStartIndex(windowStart)
                }
            }
        } else {
            setSelectedOptionIndex(0)
            setWindowStartIndex(0)
        }
    }

    // Handle keyboard navigation when focused
    useKeyboard((evt) => {
        if (!isFocused || !isInFocus) return

        if (dropdownItems.length > 0) {
            if (evt.name === 'down') {
                if (selectedOptionIndex < dropdownItems.length - 1) {
                    const newIndex = selectedOptionIndex + 1
                    setSelectedOptionIndex(newIndex)

                    // Slide window if needed when reaching second-to-last visible item
                    const visibleEndIndex = windowStartIndex + itemsPerPage - 1
                    if (newIndex >= visibleEndIndex && windowStartIndex + itemsPerPage < dropdownItems.length) {
                        setWindowStartIndex(windowStartIndex + 1)
                    }
                } else {
                    // At last item, navigate to next field
                    handleNavigateDown()
                }
            } else if (evt.name === 'up') {
                if (selectedOptionIndex > 0) {
                    const newIndex = selectedOptionIndex - 1
                    setSelectedOptionIndex(newIndex)

                    // Slide window if needed when reaching first visible item
                    if (newIndex < windowStartIndex + 1 && windowStartIndex > 0) {
                        setWindowStartIndex(windowStartIndex - 1)
                    }
                } else {
                    // At first item, navigate to previous field
                    handleNavigateUp()
                }
            } else if (evt.name === 'return' || evt.name === 'space') {
                const selectedItem = dropdownItems[selectedOptionIndex]
                if (selectedItem) {
                    handleSelect(selectedItem.value)
                }
            }
        }

        // Handle tab navigation
        if (evt.name === 'tab') {
            if ((evt as any).modifiers?.shift) {
                handleNavigateUp()
            } else {
                handleNavigateDown()
            }
        }
    })

    // Get visible items
    const visibleItems = dropdownItems.slice(windowStartIndex, windowStartIndex + itemsPerPage)

    return (
        <box flexDirection='column'>
            <WithLeftBorder withDiamond isFocused={isFocused}>
                <text
                    fg={Theme.text}
                    onMouseDown={() => {
                        setFocusedField(props.id)
                    }}
                >
                    {props.title}
                </text>
            </WithLeftBorder>
            <WithLeftBorder isFocused={isFocused}>
                <text
                    fg={selectedValues.size > 0 ? Theme.text : Theme.textMuted}
                    selectable={false}
                    onMouseDown={() => {
                        setFocusedField(props.id)
                    }}
                >
                    {selectedValues.size > 0 
                        ? Array.from(selectedValues).map(val => 
                            dropdownItems.find(item => item.value === val)?.title || val
                          ).join(', ')
                        : (props.placeholder || 'Select...')
                    }
                </text>
            </WithLeftBorder>
            {visibleItems.map((item, visualIndex) => {
                const actualIndex = windowStartIndex + visualIndex
                return (
                    <WithLeftBorder key={item.value} isFocused={isFocused} paddingBottom={0}>
                        <text
                            fg={
                                isFocused && actualIndex === selectedOptionIndex
                                    ? Theme.accent
                                    : isFocused
                                    ? Theme.text
                                    : Theme.textMuted
                            }
                            onMouseDown={() => {
                                handleSelect(item.value)
                            }}
                        >
                            {selectedValues.has(item.value) ? '●' : '○'} {item.title}
                        </text>
                    </WithLeftBorder>
                )
            })}
            {dropdownItems.length > itemsPerPage && (
                <WithLeftBorder isFocused={isFocused}>
                    <text fg={Theme.textMuted}>
                        ↑↓ to see more options
                    </text>
                </WithLeftBorder>
            )}
            {(fieldState.error || props.error) && (
                <WithLeftBorder isFocused={isFocused}>
                    <text fg={Theme.error}>
                        {fieldState.error?.message ||
                            props.error}
                    </text>
                </WithLeftBorder>
            )}
            {props.info && (
                <WithLeftBorder isFocused={isFocused}>
                    <text fg={Theme.textMuted}>
                        {props.info}
                    </text>
                </WithLeftBorder>
            )}
        </box>
    )
}

// Inner component that has access to descendants
const DropdownInner = (props: DropdownProps & { control: any; getValues: any; isFocused: boolean; setFocusedField: (field: string) => void; items: FormDropdownItemDescendant[] }): any => {
    const { control, getValues, isFocused, setFocusedField, items } = props

    return (
        <Controller
            name={props.id}
            control={control}
            defaultValue={props.defaultValue || props.value || (props.hasMultipleSelection ? [] : '')}
            render={({ field, fieldState }) => {
                return (
                    <DropdownContent
                        field={field}
                        fieldState={fieldState}
                        props={props}
                        isFocused={isFocused}
                        setFocusedField={setFocusedField}
                        getValues={getValues}
                        items={items}
                    />
                ) as React.ReactElement
            }}
        />
    )
}

const DropdownComponent = (props: DropdownProps): any => {
    const { control, getValues } = useFormContext()
    const { focusedField, setFocusedField } = useFocusContext()
    const isFocused = focusedField === props.id
    const descendantsContext = useFormDropdownDescendants()

    // Parse children to get dropdown items
    const parsedItems = useMemo(() => {
        const items: FormDropdownItemDescendant[] = []
        Children.forEach(props.children, (child) => {
            if (React.isValidElement(child) && child.type === DropdownItem) {
                const childProps = child.props as DropdownItemProps
                items.push({
                    value: childProps.value,
                    title: childProps.title,
                    icon: childProps.icon,
                })
            }
        })
        return items
    }, [props.children])

    return (
        <FormDropdownDescendantsProvider value={descendantsContext}>
            <FormDropdownContext.Provider value={{}}>
                {/* Render children to collect items (they return null but register) */}
                {props.children}
            </FormDropdownContext.Provider>

            <DropdownInner
                {...props}
                control={control}
                getValues={getValues}
                isFocused={isFocused}
                setFocusedField={setFocusedField}
                items={parsedItems}
            />
        </FormDropdownDescendantsProvider>
    )
}

// Create the properly typed Dropdown with sub-components
export const Dropdown = Object.assign(DropdownComponent, {
    Item: DropdownItem,
    Section: DropdownSection,
}) as DropdownType
