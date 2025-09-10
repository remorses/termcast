export interface FormValue {
  [key: string]: any
}

export interface FormValues {
  [key: string]: FormValue
}

export interface FormProps {
  actions?: React.ReactNode
  children?: React.ReactNode
  navigationTitle?: string
  isLoading?: boolean
  enableDrafts?: boolean
}

export interface FormItemProps<T> {
  id: string
  title?: string
  info?: string
  error?: string
  storeValue?: boolean
  autoFocus?: boolean
  value?: T
  defaultValue?: T
  onChange?: (value: T) => void
  onFocus?: (event: FormEvent<T>) => void
  onBlur?: (event: FormEvent<T>) => void
}

export interface FormEvent<T> {
  target: {
    id: string
    value?: T
  }
  type: 'focus' | 'blur'
}

export type FormEventType = 'focus' | 'blur'

export interface FormItemRef {
  focus: () => void
  reset: () => void
}

export type FormValue_2 = FormValue
export type FormValues_2 = FormValues
export type FormProps_2 = FormProps
export type FormItemProps_2<T> = FormItemProps<T>
