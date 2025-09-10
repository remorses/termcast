// Import globals to set up global references
import { LaunchType } from '@termcast/cli/src/environment'
import './globals'

// termcastApi will be set by the runtime when needed

// Core UI Components - Lists
export { List, Grid } from '@termcast/cli/src/components/list'
export { List as default } from '@termcast/cli/src/components/list'
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
  Color as ListColor,
  GridProps,
  GridItemProps,
  GridSectionProps,
  GridInset,
} from '@termcast/cli/src/components/list'

// Core UI Components - Dropdowns
export { Dropdown } from '@termcast/cli/src/components/dropdown'
export type {
  DropdownProps,
  DropdownItemProps,
  DropdownSectionProps,
} from '@termcast/cli/src/components/dropdown'

// Core UI Components - Actions
export {
  Action,
  ActionPanel,
  ActionStyle,
} from '@termcast/cli/src/components/actions'
export type {
  ActionProps,
  ActionPanelProps,
  ActionPanelSectionProps,
} from '@termcast/cli/src/components/actions'

// Core UI Components - Detail
export { Detail } from '@termcast/cli/src/components/detail'
export type {
  DetailProps,
  DetailPropsWithLoading,
} from '@termcast/cli/src/components/detail'

// Form Components
export {
  Form,
  useFormContext,
  useFormSubmit,
} from '@termcast/cli/src/components/form/index'
export { TextField } from '@termcast/cli/src/components/form/text-field'
export type {
  TextFieldProps,
  TextFieldRef,
} from '@termcast/cli/src/components/form/text-field'
export { TextArea } from '@termcast/cli/src/components/form/text-area'
export type {
  TextAreaProps,
  TextAreaRef,
} from '@termcast/cli/src/components/form/text-area'
export { PasswordField } from '@termcast/cli/src/components/form/password-field'
export type {
  PasswordFieldProps,
  PasswordFieldRef,
} from '@termcast/cli/src/components/form/password-field'
export { Checkbox } from '@termcast/cli/src/components/form/checkbox'
export type {
  CheckboxProps,
  CheckboxRef,
} from '@termcast/cli/src/components/form/checkbox'
export { Dropdown as FormDropdown } from '@termcast/cli/src/components/form/dropdown'
export type {
  DropdownProps as FormDropdownProps,
  DropdownItemProps as FormDropdownItemProps,
  DropdownSectionProps as FormDropdownSectionProps,
  DropdownRef as FormDropdownRef,
} from '@termcast/cli/src/components/form/dropdown'
export type {
  FormProps,
  FormValues,
  FormValue,
  FormItemProps,
  FormItemRef,
  FormEvent,
  FormEventType,
} from '@termcast/cli/src/components/form/types'

// Icons and Images
export {
  Icon,
  getIconEmoji,
  IconComponent,
} from '@termcast/cli/src/components/icon'
export { Image, ImageMask } from '@termcast/cli/src/components/image'
export type {
  ImageProps,
  ImageSource,
  FileIcon,
  ImageLike,
} from '@termcast/cli/src/components/image'

// Alerts
export { Alert, confirmAlert } from '@termcast/cli/src/components/alert'

// MenuBar
export { MenuBarExtra } from '@termcast/cli/src/components/menubar-extra'
export type {
  MenuBarExtraProps,
  MenuBarExtraItemProps,
  MenuBarExtraSeparatorProps,
  MenuBarExtraSubmenuProps,
  MenuBarExtraSectionProps,
  MenuBarExtraActionEvent,
} from '@termcast/cli/src/components/menubar-extra'

// AI
export { AI } from '@termcast/cli/src/ai'

// OAuth
export { OAuth } from '@termcast/cli/src/oauth'

// Colors
export { Color } from '@termcast/cli/src/colors'

// Navigation
export {
  useNavigation,
  NavigationContainer,
} from '@termcast/cli/src/internal/navigation'

// Focus Context
export { InFocus, useIsInFocus } from '@termcast/cli/src/internal/focus-context'

// Dialog
export {
  Dialog,
  DialogProvider,
  useDialog,
} from '@termcast/cli/src/internal/dialog'

// Toast
export { Toast, showToast } from '@termcast/cli/src/toast'

// Clipboard
export {
  Clipboard,
  copyTextToClipboard,
  clearClipboard,
  pasteText,
} from '@termcast/cli/src/clipboard'

// Storage
export { Cache } from '@termcast/cli/src/cache'
export { LocalStorage } from '@termcast/cli/src/localstorage'

// Utilities
export {
  copyToClipboard,
  openInBrowser,
  openFile,
  pasteContent,
  showInFinder,
  moveToTrash,
} from '@termcast/cli/src/action-utils'

export {
  getApplications,
  getDefaultApplication,
  getFrontmostApplication,
  trash,
  open,
  captureException,
} from '@termcast/cli/src/utils'

// Environment
export {
  environment,
  getSelectedFinderItems,
  getSelectedText,
} from '@termcast/cli/src/environment'
export type { Environment, LaunchProps } from '@termcast/cli/src/environment'

export { LaunchType }

// Preferences
export {
  getPreferenceValues,
  openExtensionPreferences,
  openCommandPreferences,
} from '@termcast/cli/src/preferences'
export type { PreferenceValues } from '@termcast/cli/src/preferences'

// Common Types
export type { CommonProps } from '@termcast/cli/src/utils'

// Theme
export { Theme } from '@termcast/cli/src/theme'

// Logger
export { logger } from '@termcast/cli/src/logger'

// State Management (internal use)
export { useStore } from '@termcast/cli/src/state'
export type { DialogPosition } from '@termcast/cli/src/state'

// Providers (for app setup)
export { Providers } from '@termcast/cli/src/internal/providers'

// Helper function for rendering examples
export { renderWithProviders } from '@termcast/cli/src/utils'

// Window Management
export { closeMainWindow, PopToRootType } from '@termcast/cli/src/window'
