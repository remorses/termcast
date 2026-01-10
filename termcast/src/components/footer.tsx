import React, { ReactNode, useState, useEffect } from 'react'
import { TextAttributes } from '@opentui/core'
import { useTerminalDimensions, useKeyboard } from '@opentui/react'
import { colord } from 'colord'
import { useTheme } from 'termcast/src/theme'
import { openInBrowser } from 'termcast/src/action-utils'
import {
  useStore,
  toastPrimaryActionKey,
  toastSecondaryActionKey,
  ToastData,
} from 'termcast/src/state'
import { useIsInFocus } from 'termcast/src/internal/focus-context'

/** Returns white or black foreground color based on background lightness */
function getFgForBg(bgColor: string): string {
  return colord(bgColor).isLight() ? '#000000' : '#ffffff'
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

function ToastInline({ toast }: { toast: ToastData }): any {
  const theme = useTheme()
  const inFocus = useIsInFocus()
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

  const getIconColor = () => {
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
  }

  const primaryBg = theme.primary
  const primaryFg = getFgForBg(primaryBg)
  const keysBg = colord(primaryBg).darken(0.06).toHex()

  const hasKeys = !!toast.primaryAction?.title || !!toast.secondaryAction?.title
  return (
    <box
      flexDirection='row'
      // marginLeft={-1}
      // marginRight={-1}
      width={'100%'}
      flexGrow={0}
      flexShrink={0}
      overflow='hidden'
      height={1}
    >
      {/* Title box */}
      <box
        flexDirection='row'
        flexShrink={0}
        backgroundColor={colord(primaryBg).lighten(0.1).toHex()}
        paddingLeft={3}
        paddingRight={1}
        overflow='hidden'
        height={1}
      >
        <text flexShrink={0} fg={getIconColor()} wrapMode='none'>
          {getIcon()}{' '}
        </text>
        <text
          flexShrink={1}
          fg={primaryFg}
          attributes={TextAttributes.BOLD}
          wrapMode='none'
        >
          {toast.title}
        </text>
      </box>
      {/* Message/description box (in the middle with keys background) */}
      <box
        flexGrow={1}
        flexShrink={1}
        backgroundColor={keysBg}
        paddingLeft={1}
        paddingRight={1}
        flexDirection='row'
        overflow='hidden'
        height={1}
      >
        <text fg={primaryFg} flexShrink={1} wrapMode='none'>
          {toast.message || ''}
        </text>
      </box>
      {/* Keys box (right aligned, no grow) */}

      <box
        backgroundColor={keysBg}
        paddingLeft={1}
        paddingRight={3}
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
            onMouseDown={() => {
              toast.primaryAction?.onAction()
            }}
          >
            <text
              fg={primaryFg}
              attributes={TextAttributes.BOLD}
              wrapMode='none'
            >
              {toast.primaryAction.title}
            </text>
            <text fg={primaryFg} wrapMode='none'>
              {' '}
              ctrl t
            </text>
          </box>
        )}
        {toast.secondaryAction?.title && (
          <box
            flexShrink={0}
            flexDirection='row'
            onMouseDown={() => {
              toast.secondaryAction?.onAction()
            }}
          >
            <text
              fg={primaryFg}
              attributes={TextAttributes.BOLD}
              wrapMode='none'
            >
              {toast.secondaryAction.title}
            </text>
            <text fg={primaryFg} wrapMode='none'>
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
          {children}
          {showPoweredBy && (
            <box flexDirection='row' gap={1}>
              <text flexShrink={0} fg={theme.textMuted}>
                powered by
              </text>
              <text
                flexShrink={0}
                onMouseDown={() => {
                  openInBrowser('https://termcast.app')
                }}
                fg={theme.textMuted}
                attributes={TextAttributes.BOLD}
              >
                termcast
              </text>
            </box>
          )}
        </>
      )}
    </box>
  )
}
