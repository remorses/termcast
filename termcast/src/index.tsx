// Core UI Components
export { List } from '@termcast/api/src/list'
export type {
  ListProps,
  ItemProps as ListItemProps,
  SectionProps as ListSectionProps,
  DetailProps as ListDetailProps,
  MetadataProps as ListMetadataProps,
  DropdownProps as ListDropdownProps,
  DropdownItemProps as ListDropdownItemProps,
  DropdownSectionProps as ListDropdownSectionProps,
  ItemAccessory,
  Color as ListColor
} from '@termcast/api/src/list'

export { Dropdown } from '@termcast/api/src/dropdown'
export type {
  DropdownProps,
  DropdownItemProps,
  DropdownSectionProps
} from '@termcast/api/src/dropdown'

export { Action, ActionPanel } from '@termcast/api/src/actions'
export { ActionStyle } from '@termcast/api/src/actions'
export type {
  ActionProps,
  ActionPanelProps,
  ActionPanelSectionProps
} from '@termcast/api/src/actions'

// Form Components
export {
  Form,
  useFormContext
} from '@termcast/api/src/form/index'
export { TextField } from '@termcast/api/src/form/text-field'
export type { TextFieldProps, TextFieldRef } from '@termcast/api/src/form/text-field'
export { TextArea } from '@termcast/api/src/form/text-area'
export type { TextAreaProps, TextAreaRef } from '@termcast/api/src/form/text-area'
export { PasswordField } from '@termcast/api/src/form/password-field'
export type { PasswordFieldProps, PasswordFieldRef } from '@termcast/api/src/form/password-field'
export { Checkbox } from '@termcast/api/src/form/checkbox'
export type { CheckboxProps, CheckboxRef } from '@termcast/api/src/form/checkbox'
export { Dropdown as FormDropdown } from '@termcast/api/src/form/dropdown'
export type {
  DropdownProps as FormDropdownProps,
  DropdownItemProps as FormDropdownItemProps,
  DropdownSectionProps as FormDropdownSectionProps,
  DropdownRef as FormDropdownRef
} from '@termcast/api/src/form/dropdown'
export type {
  FormProps,
  FormValues,
  FormValue,
  FormItemProps,
  FormItemRef,
  FormEvent,
  FormEventType
} from '@termcast/api/src/form/types'

// Icons and Images
export { Icon, getIconEmoji, IconComponent } from '@termcast/api/src/icon'
export { Image, ImageMask } from '@termcast/api/src/image'
export type {
  ImageProps,
  ImageSource,
  FileIcon,
  ImageLike
} from '@termcast/api/src/image'

// Colors
export { Color } from '@termcast/api/src/colors'

// Navigation
export { useNavigation, NavigationContainer } from '@termcast/api/src/internal/navigation'

// Focus Context
export { InFocus, useIsInFocus } from '@termcast/api/src/internal/focus-context'

// Dialog
export { Dialog, DialogProvider, useDialog } from '@termcast/api/src/internal/dialog'

// Alert
export { Alert, confirmAlert } from '@termcast/api/src/alert'

// Toast
export { Toast, showToast } from '@termcast/api/src/toast'

// Clipboard
export {
  Clipboard,
  copyTextToClipboard,
  clearClipboard,
  pasteText
} from '@termcast/api/src/clipboard'

// Storage
export { Cache } from '@termcast/api/src/cache'
export { LocalStorage } from '@termcast/api/src/localstorage'

// Utilities
export {
  copyToClipboard,
  openInBrowser,
  openFile,
  pasteContent,
  showInFinder,
  moveToTrash
} from '@termcast/api/src/action-utils'

// Environment
export {
  environment,
  getSelectedFinderItems,
  getSelectedText
} from '@termcast/api/src/environment'
export type {
  Environment,
  LaunchType,
  LaunchProps
} from '@termcast/api/src/environment'

// Common Types
export type { CommonProps } from '@termcast/api/src/utils'

// Theme
export { Theme } from '@termcast/api/src/theme'

// Logger
export { logger } from '@termcast/api/src/logger'

// State Management (internal use)
export { useStore } from '@termcast/api/src/state'
export type { DialogPosition } from '@termcast/api/src/state'

// Providers (for app setup)
export { Providers } from '@termcast/api/src/internal/providers'

// Helper function for rendering examples
export { renderWithProviders as renderExample } from '@termcast/api/src/utils'
