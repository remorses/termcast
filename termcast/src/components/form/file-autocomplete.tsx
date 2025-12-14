import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Theme } from 'termcast/src/theme'
import { TextareaRenderable } from '@opentui/core'
import { FileSystemItem, searchFiles, parsePath } from '../../utils/file-system'
import { useKeyboard } from '@opentui/react'
import { useIsInFocus } from 'termcast/src/internal/focus-context'
import { ScrollBox } from 'termcast/src/internal/scrollbox'

export interface FileAutocompleteProps {
  onSelect: (path: string) => void
  visible: boolean
  onVisibilityChange: (visible: boolean) => void
  inputRef: React.RefObject<TextareaRenderable | null>
  anchorRef: React.RefObject<any>
  searchTrigger: number
}

export const FileAutocomplete = ({
  onSelect,
  visible,
  onVisibilityChange,
  inputRef,
  anchorRef,
  searchTrigger,
}: FileAutocompleteProps): any => {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const isInFocus = useIsInFocus()

  const inputValue = inputRef.current?.plainText || ''
  const { basePath, prefix } = inputValue
    ? parsePath(inputValue)
    : { basePath: '.', prefix: '' }

  const { data: items = [], isLoading: loading } = useQuery({
    queryKey: ['file-autocomplete', basePath, prefix, searchTrigger],
    queryFn: async () => {
      const results = await searchFiles(basePath, prefix)
      setSelectedIndex(0)
      return results
    },
    enabled: visible,
  })

  // Handle keyboard navigation
  useKeyboard((evt) => {
    if (!visible || !isInFocus) return

    if (evt.name === 'up') {
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : items.length - 1))
    } else if (evt.name === 'down') {
      setSelectedIndex((prev) => (prev < items.length - 1 ? prev + 1 : 0))
    } else if (evt.name === 'escape') {
      onVisibilityChange(false)
    } else if (evt.name === 'return') {
      if (items[selectedIndex]) {
        const value = inputRef.current?.plainText || ''
        const selectedItem = items[selectedIndex]
        const newValue =
          value.substring(0, value.lastIndexOf('/') + 1) + selectedItem.name

        if (selectedItem.isDirectory) {
          // Add trailing slash for directories and update textarea
          const fullPath = newValue + '/'
          inputRef.current?.setText(fullPath)
          inputRef.current!.cursorOffset = fullPath.length
          // Keep autocomplete open for directories
        } else {
          onSelect(newValue)
          onVisibilityChange(false)
        }
      }
    }
  })

  if (!visible || items.length === 0) return null

  // Calculate position based on anchor element
  const anchorElement = anchorRef.current
  if (!anchorElement) return null

  return (
    <box
      position='absolute'
      top={anchorElement.y + anchorElement.height}
      left={anchorElement.x}
      width={anchorElement.width}
      zIndex={1000}
      borderStyle='single'
      borderColor={Theme.border}
      backgroundColor={Theme.backgroundPanel}
      maxHeight={10}
    >
      {loading ? (
        <text fg={Theme.textMuted} padding={1}>
          Loading...
        </text>
      ) : (
        <ScrollBox
          focused={false}
          flexGrow={1}
          flexShrink={1}
          style={{
            rootOptions: {
              backgroundColor: undefined,
            },
            scrollbarOptions: {
              visible: true,
              showArrows: false,

            },
          }}
        >
          <box flexDirection='column'>
            {items.map((item, index) => (
              <box
                key={item.path}
                paddingLeft={1}
                paddingRight={1}
                backgroundColor={
                  index === selectedIndex ? Theme.primary : undefined
                }
                onMouseDown={() => {
                  setSelectedIndex(index)
                  const value = inputRef.current?.plainText || ''
                  const newValue =
                    value.substring(0, value.lastIndexOf('/') + 1) + item.name
                  if (item.isDirectory) {
                    const fullPath = newValue + '/'
                    inputRef.current?.setText(fullPath)
                    inputRef.current!.cursorOffset = fullPath.length
                  } else {
                    onSelect(newValue)
                    onVisibilityChange(false)
                  }
                }}
              >
                <text
                  fg={index === selectedIndex ? Theme.background : Theme.text}
                >
                  {item.isDirectory ? '📁 ' : '📄 '}
                  {item.name}
                </text>
              </box>
            ))}
          </box>
        </ScrollBox>
      )}
    </box>
  )
}
