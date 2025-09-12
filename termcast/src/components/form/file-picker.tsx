import React from 'react'
import { Theme } from '@termcast/cli/src/theme'
import { WithLeftBorder } from './with-left-border'
import { FormItemProps, FormItemRef } from './types'
import { useFormContext, Controller } from 'react-hook-form'
import { useFocusContext } from './index'
import { useKeyboard } from '@opentui/react'
import { useIsInFocus } from '@termcast/cli/src/internal/focus-context'

export interface FilePickerProps extends FormItemProps<string[]> {
  /**
   * Indicates whether the user can select multiple items or only one.
   * @defaultValue `true`
   */
  allowMultipleSelection?: boolean
  /**
   * Indicates whether it's possible to choose a directory.
   * Note: On Windows, this property is ignored if `canChooseFiles` is set to `true`.
   * @defaultValue `false`
   */
  canChooseDirectories?: boolean
  /**
   * Indicates whether it's possible to choose a file.
   * @defaultValue `true`
   */
  canChooseFiles?: boolean
  /**
   * Indicates whether the file picker displays files that are normally hidden from the user.
   * @defaultValue `false`
   */
  showHiddenFiles?: boolean
  /**
   * Placeholder text for the input field
   */
  placeholder?: string
}

export type FilePickerRef = FormItemRef

const FilePickerField = ({
  field,
  fieldState,
  formState,
  props,
  isFocused,
  setFocusedField,
}: {
  field: any
  fieldState: any
  formState: any
  props: FilePickerProps
  isFocused: boolean
  setFocusedField: (id: string) => void
}): any => {
  const isInFocus = useIsInFocus()
  const [inputValue, setInputValue] = React.useState('')

  // Handle Enter key to add file path
  useKeyboard((evt) => {
    if (!isFocused || !isInFocus) return

    if (evt.name === 'return' && inputValue.trim()) {
      const currentFiles = field.value || []
      const newFiles =
        props.allowMultipleSelection !== false
          ? [...currentFiles, inputValue.trim()]
          : [inputValue.trim()]
      field.onChange(newFiles)
      if (props.onChange) {
        props.onChange(newFiles)
      }
      setInputValue('')
    }
  })

  const selectedFiles = field.value || []

  return (
    <box flexDirection='column'>
      <WithLeftBorder withDiamond isFocused={isFocused}>
        <text
          fg={Theme.text}
          onMouseDown={() => {
            setFocusedField(props.id)
          }}
        >
          {props.title || 'File Path'}
        </text>
      </WithLeftBorder>
      <WithLeftBorder isFocused={isFocused}>
        <box flexDirection='column'>
          <input
            value={inputValue}
            placeholder={props.placeholder || 'Enter file path...'}
            focused={isFocused}
            onMouseDown={() => setFocusedField(props.id)}
            onInput={(value: string) => setInputValue(value)}
          />
          {selectedFiles.length > 0 && (
            <box flexDirection='column' marginTop={1}>
              <text fg={Theme.textMuted}>Selected files:</text>
              {selectedFiles.map((file: string, index: number) => (
                <text key={index} fg={Theme.text}>
                  • {file}
                </text>
              ))}
            </box>
          )}
        </box>
      </WithLeftBorder>
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
  ) as React.ReactElement
}

export const FilePicker = (props: FilePickerProps): any => {
  const { control, getValues } = useFormContext()
  const { focusedField, setFocusedField } = useFocusContext()
  const isFocused = focusedField === props.id
  const isInFocus = useIsInFocus()

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

  // Handle keyboard navigation
  useKeyboard((evt) => {
    if (!isFocused || !isInFocus) return

    if (evt.name === 'tab') {
      if (evt.shift) {
        handleNavigateUp()
      } else {
        handleNavigateDown()
      }
    }
  })

  return (
    <Controller
      name={props.id}
      control={control}
      defaultValue={props.defaultValue || props.value || []}
      render={(renderProps) => {
        return (
          <FilePickerField
            {...renderProps}
            props={props}
            isFocused={isFocused}
            setFocusedField={setFocusedField}
          />
        ) as React.ReactElement
      }}
    />
  )
}
