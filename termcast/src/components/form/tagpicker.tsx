import React, { forwardRef, useImperativeHandle, useRef } from 'react'
import {
  ForwardRefExoticComponent,
  FunctionComponent,
  ReactNode,
  RefAttributes,
} from 'react'
import { Image } from 'termcast/src/components/list'
import { getIconValue } from 'termcast/src/components/icon'
import { Dropdown, DropdownProps, DropdownItemProps } from './dropdown'

/**
 * Form value types that can be used in form items
 */
type FormValue = string | number | boolean | string[] | number[] | Date | null

/**
 * Event types for form item callbacks
 */
type FormEventType = 'focus' | 'blur'

/**
 * Form event interface for onFocus and onBlur callbacks
 */
interface FormEvent<T extends FormValue> {
  target: {
    id: string
    value?: T
  }
  type: FormEventType
}

/**
 * Base props for all form items
 */
interface FormItemProps<T extends FormValue> {
  /**
   * ID of the form item.
   * Make sure to assign each form item a unique id.
   */
  id: string
  /**
   * The title displayed on the left side of the item.
   */
  title?: string
  /**
   * An optional info message to describe the form item. It appears on the right side of the item with an info icon. When the icon is hovered, the info message is shown.
   */
  info?: string
  /**
   * An optional error message to show the form item validation issues.
   * If the `error` is present, the Form Item will be highlighted with red border and will show an error message on the right.
   */
  error?: string
  /**
   * Indicates whether the value of the item should be persisted after submitting, and restored next time the form is rendered.
   */
  storeValue?: boolean
  /**
   * The value of the item. If `undefined`, the item is uncontrolled.
   */
  value?: T
  /**
   * The initial value of the item. Used for uncontrolled items. Overwrites the value restored from `storeValue`.
   */
  defaultValue?: T
  /**
   * The callback that is triggered when the value of the item changes.
   */
  onChange?: (value: T) => void
  /**
   * The callback that is triggered when the item is focused.
   */
  onFocus?: (event: FormEvent<T>) => void
  /**
   * The callback that is triggered when the item loses focus.
   */
  onBlur?: (event: FormEvent<T>) => void
}

/**
 * Ref methods available on form items
 */
interface FormItemRef {
  /**
   * Focuses the item.
   */
  focus: () => void
  /**
   * Resets value of the item
   *
   * @remarks
   * If `defaultValue` is defined, calling the `.reset()` function will set `value` to the `defaultValue`.
   */
  reset: () => void
}

/**
 * Props for Form.TagPicker component
 */
export interface TagPickerProps extends FormItemProps<string[]> {
  /**
   * The list of tags.
   */
  children?: ReactNode
  /**
   * Placeholder text shown in the token field.
   */
  placeholder?: string
}

/**
 * Props for Form.TagPicker.Item component
 */
export interface TagPickerItemProps {
  /**
   * Value of the tag.
   * Make sure to assign unique value for each item.
   */
  value: string
  /**
   * The display title of the tag.
   */
  title?: string
  /**
   * An icon to show in the tag.
   */
  icon?: Image.ImageLike
}

/**
 * Ref type for Form.TagPicker
 */
export type TagPickerRef = FormItemRef

/**
 * Members of the TagPicker component
 */
interface TagPickerMembers {
  /**
   * A tag picker item in a {@link Form.TagPicker}.
   */
  Item: (props: TagPickerItemProps) => any
}

/**
 * Type definition for Form.TagPicker component
 */
export type TagPickerType = ForwardRefExoticComponent<
  TagPickerProps & RefAttributes<TagPickerRef>
> &
  TagPickerMembers

// Implementation

const TagPickerItem: FunctionComponent<TagPickerItemProps> = (props): any => {
  // Convert TagPickerItem props to DropdownItem props
  return (
    <Dropdown.Item
      value={props.value}
      title={props.title || props.value}
      icon={getIconValue(props.icon) || undefined}
    />
  )
}

const TagPickerComponent = forwardRef<TagPickerRef, TagPickerProps>(
  (props, ref) => {
    const dropdownRef = useRef<any>(null)

    useImperativeHandle(ref, () => ({
      focus: () => dropdownRef.current?.focus(),
      reset: () => dropdownRef.current?.reset(),
    }))

    // TagPicker will use hasMultipleSelection by default
    const dropdownValue = props.value || props.defaultValue || []

    const handleDropdownChange = (value: string | string[]) => {
      // TagPicker always expects array values
      if (Array.isArray(value)) {
        props.onChange?.(value)
      } else {
        props.onChange?.([value])
      }
    }

    // Convert FormEvent callbacks between string[] and string | string[]
    const handleFocus = props.onFocus
      ? (event: FormEvent<string | string[]>) => {
          props.onFocus!({
            target: {
              id: event.target.id,
              value: Array.isArray(event.target.value)
                ? event.target.value
                : event.target.value
                  ? [event.target.value]
                  : [],
            },
            type: event.type,
          })
        }
      : undefined

    const handleBlur = props.onBlur
      ? (event: FormEvent<string | string[]>) => {
          props.onBlur!({
            target: {
              id: event.target.id,
              value: Array.isArray(event.target.value)
                ? event.target.value
                : event.target.value
                  ? [event.target.value]
                  : [],
            },
            type: event.type,
          })
        }
      : undefined

    // Create dropdown props
    const dropdownProps: DropdownProps = {
      id: props.id,
      title: props.title,
      info: props.info,
      error: props.error,
      storeValue: props.storeValue,
      value: dropdownValue,
      defaultValue: dropdownValue,
      onChange: handleDropdownChange,
      onFocus: handleFocus,
      onBlur: handleBlur,
      placeholder: props.placeholder,
      children: props.children,
      hasMultipleSelection: true, // TagPicker always uses multiple selection
    }

    return <Dropdown {...dropdownProps} />
  },
)

TagPickerComponent.displayName = 'TagPicker'

export const TagPicker = Object.assign(TagPickerComponent, {
  Item: TagPickerItem,
}) as TagPickerType
