import React, { ReactNode } from 'react'
import { TextAttributes } from '@opentui/core'
import { useTerminalDimensions } from '@opentui/react'
import { Theme } from 'termcast/src/theme'
import { openInBrowser } from 'termcast/src/action-utils'

interface FooterProps {
  children?: ReactNode
  paddingLeft?: number
  paddingRight?: number
  paddingTop?: number
  paddingBottom?: number
  marginTop?: number
}

const MIN_WIDTH_FOR_POWERED_BY = 60

export function Footer({
  children,
  paddingLeft = 1,
  paddingRight = 1,
  paddingTop = 1,
  paddingBottom,
  marginTop = 1,
}: FooterProps): any {
  const { width } = useTerminalDimensions()
  const showPoweredBy = width >= MIN_WIDTH_FOR_POWERED_BY

  return (
    <box
      border={false}
      style={{
        paddingLeft,
        paddingRight,
        paddingTop,
        paddingBottom,
        marginTop,
        flexShrink: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
      }}
    >
      {children}
      {showPoweredBy && (
        <box
          flexDirection="row"
          gap={1}
          onMouseDown={() => {
            openInBrowser('https://termcast.app')
          }}
        >
          <text flexShrink={0} fg={Theme.textMuted}>
            powered by
          </text>
          <text
            flexShrink={0}
            fg={Theme.textMuted}
            attributes={TextAttributes.UNDERLINE}
          >
            termcast
          </text>
        </box>
      )}
    </box>
  )
}
