import React, {
    useState,
    createContext,
    useContext,
    useMemo,
    useRef,
    useLayoutEffect,
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
import { useFormNavigation } from './use-form-navigation'
import { useIsInFocus } from '@termcast/cli/src/internal/focus-context'

export interface DropdownProps extends FormItemProps<string> {
    placeholder?: string
    children?: React.ReactNode
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

const DropdownComponent = (props: DropdownProps): any => {
        const { control } = useFormContext()
        const { focusedField, setFocusedField } = useFocusContext()
        const [isOpen, setIsOpen] = useState(false)
        const [selectedOptionIndex, setSelectedOptionIndex] = useState(0)
        const [currentPage, setCurrentPage] = useState(0)
        const isFocused = focusedField === props.id
        const descendantsContext = useFormDropdownDescendants()
        const isInFocus = useIsInFocus()
        const itemsPerPage = 5

        // Use form navigation hook - dropdown should handle its own arrows when open
        useFormNavigation(props.id, { handleArrows: !isOpen })

        return (
            <FormDropdownDescendantsProvider value={descendantsContext}>
                <FormDropdownContext.Provider value={{}}>
                    {/* Render children to collect items (they return null but register) */}
                    {props.children}
                </FormDropdownContext.Provider>

                <Controller
                    name={props.id}
                    control={control}
                    defaultValue={props.defaultValue || props.value || ''}
                    render={({ field, fieldState, formState }) => {
                        // Store selected title for display
                        const [selectedTitle, setSelectedTitle] =
                            React.useState<string>('')

                        const handleSelect = (value: string) => {
                            field.onChange(value)
                            setIsOpen(false)
                            setSelectedOptionIndex(0)
                            setCurrentPage(0)

                            // Find and store the selected item's title
                            const items = Object.values(
                                descendantsContext.map.current,
                            )
                                .filter((item: any) => item.index !== -1)
                                .map(
                                    (item: any) => item.props,
                                ) as FormDropdownItemDescendant[]
                            const selectedItem = items.find(
                                (item) => item.value === value,
                            )
                            if (selectedItem) {
                                setSelectedTitle(selectedItem.title)
                            }

                            if (props.onChange) {
                                props.onChange(value)
                            }
                        }

                        const openDropdown = () => {
                            setIsOpen(true)

                            // Access map.current ONLY in event handler
                            const items = Object.values(
                                descendantsContext.map.current,
                            )
                                .filter((item: any) => item.index !== -1)
                                .sort((a: any, b: any) => a.index - b.index)
                                .map(
                                    (item: any) => item.props,
                                ) as FormDropdownItemDescendant[]

                            // Update selected title if field has a value
                            if (field.value) {
                                const selectedItem = items.find(
                                    (item) => item.value === field.value,
                                )
                                if (selectedItem) {
                                    setSelectedTitle(selectedItem.title)
                                    // Find index and set current page
                                    const index = items.findIndex(item => item.value === field.value)
                                    if (index !== -1) {
                                        setSelectedOptionIndex(index % itemsPerPage)
                                        setCurrentPage(Math.floor(index / itemsPerPage))
                                    }
                                }
                            }
                        }

                        // Handle keyboard navigation when focused
                        useKeyboard((evt) => {
                            if (!isFocused || !isInFocus) return

                            if (isOpen) {
                                const items = Object.values(
                                    descendantsContext.map.current,
                                )
                                    .filter((item: any) => item.index !== -1)
                                    .sort((a: any, b: any) => a.index - b.index)
                                    .map(
                                        (item: any) => item.props,
                                    ) as FormDropdownItemDescendant[]

                                const totalPages = Math.ceil(items.length / itemsPerPage)
                                const startIndex = currentPage * itemsPerPage
                                const pageItems = items.slice(startIndex, startIndex + itemsPerPage)

                                if (evt.name === 'down') {
                                    if (selectedOptionIndex < pageItems.length - 1) {
                                        setSelectedOptionIndex(selectedOptionIndex + 1)
                                    } else if (currentPage < totalPages - 1) {
                                        setCurrentPage(currentPage + 1)
                                        setSelectedOptionIndex(0)
                                    }
                                } else if (evt.name === 'up') {
                                    if (selectedOptionIndex > 0) {
                                        setSelectedOptionIndex(selectedOptionIndex - 1)
                                    } else if (currentPage > 0) {
                                        setCurrentPage(currentPage - 1)
                                        const prevPageStartIndex = (currentPage - 1) * itemsPerPage
                                        const prevPageItems = items.slice(prevPageStartIndex, prevPageStartIndex + itemsPerPage)
                                        setSelectedOptionIndex(prevPageItems.length - 1)
                                    }
                                } else if (evt.name === 'return' || evt.name === 'space') {
                                    const selectedItem = pageItems[selectedOptionIndex]
                                    if (selectedItem) {
                                        handleSelect(selectedItem.value)
                                    }
                                } else if (evt.name === 'escape') {
                                    setIsOpen(false)
                                    setSelectedOptionIndex(0)
                                    setCurrentPage(0)
                                }
                            } else {
                                if (evt.name === 'return' || evt.name === 'space') {
                                    openDropdown()
                                }
                            }
                        })

                        // Access items for rendering
                        const items = isOpen ? Object.values(
                            descendantsContext.map.current,
                        )
                            .filter((item: any) => item.index !== -1)
                            .sort((a: any, b: any) => a.index - b.index)
                            .map(
                                (item: any) => item.props,
                            ) as FormDropdownItemDescendant[] : []

                        const totalPages = Math.ceil(items.length / itemsPerPage)
                        const startIndex = currentPage * itemsPerPage
                        const pageItems = items.slice(startIndex, startIndex + itemsPerPage)

                        return (
                            <box flexDirection='column'>
                                <WithLeftBorder withDiamond isFocused={isFocused}>
                                    <text
                                        fg={Theme.text}
                                        onMouseDown={() => {
                                            // Focus if not already focused
                                            if (!isFocused) {
                                                setFocusedField(props.id)
                                            }
                                            // Always try to open if not already open
                                            if (!isOpen) {
                                                openDropdown()
                                            }
                                        }}
                                    >
                                        {props.title}
                                    </text>
                                </WithLeftBorder>
                                <WithLeftBorder isFocused={isFocused}>
                                    <text
                                        fg={selectedTitle ? Theme.text : Theme.textMuted}
                                        selectable={false}
                                        onMouseDown={() => {
                                            if (!isFocused) {
                                                setFocusedField(props.id)
                                            }
                                            if (!isOpen) {
                                                openDropdown()
                                            }
                                        }}
                                    >
                                        {field.value ? '●' : '○'} {selectedTitle || props.placeholder || 'Select...'}
                                    </text>
                                </WithLeftBorder>
                                {isOpen && pageItems.map((item, index) => (
                                    <box key={item.value}>
                                        <WithLeftBorder isFocused={isFocused}>
                                            <text
                                                fg={
                                                    isFocused && index === selectedOptionIndex
                                                        ? Theme.accent
                                                        : isFocused
                                                        ? Theme.text
                                                        : Theme.textMuted
                                                }
                                                onMouseDown={() => {
                                                    handleSelect(item.value)
                                                }}
                                            >
                                                {index === selectedOptionIndex ? '●' : '○'} {item.title}
                                            </text>
                                        </WithLeftBorder>
                                    </box>
                                ))}
                                {isOpen && totalPages > 1 && (
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
                        ) as React.ReactElement
                    }}
                />
            </FormDropdownDescendantsProvider>
        )
    }

// Create the properly typed Dropdown with sub-components
export const Dropdown = Object.assign(DropdownComponent, {
    Item: DropdownItem,
    Section: DropdownSection,
}) as DropdownType
