import React, { useState, useRef, useEffect } from 'react'
import { renderWithProviders } from 'termcast'
import { useKeyboard } from '@opentui/react'

function ScrollBoxListDemo(): any {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const scrollBoxRef = useRef<any>(null)
  const itemRefs = useRef<Map<number, any>>(new Map())

  const items = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    title: `Item ${i + 1}`,
    description: `Description for item ${i + 1}`,
  }))

  useEffect(() => {
    // Small delay to ensure layout is complete
    const timeoutId = setTimeout(() => {
      const scrollBox = scrollBoxRef.current
      const selectedItem = itemRefs.current.get(selectedIndex)

      if (scrollBox && selectedItem) {
        // Calculate item position in the content
        const itemRelativeTop = selectedItem.y - scrollBox.content.y

        // Get viewport info
        const viewportHeight = scrollBox.viewport.height

        // Scroll so the top of the item is centered in the viewport
        const targetScrollTop = itemRelativeTop - viewportHeight / 2
        scrollBox.scrollTo(Math.max(0, targetScrollTop))
      }
    }, 20) // Give enough time for layout

    return () => clearTimeout(timeoutId)
  }, [selectedIndex])

  useKeyboard((evt) => {
    if (evt.name === 'up') {
      setSelectedIndex((prev) => Math.max(0, prev - 1))
    } else if (evt.name === 'down') {
      setSelectedIndex((prev) => Math.min(items.length - 1, prev + 1))
    } else if (evt.name === 'pageup') {
      setSelectedIndex((prev) => Math.max(0, prev - 10))
    } else if (evt.name === 'pagedown') {
      setSelectedIndex((prev) => Math.min(items.length - 1, prev + 10))
    } else if (evt.name === 'home') {
      setSelectedIndex(0)
    } else if (evt.name === 'end') {
      setSelectedIndex(items.length - 1)
    } else if (evt.name === 'q' || evt.name === 'escape') {
      process.exit(0)
    }
  })

  return (
    <box flexDirection='column' width='100%' height='100%'>
      <box padding={1} backgroundColor='#2e3440'>
        <text>
          <strong>
            <span fg='#88c0d0'>ScrollBox Demo</span>
          </strong>
        </text>
        <text fg='#d8dee9'>
          ↑↓ Navigate | PgUp/PgDn Jump | Home/End First/Last
        </text>
      </box>

      <scrollbox
        ref={scrollBoxRef}
        focused={true}
        flexGrow={1}
        flexShrink={1}
        style={{
          rootOptions: {
            maxHeight: '100%',
            overflow: 'hidden',
          },
          viewportOptions: {
            flexGrow: 1,
            flexShrink: 1,
          },
          contentOptions: {
            padding: 1,
            flexShrink: 0,
          },
          scrollbarOptions: {

            showArrows: true,
          },
        }}
      >
        {items.map((item, index) => {
          const isSelected = index === selectedIndex
          return (
            <box
              key={item.id}
              ref={(el) => {
                if (el) itemRefs.current.set(index, el)
              }}
              padding={1}
              backgroundColor={isSelected ? '#5e81ac' : '#3b4252'}
              marginBottom={0.5}
            >
              <text>
                {isSelected ? (
                  <strong>
                    <span fg='#eceff4'>{`▶ ${item.title}`}</span>
                  </strong>
                ) : (
                  <span fg='#d8dee9'>{`  ${item.title}`}</span>
                )}
              </text>
              <text fg={isSelected ? '#e5e9f0' : '#81a1c1'}>
                {item.description}
              </text>
            </box>
          )
        })}
      </scrollbox>

      <box padding={1} backgroundColor='#2e3440'>
        <text fg='#81a1c1'>
          Selected: {selectedIndex + 1}/{items.length} | Press [q] to quit
        </text>
      </box>
    </box>
  )
}

if (import.meta.main) {
  await renderWithProviders(<ScrollBoxListDemo />)
}
