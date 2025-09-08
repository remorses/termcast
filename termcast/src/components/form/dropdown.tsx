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
import { Dropdown as BaseDropdown } from '@termcast/cli/src/components/dropdown'
import { useDialog } from '@termcast/cli/src/internal/dialog'
import { createDescendants } from '@termcast/cli/src/descendants'
import { WithLeftBorder } from './with-left-border'

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
        const isFocused = focusedField === props.id
        const dialog = useDialog()
        const descendantsContext = useFormDropdownDescendants()

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
                            dialog.clear()

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
                                }
                            }

                            // Build BaseDropdown children from descendants
                            const dropdownChildren = items.map((item) => (
                                <BaseDropdown.Item
                                    key={item.value}
                                    value={item.value}
                                    title={item.title}
                                    icon={item.icon}
                                />
                            ))

                            dialog.push(
                                <BaseDropdown
                                    value={field.value}
                                    onChange={handleSelect}
                                    placeholder={props.placeholder}
                                    tooltip={props.title}
                                    filtering={true}
                                >
                                    {dropdownChildren}
                                </BaseDropdown>,
                                'center',
                            )
                        }

                        // Handle keyboard navigation when focused
                        useKeyboard((evt) => {
                            if (!isFocused) return

                            if (
                                (evt.name === 'return' ||
                                    evt.name === 'space') &&
                                !isOpen
                            ) {
                                openDropdown()
                            }
                        })

                        return (
                            <box flexDirection='column'>
                                <WithLeftBorder withDiamond={true} diamondFilled={isFocused}>
                                    <text 
                                        fg={isFocused ? Theme.accent : Theme.text}
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
                                <WithLeftBorder>
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
                                {(fieldState.error || props.error) && (
                                    <WithLeftBorder>
                                        <text fg={Theme.error}>
                                            {fieldState.error?.message ||
                                                props.error}
                                        </text>
                                    </WithLeftBorder>
                                )}
                                {props.info && (
                                    <WithLeftBorder>
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
