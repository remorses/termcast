import React from 'react'
import { renderWithProviders } from 'termcast'
import { useKeyboard } from '@opentui/react'
import { ScrollBox } from 'termcast/src/internal/scrollbox'

function SimpleScrollBoxDemo(): any {
  useKeyboard((evt) => {
    if (evt.name === 'q' || evt.name === 'escape') {
      process.exit(0)
    }
  })

  const colors = [
    '#e06c75',
    '#98c379',
    '#e5c07b',
    '#61afef',
    '#c678dd',
    '#56b6c2',
    '#abb2bf',
  ]

  return (
    <box flexDirection="column" width="100%" height="100%">
      <box padding={1} backgroundColor="#282c34">
        <text>
          <strong>
            <span fg='#61afef'>Simple ScrollBox Demo</span>
          </strong>
        </text>
      </box>

      <ScrollBox focused flexGrow={1} flexShrink={1}>
        {Array.from({ length: 30 }, (_, i) => (
          <box
            key={i}
            padding={1}
            backgroundColor={colors[i % colors.length]}
            marginBottom={1}
          >
            <text fg="#282c34">
              <strong>{`Item ${i + 1}`}</strong> - This is content for item number{' '}
              {i + 1}. Lorem ipsum dolor sit amet, consectetur adipiscing elit.
            </text>
          </box>
        ))}
      </ScrollBox>

      <box padding={1} backgroundColor="#282c34">
        <text fg="#abb2bf">Use mouse scroll or arrow keys | Press [q] to quit</text>
      </box>
    </box>
  )
}

if (import.meta.main) {
  await renderWithProviders(<SimpleScrollBoxDemo />)
}