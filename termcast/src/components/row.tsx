// Row component - horizontal layout container that distributes space evenly.
// Wraps each child in a flex-grow box so they split available width equally.
// Useful for placing multiple graphs or detail panels side by side.

import React, { ReactNode } from 'react'

export interface RowProps {
  /** Gap between children in columns (default: 1) */
  gap?: number
  children: ReactNode
}

function Row(props: RowProps): any {
  const { gap = 1, children } = props
  return (
    <box flexDirection="row" gap={gap} width="100%">
      {React.Children.map(children, (child) => {
        if (!React.isValidElement(child)) return child
        return (
          <box flexGrow={1} flexBasis={0} flexShrink={1}>
            {child}
          </box>
        )
      })}
    </box>
  )
}

export { Row }
