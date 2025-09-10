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
import {
  useFormContext,
  Controller,
  ControllerRenderProps,
  ControllerFieldState,
} from 'react-hook-form'
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

type DropdownFieldType = ControllerRenderProps<
  { __dropdown: string | string[] },
  '__dropdown'
>

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
  useDescendant: useFormDropdownDescendant,
} = createDescendants<FormDropdownItemDescendant>()

// Context for dropdown state and section information
interface FormDropdownContextValue {
  currentSection?: string
  focusedIndex: number
  offset: number
  itemsPerPage: number
  isFocused: boolean
  handleSelect: (descendantId: string) => void
  field: DropdownFieldType
  props: DropdownProps
}

const itemsPerPage = 4
const FormDropdownContext = createContext<FormDropdownContextValue>({
  focusedIndex: 0,
  offset: 0,
  itemsPerPage,
  isFocused: false,
  handleSelect: () => {},
  field: {} as DropdownFieldType,
  props: {} as DropdownProps,
})

const DropdownItem = (props: DropdownItemProps) => {
  const context = useContext(FormDropdownContext)

  // Register as descendant
  const descendant = useFormDropdownDescendant({
    value: props.value,
    title: props.title,
    icon: props.icon,
  })

  // Hide items that are outside the visible range
  if (
    descendant.index < context.offset ||
    descendant.index >= context.offset + context.itemsPerPage
  ) {
    return null
  }

  const isFocused = descendant.index === context.focusedIndex

  // Check if this item is selected based on field value
  const isSelected = (() => {
    if (!context.field.value) return false

    if (
      context.props.hasMultipleSelection &&
      Array.isArray(context.field.value)
    ) {
      return context.field.value.includes(props.value)
    } else if (
      !context.props.hasMultipleSelection &&
      typeof context.field.value === 'string'
    ) {
      return context.field.value === props.value
    }
    return false
  })()

  return (
    <WithLeftBorder
      key={props.value}
      isFocused={context.isFocused}
      paddingBottom={0}
    >
      <text
        fg={
          context.isFocused && isFocused
            ? Theme.accent
            : context.isFocused
              ? Theme.text
              : Theme.textMuted
        }
        onMouseDown={() => {
          context.handleSelect(descendant.descendantId)
        }}
      >
        {isSelected ? '●' : '○'} {props.title}
      </text>
    </WithLeftBorder>
  )
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
      <box flexDirection='column' paddingBottom={1}>
        {props.title && (
          <WithLeftBorder 
            isFocused={parentContext.isFocused}
            paddingBottom={0}
          >
            <text fg={Theme.textMuted} dimColor>
              {props.title}
            </text>
          </WithLeftBorder>
        )}
        {props.children}
      </box>
    </FormDropdownContext.Provider>
  )
}

// Separate component for the dropdown content
interface DropdownContentProps extends DropdownProps {
  field: DropdownFieldType
  fieldState: ControllerFieldState
}

