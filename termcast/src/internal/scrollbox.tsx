import React from 'react'
import { useTheme } from '../theme'
import { MacOSScrollAccel } from '@opentui/core'
import { ScrollBoxProps } from '@opentui/react'


export function ScrollBox({
  children,
  focused = false,
  flexGrow,
  flexShrink,
  style,
  ref,
  ...props
}: ScrollBoxProps): any {
  const Theme = useTheme()
  return (
    <scrollbox
      ref={ref}
      focused={focused}
      scrollAcceleration={new MacOSScrollAccel()}
      flexGrow={flexGrow}
      flexShrink={flexShrink}
      style={{
        rootOptions: {
          // backgroundColor: '#1a1b26',
          ...(style?.rootOptions || {}),
        },
        viewportOptions: {
          flexGrow: 1,
          flexShrink: 1,
          paddingRight: 1,

          ...(style?.viewportOptions || {}),
        },
        contentOptions: {
          flexShrink: 0,
          minHeight: 0, // let the scrollbox shrink with content
          ...(style?.contentOptions || {}),
        },
        scrollbarOptions: {
          // visible: true,
          // showArrows: true,
          trackOptions: {
            foregroundColor: Theme.textMuted,

            // backgroundColor: '#414868',
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
