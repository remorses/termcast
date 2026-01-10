import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTheme } from 'termcast/src/theme'
import { searchFiles, parsePath } from '../../utils/file-system'
import { useKeyboard } from '@opentui/react'
import { useIsInFocus } from 'termcast/src/internal/focus-context'
import { createStore, useStore } from 'zustand'
import os from 'os'

const homedir = os.homedir()

interface FileAutocompleteState {
  filter: string
}

/**
 * Creates a local zustand store for sharing state between FilePicker and FileAutocompleteDialog.
 * This is necessary because dialog.push() freezes props at creation time - props won't update.
 * Using zustand allows the dialog to subscribe to state changes reactively.
 */
export function createFileAutocompleteStore() {
  return createStore<FileAutocompleteState>(() => ({
    filter: '',
  }))
}

export type FileAutocompleteStore = ReturnType<typeof createFileAutocompleteStore>

export interface FileAutocompleteDialogProps {
  /**
   * NOTE: Do not pass frequently-changing values as props here.
   * dialog.push() freezes props at creation time - they won't update.
   * Use the `store` prop for reactive state instead.
   */
  store: FileAutocompleteStore
  onSelect: (path: string) => void
  onClose: () => void
  onNavigate: (path: string) => void
  canChooseFiles?: boolean
  canChooseDirectories?: boolean
  initialDirectory?: string
}

export const FileAutocompleteDialog = ({
  store,
  onSelect,
  onClose,
  onNavigate,
  canChooseFiles = true,
  canChooseDirectories = false,
  initialDirectory,
}: FileAutocompleteDialogProps): any => {
  const theme = useTheme()
  const [selectedIndex, setSelectedIndex] = useState(0)
  const isInFocus = useIsInFocus()
  
  // Subscribe to filter from zustand store (reactive)
  const filter = useStore(store, (s) => s.filter)
  
  // Reset selection when filter changes
  const prevFilterRef = React.useRef(filter)
  if (prevFilterRef.current !== filter) {
    prevFilterRef.current = filter
    setSelectedIndex(0)
  }

  // Parse the filter to extract base path and prefix
  // When filter is empty, use initialDirectory with empty prefix to show all files
  const { basePath, prefix } = filter
    ? parsePath(filter)
    : { basePath: initialDirectory || '.', prefix: '' }

  const { data: files = [], isLoading } = useQuery({
    queryKey: ['file-search', basePath, prefix, canChooseFiles],
    queryFn: async () => {
      const items = await searchFiles(basePath, prefix)
      
      // Always show directories for navigation, filter files based on canChooseFiles
      return items.filter((item) => {
        if (item.isDirectory) {
          return true
        }
        return canChooseFiles
      })
    },
  })

  const visibleFiles = files.slice(0, 10)

  useKeyboard((evt) => {
    if (!isInFocus) return

    if (evt.name === 'up') {
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : visibleFiles.length - 1))
    } else if (evt.name === 'down') {
      setSelectedIndex((prev) => (prev < visibleFiles.length - 1 ? prev + 1 : 0))
    } else if (evt.name === 'return' || evt.name === 'tab') {
      const selected = visibleFiles[selectedIndex]
      if (selected) {
        if (selected.isDirectory) {
          if (canChooseDirectories) {
            // Select directory
            onSelect(selected.path)
            onClose()
          } else {
            // Navigate into directory
            onNavigate(selected.path + '/')
          }
        } else {
          // Select file
          onSelect(selected.path)
          onClose()
        }
      }
    }
  })

  const hintText = '↑↓ navigate  ⏎/tab select  esc close'

  return (
    <box flexDirection='column' paddingLeft={1} paddingRight={1} overflow='hidden'>
      <box flexDirection='row'>
        <text fg={theme.textMuted} wrapMode='none'>Filter: </text>
        <text fg={theme.primary} wrapMode='none'>
          {filter ? filter.replace(homedir, '~') : '(type to filter)'}
        </text>
      </box>
      <box height={1} />
      {isLoading ? (
        <text fg={theme.textMuted}>Loading files...</text>
      ) : visibleFiles.length === 0 ? (
        <text fg={theme.textMuted}>No files found</text>
      ) : (
        <>
          {visibleFiles.map((item, index) => {
            const icon = item.isDirectory ? '▫ ' : '▪ '
            return (
              <text
                key={item.path}
                fg={index === selectedIndex ? theme.background : theme.text}
                bg={index === selectedIndex ? theme.primary : theme.backgroundPanel}
                wrapMode='none'
              >
                {' '}{icon}{item.name}{item.isDirectory ? '/' : ''}
              </text>
            )
          })}
        </>
      )}
      <box height={1} />
      <text fg={theme.textMuted} wrapMode='none'>{hintText}</text>
    </box>
  )
}
