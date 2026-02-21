import React, { ReactNode, useState, useEffect } from 'react'
import { TextAttributes } from '@opentui/core'
import { useTerminalDimensions, useKeyboard } from '@opentui/react'

import { useTheme } from 'termcast/src/theme'
import { openInBrowser } from 'termcast/src/action-utils'
import { termcastMaxContentWidth } from 'termcast/src/utils'
import {
  useStore,
  toastPrimaryActionKey,
  toastSecondaryActionKey,
  ToastData,
} from 'termcast/src/state'
import { useIsInFocus } from 'termcast/src/internal/focus-context'

interface HoverableProps {
  children: ReactNode
  onMouseDown?: () => void
  flexShrink?: number
}

// Clickable box that shows a subtle background on hover.
// Keeps hover state local to each label for minimal re-renders.
export function Hoverable({ children, onMouseDown, flexShrink = 0 }: HoverableProps): any {
  const [isHovered, setIsHovered] = useState(false)
  const theme = useTheme()
  return (
    <box
      flexDirection='row'
      gap={1}
      flexShrink={flexShrink}
      backgroundColor={isHovered ? theme.backgroundElement : undefined}
      onMouseMove={() => { setIsHovered(true) }}
      onMouseOut={() => { setIsHovered(false) }}
      onMouseDown={onMouseDown}
    >
      {children}
    </box>
  )
}

interface FooterProps {
  children?: ReactNode
  paddingLeft?: number
  paddingRight?: number
  paddingTop?: number
  paddingBottom?: number
  marginTop?: number
  hidePoweredBy?: boolean
}

const MIN_WIDTH_FOR_POWERED_BY = 75

const TOAST_MARGIN = 2

function ToastInline({ toast }: { toast: ToastData }): any {
  const theme = useTheme()
  const inFocus = useIsInFocus()
  const { width: terminalWidth } = useTerminalDimensions()
  const [animationFrame, setAnimationFrame] = useState(0)

  // Keyboard handling for toast actions
  useKeyboard((evt) => {
    if (!inFocus) return

    if (evt.name === 'escape') {
      toast.onHide()
    } else if (
      toast.primaryAction &&
      evt.ctrl &&
      evt.name === toastPrimaryActionKey.name
    ) {
      toast.primaryAction.onAction()
    } else if (
      toast.secondaryAction &&
      evt.ctrl &&
      evt.name === toastSecondaryActionKey.name
    ) {
      toast.secondaryAction.onAction()
    }
  })

  // Animation for animated toasts
  useEffect(() => {
    if (toast.style === 'ANIMATED') {
      const interval = setInterval(() => {
        setAnimationFrame((prev) => (prev + 1) % 8)
      }, 100)
      return () => clearInterval(interval)
    }
  }, [toast.style])

  // Auto-dismiss for non-animated toasts
  useEffect(() => {
    if (toast.style !== 'ANIMATED') {
      const duration = toast.style === 'FAILURE' ? 8000 : 5000
      const timer = setTimeout(() => {
        toast.onHide()
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [toast.style, toast.onHide])

  const getIcon = () => {
    switch (toast.style) {
      case 'SUCCESS':
        return '✓'
      case 'FAILURE':
        return '✗'
      case 'ANIMATED':
        return '⣾⣽⣻⢿⡿⣟⣯⣷'[animationFrame]
      default:
        return '✓'
    }
  }

  // All toast styles use a colored background with contrasting text
  const toastBg = (() => {
    switch (toast.style) {
      case 'SUCCESS':
        return theme.success
      case 'FAILURE':
        return theme.error
      case 'ANIMATED':
        return theme.primary
      default:
        return theme.success
    }
  })()
  const toastFg = theme.background

  const maxToastWidth = Math.min(terminalWidth, termcastMaxContentWidth)
  const toastWidth = maxToastWidth - TOAST_MARGIN * 2

  return (
    <box
      flexDirection='row'
      width={toastWidth}
      marginLeft={-TOAST_MARGIN}
      marginRight={-TOAST_MARGIN}
      flexGrow={0}
      flexShrink={0}
      overflow='hidden'
      height={1}
      backgroundColor={toastBg}
      onMouseDown={() => { toast.onHide() }}
    >
      {/* Title box */}
      <box
        flexDirection='row'
        flexShrink={0}
        paddingRight={1}
        overflow='hidden'
        height={1}
      >
        <text flexShrink={0} fg={toastFg} wrapMode='none'>
          {getIcon()}{' '}
        </text>
        <text
          flexShrink={1}
          fg={toastFg}
          attributes={TextAttributes.BOLD}
          wrapMode='none'
        >
          {toast.title}
        </text>
      </box>
      {/* Message/description box */}
      <box
        flexGrow={1}
        flexShrink={1}
        paddingLeft={1}
        paddingRight={1}
        flexDirection='row'
        overflow='hidden'
        height={1}
      >
        <text fg={toastFg} flexShrink={1} wrapMode='none'>
          {toast.message || ''}
        </text>
      </box>
      {/* Keys box (right aligned, no grow) */}
      <box
        paddingLeft={1}
        gap={1}
        flexDirection='row'
        flexShrink={0}
        overflow='hidden'
        height={1}
      >
        {toast.primaryAction?.title && (
          <box
            flexShrink={0}
            flexDirection='row'
            onMouseDown={(evt) => {
              evt.stopPropagation()
              toast.primaryAction?.onAction()
            }}
          >
            <text
              fg={toastFg}
              attributes={TextAttributes.BOLD}
              wrapMode='none'
            >
              {toast.primaryAction.title}
            </text>
            <text fg={toastFg} wrapMode='none'>
              {' '}
              ctrl t
            </text>
          </box>
        )}
        {toast.secondaryAction?.title && (
          <box
            flexShrink={0}
            flexDirection='row'
            onMouseDown={(evt) => {
              evt.stopPropagation()
              toast.secondaryAction?.onAction()
            }}
          >
            <text
              fg={toastFg}
              attributes={TextAttributes.BOLD}
              wrapMode='none'
            >
              {toast.secondaryAction.title}
            </text>
            <text fg={toastFg} wrapMode='none'>
              {' '}
              ctrl g
            </text>
          </box>
        )}
      </box>
    </box>
  )
}

export function Footer({
  children,
  paddingLeft = 1,
  paddingRight = 1,
  paddingTop = 1,
  paddingBottom,
  marginTop = 1,
  hidePoweredBy = false,
}: FooterProps): any {
  const theme = useTheme()
  const { width } = useTerminalDimensions()
  const showPoweredBy = !hidePoweredBy && width >= MIN_WIDTH_FOR_POWERED_BY
  const toast = useStore((state) => state.toast)

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
      {toast ? (
        <ToastInline toast={toast} />
      ) : (
        <>
          <box flexDirection='row' overflow='hidden' height={1} flexShrink={1}>
            {children}
          </box>
          {showPoweredBy && (
            <Hoverable
              onMouseDown={() => {
                openInBrowser('https://termcast.app')
              }}
            >
              <text flexShrink={0} fg={theme.textMuted}>
                powered by
              </text>
              <text
                flexShrink={0}
                fg={theme.textMuted}
                attributes={TextAttributes.BOLD}
              >
                termcast.app
              </text>
            </Hoverable>
          )}
        </>
      )}
    </box>
  )
}
