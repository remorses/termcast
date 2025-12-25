import React, { useEffect, useState } from 'react'
import { Theme } from 'termcast/src/theme'
import { TextAttributes } from '@opentui/core'
import { useStore, toastPrimaryActionKey, toastSecondaryActionKey } from 'termcast/src/state'
import { useKeyboard, useTerminalDimensions } from '@opentui/react'
import { useIsInFocus } from 'termcast/src/internal/focus-context'

export namespace Toast {
  export interface Options {
    title: string
    message?: string
    style?: Style
    primaryAction?: ActionOptions
    secondaryAction?: ActionOptions
  }

  export interface ActionOptions {
    title: string
    shortcut?: any
    onAction: (toast: Toast) => void
  }

  export type Style = 'SUCCESS' | 'FAILURE' | 'ANIMATED'
}

export class Toast {
  private options: Toast.Options
  private id: string
  private callbacks: {
    onUpdate?: (toast: Toast) => void
    onHide?: () => void
  } = {}

  static Style = {
    Success: 'SUCCESS' as Toast.Style,
    Failure: 'FAILURE' as Toast.Style,
    Animated: 'ANIMATED' as Toast.Style,
  }

  constructor(props: Toast.Options) {
    this.options = { ...props }
    this.id = Math.random().toString(36).substring(7)

    // Bind all methods to this instance
    this.show = this.show.bind(this)
    this.hide = this.hide.bind(this)
    this.update = this.update.bind(this)
    this._setCallbacks = this._setCallbacks.bind(this)
    this._getId = this._getId.bind(this)
  }

  get style(): Toast.Style {
    return this.options.style || Toast.Style.Success
  }

  set style(style: Toast.Style) {
    this.options.style = style
    this.update()
  }

  get title(): string {
    return this.options.title
  }

  set title(title: string) {
    this.options.title = title
    this.update()
  }

  get message(): string | undefined {
    return this.options.message
  }

  set message(message: string | undefined) {
    this.options.message = message
    this.update()
  }

  get primaryAction(): Toast.ActionOptions | undefined {
    return this.options.primaryAction
  }

  set primaryAction(action: Toast.ActionOptions | undefined) {
    this.options.primaryAction = action
    // Update store to reflect that toast now has a primary action (for focus management)
    useStore.setState({ toastWithPrimaryAction: Boolean(action) })
    this.update()
  }

  get secondaryAction(): Toast.ActionOptions | undefined {
    return this.options.secondaryAction
  }

  set secondaryAction(action: Toast.ActionOptions | undefined) {
    this.options.secondaryAction = action
    this.update()
  }

  async show(): Promise<void> {
    showToastInternal(this)
  }

  async hide(): Promise<void> {
    useStore.setState({ toast: null })
    if (this.callbacks.onHide) {
      this.callbacks.onHide()
    }
  }

  private update(): void {
    if (this.callbacks.onUpdate) {
      this.callbacks.onUpdate(this)
    }
  }

  _setCallbacks(callbacks: typeof this.callbacks): void {
    this.callbacks = callbacks
  }

  _getId(): string {
    return this.id
  }
}

export interface ToastContentProps {
  toast: Toast
  onHide: () => void
}

