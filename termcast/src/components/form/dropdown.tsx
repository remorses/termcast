import React, { useState, useEffect, useRef } from 'react'
import { TextAttributes } from '@opentui/core'
import { useKeyboard } from '@opentui/react'
import { useFormContext } from './index'
import { FormItemProps, FormItemRef } from './types'
import { logger } from '@termcast/api/src/logger'
import { Theme } from '@termcast/api/src/theme'
import { Dropdown as BaseDropdown } from '@termcast/api/src/components/dropdown'
import { useDialog } from '@termcast/api/src/internal/dialog'

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

const DropdownItem = (props: DropdownItemProps) => {
    return null
}

const DropdownSection = (props: DropdownSectionProps) => {
    return null
}

const DropdownComponent = React.forwardRef<DropdownRef, DropdownProps>((props, ref) => {
    const formContext = useFormContext()
    const [localValue, setLocalValue] = useState(props.defaultValue || props.value || '')
    const [isOpen, setIsOpen] = useState(false)
    const isFocused = formContext.focusedField === props.id
    const dialog = useDialog()

    // Parse children to extract items for display
    const items: DropdownItemProps[] = []
    const sections: { title?: string; items: DropdownItemProps[] }[] = []
    let currentSection: { title?: string; items: DropdownItemProps[] } | null = null

    React.Children.forEach(props.children, (child: any) => {
        if (child?.type === DropdownSection) {
            if (currentSection) {
                sections.push(currentSection)
            }
            currentSection = { title: child.props.title, items: [] }
            React.Children.forEach(child.props.children, (item: any) => {
                if (item?.type === DropdownItem) {
                    currentSection!.items.push(item.props)
                }
            })
        } else if (child?.type === DropdownItem) {
            if (currentSection) {
                currentSection.items.push(child.props)
            } else {
                items.push(child.props)
            }
        }
    })

    if (currentSection) {
        sections.push(currentSection)
    }

    const allItems = [...items, ...sections.flatMap(s => s.items)]
    const selectedItem = allItems.find(item => item.value === localValue)

    useEffect(() => {
        if (props.value !== undefined) {
            setLocalValue(props.value)
        }
    }, [props.value])

    useEffect(() => {
        formContext.setFieldValue(props.id, localValue)
    }, [localValue, props.id])

    const fieldRef: FormItemRef = {
        focus: () => {
            formContext.setFocusedField(props.id)
        },
        reset: () => {
            const resetValue = props.defaultValue || ''
            setLocalValue(resetValue)
            formContext.setFieldValue(props.id, resetValue)
        }
    }

    React.useImperativeHandle(ref, () => fieldRef)

    useEffect(() => {
        formContext.registerField(props.id, fieldRef)
        return () => formContext.unregisterField(props.id)
    }, [props.id])

    const handleSelect = (value: string) => {
        setLocalValue(value)
        setIsOpen(false)
        dialog.clear()
        if (props.onChange) {
            props.onChange(value)
        }
    }

    const openDropdown = () => {
        setIsOpen(true)
        dialog.push(
            <BaseDropdown
                value={localValue}
                onChange={handleSelect}
                placeholder={props.placeholder}
                tooltip={props.title}
            >
                {props.children}
            </BaseDropdown>,
            'center'
        )
    }

    // Handle keyboard navigation when focused
    useKeyboard((evt) => {
        if (!isFocused) return

        if ((evt.name === 'return' || evt.name === 'space') && !isOpen) {
            openDropdown()
        }
    })

    return (
        <box flexDirection="column">
            {props.title && (
                <text fg={Theme.primary}>
                    {props.title}
                </text>
            )}
            <box 
                border
                padding={1}
                backgroundColor={isFocused ? Theme.backgroundPanel : undefined}
            >
                <text fg={selectedItem ? Theme.text : Theme.textMuted}>
                    {selectedItem ? selectedItem.title : (props.placeholder || 'Select...')}
                    {isFocused ? ' ▼' : ''}
                </text>
            </box>
            {props.error && (
                <text fg={Theme.error}>
                    {props.error}
                </text>
            )}
            {props.info && (
                <text fg={Theme.textMuted}>
                    {props.info}
                </text>
            )}
        </box>
    )
}) as unknown as DropdownType

DropdownComponent.Item = DropdownItem
DropdownComponent.Section = DropdownSection

export const Dropdown = DropdownComponent