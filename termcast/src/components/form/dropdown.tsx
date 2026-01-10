import React, {
  useState,
  createContext,
  useContext,
  useMemo,
  useRef,
  useLayoutEffect,
} from 'react'
import { BoxRenderable, ScrollBoxRenderable } from '@opentui/core'
import { useKeyboard, flushSync } from '@opentui/react'
import {
  useFormContext,
  Controller,
  ControllerRenderProps,
  ControllerFieldState,
} from 'react-hook-form'
import { useFocusContext, useFormFieldDescendant } from './index'
import { FormItemProps, FormItemRef } from './types'
import { logger } from 'termcast/src/logger'
import { useTheme } from 'termcast/src/theme'
import {
  createDescendants,
  DescendantContextType,
} from 'termcast/src/descendants'
import { WithLeftBorder } from './with-left-border'
import { useIsInFocus } from 'termcast/src/internal/focus-context'
import { useFormNavigationHelpers } from './use-form-navigation'
import { LoadingText } from 'termcast/src/components/loading-text'

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
  section?: string // Track which section this item belongs to
  elementRef?: BoxRenderable | null
}

const {
  DescendantsProvider: FormDropdownDescendantsProvider,
  useDescendants: useFormDropdownDescendants,
  useDescendant: useFormDropdownDescendant,
} = createDescendants<FormDropdownItemDescendant>()

// Context for dropdown state
interface FormDropdownContextValue {
  focusedIndex: number
  isFocused: boolean
  handleSelect: (descendantId: string) => void
  field: DropdownFieldType
  props: DropdownProps
  descendantsContext: DescendantContextType<FormDropdownItemDescendant>
  scrollBoxRef: React.RefObject<ScrollBoxRenderable | null>
}

// Separate context for section information
interface SectionContextValue {
  currentSection?: string
}

const SectionContext = createContext<SectionContextValue>({
  currentSection: undefined,
})

const FormDropdownContext = createContext<FormDropdownContextValue>({
  focusedIndex: 0,
  isFocused: false,
  handleSelect: () => {},
  descendantsContext: {} as any,
  field: {} as DropdownFieldType,
  props: {} as DropdownProps,
  scrollBoxRef: { current: null },
})

const DropdownItem = (props: DropdownItemProps) => {
  const theme = useTheme()
  const context = useContext(FormDropdownContext)
  const sectionContext = useContext(SectionContext)
  const elementRef = useRef<BoxRenderable | null>(null)

  // Register as descendant
  const descendant = useFormDropdownDescendant({
    value: props.value,
    title: props.title,
    icon: props.icon,
    section: sectionContext.currentSection,
    elementRef: elementRef.current,
  })

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
    <box ref={elementRef} key={props.value}>
      <WithLeftBorder
        isFocused={context.isFocused}
        paddingLeft={0}
        paddingBottom={0}
      >
        <text
          fg={
            context.isFocused && isFocused
              ? theme.accent
              : context.isFocused
                ? theme.text
                : theme.textMuted
          }
          onMouseDown={() => {
            context.handleSelect(descendant.descendantId)
          }}
        >
          {context.isFocused && isFocused ? '› ' : '  '}
          {isSelected ? '●' : '○'} {props.title}
        </text>
      </WithLeftBorder>
    </box>
  )
}

