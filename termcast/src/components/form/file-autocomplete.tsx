import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Theme } from 'termcast/src/theme'
import { TextareaRenderable, RGBA } from '@opentui/core'
import { searchFiles, parsePath } from '../../utils/file-system'
import { useKeyboard } from '@opentui/react'
import { useIsInFocus } from 'termcast/src/internal/focus-context'

const backgroundPanel = RGBA.fromHex(Theme.backgroundPanel)
const primary = RGBA.fromHex(Theme.primary)
const border = RGBA.fromHex(Theme.border)

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
          const fullPath = newValue + '/'
          inputRef.current?.setText(fullPath)
          inputRef.current!.cursorOffset = fullPath.length
        } else {
          onSelect(newValue)
          onVisibilityChange(false)
        }
      }
    }
  })

  if (!visible || items.length === 0) return null

  const anchorElement = anchorRef.current
  if (!anchorElement) return null

  const maxVisible = 8
  const visibleItems = items.slice(0, maxVisible)
  const displayHeight = visibleItems.length

  const contentWidth = anchorElement.width - 2

  return (
    <box
      position='absolute'
      top={anchorElement.y - displayHeight - 2}
      left={anchorElement.x}
      width={anchorElement.width}
      height={displayHeight + 2}
      zIndex={1000}
      borderStyle='single'
      borderColor={border}
      backgroundColor={backgroundPanel}
      shouldFill
    >
      <box flexDirection='column' backgroundColor={backgroundPanel} shouldFill>
        {loading ? (
          <text fg={Theme.textMuted}> Loading...</text>
        ) : (
          visibleItems.map((item, index) => {
            const icon = item.isDirectory ? '📁 ' : '📄 '
            const text = ' ' + icon + item.name
            const padded = text.padEnd(contentWidth, ' ')
            return (
              <text
                key={item.path}
                fg={index === selectedIndex ? Theme.background : Theme.text}
                bg={index === selectedIndex ? Theme.primary : Theme.backgroundPanel}
              >
                {padded}
              </text>
            )
          })
        )}
      </box>
    </box>
  )
}
