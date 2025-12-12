import React from 'react'

interface ScrollBoxProps {
  children?: React.ReactNode
  focused?: boolean
  flexGrow?: number
  flexShrink?: number
  style?: any
  ref?: React.Ref<any>
}

export function ScrollBox({
  children,
  focused = false,
  flexGrow,
  flexShrink,
  style,
  ref,
  ...props
}: ScrollBoxProps): any {
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
        horizontalScrollbarOptions: {
          visible: false,
          ...(style?.horizontalScrollbarOptions || {}),
        },
      }}
      {...props}
    >
      {children}
    </scrollbox>
  )
}
