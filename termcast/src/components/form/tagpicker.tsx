import { ForwardRefExoticComponent, FunctionComponent, ReactNode, RefAttributes } from 'react'
import type { Image } from '@termcast/cli'

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
    Item: FunctionComponent<TagPickerItemProps>
}

/**
 * Type definition for Form.TagPicker component
 */
export type TagPickerType = ForwardRefExoticComponent<TagPickerProps & RefAttributes<TagPickerRef>> & TagPickerMembers