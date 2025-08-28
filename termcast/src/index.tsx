// Import globals to set up global references
import { LaunchType } from '@termcast/api/src/environment'
import './globals'

// termcastApi will be set by the runtime when needed

// Core UI Components - Lists
export { List } from '@termcast/api/src/components/list'
export { List as default } from '@termcast/api/src/components/list'
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
} from '@termcast/api/src/components/list'

// Core UI Components - Dropdowns
export { Dropdown } from '@termcast/api/src/components/dropdown'
export type {
  DropdownProps,
  DropdownItemProps,
  DropdownSectionProps
} from '@termcast/api/src/components/dropdown'

// Core UI Components - Actions
export { Action, ActionPanel, ActionStyle } from '@termcast/api/src/components/actions'
export type {
  ActionProps,
  ActionPanelProps,
  ActionPanelSectionProps
} from '@termcast/api/src/components/actions'

// Core UI Components - Detail
export { Detail } from '@termcast/api/src/components/detail'
export type {
  DetailProps,
  DetailPropsWithLoading
} from '@termcast/api/src/components/detail'

// Form Components
export {
  Form,
  useFormContext
} from '@termcast/api/src/components/form/index'
export { TextField } from '@termcast/api/src/components/form/text-field'
export type { TextFieldProps, TextFieldRef } from '@termcast/api/src/components/form/text-field'
export { TextArea } from '@termcast/api/src/components/form/text-area'
export type { TextAreaProps, TextAreaRef } from '@termcast/api/src/components/form/text-area'
export { PasswordField } from '@termcast/api/src/components/form/password-field'
export type { PasswordFieldProps, PasswordFieldRef } from '@termcast/api/src/components/form/password-field'
export { Checkbox } from '@termcast/api/src/components/form/checkbox'
export type { CheckboxProps, CheckboxRef } from '@termcast/api/src/components/form/checkbox'
export { Dropdown as FormDropdown } from '@termcast/api/src/components/form/dropdown'
export type {
  DropdownProps as FormDropdownProps,
  DropdownItemProps as FormDropdownItemProps,
  DropdownSectionProps as FormDropdownSectionProps,
  DropdownRef as FormDropdownRef
} from '@termcast/api/src/components/form/dropdown'
export type {
  FormProps,
  FormValues,
  FormValue,
  FormItemProps,
  FormItemRef,
  FormEvent,
  FormEventType
} from '@termcast/api/src/components/form/types'

// Icons and Images
export { Icon, getIconEmoji, IconComponent } from '@termcast/api/src/components/icon'
export { Image, ImageMask } from '@termcast/api/src/components/image'
export type {
  ImageProps,
  ImageSource,
  FileIcon,
  ImageLike
} from '@termcast/api/src/components/image'

// Alerts
export { Alert, confirmAlert } from '@termcast/api/src/components/alert'

// MenuBar
export { MenuBarExtra } from '@termcast/api/src/components/menubar-extra'
export type {
  MenuBarExtraProps,
  MenuBarExtraItemProps,
  MenuBarExtraSeparatorProps,
  MenuBarExtraSubmenuProps,
  MenuBarExtraSectionProps,
  MenuBarExtraActionEvent
} from '@termcast/api/src/components/menubar-extra'

// AI
export { AI } from '@termcast/api/src/ai'

// OAuth
export { OAuth } from '@termcast/api/src/oauth'

// Colors
export { Color } from '@termcast/api/src/colors'

// Navigation
export { useNavigation, NavigationContainer } from '@termcast/api/src/internal/navigation'

// Focus Context
export { InFocus, useIsInFocus } from '@termcast/api/src/internal/focus-context'

// Dialog
export { Dialog, DialogProvider, useDialog } from '@termcast/api/src/internal/dialog'

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

export {
  getApplications,
  getDefaultApplication,
  getFrontmostApplication,
  trash,
  open,
  captureException
} from '@termcast/api/src/utils'

// Environment
export {
  environment,
  getSelectedFinderItems,
  getSelectedText
} from '@termcast/api/src/environment'
export type {
  Environment,
  LaunchProps
} from '@termcast/api/src/environment'

export {LaunchType}

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
export { renderWithProviders as renderExample, renderWithProviders } from '@termcast/api/src/utils'
