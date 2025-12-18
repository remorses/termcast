import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Theme } from 'termcast/src/theme'
import { TextareaRenderable } from '@opentui/core'
import { listAllFiles } from '../../utils/file-system'
import { useKeyboard } from '@opentui/react'
import { useIsInFocus } from 'termcast/src/internal/focus-context'

export interface FileAutocompleteDialogProps {
  onSelect: (path: string) => void
  onClose: () => void
  inputRef: React.RefObject<TextareaRenderable | null>
  canChooseFiles?: boolean
  canChooseDirectories?: boolean
  initialDirectory?: string
}

function fuzzyMatch(text: string, query: string): boolean {
  if (!query) return true
  const lowerText = text.toLowerCase()
  const lowerQuery = query.toLowerCase()
  
  let queryIndex = 0
  for (let i = 0; i < lowerText.length && queryIndex < lowerQuery.length; i++) {
    if (lowerText[i] === lowerQuery[queryIndex]) {
      queryIndex++
    }
  }
  return queryIndex === lowerQuery.length
}

export const FileAutocompleteDialog = ({
  onSelect,
  onClose,
  inputRef,
  canChooseFiles = true,
  canChooseDirectories = false,
  initialDirectory,
}: FileAutocompleteDialogProps): any => {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [filter, setFilter] = useState(() => inputRef.current?.plainText || '')
  const isInFocus = useIsInFocus()

  const { data: allFiles = [], isLoading } = useQuery({
    queryKey: ['file-list', initialDirectory, canChooseFiles, canChooseDirectories],
    queryFn: async () => {
      // Always include directories in the listing, filter afterwards
      const files = await listAllFiles({
        basePath: initialDirectory || '.',
        maxDepth: 4,
        maxFiles: 500,
        includeDirectories: true,
      })
      
      // Filter based on canChooseFiles/canChooseDirectories
      return files.filter((f) => {
        const isDir = f.endsWith('/')
        if (isDir) {
          return canChooseDirectories
        }
        return canChooseFiles
      })
    },
  })

  // Filter files based on current input
  const filteredFiles = allFiles.filter((file) => fuzzyMatch(file, filter))
  const visibleFiles = filteredFiles.slice(0, 10)

  useKeyboard((evt) => {
    if (!isInFocus) return

    if (evt.name === 'up') {
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : visibleFiles.length - 1))
    } else if (evt.name === 'down') {
      setSelectedIndex((prev) => (prev < visibleFiles.length - 1 ? prev + 1 : 0))
    } else if (evt.name === 'return' || evt.name === 'tab') {
      const selected = visibleFiles[selectedIndex]
      if (selected) {
        const path = selected.endsWith('/') ? selected.slice(0, -1) : selected
        inputRef.current?.setText(path)
        onSelect(path)
        onClose()
      }
    } else if (evt.name === 'backspace') {
      if (filter.length > 0) {
        const newFilter = filter.slice(0, -1)
        setFilter(newFilter)
        setSelectedIndex(0)
      }
    } else if (evt.name && evt.name.length === 1 && !evt.ctrl && !evt.meta) {
      // Single character input
      const newFilter = filter + evt.name
      setFilter(newFilter)
      setSelectedIndex(0)
    }
  })

  const hintText = '↑↓ navigate  ⏎/tab select  esc close'

  return (
    <box flexDirection='column' paddingLeft={1} paddingRight={1}>
      <box flexDirection='row'>
        <text fg={Theme.textMuted}>Filter: </text>
        <text fg={Theme.primary}>{filter || '(type to filter)'}</text>
      </box>
      <box height={1} />
      {isLoading ? (
        <text fg={Theme.textMuted}>Loading files...</text>
      ) : visibleFiles.length === 0 ? (
        <text fg={Theme.textMuted}>No files found</text>
      ) : (
        <>
          {visibleFiles.map((file, index) => {
            const isDir = file.endsWith('/')
            const icon = isDir ? '📁 ' : '📄 '
            return (
              <text
                key={file}
                fg={index === selectedIndex ? Theme.background : Theme.text}
                bg={index === selectedIndex ? Theme.primary : Theme.backgroundPanel}
              >
                {' '}{icon}{file}
              </text>
            )
          })}
        </>
      )}
      <box height={1} />
      <text fg={Theme.textMuted}>{hintText}</text>
    </box>
  )
}
