import React, { forwardRef } from 'react'

interface ScrollBoxProps {
  children?: React.ReactNode
  focused?: boolean
  flexGrow?: number
  flexShrink?: number
  style?: any
}

export const ScrollBox = forwardRef<any, ScrollBoxProps>(
  ({ children, focused = false, flexGrow, flexShrink, style, ...props }, ref) => {
    return (
      <scrollbox
        ref={ref}
        focused={focused}
        flexGrow={flexGrow}
        flexShrink={flexShrink}
        style={{
          rootOptions: {
            backgroundColor: '#1a1b26',
            ...(style?.rootOptions || {}),
          },
          viewportOptions: {
            flexGrow: 1,
            flexShrink: 1,
            ...(style?.viewportOptions || {}),
          },
          contentOptions: {
            flexShrink: 0,
            ...(style?.contentOptions || {}),
          },
          scrollbarOptions: {
            visible: true,
            showArrows: true,
            trackOptions: {
              foregroundColor: '#7aa2f7',
              backgroundColor: '#414868',
            },
            ...(style?.scrollbarOptions || {}),
          },
        }}
        {...props}
      >
        {children}
      </scrollbox>
    )
  },
)

ScrollBox.displayName = 'ScrollBox'