const DropdownContent = ({
  field,
  fieldState,
  ...props
}: DropdownContentProps) => {
  const descendantsContext = useFormDropdownDescendants()
  const isInFocus = useIsInFocus()
  const { getValues } = useFormContext()
  const { focusedField, setFocusedField } = useFocusContext()
  const isFocused = focusedField === props.id
  const [focusedIndex, setFocusedIndex] = useState(0)
  const [offset, setOffset] = useState(0)

  const [selectedTitles, setSelectedTitles] = useState<string[]>([])
  const [itemsCount, setItemsCount] = useState(0)

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

  // Helper to get value for a descendantId
  const getValueForDescendantId = (
    descendantId: string,
  ): string | undefined => {
    const item = descendantsContext.map.current[descendantId]
    return item?.props?.value
  }

  const handleSelect = (descendantId: string) => {
    const value = getValueForDescendantId(descendantId)
    if (!value) return

    const item = descendantsContext.map.current[descendantId]
    const title = item?.props?.title || value

    if (props.hasMultipleSelection) {
      const currentValues = Array.isArray(field.value) ? [...field.value] : []
      const index = currentValues.indexOf(value)

      if (index >= 0) {
        currentValues.splice(index, 1)
        // Remove from selected titles
        setSelectedTitles((prev) => prev.filter((t) => t !== title))
      } else {
        currentValues.push(value)
        // Add to selected titles
        setSelectedTitles((prev) => [...prev, title])
      }

      field.onChange(currentValues)
      if (props.onChange) {
        props.onChange(currentValues)
      }
    } else {
      field.onChange(value)
      setSelectedTitles([title])
      if (props.onChange) {
        props.onChange(value)
      }
    }
  }

  // Handle keyboard navigation when focused
  useKeyboard((evt) => {
    if (!isFocused || !isInFocus) return

    const items = Object.values(descendantsContext.map.current).filter(
      (item) => item.index !== -1,
    )
    const itemCount = items.length

    if (itemCount > 0) {
      if (evt.name === 'down') {
        setFocusedIndex((prev) => {
          const nextIndex = (prev + 1) % itemCount

          // Update offset only when the focused item is at the last position and there are more items
          const visibleEnd = offset + itemsPerPage - 1
          if (
            prev === visibleEnd &&
            nextIndex < itemCount &&
            nextIndex > prev
          ) {
            // Scroll down by one when at the last visible item
            setOffset(offset + 1)
          } else if (nextIndex < prev) {
            // Wrapped to beginning
            setOffset(0)
          }

          return nextIndex
        })
      } else if (evt.name === 'up') {
        setFocusedIndex((prev) => {
          const nextIndex = (prev - 1 + itemCount) % itemCount

          // Update offset if we're going above the visible range
          if (nextIndex < offset) {
            setOffset(Math.max(0, nextIndex))
          } else if (nextIndex >= offset + itemsPerPage) {
            // Wrapped to end
            setOffset(Math.max(0, itemCount - itemsPerPage))
          }

          return nextIndex
        })
      } else if (evt.name === 'return' || evt.name === 'space') {
        // Toggle selection of current focused item
        const entries = Object.entries(descendantsContext.map.current)
        const sortedEntries = entries
          .filter(([_, item]) => item.index !== -1)
          .sort((a, b) => a[1].index - b[1].index)

        const focusedId = sortedEntries[focusedIndex]?.[0]
        if (focusedId) {
          handleSelect(focusedId)
        }
      }
    }

    // Handle tab navigation
    if (evt.name === 'tab') {
      if (evt.shift) {
        handleNavigateUp()
      } else {
        handleNavigateDown()
      }
    }
  })

  // Update active item count when descendants change
  useLayoutEffect(() => {
    let itemCount = 0
    const entries = Object.entries(descendantsContext.map.current)

    entries.forEach(([id, item]) => {
      if (item.index !== -1) {
        itemCount++
      }
    })

    setItemsCount(itemCount)
  })

  // Initialize selected titles from field value only once when descendants are loaded
  useLayoutEffect(() => {
    if (field.value && Object.keys(descendantsContext.map.current).length > 0) {
      const titles: string[] = []
      const entries = Object.entries(descendantsContext.map.current)

      entries.forEach(([id, item]) => {
        if (item.props) {
          if (props.hasMultipleSelection && Array.isArray(field.value)) {
            if (field.value.includes(item.props.value)) {
              titles.push(item.props.title)
            }
          } else if (
            !props.hasMultipleSelection &&
            typeof field.value === 'string'
          ) {
            if (item.props.value === field.value) {
              titles.push(item.props.title)
            }
          }
        }
      })

      setSelectedTitles(titles)
    }
  }, []) // Only run once on mount

  // Create context value
  const contextValue: FormDropdownContextValue = {
    focusedIndex,
    offset,
    itemsPerPage,
    isFocused,
    handleSelect,
    field,
    props,
  }

  return (
    <FormDropdownDescendantsProvider value={descendantsContext}>
      <FormDropdownContext.Provider value={contextValue}>
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
              fg={selectedTitles.length > 0 ? Theme.text : Theme.textMuted}
              selectable={false}
              onMouseDown={() => {
                setFocusedField(props.id)
              }}
            >
              {selectedTitles.length > 0
                ? selectedTitles.join(', ')
                : props.placeholder || 'Select...'}
            </text>
          </WithLeftBorder>
          {props.children}
          {itemsCount > itemsPerPage && (
            <WithLeftBorder isFocused={isFocused}>
              <text fg={Theme.textMuted}>↑↓ to see more options</text>
            </WithLeftBorder>
          )}
          {(fieldState.error || props.error) && (
            <WithLeftBorder isFocused={isFocused}>
              <text fg={Theme.error}>
                {fieldState.error?.message || props.error}
              </text>
            </WithLeftBorder>
          )}
          {props.info && (
            <WithLeftBorder isFocused={isFocused}>
              <text fg={Theme.textMuted}>{props.info}</text>
            </WithLeftBorder>
          )}
        </box>
      </FormDropdownContext.Provider>
    </FormDropdownDescendantsProvider>
  )
}

const DropdownComponent = (props: DropdownProps): any => {
  const { control } = useFormContext()
  const { focusedField } = useFocusContext()
  const isFocused = focusedField === props.id

  return (
    <Controller
      name={props.id}
      control={control}
      defaultValue={
        props.defaultValue ||
        props.value ||
        (props.hasMultipleSelection ? [] : '')
      }
      render={({ field, fieldState }) => {
        return (
          <DropdownContent
            field={field as any}
            fieldState={fieldState}
            {...props}
          />
        ) as React.ReactElement
      }}
    />
  )
}

// Create the properly typed Dropdown with sub-components
export const Dropdown = Object.assign(DropdownComponent, {
  Item: DropdownItem,
  Section: DropdownSection,
}) as DropdownType