export function ToastContent({ toast, onHide }: ToastContentProps): any {
  const [, forceUpdate] = useState(0)
  const inFocus = useIsInFocus()

  useEffect(() => {
    const onUpdate = () => {
      forceUpdate((n) => n + 1)
    }
    toast._setCallbacks({ onUpdate, onHide })
    return () => {
      toast._setCallbacks({})
    }
  }, [toast, onHide])

  useKeyboard((evt) => {
    if (!inFocus) return

    if (evt.name === 'escape') {
      onHide()
    } else if (toast.primaryAction && evt.ctrl && evt.name === toastPrimaryActionKey.name) {
      onHide()
      toast.primaryAction.onAction(toast)
    } else if (toast.secondaryAction && evt.ctrl && evt.name === toastSecondaryActionKey.name) {
      onHide()
      toast.secondaryAction.onAction(toast)
    }
  })

  const getIcon = () => {
    switch (toast.style) {
      case Toast.Style.Success:
        return '✓'
      case Toast.Style.Failure:
        return '✗'
      case Toast.Style.Animated:
        return '⣾⣽⣻⢿⡿⣟⣯⣷'
      default:
        return '✓'
    }
  }

  const getIconColor = () => {
    switch (toast.style) {
      case Toast.Style.Success:
        return Theme.success
      case Toast.Style.Failure:
        return Theme.error
      case Toast.Style.Animated:
        return Theme.primary
      default:
        return Theme.success
    }
  }

  const [animationFrame, setAnimationFrame] = useState(0)

  useEffect(() => {
    if (toast.style === Toast.Style.Animated) {
      const interval = setInterval(() => {
        setAnimationFrame((prev) => (prev + 1) % 8)
      }, 100)
      return () => clearInterval(interval)
    }
  }, [toast.style])

  useEffect(() => {
    if (toast.style !== Toast.Style.Animated) {
      const duration = toast.style === Toast.Style.Failure ? 8000 : 5000
      const timer = setTimeout(() => {
        onHide()
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [toast.style, onHide])

  const icon =
    toast.style === Toast.Style.Animated ? getIcon()[animationFrame] : getIcon()

  return (
    <box
      paddingLeft={1}
      paddingRight={1}
      alignItems='center' // show toast in center horizontally
      flexDirection='column'
      maxHeight={10}
      overflow='hidden'
    >
      <box flexDirection='row' alignItems='center' flexShrink={0} overflow='hidden'>
        <text flexShrink={0} fg={getIconColor()}>
          {icon}{' '}
        </text>
        <text flexShrink={0} fg={Theme.text} attributes={TextAttributes.BOLD}>
          {toast.title}
        </text>
        {toast.primaryAction && (
          <box
            flexShrink={0}
            flexDirection='row'
            onMouseDown={() => {
              toast.primaryAction?.onAction(toast)
            }}
          >
            <text fg={Theme.primary} attributes={TextAttributes.BOLD}>
              {' '}
              [{toast.primaryAction.title}
            </text>
            <text fg={Theme.primary}> ctrl t]</text>
          </box>
        )}
        {toast.secondaryAction && (
          <box
            flexShrink={0}
            flexDirection='row'
            onMouseDown={() => {
              toast.secondaryAction?.onAction(toast)
            }}
          >
            <text fg={Theme.textMuted} attributes={TextAttributes.BOLD}>
              {' '}
              [{toast.secondaryAction.title}
            </text>
            <text fg={Theme.textMuted}> ctrl g]</text>
          </box>
        )}
      </box>
      <box paddingLeft={2} maxHeight={1} overflow='hidden'>
        <text flexShrink={0} fg={Theme.textMuted}>
          {toast.message || ' '}
        </text>
      </box>
    </box>
  )
}

export function ToastOverlay(): any {
  const dimensions = useTerminalDimensions()
  const toastElement = useStore((state) => state.toast)

  if (!toastElement) {
    return null
  }

  return (
    <box
      position='absolute'
      left={0}
      bottom={1}
      width={dimensions.width}
      maxHeight={11}
      flexDirection='column'
      backgroundColor={Theme.background}
    >
      {toastElement}
    </box>
  )
}

let currentToastInstance: Toast | null = null

export function showToastInternal(toast: Toast): void {
  currentToastInstance = toast
  useStore.setState({
    toast: (
      <ToastContent
        toast={toast}
        onHide={() => {
          useStore.setState({ toast: null, toastWithPrimaryAction: false })
          currentToastInstance = null
        }}
      />
    ),
    toastWithPrimaryAction: Boolean(toast.primaryAction),
  })
}

export async function showToast(options: Toast.Options): Promise<Toast>
export async function showToast(
  style: Toast.Style,
  title: string,
  message?: string,
): Promise<Toast>
export async function showToast(
  optionsOrStyle: Toast.Options | Toast.Style,
  title?: string,
  message?: string,
): Promise<Toast> {
  let options: Toast.Options

  if (typeof optionsOrStyle === 'string') {
    options = {
      style: optionsOrStyle,
      title: title!,
      message,
    }
  } else {
    options = optionsOrStyle
  }

  const toast = new Toast(options)
  await toast.show()
  return toast
}

/**
 * Creates and shows a failure toast for error scenarios.
 *
 * This is a convenience function that automatically creates a toast with failure styling
 * and extracts error messages from various error types.
 *
 * @param error - The error to display. Can be an Error object, string, or any object with a message property
 * @param options - Optional configuration
 * @param options.title - Custom title for the toast (defaults to error name or "Something went wrong")
 * @param options.primaryAction - Optional action button to display on the toast
 * @returns A Promise that resolves to the created Toast instance
 *
 * @example
 * ```typescript
 * try {
 *   await riskyOperation()
 * } catch (error) {
 *   await showFailureToast(error, {
 *     title: "Operation Failed",
 *     primaryAction: {
 *       title: "Retry",
 *       onAction: () => retryOperation()
 *     }
 *   })
 * }
 * ```
 */
export async function showFailureToast(
  error: unknown,
  options?: {
    title?: string
    primaryAction?: Toast.ActionOptions
  },
): Promise<Toast> {
  let errorMessage: string
  let errorTitle: string

  if (error instanceof Error) {
    errorMessage = error.message
    errorTitle = options?.title || error.name || 'Something went wrong'
  } else if (typeof error === 'string') {
    errorMessage = error
    errorTitle = options?.title || 'Something went wrong'
  } else if (error && typeof error === 'object' && 'message' in error) {
    errorMessage = String(error.message)
    errorTitle = options?.title || 'Something went wrong'
  } else {
    errorMessage = String(error)
    errorTitle = options?.title || 'Something went wrong'
  }

  const toastOptions: Toast.Options = {
    title: errorTitle,
    message: errorMessage,
    style: Toast.Style.Failure,
    primaryAction: options?.primaryAction,
  }

  return showToast(toastOptions)
}
