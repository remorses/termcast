/**
 * MenuBarExtra Component - Creates menu bar extensions for macOS
 *
 * Raycast Docs: https://developers.raycast.com/api-reference/menu-bar-commands
 *
 * MenuBarExtra allows you to create persistent menu bar items in macOS that can
 * display information and provide quick actions without opening the main Raycast window.
 *
 * Key features:
 * - Display text/icons in the menu bar
 * - Show dropdown menus with items, sections, and submenus
 * - Handle user interactions via onAction callbacks
 * - Support for keyboard shortcuts
 * - Loading states and tooltips
 *
 * Components:
 * - MenuBarExtra: Root component for menu bar extensions
 * - MenuBarExtra.Item: Individual menu items with optional actions
 * - MenuBarExtra.Section: Group related items with optional title
 * - MenuBarExtra.Submenu: Nested menu for organizing items hierarchically
 * - MenuBarExtra.Separator: Visual separator between items
 */

import React, { ReactNode } from 'react'
import { Image, ImageLike } from '@termcast/cli/src/components/image'
import { logger } from '@termcast/cli/src/logger'

export interface MenuBarExtraProps {
  isLoading?: boolean
  title?: string
  tooltip?: string
  icon?: ImageLike
  children?: ReactNode
}

export interface MenuBarExtraItemProps {
  title: string
  subtitle?: string
  icon?: ImageLike
  tooltip?: string
  shortcut?: { modifiers: string[]; key: string }
  onAction?: (event?: MenuBarExtraActionEvent) => void
  disabled?: boolean
  children?: ReactNode
}

export interface MenuBarExtraSeparatorProps {}

export interface MenuBarExtraSubmenuProps {
  title: string
  icon?: ImageLike
  children?: ReactNode
}

export interface MenuBarExtraSectionProps {
  title?: string
  children?: ReactNode
}

export interface MenuBarExtraActionEvent {
  type: 'left-click' | 'right-click'
}

interface MenuBarExtraType {
  (props: MenuBarExtraProps): any
  Item: (props: MenuBarExtraItemProps) => any
  Separator: (props: MenuBarExtraSeparatorProps) => any
  Submenu: (props: MenuBarExtraSubmenuProps) => any
  Section: (props: MenuBarExtraSectionProps) => any
}

const MenuBarExtra: MenuBarExtraType = ({
  isLoading,
  title,
  tooltip,
  icon,
  children
}) => {
  logger.log('MenuBarExtra rendered', { isLoading, title, tooltip })

  // TODO: Implement actual menu bar integration
  // This component should:
  // 1. Create a real macOS menu bar item
  // 2. Handle menu dropdown display/hide
  // 3. Position the menu correctly below the menu bar icon
  // Currently just renders content in the terminal

  return (
    <box>
      {title && (
        <box>
          {icon && (typeof icon === 'string' ? <text>{icon}</text> : <Image source={icon} />)}
          <text>{title}</text>
        </box>
      )}
      {tooltip && <text>{tooltip}</text>}
      {children}
    </box>
  )
}

MenuBarExtra.Item = ({
  title,
  subtitle,
  icon,
  tooltip,
  shortcut,
  onAction,
  disabled,
  children
}) => {
  // TODO: Implement real click/keyboard handling for menu items
  // OpenTUI doesn't support onClick on box elements yet
  // This should handle:
  // 1. Mouse clicks on the menu item
  // 2. Keyboard navigation and selection (Enter key)
  // 3. Keyboard shortcuts defined in shortcut prop
  if (onAction) {
    logger.log('MenuBarExtra.Item would handle action', { title })
  }

  return (
    <box>
      <box>
        {icon && (typeof icon === 'string' ? <text>{icon}</text> : <Image source={icon} />)}
        <text>{disabled ? `[${title}]` : title}</text>
        {subtitle && <text> {subtitle}</text>}
      </box>
      {shortcut && (
        <text>{shortcut.modifiers.join('')}{shortcut.key}</text>
      )}
      {children}
    </box>
  )
}

MenuBarExtra.Separator = () => {
  return <text>─────────────────</text>
}

MenuBarExtra.Submenu = ({ title, icon, children }) => {
  return (
    <box>
      <box>
        {icon && (typeof icon === 'string' ? <text>{icon}</text> : <Image source={icon} />)}
        <text>{title} ▶</text>
      </box>
      {children && <box>{children}</box>}
    </box>
  )
}

MenuBarExtra.Section = ({ title, children }) => {
  return (
    <box>
      {title && <text>{title}</text>}
      {children}
      <MenuBarExtra.Separator />
    </box>
  )
}

export { MenuBarExtra }
