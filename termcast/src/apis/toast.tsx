import { useStore, ToastData, ToastStyle } from 'termcast/src/state'

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

  export type Style = ToastStyle
}

export class Toast {
  private _id: string
  private _title: string
  private _message?: string
  private _style: ToastStyle
  private _primaryAction?: Toast.ActionOptions
  private _secondaryAction?: Toast.ActionOptions

  static Style = {
    Success: 'SUCCESS' as ToastStyle,
    Failure: 'FAILURE' as ToastStyle,
    Animated: 'ANIMATED' as ToastStyle,
  }

  constructor(props: Toast.Options) {
    this._id = Math.random().toString(36).substring(7)
    this._title = props.title
    this._message = props.message
    this._style = props.style || 'SUCCESS'
    this._primaryAction = props.primaryAction
    this._secondaryAction = props.secondaryAction
  }

  private _isShowing(): boolean {
    return useStore.getState().toast?.id === this._id
  }

  private _updateState(): void {
    if (this._isShowing()) {
      useStore.setState({
        toast: this._toData(),
        toastWithPrimaryAction: Boolean(this._primaryAction),
      })
    }
  }

  private _toData(): ToastData {
    return {
      id: this._id,
      title: this._title,
      message: this._message,
      style: this._style,
      primaryAction: this._primaryAction
        ? {
            title: this._primaryAction.title,
            onAction: () => {
              this.hide()
              this._primaryAction?.onAction(this)
            },
          }
        : undefined,
      secondaryAction: this._secondaryAction
        ? {
            title: this._secondaryAction.title,
            onAction: () => {
              this.hide()
              this._secondaryAction?.onAction(this)
            },
          }
        : undefined,
      onHide: () => {
        this.hide()
      },
    }
  }

  get style(): ToastStyle {
    return this._style
  }

  set style(style: ToastStyle) {
    this._style = style
    this._updateState()
  }

  get title(): string {
    return this._title
  }

  set title(title: string) {
    this._title = title
    this._updateState()
  }

  get message(): string | undefined {
    return this._message
  }

  set message(message: string | undefined) {
    this._message = message
    this._updateState()
  }

  get primaryAction(): Toast.ActionOptions | undefined {
    return this._primaryAction
  }

  set primaryAction(action: Toast.ActionOptions | undefined) {
    this._primaryAction = action
    this._updateState()
  }

  get secondaryAction(): Toast.ActionOptions | undefined {
    return this._secondaryAction
  }

  set secondaryAction(action: Toast.ActionOptions | undefined) {
    this._secondaryAction = action
    this._updateState()
  }

  async show(): Promise<void> {
    useStore.setState({
      toast: this._toData(),
      toastWithPrimaryAction: Boolean(this._primaryAction),
    })
  }

  async hide(): Promise<void> {
    if (this._isShowing()) {
      useStore.setState({ toast: null, toastWithPrimaryAction: false })
    }
  }
}

export async function showToast(options: Toast.Options): Promise<Toast>
export async function showToast(
  style: Toast.Style,
  title: string,
  message?: string
): Promise<Toast>
export async function showToast(
  optionsOrStyle: Toast.Options | Toast.Style,
  title?: string,
  message?: string
): Promise<Toast> {
  const options: Toast.Options =
    typeof optionsOrStyle === 'string'
      ? { style: optionsOrStyle, title: title!, message }
      : optionsOrStyle

  const toast = new Toast(options)
  await toast.show()
  return toast
}

/**
 * Creates and shows a failure toast for error scenarios.
 */
export async function showFailureToast(
  error: unknown,
  options?: {
    title?: string
    primaryAction?: Toast.ActionOptions
  }
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

  return showToast({
    title: errorTitle,
    message: errorMessage,
    style: Toast.Style.Failure,
    primaryAction: options?.primaryAction,
  })
}
