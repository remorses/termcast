// Import globals to set up global references
import { LaunchType } from 'termcast/src/apis/environment'
import './globals'

// termcastApi will be set by the runtime when needed

// Core UI Components - Lists
export { List, Grid } from 'termcast/src/components/list'
export { List as default } from 'termcast/src/components/list'
export type {
  ListProps,
  ListSpacingMode,
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
} from 'termcast/src/components/list'

// Core UI Components - Dropdowns
export { Dropdown } from 'termcast/src/components/dropdown'
export type {
  DropdownProps,
  DropdownItemProps,
  DropdownSectionProps,
} from 'termcast/src/components/dropdown'

// Core UI Components - Actions
export {
  Action,
  ActionPanel,
  ActionStyle,
} from 'termcast/src/components/actions'
export type {
  ActionProps,
  ActionPanelProps,
  ActionPanelSectionProps,
} from 'termcast/src/components/actions'

// Core UI Components - Detail
export { Detail } from 'termcast/src/components/detail'
export type {
  DetailProps,
  DetailPropsWithLoading,
} from 'termcast/src/components/detail'

// Form Components
import {
  Form as FormComponent,
  useFormContext,
  useFormSubmit,
} from 'termcast/src/components/form/index'
import type {
  FormProps,
  FormValues,
  FormValue,
  FormItemProps,
  FormItemRef,
  FormEvent,
  FormEventType,
} from 'termcast/src/components/form/types'
export { useFormContext, useFormSubmit }

export function Form(props: FormProps): any {
  return FormComponent(props)
}

const FormWithStatics = Form as unknown as typeof FormComponent
FormWithStatics.TextField = FormComponent.TextField
FormWithStatics.PasswordField = FormComponent.PasswordField
FormWithStatics.TextArea = FormComponent.TextArea
FormWithStatics.Checkbox = FormComponent.Checkbox
FormWithStatics.Dropdown = FormComponent.Dropdown
FormWithStatics.DatePicker = FormComponent.DatePicker
FormWithStatics.TagPicker = FormComponent.TagPicker
FormWithStatics.FilePicker = FormComponent.FilePicker
FormWithStatics.Separator = FormComponent.Separator
FormWithStatics.Description = FormComponent.Description
FormWithStatics.LinkAccessory = FormComponent.LinkAccessory

export namespace Form {
  export let TextField: typeof FormComponent.TextField
  export let PasswordField: typeof FormComponent.PasswordField
  export let TextArea: typeof FormComponent.TextArea
  export let Checkbox: typeof FormComponent.Checkbox
  export let Dropdown: typeof FormComponent.Dropdown
  export let DatePicker: typeof FormComponent.DatePicker
  export let TagPicker: typeof FormComponent.TagPicker
  export let FilePicker: typeof FormComponent.FilePicker
  export let Separator: typeof FormComponent.Separator
  export let Description: typeof FormComponent.Description
  export let LinkAccessory: typeof FormComponent.LinkAccessory
  export type Values = FormValues
  export type Value = FormValue
  export type ItemProps<T> = FormItemProps<T>
  export type ItemReference = FormItemRef
  export type Event<T> = FormEvent<T>
  export type EventType = FormEventType
}
export { TextField } from 'termcast/src/components/form/text-field'
export type {
  TextFieldProps,
  TextFieldRef,
} from 'termcast/src/components/form/text-field'
export { TextArea } from 'termcast/src/components/form/text-area'
export type {
  TextAreaProps,
  TextAreaRef,
} from 'termcast/src/components/form/text-area'
export { PasswordField } from 'termcast/src/components/form/password-field'
export type {
  PasswordFieldProps,
  PasswordFieldRef,
} from 'termcast/src/components/form/password-field'
export { Checkbox } from 'termcast/src/components/form/checkbox'
export type {
  CheckboxProps,
  CheckboxRef,
} from 'termcast/src/components/form/checkbox'
export { Dropdown as FormDropdown } from 'termcast/src/components/form/dropdown'
export type {
  DropdownProps as FormDropdownProps,
  DropdownItemProps as FormDropdownItemProps,
  DropdownSectionProps as FormDropdownSectionProps,
  DropdownRef as FormDropdownRef,
} from 'termcast/src/components/form/dropdown'
export type {
  FormProps,
  FormValues,
  FormValue,
  FormItemProps,
  FormItemRef,
  FormEvent,
  FormEventType,
}

