import React from 'react'
import { Theme } from '@termcast/cli/src/theme'
import { WithLeftBorder } from './with-left-border'
import { FormItemProps, FormItemRef } from './types'
import { useFormContext, Controller } from 'react-hook-form'
import { useFocusContext } from './index'
import { useKeyboard } from '@opentui/react'
import { useIsInFocus } from '@termcast/cli/src/internal/focus-context'

import { homedir } from 'os'

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
}

export type FilePickerRef = FormItemRef

const FilePickerField = ({
  field,
  fieldState,
  formState,
  props,
  isFocused,
  setFocusedField,
  handleSelectFiles,
}: {
  field: any
  fieldState: any
  formState: any
  props: FilePickerProps
  isFocused: boolean
  setFocusedField: (id: string) => void
  handleSelectFiles: (
    onChange: (value: string[]) => void,
    currentValue: string[],
  ) => void
}): any => {
  const isInFocus = useIsInFocus()

  // Handle Enter key to open file picker
  useKeyboard((evt) => {
    if (!isFocused || !isInFocus) return

    if (evt.name === 'return') {
      handleSelectFiles(field.onChange, field.value)
    }
  })

  const selectedFiles = field.value || []
  const displayText =
    selectedFiles.length === 0
      ? 'No files selected'
      : selectedFiles.length === 1
        ? selectedFiles[0].split('/').pop() || selectedFiles[0]
        : `${selectedFiles.length} files selected`

  return (
    <box flexDirection='column'>
      <WithLeftBorder withDiamond isFocused={isFocused}>
        <text
          fg={Theme.text}
          onMouseDown={() => {
            setFocusedField(props.id)
          }}
        >
          {props.title || 'Select Files'}
        </text>
      </WithLeftBorder>
      <WithLeftBorder isFocused={isFocused}>
        <box flexDirection='row'>
          <text
            fg={selectedFiles.length > 0 ? Theme.text : Theme.textMuted}
            onMouseDown={() => {
              setFocusedField(props.id)
              handleSelectFiles(field.onChange, field.value)
            }}
          >
            {displayText}
          </text>
          {isFocused && (
            <text fg={Theme.primary}> (Press Enter to select)</text>
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

  const handleSelectFiles = async (
    onChange: (value: string[]) => void,
    currentValue: string[],
  ) => {
    // Import FileDialog dynamically so that it's only loaded when needed
    const { FileDialog } = await import('@xmorse/rfd')
    const dialog = new FileDialog()
      .setTitle(props.title || 'Select Files')
      .setDirectory(homedir())

    let result: string | string[] | null = null

    // Apply defaults: allowMultipleSelection defaults to true, canChooseFiles defaults to true
    const allowMultiple = props.allowMultipleSelection !== false
    const canChooseFiles = props.canChooseFiles !== false
    const canChooseDirectories = props.canChooseDirectories === true

    // Handle directory vs file selection
    if (canChooseDirectories && !canChooseFiles) {
      // Only directories
      result = allowMultiple ? dialog.pickFolders() : dialog.pickFolder()
    } else if (!canChooseDirectories && canChooseFiles) {
      // Only files (default)
      result = allowMultiple ? dialog.pickFiles() : dialog.pickFile()
    } else if (canChooseDirectories && canChooseFiles) {
      // TODO: rfd doesn't support mixed file/directory selection
      // Default to file selection when both are true
      result = allowMultiple ? dialog.pickFiles() : dialog.pickFile()
    }

    if (result) {
      const newValue = Array.isArray(result) ? result : [result]
      onChange(newValue)
      if (props.onChange) {
        props.onChange(newValue)
      }
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
            handleSelectFiles={handleSelectFiles}
          />
        ) as React.ReactElement
      }}
    />
  )
}