const DropdownSection = (props: DropdownSectionProps) => {
  const theme = useTheme()
  const parentContext = useContext(FormDropdownContext)

  // Create section context value
  const sectionContextValue = useMemo(
    () => ({
      currentSection: props.title,
    }),
    [props.title],
  )

  return (
    <SectionContext.Provider value={sectionContextValue}>
      <box flexDirection='column'>
        {props.title && (
          <WithLeftBorder
            paddingTop={0}
            paddingBottom={0}
            isFocused={parentContext.isFocused}
          >
            <text fg={theme.textMuted}>{props.title}</text>
          </WithLeftBorder>
        )}
        {props.children}
      </box>
    </SectionContext.Provider>
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
  const theme = useTheme()
  const descendantsContext = useFormDropdownDescendants()
  const isInFocus = useIsInFocus()
  const focusContext = useFocusContext()
  const { focusedField, setFocusedField } = focusContext
  const isFocused = focusedField === props.id
  const [focusedIndex, setFocusedIndex] = useState(0)

  const elementRef = useRef<BoxRenderable>(null)
  const scrollBoxRef = useRef<ScrollBoxRenderable>(null)

  const typeAheadTextRef = useRef('')
  const typeAheadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Register as form field descendant for scroll support
  useFormFieldDescendant({
    id: props.id,
    elementRef: elementRef.current,
  })

  const [selectedTitles, setSelectedTitles] = useState<string[]>([])

  const { navigateToPrevious, navigateToNext } = useFormNavigationHelpers(
    props.id,
  )

  const scrollToItem = (item: { props?: FormDropdownItemDescendant }) => {
    const scrollBox = scrollBoxRef.current
    const itemElementRef = item.props?.elementRef
    if (!scrollBox || !itemElementRef) return

    const contentY = scrollBox.content?.y || 0
    const viewportHeight = scrollBox.viewport?.height || 5

    // Calculate item position relative to content
    const itemTop = itemElementRef.y - contentY

    // Scroll so the top of the item is centered in the viewport
    const targetScrollTop = itemTop - viewportHeight / 2
    scrollBox.scrollTo(Math.max(0, targetScrollTop))
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

    const items = Object.values(descendantsContext.map.current)
      .filter((item) => item.index !== -1)
      .sort((a, b) => a.index - b.index)
    const itemCount = items.length

    if (itemCount > 0) {
      if (evt.name === 'down') {
        const nextIndex = (focusedIndex + 1) % itemCount
        const nextItem = items[nextIndex]
        if (nextItem) {
          flushSync(() => {
            setFocusedIndex(nextIndex)
          })
          scrollToItem(nextItem)
        }
      } else if (evt.name === 'up') {
        const nextIndex = (focusedIndex - 1 + itemCount) % itemCount
        const nextItem = items[nextIndex]
        if (nextItem) {
          flushSync(() => {
            setFocusedIndex(nextIndex)
          })
          scrollToItem(nextItem)
        }
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
        navigateToPrevious()
      } else {
        navigateToNext()
      }
      return
    }

    // Type-ahead search
    if (
      evt.name.length === 1 &&
      /^[a-zA-Z0-9]$/.test(evt.name) &&
      !evt.ctrl &&
      !evt.meta &&
      !evt.option
    ) {
      if (typeAheadTimeoutRef.current) {
        clearTimeout(typeAheadTimeoutRef.current)
      }

      typeAheadTextRef.current += evt.name.toLowerCase()
      const searchText = typeAheadTextRef.current

      const matchingItem =
        items.find((item) => {
          return item.props?.title?.toLowerCase().startsWith(searchText)
        }) ||
        items.find((item) => {
          return item.props?.title?.toLowerCase().includes(searchText)
        })

      if (matchingItem) {
        flushSync(() => {
          setFocusedIndex(matchingItem.index)
        })
        scrollToItem(matchingItem)
      }

      typeAheadTimeoutRef.current = setTimeout(() => {
        typeAheadTextRef.current = ''
      }, 300)
    }
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
    descendantsContext,
    isFocused,
    handleSelect,
    field,
    props,
    scrollBoxRef,
  }

  return (
    <FormDropdownDescendantsProvider value={descendantsContext}>
      <FormDropdownContext.Provider value={contextValue}>
        <box ref={elementRef} flexDirection='column'>
          <WithLeftBorder withDiamond isFocused={isFocused} isLoading={focusContext.isLoading}>
            <box
              onMouseDown={() => {
                setFocusedField(props.id)
              }}
            >
              <LoadingText
                isLoading={isFocused && focusContext.isLoading}
                color={isFocused ? theme.primary : theme.text}
              >
                {props.title || ''}
              </LoadingText>
            </box>
          </WithLeftBorder>
          <WithLeftBorder isFocused={isFocused}>
            <text
              fg={selectedTitles.length > 0 ? theme.text : theme.textMuted}
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

          <scrollbox
            ref={scrollBoxRef}
            maxHeight={5}
            flexShrink={1}
            style={{
              rootOptions: {
                flexShrink: 1,
              },
              viewportOptions: {
                flexShrink: 1,
              },
              scrollbarOptions: {
                visible: false,
              },
            }}
          >
            {props.children}
          </scrollbox>
          <WithLeftBorder children={<box />} isFocused={isFocused} />

          {(fieldState.error || props.error) && (
            <WithLeftBorder isFocused={isFocused}>
              <text fg={theme.error}>
                {fieldState.error?.message || props.error}
              </text>
            </WithLeftBorder>
          )}
          {props.info && (
            <WithLeftBorder isFocused={isFocused}>
              <text fg={theme.textMuted}>{props.info}</text>
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
