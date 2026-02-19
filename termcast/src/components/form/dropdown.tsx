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
import { WithLeftBorder, TitleIndicator } from './with-left-border'
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
          <text fg={theme.textMuted}>  {props.title}</text>
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
  const { navigateToPrevious, navigateToNext } = useFormNavigationHelpers(
    props.id,
  )
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

  const scrollToItemIfNeeded = ({
    item,
    direction,
  }: {
    item: { props?: FormDropdownItemDescendant }
    direction: -1 | 1
  }) => {
    const scrollBox = scrollBoxRef.current
    const itemElementRef = item.props?.elementRef
    if (!scrollBox || !itemElementRef) return

    const contentY = scrollBox.content?.y || 0
    const scrollTop = scrollBox.scrollTop || 0
    const viewportHeight = scrollBox.viewport?.height || 5

    const itemTop = itemElementRef.y - contentY
    const itemHeight = itemElementRef.height || 1
    const itemBottom = itemTop + itemHeight

    const viewportTop = scrollTop
    const viewportBottom = scrollTop + viewportHeight

    if (direction === 1) {
      if (itemBottom > viewportBottom) {
        scrollBox.scrollTo(Math.max(0, itemTop))
      }
      return
    }

    if (itemTop < viewportTop) {
      const targetScrollTop = itemBottom - viewportHeight
      scrollBox.scrollTo(Math.max(0, targetScrollTop))
    }
  }

  // Helper to get value for a descendantId - use committedMap for stability
  const getValueForDescendantId = (
    descendantId: string,
  ): string | undefined => {
    const item = descendantsContext.committedMap[descendantId]
    return item?.props?.value
  }

  const handleSelect = (descendantId: string) => {
    const value = getValueForDescendantId(descendantId)
    if (!value) return

    const item = descendantsContext.committedMap[descendantId]
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
    const items = Object.values(descendantsContext.committedMap)
      .filter((item) => item.index !== -1)
      .sort((a, b) => a.index - b.index)
    const itemCount = items.length

    if (itemCount > 0) {
      if (evt.name === 'down') {
        if (focusedIndex >= itemCount - 1) {
          navigateToNext()
          evt.stopPropagation()
          return
        }
        const nextIndex = focusedIndex + 1
        const nextItem = items[nextIndex]
        if (nextItem) {
          flushSync(() => {
            setFocusedIndex(nextIndex)
          })
          scrollToItemIfNeeded({ item: nextItem, direction: 1 })
        }
      } else if (evt.name === 'up') {
        if (focusedIndex <= 0) {
          navigateToPrevious()
          evt.stopPropagation()
          return
        }
        const nextIndex = focusedIndex - 1
        const nextItem = items[nextIndex]
        if (nextItem) {
          flushSync(() => {
            setFocusedIndex(nextIndex)
          })
          scrollToItemIfNeeded({ item: nextItem, direction: -1 })
        }
      } else if (
        (evt.name === 'return' || evt.name === 'space') &&
        !evt.ctrl &&
        !evt.meta
      ) {
        // Toggle selection of current focused item (but not when ctrl/meta is held for form submission)
        const entries = Object.entries(descendantsContext.committedMap)
        const sortedEntries = entries
          .filter(([_, item]) => item.index !== -1)
          .sort((a, b) => a[1].index - b[1].index)

        const focusedId = sortedEntries[focusedIndex]?.[0]
        if (focusedId) {
          handleSelect(focusedId)
        }
      }
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
        const direction: -1 | 1 = matchingItem.index >= focusedIndex ? 1 : -1
        flushSync(() => {
          setFocusedIndex(matchingItem.index)
        })
        scrollToItemIfNeeded({ item: matchingItem, direction })
      }

      typeAheadTimeoutRef.current = setTimeout(() => {
        typeAheadTextRef.current = ''
      }, 300)
    }
  })

  // Initialize selected titles from field value only once when descendants are loaded
  useLayoutEffect(() => {
    if (field.value && Object.keys(descendantsContext.committedMap).length > 0) {
      const titles: string[] = []
      const entries = Object.entries(descendantsContext.committedMap)

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
          <WithLeftBorder isFocused={isFocused} paddingBottom={1}>
            <TitleIndicator isFocused={isFocused} isLoading={focusContext.isLoading}>
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
            </TitleIndicator>
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
            {props.children && (
              <>
                <box height={1} />
                <box marginLeft={-2}>
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
                      contentOptions: {
                        flexShrink: 0,
                        minHeight: 0,
                      },
                      scrollbarOptions: {
                        visible: false,
                      },
                    }}
                  >
                    {props.children}
                  </scrollbox>
                </box>
                <box height={1} />
              </>
            )}
            {(fieldState.error || props.error) && (
              <text fg={theme.error}>
                {fieldState.error?.message || props.error}
              </text>
            )}
            {props.info && (
              <text fg={theme.textMuted}>{props.info}</text>
            )}
          </WithLeftBorder>
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
