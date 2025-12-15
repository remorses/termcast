import React, { useEffect, useState } from 'react'
import { Theme } from 'termcast/src/theme'
import { TextAttributes } from '@opentui/core'
import { logger } from 'termcast/src/logger'
import { useStore } from 'termcast/src/state'
import { useKeyboard, useTerminalDimensions } from '@opentui/react'


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

interface ToastContentProps {
  toast: Toast
  onHide: () => void
}

function ToastContent({ toast, onHide }: ToastContentProps): any {
  const [, forceUpdate] = useState(0)
  const dimensions = useTerminalDimensions()
  const dialogStack = useStore((state) => state.dialogStack)

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
    if (dialogStack.length > 0) return

    if (evt.name === 'escape') {
      onHide()
    } else if (toast.primaryAction && evt.name === 'return') {
      toast.primaryAction.onAction(toast)
    } else if (toast.secondaryAction && evt.name === 'tab') {
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

  const wrapText = (text: string, maxWidth: number): string[] => {
    if (!text) return []

    const words = text.split(' ')
    const lines: string[] = []
    let currentLine = ''

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word
      if (testLine.length <= maxWidth) {
        currentLine = testLine
      } else {
        if (currentLine) {
          lines.push(currentLine)
        }
        currentLine = word
      }
    }

    if (currentLine) {
      lines.push(currentLine)
    }

    return lines.slice(0, 3)
  }

  const iconLength = 2
  const titleLength = toast.title.length
  const actionsLength = (() => {
    let length = 0
    if (toast.primaryAction) {
      length += toast.primaryAction.title.length + 4
    }
    if (toast.secondaryAction) {
      length += toast.secondaryAction.title.length + 4
    }
    return length
  })()

  const availableWidth =
    dimensions.width - iconLength - titleLength - actionsLength - 8
  const messageLines = toast.message
    ? wrapText(toast.message, Math.max(20, availableWidth))
    : []

  return (
    <box
      borderColor={Theme.border}
      paddingLeft={1}
      paddingRight={1}
      flexDirection='column'
    >
      <box flexDirection='row' alignItems='center'>
        <text fg={getIconColor()}>{icon} </text>
        <text fg={Theme.text} attributes={TextAttributes.BOLD}>
          {toast.title}
        </text>
        {messageLines.length > 0 && (
          <text fg={Theme.textMuted}> - {messageLines[0]}</text>
        )}
        {toast.primaryAction && (
          <text fg={Theme.primary}> [{toast.primaryAction.title} ↵]</text>
        )}
        {toast.secondaryAction && (
          <text fg={Theme.textMuted}> [{toast.secondaryAction.title} ⇥]</text>
        )}
      </box>
      {messageLines.slice(1).map((line, index) => (
        <box key={index} paddingLeft={iconLength + titleLength + 3}>
          <text fg={Theme.textMuted}>{line}</text>
        </box>
      ))}
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
      top={dimensions.height - 3}
      width={dimensions.width}
      height={3}
      justifyContent='flex-end'
      alignItems='center'
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
          useStore.setState({ toast: null })
          currentToastInstance = null
        }}
      />
    ),
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
