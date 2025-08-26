import React, { useEffect, useState } from 'react'
import { Theme } from '@termcast/api/src/theme'
import { TextAttributes } from '@opentui/core'
import { logger } from '@termcast/api/src/logger'
import { useStore } from '@termcast/api/src/state'
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

  export type Style = "SUCCESS" | "FAILURE" | "ANIMATED"
}

export class Toast {
  private options: Toast.Options
  private id: string
  private callbacks: {
    onUpdate?: (toast: Toast) => void
    onHide?: () => void
  } = {}

  static Style = {
    Success: "SUCCESS" as Toast.Style,
    Failure: "FAILURE" as Toast.Style,
    Animated: "ANIMATED" as Toast.Style
  }

  constructor(props: Toast.Options) {
    this.options = { ...props }
    this.id = Math.random().toString(36).substring(7)
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
    const setToast = useStore.getState().setToast
    setToast(null)
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

interface ToastComponentProps {
  toast: Toast
  onHide: () => void
}

function ToastComponent({ toast, onHide }: ToastComponentProps): any {
  const [, forceUpdate] = useState(0)
  const dimensions = useTerminalDimensions()

  useEffect(() => {
    const onUpdate = () => {
      forceUpdate(n => n + 1)
    }
    toast._setCallbacks({ onUpdate, onHide })
    return () => {
      toast._setCallbacks({})
    }
  }, [toast, onHide])

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
      const timer = setTimeout(() => {
        onHide()
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [toast.style, onHide])

  const icon = toast.style === Toast.Style.Animated
    ? getIcon()[animationFrame]
    : getIcon()

  useKeyboard((evt) => {
    if (evt.name === 'escape') {
      onHide()
    } else if (toast.primaryAction && evt.name === 'enter') {
      toast.primaryAction.onAction(toast)
    } else if (toast.secondaryAction && evt.name === 'tab') {
      toast.secondaryAction.onAction(toast)
    }
  })

  // TODO use flexWrap when implemented
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

  const availableWidth = dimensions.width - iconLength - titleLength - actionsLength - 8
  const messageLines = toast.message ? wrapText(toast.message, Math.max(20, availableWidth)) : []

  return (
    <box
      borderColor={Theme.border}
      paddingLeft={1}
      paddingRight={1}
      flexDirection="column"
    >
      <box flexDirection="row" alignItems="center">
        <text fg={getIconColor()}>{icon} </text>
        <text fg={Theme.text} attributes={TextAttributes.BOLD}>{toast.title}</text>
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

let currentToastInstance: Toast | null = null

function showToastInternal(toast: Toast): void {
  currentToastInstance = toast
  const setToast = useStore.getState().setToast
  setToast(
    <ToastComponent
      toast={toast}
      onHide={() => {
        setToast(null)
        currentToastInstance = null
      }}
    />
  )
}

export async function showToast(options: Toast.Options): Promise<Toast>
export async function showToast(style: Toast.Style, title: string, message?: string): Promise<Toast>
export async function showToast(
  optionsOrStyle: Toast.Options | Toast.Style,
  title?: string,
  message?: string
): Promise<Toast> {
  let options: Toast.Options

  if (typeof optionsOrStyle === 'string') {
    options = {
      style: optionsOrStyle,
      title: title!,
      message
    }
  } else {
    options = optionsOrStyle
  }

  const toast = new Toast(options)
  await toast.show()
  return toast
}
