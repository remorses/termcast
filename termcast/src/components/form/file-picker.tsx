import React, { useCallback } from 'react'
import { useTheme } from 'termcast/src/theme'
import { TextareaRenderable } from '@opentui/core'
import { WithLeftBorder } from './with-left-border'
import { FormItemProps, FormItemRef } from './types'
import { useFormContext, Controller } from 'react-hook-form'
import { useFocusContext } from './index'
import { useKeyboard } from '@opentui/react'
import { useIsInFocus } from 'termcast/src/internal/focus-context'
import { FileAutocompleteDialog, createFileAutocompleteStore } from './file-autocomplete'
import { useFormNavigationHelpers } from './use-form-navigation'
import { useDialog } from 'termcast/src/internal/dialog'
import { LoadingText } from 'termcast/src/components/loading-text'
import { useStore } from 'termcast/src/state'

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
  /**
   * The initial directory to start browsing from.
   * @defaultValue current working directory
   */
  initialDirectory?: string
}

export type FilePickerRef = FormItemRef

const FilePickerField = ({
  field,
  fieldState,
  formState,
  props,
  isFocused,
  setFocusedField,
  isFormLoading,
}: {
  field: any
  fieldState: any
  formState: any
  props: FilePickerProps
  isFocused: boolean
  setFocusedField: (id: string) => void
  isFormLoading: boolean
}): any => {
  const theme = useTheme()
  const isInFocus = useIsInFocus()
  const inputRef = React.useRef<TextareaRenderable>(null)

  // Ref callback that registers the textarea in global state for ESC handling
  const setInputRef = useCallback((node: TextareaRenderable | null) => {
    if (!node) return

    inputRef.current = node
    useStore.setState({ activeSearchInputRef: node })

    // React 19: return cleanup function for unmount
    return () => {
      if (useStore.getState().activeSearchInputRef === node) {
        useStore.setState({ activeSearchInputRef: null })
      }
      inputRef.current = null
    }
  }, [])

  const dialog = useDialog()

  // Create store once for sharing state with dialog
  const [store] = React.useState(() => createFileAutocompleteStore())

  const showAutocomplete = () => {
    if (dialog.stack.length > 0) return

    dialog.push({
      element: (
        <FileAutocompleteDialog
          store={store}
          onSelect={(path) => {
            const currentFiles = field.value || []
            const newFiles =
              props.allowMultipleSelection !== false ? [...currentFiles, path] : [path]
            field.onChange(newFiles)
            if (props.onChange) {
              props.onChange(newFiles)
            }
            inputRef.current?.setText('')
            store.setState({ filter: '' })
            dialog.clear()
          }}
          onNavigate={(path) => {
            inputRef.current?.setText(path)
            store.setState({ filter: path })
          }}
          onClose={() => {
            dialog.clear()
          }}
          canChooseFiles={props.canChooseFiles}
          canChooseDirectories={props.canChooseDirectories}
          initialDirectory={props.initialDirectory}
        />
      ),
    })
  }

  // Handle Enter key and left arrow for removing last file
  useKeyboard((evt) => {
    if (!isFocused || !isInFocus) return
    if (dialog.stack.length > 0) return // Let autocomplete handle keys

    // Left arrow removes last selected file when input is empty
    if (evt.name === 'left') {
      const inputValue = inputRef.current?.plainText || ''
      if (!inputValue && selectedFiles.length > 0) {
        const newFiles = selectedFiles.slice(0, -1)
        field.onChange(newFiles)
        if (props.onChange) {
          props.onChange(newFiles)
        }
      }
      return
    }

    if (evt.name === 'return') {
      const inputValue = inputRef.current?.plainText || ''
      // If input is empty, show files in current directory
      if (!inputValue) {
        showAutocomplete()
      }
      // If input has value, add the path directly
      else if (inputValue.trim()) {
        const currentFiles = field.value || []
        const newFiles =
          props.allowMultipleSelection !== false
            ? [...currentFiles, inputValue.trim()]
            : [inputValue.trim()]
        field.onChange(newFiles)
        if (props.onChange) {
          props.onChange(newFiles)
        }
        inputRef.current?.setText('')
        store.setState({ filter: '' })
      }
    }
  })

  const selectedFiles = field.value || []

  return (
    <box flexDirection='column'>
      <WithLeftBorder withDiamond isFocused={isFocused} isLoading={isFormLoading}>
        <box
          onMouseDown={() => {
            setFocusedField(props.id)
          }}
        >
          <LoadingText
            isLoading={isFocused && isFormLoading}
            color={isFocused ? theme.primary : theme.text}
          >
            {props.title || 'File Path'}
          </LoadingText>
        </box>
      </WithLeftBorder>
      <WithLeftBorder isFocused={isFocused}>
        <box flexDirection='column'>
          <textarea
            ref={setInputRef}
            height={1}
            wrapMode='none'
            keyBindings={[
              { name: 'return', action: 'submit' },
              { name: 'linefeed', action: 'submit' },
            ]}
            initialValue=""
            placeholder={props.placeholder || 'Enter file path...'}
            focused={isFocused}
            showCursor={dialog.stack.length === 0}
            onMouseDown={() => setFocusedField(props.id)}
            onContentChange={() => {
              const value = inputRef.current?.plainText || ''
              store.setState({ filter: value })
              if (value && isFocused) {
                showAutocomplete()
              }
            }}
          />
          {selectedFiles.length > 0 && (
            <box flexDirection='column' marginTop={1}>
              <text fg={theme.textMuted}>Selected files:</text>
              {selectedFiles.map((file: string, index: number) => (
                <text key={index} fg={theme.text}>
                  • {file}
                </text>
              ))}
            </box>
          )}
        </box>
      </WithLeftBorder>
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
  ) as React.ReactElement
}

export const FilePicker = (props: FilePickerProps): any => {
  const { control } = useFormContext()
  const focusContext = useFocusContext()
  const { focusedField, setFocusedField } = focusContext
  const isFocused = focusedField === props.id
  const isInFocus = useIsInFocus()

  const { navigateToPrevious, navigateToNext } = useFormNavigationHelpers(props.id)

  // Handle keyboard navigation
  useKeyboard((evt) => {
    if (!isFocused || !isInFocus) return

    if (evt.name === 'tab') {
      if (evt.shift) {
        navigateToPrevious()
      } else {
        navigateToNext()
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
          <termcast-form-field-wrapper fieldId={props.id}>
            <FilePickerField
              {...renderProps}
              props={props}
              isFocused={isFocused}
              setFocusedField={setFocusedField}
              isFormLoading={focusContext.isLoading}
            />
          </termcast-form-field-wrapper>
        ) as React.ReactElement
      }}
    />
  )
}