// Icons and Images
export { Icon, getIconEmoji, getIconShape, IconComponent } from 'termcast/src/components/icon'
export { Spinner } from 'termcast/src/components/spinner'
import {
  Image as ImageComponent,
  ImageMask,
} from 'termcast/src/components/image'
import type {
  ImageType,
  ImageProps,
  ImageSource,
  FileIcon,
  ImageLike,
  ImageFallback,
} from 'termcast/src/components/image'

export function Image(props: ImageProps): any {
  return ImageComponent(props)
}

const ImageWithStatics = Image as unknown as ImageType
ImageWithStatics.Mask = ImageMask

export namespace Image {
  export import Mask = ImageMask
  export type Source = ImageSource
  export type Asset = string
  export type Fallback = ImageFallback
  export type ImageLike = import('termcast/src/components/image').ImageLike
}

export { ImageMask }
export type {
  ImageType,
  ImageProps,
  ImageSource,
  FileIcon,
  ImageLike,
  ImageFallback,
}

// Alerts
export { Alert, confirmAlert } from 'termcast/src/components/alert'

// Command Arguments
export { CommandArguments } from 'termcast/src/components/command-arguments'

// MenuBar
export { MenuBarExtra } from 'termcast/src/components/menubar-extra'
export type {
  MenuBarExtraProps,
  MenuBarExtraItemProps,
  MenuBarExtraSeparatorProps,
  MenuBarExtraSubmenuProps,
  MenuBarExtraSectionProps,
  MenuBarExtraActionEvent,
} from 'termcast/src/components/menubar-extra'

// AI
export { AI } from 'termcast/src/apis/ai'

// Browser Extension
export { BrowserExtension } from 'termcast/src/apis/browser-extension'

// OAuth
export { OAuth } from 'termcast/src/apis/oauth'

// Colors
export { Color } from 'termcast/src/colors'

// Navigation
export {
  useNavigation,
  NavigationProvider,
  NavigationContainer,
  popToRoot,
} from 'termcast/src/internal/navigation'

// Hooks
export { useActionPanel, useId, useUnstableAI } from 'termcast/src/hooks/index'
export type { ActionPanelState } from 'termcast/src/hooks/index'

// Focus Context
export { InFocus, useIsInFocus } from 'termcast/src/internal/focus-context'

// Dialog
export { Dialog, DialogProvider, useDialog } from 'termcast/src/internal/dialog'

// Toast
export { Toast, showToast, showFailureToast } from 'termcast/src/apis/toast'

// Clipboard
export {
  Clipboard,
  copyTextToClipboard,
  clearClipboard,
  pasteText,
} from 'termcast/src/apis/clipboard'

// Storage
export { Cache } from 'termcast/src/apis/cache'
export { LocalStorage } from 'termcast/src/apis/localstorage'

// Utilities
export {
  copyToClipboard,
  openInBrowser,
  openFile,
  pasteContent,
  showInFinder,
  moveToTrash,
} from 'termcast/src/action-utils'

export {
  getApplications,
  getDefaultApplication,
  getFrontmostApplication,
  trash,
  open,
  captureException,
} from 'termcast/src/utils'

// Environment
export {
  environment,
  getSelectedFinderItems,
  getSelectedText,
  launchCommand,
} from 'termcast/src/apis/environment'
export type { Environment, LaunchProps } from 'termcast/src/apis/environment'

export { LaunchType }

// Preferences
export {
  getPreferenceValues,
  openExtensionPreferences,
  openCommandPreferences,
} from 'termcast/src/apis/preferences'
export type { PreferenceValues } from 'termcast/src/apis/preferences'

// Common Types
export type { CommonProps } from 'termcast/src/utils'

// Theme
export { useTheme } from 'termcast/src/theme'

// Logger
export { logger } from 'termcast/src/logger'

// State Management (internal use)
export { useStore } from 'termcast/src/state'
export type { DialogPosition } from 'termcast/src/state'

// Providers (for app setup)
export { TermcastProvider } from 'termcast/src/internal/providers'

// Helper function for rendering examples
export { renderWithProviders } from 'termcast/src/utils'
export type { RenderWithProvidersOptions } from 'termcast/src/utils'

// Window Management
export { closeMainWindow, PopToRootType } from 'termcast/src/apis/window'

// HUD
export { showHUD } from 'termcast/src/apis/hud'

// Keyboard
export { Keyboard } from 'termcast/src/keyboard'
export type {
  KeyboardKeyEquivalent,
  KeyboardKeyModifier,
  KeyboardShortcut,
  KeyboardCrossPlatformShortcut,
} from 'termcast/src/keyboard'

// Compile support
export { startCompiledExtension } from 'termcast/src/extensions/dev'
